import { useEffect, useRef, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Download, Loader2, ArrowLeft, Upload, FileCheck2, ExternalLink, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { startWayForPayCheckout } from "@/lib/wayforpay";
import { PromoCodeInput, PromoPreview } from "@/components/PromoCodeInput";

const Ticket = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [payingBusy, setPayingBusy] = useState(false);
  const [receiptViewUrl, setReceiptViewUrl] = useState<string>("");
  const [redemption, setRedemption] = useState<{ discount_amount: number; promo_code_id: string; code?: string } | null>(null);
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: reg } = await supabase
        .from("registrations")
        .select(`*, events(*), distances(*), athletes(full_name, birth_date, gender, city, club)`)
        .eq("user_id", user.id)
        .eq("id", id)
        .maybeSingle();
      if (reg) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .maybeSingle();
        const ev = (reg as any).events;
        const dist = (reg as any).distances;
        const ath = (reg as any).athletes;
        const displayName = ath?.full_name ?? prof?.full_name;
        const payload = JSON.stringify({
          rid: reg.id,
          bib: reg.bib_number,
          event: ev?.title,
          date: ev?.event_date,
          time: ev?.event_time,
          location: ev?.location,
          distance_km: dist?.distance_km,
          distance_name: dist?.name,
          status: reg.payment_status,
          name: displayName,
          email: prof?.email,
        });
        const url = await QRCode.toDataURL(payload, { width: 600, margin: 1, color: { dark: "#0a0a0a", light: "#ffffff" } });
        setQrUrl(url);
      }
      setData(reg);
      // Load existing redemption (if user already applied a promo)
      if (reg) {
        const { data: red } = await supabase
          .from("promo_code_redemptions")
          .select("discount_amount, promo_code_id, promo_codes(code)")
          .eq("registration_id", reg.id)
          .maybeSingle();
        if (red) setRedemption({
          discount_amount: Number(red.discount_amount),
          promo_code_id: red.promo_code_id,
          code: (red as any).promo_codes?.code,
        });
      }
      setLoading(false);
    })();
  }, [id, user]);

  // Generate a signed URL whenever we have a stored receipt
  useEffect(() => {
    if (!data?.receipt_url) { setReceiptViewUrl(""); return; }
    (async () => {
      const { data: signed } = await supabase.storage
        .from("payment-receipts")
        .createSignedUrl(data.receipt_url, 60 * 10);
      setReceiptViewUrl(signed?.signedUrl ?? "");
    })();
  }, [data?.receipt_url]);

  const onPickReceipt = () => fileRef.current?.click();

  const onReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !data || !user) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) { toast.error(t.ticket.receiptInvalidType); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error(t.ticket.receiptTooBig); return; }

    setUploadingReceipt(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "jpg");
      const path = `${user.id}/${data.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-receipts")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      // Cleanup previous file (best effort)
      if (data.receipt_url && data.receipt_url !== path) {
        await supabase.storage.from("payment-receipts").remove([data.receipt_url]);
      }

      const { data: updated, error: updErr } = await supabase
        .from("registrations")
        .update({ receipt_url: path })
        .eq("id", data.id)
        .select(`*, events(*), distances(*)`)
        .single();
      if (updErr) throw updErr;

      setData(updated);
      toast.success(t.ticket.receiptUploaded);
    } catch (err: any) {
      toast.error(err.message ?? t.common.error);
    } finally {
      setUploadingReceipt(false);
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const downloadPdf = async () => {
    if (!data || !qrUrl || !cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    // Match aspect ratio of the rendered card
    const pxW = canvas.width;
    const pxH = canvas.height;
    const pdfW = 148; // mm (A6 width)
    const pdfH = (pxH / pxW) * pdfW;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfW, pdfH] });
    doc.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    doc.save(`fartlek-ticket-${data.bib_number ?? id}.pdf`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">404</div>;

  const ev = data.events;
  const dist = data.distances;
  const fmtDate = new Date(ev.event_date).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", { day: "numeric", month: "long", year: "numeric" });

  const statusLabel = data.payment_status === "paid" ? t.ticket.paid : data.payment_status === "free" ? t.ticket.free : t.ticket.pending;
  const statusColor = data.payment_status === "pending" ? "text-yellow-600 dark:text-yellow-500" : "text-green-600 dark:text-green-500";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-2xl py-10">
        <Link to="/my-events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t.nav.myEvents}
        </Link>
        <div ref={cardRef} className="bg-card rounded-3xl shadow-elevated overflow-hidden">
          <div className="bg-gradient-hero p-8 text-primary-foreground">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{t.ticket.title}</div>
            <h1 className="font-display text-3xl font-bold mt-2 leading-tight">{ev.title}</h1>
            <div className="mt-4 text-sm opacity-90">{fmtDate} · {ev.event_time.slice(0, 5)}</div>
          </div>
          <div className="p-8 grid sm:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              {qrUrl && <img src={qrUrl} alt="QR" className="w-56 h-56 rounded-xl border-4 border-foreground" />}
            </div>
            <div className="space-y-4">
              {data.athletes?.full_name && (
                <div>
                  <div className="text-xs uppercase text-muted-foreground tracking-wider">{t.athletes.registeringAs}</div>
                  <div className="font-bold text-lg">{data.athletes.full_name}</div>
                </div>
              )}
              <div>
                <div className="text-xs uppercase text-muted-foreground tracking-wider">{t.ticket.bib}</div>
                <div className="font-display text-5xl font-bold text-primary">{data.bib_number ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground tracking-wider">{t.events.distances}</div>
                <div className="font-bold text-lg">{dist.distance_km} km {dist.name ? `· ${dist.name}` : ""}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground tracking-wider">{t.ticket.status}</div>
                <div className={`font-semibold ${statusColor}`}>{statusLabel}</div>
              </div>
              <p className="text-xs text-muted-foreground">{t.ticket.qrHint}</p>
            </div>
          </div>
          <div className="border-t border-border p-6 bg-muted/30">
            <Button onClick={downloadPdf} className="w-full" disabled={!qrUrl}>
              <Download className="h-4 w-4" /> {t.ticket.download}
            </Button>
          </div>
        </div>

        {data.payment_status === "pending" && (
          <div className="mt-6 bg-card rounded-2xl shadow-card p-6 space-y-3">
            <div>
              <h2 className="font-display text-lg font-bold">{t.ticket.paymentTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t.ticket.paymentHint}</p>
            </div>
            {ev.payment_url ? (
              <Button asChild className="w-full sm:w-auto">
                <a href={ev.payment_url} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="h-4 w-4" /> {t.ticket.payNow}
                </a>
              </Button>
            ) : (
              <Button
                className="w-full sm:w-auto"
                disabled={payingBusy}
                onClick={async () => {
                  setPayingBusy(true);
                  try { await startWayForPayCheckout(data.id); }
                  catch (e: any) { toast.error(e.message ?? t.common.error); setPayingBusy(false); }
                }}
              >
                {payingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {t.ticket.payNow}
              </Button>
            )}
          </div>
        )}

        {data.payment_status !== "free" && (
          <div className="mt-6 bg-card rounded-2xl shadow-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">{t.ticket.receiptTitle}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t.ticket.receiptHint}</p>
              </div>
              {data.receipt_url && (
                <FileCheck2 className="h-6 w-6 text-green-600 dark:text-green-500 shrink-0" />
              )}
            </div>

            {data.receipt_revoked_reason && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-sm p-3">
                {t.ticket.receiptRevoked}
                <div className="mt-1 opacity-80">«{data.receipt_revoked_reason}»</div>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={onReceiptChange}
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={onPickReceipt} disabled={uploadingReceipt} variant={data.receipt_url ? "outline" : "default"}>
                {uploadingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingReceipt
                  ? t.ticket.receiptUploading
                  : data.receipt_url
                  ? t.ticket.receiptReplace
                  : t.ticket.receiptUpload}
              </Button>
              {data.receipt_url && receiptViewUrl && (
                <Button asChild variant="ghost">
                  <a href={receiptViewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> {t.ticket.receiptView}
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Ticket;

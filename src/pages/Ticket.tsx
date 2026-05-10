import { useEffect, useRef, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Download, Loader2, ArrowLeft, Upload, FileCheck2, ExternalLink, CreditCard, CalendarPlus, Package, Pencil } from "lucide-react";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { downloadIcs } from "@/lib/calendar";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { startWayForPayCheckout } from "@/lib/wayforpay";
import { startLiqPayCheckout } from "@/lib/liqpay";
import { startAutomatedPaymentCheckout } from "@/lib/paymentCheckout";
import { PromoCodeInput, PromoPreview } from "@/components/PromoCodeInput";
import { NovaPoshtaDelivery, emptyDelivery, validateDelivery, type DeliveryData } from "@/components/NovaPoshtaDelivery";
import { RegistrationSelfService } from "@/components/RegistrationSelfService";
import { BibCard } from "@/components/BibCard";

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
  const [hasPromoCodes, setHasPromoCodes] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryData>(emptyDelivery());
  const [savingDelivery, setSavingDelivery] = useState(false);
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
        const { count: promoCnt } = await supabase
          .from("promo_codes")
          .select("id", { count: "exact", head: true })
          .eq("event_id", (reg as any).event_id)
          .eq("is_active", true);
        setHasPromoCodes((promoCnt ?? 0) > 0);
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

    const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
    const allowedExt = ["jpg", "jpeg", "png", "webp", "heic", "heif", "pdf"];
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const mimeOk = file.type ? allowedMime.includes(file.type.toLowerCase()) : false;
    const extOk = ext ? allowedExt.includes(ext) : false;
    // On mobile (especially iOS), file.type can be empty or non-standard — fall back to extension.
    if (!mimeOk && !extOk) { toast.error(t.ticket.receiptInvalidType); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error(t.ticket.receiptTooBig); return; }

    setUploadingReceipt(true);
    try {
      const safeExt = ext || (file.type === "application/pdf" ? "pdf" : "jpg");
      const contentType =
        file.type ||
        (safeExt === "pdf"
          ? "application/pdf"
          : safeExt === "png"
          ? "image/png"
          : safeExt === "webp"
          ? "image/webp"
          : safeExt === "heic" || safeExt === "heif"
          ? `image/${safeExt}`
          : "image/jpeg");
      const path = `${user.id}/${data.id}-${Date.now()}.${safeExt}`;
      const { error: upErr } = await supabase.storage
        .from("payment-receipts")
        .upload(path, file, { contentType, upsert: false });
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
          <div className="border-t border-border p-6 bg-muted/30 space-y-2">
            <Button onClick={downloadPdf} className="w-full" disabled={!qrUrl}>
              <Download className="h-4 w-4" /> {t.ticket.download}
            </Button>
            <BibCard
              eventTitle={ev.title}
              fullName={data.athletes?.full_name ?? undefined}
              club={data.athletes?.club ?? undefined}
              bibNumber={data.bib_number}
            />
            <AddToCalendarButton
              variant="outline"
              className="w-full"
              event={{
                uid: data.id,
                title: ev.title,
                description: ev.description,
                location: ev.location,
                date: ev.event_date,
                time: ev.event_time,
                url: `${window.location.origin}/events/${ev.slug ?? ev.id}`,
              }}
            />

          </div>
        </div>

        {data.payment_status === "pending" && (
          <div className="mt-6 bg-card rounded-2xl shadow-card p-6 space-y-3">
            <div>
              <h2 className="font-display text-lg font-bold">{t.ticket.paymentTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t.ticket.paymentHint}</p>
            </div>

            {(() => {
              const basePrice = Number(dist?.price ?? 0);
              if (!basePrice) return null;
              if (!redemption && !hasPromoCodes) return null;
              if (redemption) {
                return (
                  <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>{t.promo.applied}{redemption.code ? `: ${redemption.code}` : ""}</span>
                      <span className="font-semibold">−{redemption.discount_amount} ₴</span>
                    </div>
                    <div className="flex justify-between border-t border-primary/30 pt-1">
                      <span className="text-muted-foreground line-through">{basePrice} ₴</span>
                      <span className="font-bold text-primary">{t.promo.finalPrice}: {Math.max(basePrice - redemption.discount_amount, 0)} ₴</span>
                    </div>
                  </div>
                );
              }
              return (
                <div className="space-y-2">
                  <PromoCodeInput
                    eventId={ev.id}
                    distanceId={dist?.id ?? ""}
                    basePrice={basePrice}
                    applied={promo}
                    onApplied={setPromo}
                  />
                  {promo && (
                    <div className="text-sm flex justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground line-through">{basePrice} ₴</span>
                      <span className="font-bold text-primary">{t.promo.finalPrice}: {promo.final_price} ₴</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {(() => {
              const isWfp = ev.payment_url && /wayforpay/i.test(ev.payment_url);
              const isLiqPay = ev.payment_url && /liqpay/i.test(ev.payment_url);
              // WayForPay або LiqPay — через API (автопідтвердження). Інакше — звичайне посилання.
              if (ev.payment_url && !isWfp && !isLiqPay) {
                return (
                  <Button asChild className="w-full sm:w-auto" onClick={async () => {
                    if (promo && !redemption) {
                      const { error } = await supabase.rpc("apply_promo_code", {
                        _code: promo.code, _event_id: ev.id, _distance_id: dist.id,
                        _registration_id: data.id, _base_price: Number(dist.price),
                      });
                      if (error) toast.error(error.message);
                      else { setRedemption({ discount_amount: promo.discount_amount, promo_code_id: promo.promo_id, code: promo.code }); setPromo(null); }
                    }
                  }}>
                    <a href={ev.payment_url} target="_blank" rel="noopener noreferrer">
                      <CreditCard className="h-4 w-4" /> {t.ticket.payNow}
                    </a>
                  </Button>
                );
              }
              return (
                <Button
                  className="w-full sm:w-auto"
                  disabled={payingBusy}
                  onClick={async () => {
                    setPayingBusy(true);
                    try {
                      if (promo && !redemption) {
                        const { error: pErr } = await supabase.rpc("apply_promo_code", {
                          _code: promo.code, _event_id: ev.id, _distance_id: dist.id,
                          _registration_id: data.id, _base_price: Number(dist.price),
                        });
                        if (pErr) throw pErr;
                        setRedemption({ discount_amount: promo.discount_amount, promo_code_id: promo.promo_id, code: promo.code });
                        setPromo(null);
                      }
                      if (!ev.payment_url) {
                        await startAutomatedPaymentCheckout(data.id);
                      } else if (isLiqPay) {
                        await startLiqPayCheckout(data.id);
                      } else {
                        await startWayForPayCheckout(data.id);
                      }
                    }
                    catch (e: any) { toast.error(e.message ?? t.common.error); setPayingBusy(false); }
                  }}
                >
                  {payingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {t.ticket.payNow}
                </Button>
              );
            })()}
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
              accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
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

        {dist?.delivery_enabled && (
          <div className="mt-6 bg-card rounded-2xl shadow-card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Package className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold">
                  {lang === "uk" ? "Доставка Новою Поштою" : "Nova Poshta delivery"}
                </h2>
                {data.delivery_enabled ? (
                  <div className="text-sm text-muted-foreground mt-2 space-y-1">
                    <div><span className="font-medium text-foreground">{data.delivery_recipient_name}</span> · {data.delivery_phone}</div>
                    <div>{data.delivery_city_name}</div>
                    <div>{data.delivery_warehouse_name}</div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === "uk"
                      ? "Не зможеш забрати на місці? Замов доставку медалі / стартового пакету Новою Поштою."
                      : "Can't pick it up on site? Order Nova Poshta delivery for your medal / starter pack."}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant={data.delivery_enabled ? "outline" : "default"}
              onClick={() => {
                setDeliveryDraft(
                  data.delivery_enabled
                    ? {
                        enabled: true,
                        recipient_name: data.delivery_recipient_name ?? "",
                        phone: data.delivery_phone ?? "",
                        city_ref: data.delivery_city_ref ?? "",
                        city_name: data.delivery_city_name ?? "",
                        warehouse_ref: data.delivery_warehouse_ref ?? "",
                        warehouse_name: data.delivery_warehouse_name ?? "",
                        warehouse_type: (data.delivery_warehouse_type as "branch" | "postomat") ?? "branch",
                      }
                    : { ...emptyDelivery(), enabled: true },
                );
                setDeliveryOpen(true);
              }}
            >
              {data.delivery_enabled ? (
                <><Pencil className="h-4 w-4" /> {lang === "uk" ? "Змінити дані доставки" : "Edit delivery details"}</>
              ) : (
                <><Package className="h-4 w-4" /> {lang === "uk" ? "Замовити доставку" : "Order delivery"}</>
              )}
            </Button>
          </div>
        )}

        <RegistrationSelfService
          registration={data}
          onChanged={async () => {
            const { data: reg } = await supabase
              .from("registrations")
              .select(`*, events(*), distances(*), athletes(full_name, birth_date, gender, city, club)`)
              .eq("id", data.id)
              .maybeSingle();
            if (reg) setData(reg);
          }}
        />

        <Dialog open={deliveryOpen} onOpenChange={setDeliveryOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {lang === "uk" ? "Доставка Новою Поштою" : "Nova Poshta delivery"}
              </DialogTitle>
            </DialogHeader>
            <NovaPoshtaDelivery value={deliveryDraft} onChange={setDeliveryDraft} />
            <DialogFooter className="gap-2">
              {data?.delivery_enabled && (
                <Button
                  variant="ghost"
                  disabled={savingDelivery}
                  onClick={async () => {
                    setSavingDelivery(true);
                    try {
                      const { data: upd, error } = await supabase
                        .from("registrations")
                        .update({
                          delivery_enabled: false,
                          delivery_recipient_name: null,
                          delivery_phone: null,
                          delivery_city_ref: null,
                          delivery_city_name: null,
                          delivery_warehouse_ref: null,
                          delivery_warehouse_name: null,
                          delivery_warehouse_type: null,
                        })
                        .eq("id", data.id)
                        .select(`*, events(*), distances(*), athletes(full_name, birth_date, gender, city, club)`)
                        .single();
                      if (error) throw error;
                      setData(upd);
                      setDeliveryOpen(false);
                      toast.success(lang === "uk" ? "Доставку скасовано" : "Delivery cancelled");
                    } catch (e: any) {
                      toast.error(e.message ?? t.common.error);
                    } finally {
                      setSavingDelivery(false);
                    }
                  }}
                >
                  {lang === "uk" ? "Скасувати доставку" : "Cancel delivery"}
                </Button>
              )}
              <Button variant="outline" onClick={() => setDeliveryOpen(false)} disabled={savingDelivery}>
                {lang === "uk" ? "Закрити" : "Close"}
              </Button>
              <Button
                disabled={savingDelivery}
                onClick={async () => {
                  const err = validateDelivery({ ...deliveryDraft, enabled: true }, lang);
                  if (err) { toast.error(err); return; }
                  setSavingDelivery(true);
                  try {
                    const { data: upd, error } = await supabase
                      .from("registrations")
                      .update({
                        delivery_enabled: true,
                        delivery_recipient_name: deliveryDraft.recipient_name.trim(),
                        delivery_phone: deliveryDraft.phone,
                        delivery_city_ref: deliveryDraft.city_ref,
                        delivery_city_name: deliveryDraft.city_name,
                        delivery_warehouse_ref: deliveryDraft.warehouse_ref,
                        delivery_warehouse_name: deliveryDraft.warehouse_name,
                        delivery_warehouse_type: deliveryDraft.warehouse_type,
                      })
                      .eq("id", data.id)
                      .select(`*, events(*), distances(*), athletes(full_name, birth_date, gender, city, club)`)
                      .single();
                    if (error) throw error;
                    setData(upd);
                    setDeliveryOpen(false);
                    toast.success(lang === "uk" ? "Дані доставки збережено" : "Delivery details saved");
                  } catch (e: any) {
                    toast.error(e.message ?? t.common.error);
                  } finally {
                    setSavingDelivery(false);
                  }
                }}
              >
                {savingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {lang === "uk" ? "Зберегти" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Ticket;

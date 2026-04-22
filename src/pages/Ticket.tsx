import { useEffect, useRef, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Download, Loader2, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Ticket = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: reg } = await supabase
        .from("registrations")
        .select(`*, events(*), distances(*)`)
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
          name: prof?.full_name,
          email: prof?.email,
        });
        const url = await QRCode.toDataURL(payload, { width: 600, margin: 1, color: { dark: "#0a0a0a", light: "#ffffff" } });
        setQrUrl(url);
      }
      setData(reg);
      setLoading(false);
    })();
  }, [id, user]);

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
      </main>
      <Footer />
    </div>
  );
};

export default Ticket;

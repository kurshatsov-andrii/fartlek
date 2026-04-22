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

  const downloadPdf = () => {
    if (!data || !qrUrl) return;
    const ev = data.events;
    const dist = data.distances;
    const fmtDate = new Date(ev.event_date).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", { day: "numeric", month: "long", year: "numeric" });
    const time = ev.event_time.slice(0, 5);
    const statusLabel = data.payment_status === "paid" ? t.ticket.paid : data.payment_status === "free" ? t.ticket.free : t.ticket.pending;

    // A6 landscape-ish card: 148 x 105 mm
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [105, 148] });
    const W = 148, H = 105;

    // Header background — orange gradient simulation (solid orange w/ darker left, lighter right via 2 rects)
    const headerH = 38;
    // Base orange
    doc.setFillColor(234, 88, 12); // primary orange
    doc.rect(0, 0, W, headerH, "F");
    // Right gradient band (yellow-ish)
    for (let i = 0; i < 60; i++) {
      const r = 234 + Math.round((250 - 234) * (i / 60));
      const g = 88 + Math.round((204 - 88) * (i / 60));
      const b = 12 + Math.round((21 - 12) * (i / 60));
      doc.setFillColor(r, g, b);
      doc.rect(W - 60 + i, 0, 1.2, headerH, "F");
    }

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(t.ticket.title.toUpperCase(), 10, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(ev.title, 10, 20, { maxWidth: W - 20 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${fmtDate} · ${time}`, 10, 30);

    // Body background
    doc.setFillColor(20, 20, 22);
    doc.rect(0, headerH, W, H - headerH, "F");

    // QR code
    const qrSize = 48;
    const qrX = 8, qrY = headerH + 8;
    // White frame
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "F");
    doc.addImage(qrUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // Right column
    const colX = qrX + qrSize + 10;
    let y = headerH + 12;

    doc.setTextColor(160, 160, 170);
    doc.setFontSize(7);
    doc.text(t.ticket.bib.toUpperCase(), colX, y);
    y += 10;
    doc.setTextColor(234, 88, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text(String(data.bib_number ?? "—"), colX, y);

    y += 8;
    doc.setTextColor(160, 160, 170);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(t.events.distances.toUpperCase(), colX, y);
    y += 5;
    doc.setTextColor(240, 240, 245);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${dist.distance_km} km${dist.name ? ` · ${dist.name}` : ""}`, colX, y, { maxWidth: W - colX - 8 });

    y += 8;
    doc.setTextColor(160, 160, 170);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(t.ticket.status.toUpperCase(), colX, y);
    y += 5;
    if (data.payment_status === "pending") doc.setTextColor(234, 179, 8);
    else doc.setTextColor(34, 197, 94);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(statusLabel, colX, y);

    // Hint
    doc.setTextColor(140, 140, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(t.ticket.qrHint, qrX, qrY + qrSize + 8, { maxWidth: W - qrX - 8 });

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
        <div className="bg-card rounded-3xl shadow-elevated overflow-hidden">
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

import { useEffect, useRef, useState, type Ref } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Award, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface CertificateData {
  fullName: string;
  eventTitle: string;
  eventDate: string;
  location?: string | null;
  distanceKm: number;
  timeSeconds: number | null;
  bib?: number | null;
  overallRank?: number | null;
  categoryRank?: number | null;
  categoryLabel?: string | null;
  /** Місце серед своєї статі (абсолют по чоловіках/жінках) */
  genderRank?: number | null;
  genderLabel?: string | null;
  /** Місце у віковій категорії всередині своєї статі */
  ageGroupRank?: number | null;
  ageGroupLabel?: string | null;
}

const fmtTime = (s: number | null): string => {
  if (s == null) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, "-").replace(/(^-|-$)/g, "").slice(0, 60);

type Orientation = "landscape" | "portrait";

const SIZE: Record<Orientation, { w: number; h: number }> = {
  landscape: { w: 1188, h: 840 },
  portrait: { w: 840, h: 1188 },
};

/**
 * Finisher certificate: preview dialog + PNG/PDF download, landscape or portrait.
 * The printable node uses plain hex colors (html2canvas cannot parse oklch/CSS vars).
 */
export const FinisherCertificate = ({
  open,
  onOpenChange,
  data,
  uk = true,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: CertificateData;
  uk?: boolean;
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [orientation, setOrientation] = useState<Orientation>("landscape");

  const dims = SIZE[orientation];

  // Fit the fixed-size certificate into the dialog width
  useEffect(() => {
    if (!open) return;
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / dims.w, 620 / dims.h));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, dims.w, dims.h]);

  const dateLabel = new Date(data.eventDate).toLocaleDateString(uk ? "uk-UA" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const render = async () => {
    const node = nodeRef.current;
    if (!node) return null;
    return html2canvas(node, { scale: 2, backgroundColor: "#0a1f4b", useCORS: true });
  };

  const fileBase = `fartlek-certificate-${slug(data.eventTitle)}-${slug(data.fullName)}`;

  const downloadPng = async () => {
    setBusy(true);
    try {
      const canvas = await render();
      if (!canvas) return;
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${fileBase}.png`;
      a.click();
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    setBusy(true);
    try {
      const canvas = await render();
      if (!canvas) return;
      const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
      const w = orientation === "landscape" ? 297 : 210;
      const h = orientation === "landscape" ? 210 : 297;
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, h);
      doc.save(`${fileBase}.pdf`);
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  const C = {
    navy: "#0a1f4b",
    navyDeep: "#071539",
    yellow: "#ffd23f",
    yellowSoft: "#ffe98a",
    blueSoft: "#1b3a7a",
    text: "#ffffff",
    muted: "#a9bde0",
  };

  const stats: { label: string; value: string | number; accent?: boolean }[] = [];
  if (data.timeSeconds != null)
    stats.push({ label: uk ? "Час" : "Time", value: fmtTime(data.timeSeconds), accent: true });
  if (data.overallRank != null)
    stats.push({ label: uk ? "Місце абсолют" : "Overall place", value: data.overallRank });
  if (data.genderRank != null)
    stats.push({
      label: `${uk ? "Місце" : "Place"}${data.genderLabel ? ` · ${data.genderLabel}` : ""}`,
      value: data.genderRank,
    });
  if (data.ageGroupRank != null)
    stats.push({
      label: `${uk ? "Вікова категорія" : "Age group"}${data.ageGroupLabel ? ` ${data.ageGroupLabel}` : ""}`,
      value: data.ageGroupRank,
    });
  if (data.categoryRank != null && data.ageGroupRank == null && data.genderRank == null)
    stats.push({
      label: `${uk ? "Місце в категорії" : "Category place"}${data.categoryLabel ? ` (${data.categoryLabel})` : ""}`,
      value: data.categoryRank,
    });
  if (data.bib != null) stats.push({ label: uk ? "Номер" : "Bib", value: data.bib });

  const sheet = (innerRef?: Ref<HTMLDivElement>) => {
    const portrait = orientation === "portrait";
    const f = portrait ? 0.84 : 1; // font scale for the narrower sheet

    return (
      <div
        ref={innerRef}
        style={{
          width: dims.w,
          height: dims.h,
          position: "relative",
          overflow: "hidden",
          backgroundColor: C.navy,
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: C.text,
          boxSizing: "border-box",
        }}
      >
        {/* decorative blocks */}
        <div style={{ position: "absolute", top: -220, left: -180, width: 620, height: 620, borderRadius: 620, backgroundColor: C.navyDeep }} />
        <div style={{ position: "absolute", bottom: -260, right: -200, width: 700, height: 700, borderRadius: 700, backgroundColor: C.blueSoft }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, backgroundColor: C.yellow }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 14, backgroundColor: C.yellow }} />
        <div style={{ position: "absolute", top: portrait ? 108 : 96, left: 0, width: portrait ? 170 : 250, height: 6, backgroundColor: C.yellow }} />
        <div style={{ position: "absolute", top: portrait ? 108 : 96, right: 0, width: portrait ? 170 : 250, height: 6, backgroundColor: C.yellow }} />

        {/* frame */}
        <div style={{ position: "absolute", inset: 34, border: `2px solid ${C.yellow}`, borderRadius: 16 }} />
        <div style={{ position: "absolute", inset: 46, border: `1px solid #35558f`, borderRadius: 10 }} />

        <div
          style={
            portrait
              ? {
                  position: "absolute",
                  top: 120,
                  bottom: 90,
                  left: 0,
                  right: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  textAlign: "center",
                  paddingLeft: 70,
                  paddingRight: 70,
                  boxSizing: "border-box",
                }
              : { position: "relative", textAlign: "center", paddingTop: 72, paddingLeft: 70, paddingRight: 70 }
          }
        >
          <div style={{ letterSpacing: 12, fontSize: 26 * f, fontWeight: 700, color: C.yellow }}>FARTLEK</div>
          <div style={{ letterSpacing: 4, fontSize: 13 * f, color: C.muted, marginTop: 6 }}>
            {uk ? "ПЛАТФОРМА БІГОВИХ ПОДІЙ" : "RUNNING EVENTS PLATFORM"}
          </div>

          <div style={{ fontSize: 48 * f, fontWeight: 700, marginTop: portrait ? 46 : 38, letterSpacing: 3, color: C.text }}>
            {uk ? "СЕРТИФІКАТ ФІНІШЕРА" : "FINISHER CERTIFICATE"}
          </div>
          <div style={{ fontSize: 19 * f, color: C.muted, marginTop: 12 }}>
            {uk ? "Цим підтверджується, що" : "This certifies that"}
          </div>

          <div style={{ fontSize: 56 * f, fontWeight: 700, marginTop: 14, color: C.yellow }}>{data.fullName}</div>
          <div style={{ width: portrait ? 380 : 440, height: 3, backgroundColor: C.yellowSoft, margin: "14px auto 0" }} />

          <div style={{ fontSize: 21 * f, color: "#dde7f7", marginTop: 26, lineHeight: 1.55 }}>
            {uk ? "успішно подолав(-ла) дистанцію" : "successfully completed the distance"}{" "}
            <strong style={{ color: C.yellow }}>{data.distanceKm} {uk ? "км" : "km"}</strong>
            <br />
            {uk ? "на події" : "at"} <strong style={{ color: C.text }}>{data.eventTitle}</strong>
            <br />
            {dateLabel}
            {data.location ? ` · ${data.location}` : ""}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: portrait ? 28 : 40,
              rowGap: portrait ? 26 : 24,
              marginTop: portrait ? 52 : 42,
            }}
          >
            {stats.map((s) => (
              <div key={s.label} style={{ minWidth: portrait ? 180 : 150 }}>
                <div style={{ fontSize: 13 * f, letterSpacing: 3, color: C.muted, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 38 * f, fontWeight: 700, marginTop: 6, color: s.accent ? C.yellow : C.text }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 48, left: 0, right: 0, textAlign: "center", fontSize: 14 * f, letterSpacing: 2, color: C.muted }}>
          fartlek.lovable.app
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {uk ? "Сертифікат фінішера" : "Finisher certificate"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={orientation === "landscape" ? "default" : "outline"}
            onClick={() => setOrientation("landscape")}
          >
            {uk ? "Горизонтальний" : "Landscape"}
          </Button>
          <Button
            size="sm"
            variant={orientation === "portrait" ? "default" : "outline"}
            onClick={() => setOrientation("portrait")}
          >
            {uk ? "Вертикальний" : "Portrait"}
          </Button>
        </div>

        <div ref={wrapRef} className="w-full overflow-hidden flex justify-center" style={{ height: dims.h * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", width: dims.w }}>
            {sheet()}
          </div>
        </div>

        {/* Offscreen unscaled copy used for PNG/PDF capture (html2canvas mis-renders scaled nodes) */}
        <div
          style={{ position: "fixed", left: -99999, top: 0, width: dims.w, height: dims.h, pointerEvents: "none", opacity: 0 }}
          aria-hidden
        >
          {sheet(nodeRef)}
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={downloadPng} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            PNG
          </Button>
          <Button onClick={downloadPdf} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useRef, useState } from "react";
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

/**
 * Finisher certificate: preview dialog + PNG/PDF download.
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
  const [busy, setBusy] = useState(false);

  const dateLabel = new Date(data.eventDate).toLocaleDateString(uk ? "uk-UA" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const render = async () => {
    const node = nodeRef.current;
    if (!node) return null;
    return html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
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
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210);
      doc.save(`${fileBase}.pdf`);
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {uk ? "Сертифікат фінішера" : "Finisher certificate"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          {/* Printable node — fixed A4 landscape ratio (1188 x 840) */}
          <div
            ref={nodeRef}
            style={{
              width: 1188,
              height: 840,
              position: "relative",
              backgroundColor: "#ffffff",
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "#111111",
              boxSizing: "border-box",
              padding: 48,
              transform: "scale(var(--cert-scale, 1))",
              transformOrigin: "top left",
            }}
            className="[--cert-scale:0.3] sm:[--cert-scale:0.45] md:[--cert-scale:0.62]"
          >
            <div
              style={{
                position: "absolute",
                inset: 24,
                border: "3px solid #ff6633",
                borderRadius: 18,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 36,
                border: "1px solid #f2c200",
                borderRadius: 12,
              }}
            />
            <div style={{ position: "relative", textAlign: "center", paddingTop: 42 }}>
              <div style={{ letterSpacing: 10, fontSize: 26, fontWeight: 700, color: "#ff6633" }}>
                FARTLEK
              </div>
              <div style={{ letterSpacing: 4, fontSize: 14, color: "#777777", marginTop: 4 }}>
                {uk ? "ПЛАТФОРМА БІГОВИХ ПОДІЙ" : "RUNNING EVENTS PLATFORM"}
              </div>

              <div style={{ fontSize: 52, fontWeight: 700, marginTop: 44, letterSpacing: 2 }}>
                {uk ? "СЕРТИФІКАТ ФІНІШЕРА" : "FINISHER CERTIFICATE"}
              </div>
              <div style={{ fontSize: 20, color: "#555555", marginTop: 14 }}>
                {uk ? "Цим підтверджується, що" : "This certifies that"}
              </div>

              <div style={{ fontSize: 58, fontWeight: 700, marginTop: 18, color: "#111111" }}>
                {data.fullName}
              </div>
              <div
                style={{
                  width: 460,
                  height: 3,
                  backgroundColor: "#ff6633",
                  margin: "16px auto 0",
                }}
              />

              <div style={{ fontSize: 22, color: "#333333", marginTop: 28, lineHeight: 1.5 }}>
                {uk ? "успішно подолав(-ла) дистанцію" : "successfully completed the distance"}{" "}
                <strong>{data.distanceKm} {uk ? "км" : "km"}</strong>
                <br />
                {uk ? "на події" : "at"} <strong>{data.eventTitle}</strong>
                <br />
                {dateLabel}
                {data.location ? ` · ${data.location}` : ""}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 64,
                  marginTop: 46,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, letterSpacing: 3, color: "#777777" }}>
                    {uk ? "ЧАС" : "TIME"}
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 700, color: "#ff6633" }}>
                    {fmtTime(data.timeSeconds)}
                  </div>
                </div>
                {data.overallRank != null && (
                  <div>
                    <div style={{ fontSize: 14, letterSpacing: 3, color: "#777777" }}>
                      {uk ? "МІСЦЕ АБСОЛЮТ" : "OVERALL PLACE"}
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 700 }}>{data.overallRank}</div>
                  </div>
                )}
                {data.categoryRank != null && (
                  <div>
                    <div style={{ fontSize: 14, letterSpacing: 3, color: "#777777" }}>
                      {uk ? "МІСЦЕ В КАТЕГОРІЇ" : "CATEGORY PLACE"}
                      {data.categoryLabel ? ` (${data.categoryLabel})` : ""}
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 700 }}>{data.categoryRank}</div>
                  </div>
                )}
                {data.bib != null && (
                  <div>
                    <div style={{ fontSize: 14, letterSpacing: 3, color: "#777777" }}>
                      {uk ? "НОМЕР" : "BIB"}
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 700 }}>{data.bib}</div>
                  </div>
                )}
              </div>

              <div style={{ position: "absolute", bottom: -180, left: 0, right: 0, fontSize: 14, color: "#999999" }}>
                fartlek.lovable.app
              </div>
            </div>
          </div>
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

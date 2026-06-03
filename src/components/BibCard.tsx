import { useEffect, useRef, useState, ReactNode } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import kharkivHalfMarathonBg from "@/assets/kharkiv-half-marathon-bib-blank.png";

const CUSTOM_BIB_TEMPLATES: { match: RegExp; bg: string; width: number; height: number }[] = [
  { match: /kharkiv\s*half\s*marathon/i, bg: kharkivHalfMarathonBg, width: 792, height: 528 },
];

type Props = {
  eventTitle: string;
  fullName?: string | null;
  club?: string | null;
  bibNumber?: number | null;
  distance?: string | null;
  qrUrl?: string | null;
  trigger?: ReactNode;
};

/**
 * Простий стартовий номер (BIB) — попередній перегляд + завантаження PNG/PDF.
 */
export const BibCard = ({ eventTitle, fullName, club, bibNumber, distance, qrUrl, trigger }: Props) => {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  const safeBib = bibNumber ?? "—";
  const fileBase = `bib-${bibNumber ?? "noncolor"}-${(fullName ?? "runner").replace(/\s+/g, "_")}`;
  const targetUrl = qrUrl || (typeof window !== "undefined" ? window.location.href : "https://fartlek.lovable.app");

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(targetUrl, { margin: 0, width: 240, errorCorrectionLevel: "M" })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [open, targetUrl]);

  const render = async () => {
    if (!ref.current) return null;
    return await html2canvas(ref.current, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
  };

  const downloadPng = async () => {
    setBusy("png");
    try {
      const canvas = await render();
      if (!canvas) return;
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${fileBase}.png`;
      link.click();
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    setBusy("pdf");
    try {
      const canvas = await render();
      if (!canvas) return;
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const marginX = 10;
      const targetW = pageW - marginX * 2;
      const ratio = canvas.height / canvas.width;
      const targetH = targetW * ratio;
      const y = 20;
      pdf.addImage(img, "PNG", marginX, y, targetW, targetH);
      pdf.save(`${fileBase}.pdf`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4" />
            {lang === "uk" ? "Стартовий номер" : "Start bib"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {lang === "uk" ? "Стартовий номер" : "Start bib"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh] flex justify-center bg-muted/30 p-3 rounded-md">
          {(() => {
            const tpl = CUSTOM_BIB_TEMPLATES.find((t) => t.match.test(eventTitle));
            if (tpl) {
              return (
                <div
                  ref={ref}
                  style={{
                    width: tpl.width,
                    height: tpl.height,
                    position: "relative",
                    backgroundImage: `url(${tpl.bg})`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    color: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "38%",
                      textAlign: "center",
                      fontSize: 230,
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: -8,
                      color: "#ffffff",
                      transform: "translateY(-50%)",
                    }}
                  >
                    {safeBib}
                  </div>
                  {fullName && (
                    <div
                      style={{
                        position: "absolute",
                        left: "22%",
                        right: "22%",
                        bottom: "9%",
                        textAlign: "center",
                        fontSize: 32,
                        fontWeight: 700,
                        color: "#ffffff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {fullName}
                    </div>
                  )}
                </div>
              );
            }
            return (
          <div
            ref={ref}
            style={{
              width: 660,
              height: 528,
              background: "#ffffff",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#0a0a0a",
              padding: 0,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "relative",
                background: "#0a0a0a",
                color: "#ffffff",
                height: 88,
                padding: "0 24px",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: "uppercase",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  display: "block",
                  lineHeight: 1,
                  transform: "translateY(-2px)",
                }}
              >
                {eventTitle}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "16px 24px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {fullName && (
                <div style={{ fontSize: 32, fontWeight: 700, textAlign: "center" }}>
                  {fullName}
                </div>
              )}
              {club && (
                <div style={{ fontSize: 20, color: "#444", textAlign: "center" }}>{club}</div>
              )}
              {distance && (
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#0057B7",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  {distance}
                </div>
              )}
              <div
                style={{
                  fontSize: 150,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: -6,
                  marginTop: 4,
                  marginBottom: 32,
                }}
              >
                {safeBib}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "2px solid #0a0a0a",
                padding: "16px 24px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR"
                  crossOrigin="anonymous"
                  style={{ width: 72, height: 72 }}
                />
              ) : (
                <div style={{ width: 72, height: 72 }} />
              )}
              <div
                style={{
                  width: 60,
                  height: 40,
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #999",
                }}
              >
                <div style={{ flex: 1, background: "#0057B7" }} />
                <div style={{ flex: 1, background: "#FFD700" }} />
              </div>
            </div>
          </div>
            );
          })()}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={downloadPng} disabled={!!busy} className="flex-1">
            {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            PNG
          </Button>
          <Button onClick={downloadPdf} disabled={!!busy} variant="secondary" className="flex-1">
            {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            PDF (A4)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BibCard;

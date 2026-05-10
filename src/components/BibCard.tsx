import { useRef, useState, ReactNode } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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

type Props = {
  eventTitle: string;
  fullName?: string | null;
  club?: string | null;
  bibNumber?: number | null;
  trigger?: ReactNode;
};

/**
 * Простий стартовий номер (BIB) — попередній перегляд + завантаження PNG/PDF.
 * Доступний учасникам, організаторам, співорганізаторам та адміну.
 */
export const BibCard = ({ eventTitle, fullName, club, bibNumber, trigger }: Props) => {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const safeBib = bibNumber ?? "—";
  const fileBase = `bib-${bibNumber ?? "noncolor"}-${(fullName ?? "runner").replace(/\s+/g, "_")}`;

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
      // A4 portrait, fit bib horizontally with margins, centered vertically near top.
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const marginX = 10;
      const targetW = pageW - marginX * 2;
      const ratio = canvas.height / canvas.width;
      const targetH = targetW * ratio;
      const y = 20;
      // Cut marks (corners)
      pdf.setLineDashPattern([2, 2], 0);
      pdf.setDrawColor(150);
      pdf.rect(marginX, y, targetW, targetH);
      pdf.setLineDashPattern([], 0);
      pdf.addImage(img, "PNG", marginX, y, targetW, targetH);
      // Footer caption
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(
        lang === "uk"
          ? "Розріжте по контуру. Закріпіть на одязі шпильками."
          : "Cut along the border. Pin to your shirt.",
        pageW / 2,
        y + targetH + 8,
        { align: "center" }
      );
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

        {/* Preview / capture surface */}
        <div className="overflow-auto max-h-[60vh] flex justify-center bg-muted/30 p-3 rounded-md">
          <div
            ref={ref}
            style={{
              width: 660,
              height: 528,
              background: "#ffffff",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#0a0a0a",
              padding: 24,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              border: "2px solid #0a0a0a",
            }}
          >
            {/* Header band */}
            <div
              style={{
                background: "#0a0a0a",
                color: "#ffffff",
                padding: "12px 16px",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 1,
                textAlign: "center",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
            >
              {eventTitle}
            </div>

            {/* Body */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "16px 0",
              }}
            >
              {fullName && (
                <div style={{ fontSize: 34, fontWeight: 700, textAlign: "center" }}>
                  {fullName}
                </div>
              )}
              {club && (
                <div style={{ fontSize: 22, color: "#444", textAlign: "center" }}>{club}</div>
              )}
              <div
                style={{
                  fontSize: 180,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: -6,
                  marginTop: 8,
                }}
              >
                {safeBib}
              </div>
            </div>

            {/* Footer with flag */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "2px solid #0a0a0a",
                paddingTop: 12,
              }}
            >
              <div style={{ fontSize: 14, color: "#666" }}>fartlek.lovable.app</div>
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

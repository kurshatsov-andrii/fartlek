import { FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

/**
 * Generic in-app viewer for an external document/link.
 * Tries to embed the URL in an iframe (with Google Docs auto-conversion to /preview).
 * Provides a fallback "Open in new tab" button for sources that block embedding.
 */
export const DocumentDialog = ({ open, onOpenChange, url, title }: DocumentDialogProps) => {
  const { lang } = useApp();

  const gdocMatch = url.match(/^https:\/\/docs\.google\.com\/document\/d\/([^/]+)/i);
  const gsheetMatch = url.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]+)/i);
  const gslidesMatch = url.match(/^https:\/\/docs\.google\.com\/presentation\/d\/([^/]+)/i);
  const gdriveMatch = url.match(/^https:\/\/drive\.google\.com\/file\/d\/([^/]+)/i);

  let embedSrc = url;
  if (gdocMatch) embedSrc = `https://docs.google.com/document/d/${gdocMatch[1]}/preview`;
  else if (gsheetMatch) embedSrc = `https://docs.google.com/spreadsheets/d/${gsheetMatch[1]}/preview`;
  else if (gslidesMatch) embedSrc = `https://docs.google.com/presentation/d/${gslidesMatch[1]}/preview`;
  else if (gdriveMatch) embedSrc = `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted">
          <iframe
            src={embedSrc}
            title={title}
            className="w-full h-full"
            allow="autoplay; fullscreen"
          />
        </div>
        <div className="p-3 border-t border-border flex justify-end">
          <Button asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noopener noreferrer">
              {lang === "uk" ? "Відкрити в новій вкладці" : "Open in new tab"}
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

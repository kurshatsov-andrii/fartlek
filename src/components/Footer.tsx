import { Activity } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export const Footer = () => {
  const { t } = useApp();
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="container py-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-bold">Fartlek Events</div>
            <div className="text-xs text-secondary-foreground/60">{t.footer.tagline}</div>
          </div>
        </div>
        <div className="text-xs text-secondary-foreground/50">
          © {new Date().getFullYear()} Fartlek. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
};

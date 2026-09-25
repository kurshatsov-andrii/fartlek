import { Link } from "@/lib/router-compat";
import { Activity, Send, MessagesSquare } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { TELEGRAM_CHANNEL_URL, TELEGRAM_CHAT_URL } from "@/components/TelegramCommunity";

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
        <div className="text-center text-sm text-secondary-foreground/70 space-y-1">
          <div className="font-semibold">ФОП КУРШАЦОВ А. І.</div>
          <a href="tel:+380972520551" className="block hover:text-primary transition-colors">+38 097 252 05 51</a>
          <a href="mailto:info@fartlek.com.ua" className="block hover:text-primary transition-colors">info@fartlek.com.ua</a>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-secondary-foreground/20 px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition-colors">
              <Send className="h-3.5 w-3.5" /> Telegram-канал
            </a>
            <a href={TELEGRAM_CHAT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-secondary-foreground/20 px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition-colors">
              <MessagesSquare className="h-3.5 w-3.5" /> Telegram-чат
            </a>
          </div>
        </div>
        <div className="text-xs text-secondary-foreground/50 flex flex-col gap-1 text-center md:text-right">
          <div>© {new Date().getFullYear()} Fartlek. {t.footer.rights}</div>
          <div className="flex flex-wrap gap-3 justify-center md:justify-end">
            <Link to="/privacy" className="hover:text-primary transition-colors">Політика конфіденційності</Link>
            <Link to="/public-offer" className="hover:text-primary transition-colors">Публічна оферта</Link>
            <Link to="/user-agreement" className="hover:text-primary transition-colors">Угода користувача</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

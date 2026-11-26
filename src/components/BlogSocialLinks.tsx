import { useL } from "@/lib/use-l";
import { Instagram, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTAGRAM_URL, TELEGRAM_CHAT_URL } from "@/lib/blog";

export const BlogSocialLinks = () => {
  const L = useL();
  return (
  <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h3 className="font-display text-lg font-bold">{L("Бігова спільнота Фартлек", "Фартлек running community")}</h3>
      <p className="text-sm text-muted-foreground">{L("Слідкуйте за нами та бігайте разом щонеділі.", "Follow us and run together every Sunday.")}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline"><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4" />Instagram</a></Button>
      <Button asChild><a href={TELEGRAM_CHAT_URL} target="_blank" rel="noopener noreferrer"><MessagesSquare className="h-4 w-4" />{L("Telegram-чат", "Telegram chat")}</a></Button>
    </div>
  </div>
);
};

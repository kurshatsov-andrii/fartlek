import { useEffect, useState } from "react";
import { Send, MessagesSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, formatBlogDate } from "@/lib/blog";
import logo from "@/assets/logo-fartlek.jpg";

export const TELEGRAM_CHANNEL_URL = "https://t.me/+5-5XOFyn0JUxMTli";
export const TELEGRAM_CHAT_URL = "https://t.me/+KgEHRsz677s4Zjhi";

export const TelegramCommunity = ({ showBlog = false }: { showBlog?: boolean }) => {
  const { lang } = useApp();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  useEffect(() => {
    if (!showBlog) return;
    supabase.from("blog_posts").select("*").eq("is_published", true)
      .order("event_date", { ascending: false }).limit(2)
      .then(({ data }) => setPosts((data as BlogPost[]) ?? []));
  }, [showBlog]);
  const L = lang === "uk" ? { blog: "Останні події з блогу", allPosts: "Усі записи" } : { blog: "Latest from the blog", allPosts: "All posts" };
  const T = lang === "uk"
    ? {
        eyebrow: "Спільнота",
        title: "Бігова спільнота Харкова у Telegram",
        subtitle: "Анонси забігів, спільні тренування, поради та живе спілкування з бігунами.",
        channelTitle: "Телеграм-канал",
        channelText: "Анонси стартів, новини та важливі оновлення.",
        channelCta: "Приєднатися до каналу",
        chatTitle: "Телеграм-чат",
        chatText: "Спілкування, пошук компанії на пробіжку, питання та відповіді.",
        chatCta: "Приєднатися до чату",
      }
    : {
        eyebrow: "Community",
        title: "Kharkiv running community on Telegram",
        subtitle: "Race announcements, group runs, tips and live chat with fellow runners.",
        channelTitle: "Telegram channel",
        channelText: "Race announcements, news and important updates.",
        channelCta: "Join the channel",
        chatTitle: "Telegram chat",
        chatText: "Chat, find running partners, ask questions.",
        chatCta: "Join the chat",
      };

  const cards = [
    { icon: Send, title: T.channelTitle, text: T.channelText, cta: T.channelCta, url: TELEGRAM_CHANNEL_URL },
    { icon: MessagesSquare, title: T.chatTitle, text: T.chatText, cta: T.chatCta, url: TELEGRAM_CHAT_URL },
  ];

  return (
    <section className="py-16">
      <div className="container">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">{T.eyebrow}</div>
            <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold">{T.title}</h2>
            <p className="mt-2 text-muted-foreground">{T.subtitle}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {cards.map((c) => (
              <div key={c.url} className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero">
                  <c.icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
                </div>
                <div className="font-semibold">{c.title}</div>
                <p className="text-sm text-muted-foreground flex-1">{c.text}</p>
                <Button asChild className="w-full sm:w-auto">
                  <a href={c.url} target="_blank" rel="noopener noreferrer">{c.cta}</a>
                </Button>
              </div>
            ))}
          </div>
          </div>
          {posts.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-bold">{L.blog}</h3>
                <Link to="/blog" className="text-sm text-primary hover:underline">{L.allPosts} →</Link>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {posts.map((p) => (
                  <Link key={p.id} to={`/blog/${p.slug}`} className="group flex gap-4 rounded-2xl border border-border bg-background p-3 transition-bounce hover:-translate-y-1">
                    <img src={p.cover_url || p.photos[0] || logo} alt={p.title} loading="lazy" className="h-24 w-32 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 space-y-1">
                      {p.event_date && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{formatBlogDate(p.event_date)}</div>}
                      <div className="font-semibold group-hover:text-primary transition-base">{p.title}</div>
                      {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
    </section>
  );
};

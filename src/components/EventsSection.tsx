import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface EventCard {
  id: string; slug: string | null; title: string; description: string | null; organizer_name: string;
  event_date: string; event_time: string; location: string | null;
  image_url: string | null; is_paid: boolean;
  category: EventCategory;
  format: "offline" | "online" | "hybrid";
  distances: { distance_km: number; price: number; is_active?: boolean }[];
}

export const EventsSection = () => {
  const { t, lang } = useApp();
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<EventCategory | "all">("all");
  const PAGE_SIZE = 9;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    supabase.from("events")
      .select("id, slug, title, description, organizer_name, event_date, event_time, location, image_url, is_paid, category, format, distances(distance_km, price, is_active)")
      .eq("status", "published")
      .order("event_date", { ascending: true })
      .then(({ data }) => { setEvents((data as any) ?? []); setLoading(false); });
  }, []);

  const filtered = useMemo(
    () => activeCat === "all" ? events : events.filter((e) => e.category === activeCat),
    [events, activeCat]
  );

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeCat]);

  const visible = filtered.slice(0, visibleCount);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
      day: "numeric", month: "long", year: "numeric",
    });

  const minPrice = (ev: EventCard) => {
    const prices = activeDistances(ev).map((d) => d.price);
    if (prices.length === 0) return 0;
    const positive = prices.filter((p) => p > 0);
    if (positive.length > 0) return Math.min(...positive);
    return Math.min(...prices);
  };

  const activeDistances = (ev: EventCard) => ev.distances.filter((d) => d.is_active !== false);

  return (
    <section id="events" className="relative py-24 sm:py-32">
      <div className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-14">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              {lang === "uk"
                ? `Сезон ${new Date().getFullYear()} — ${new Date().getFullYear() + 1}`
                : `${new Date().getFullYear()} — ${new Date().getFullYear() + 1} season`}
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {t.events.heading}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t.events.sub}</p>
          </div>
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          {(["all", ...EVENT_CATEGORIES] as const).map((cat) => {
            const label = cat === "all" ? t.categories.all : t.categories[cat];
            const baseCls = "rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-base border-border bg-card text-foreground hover:border-primary hover:text-primary";
            if (cat === "all") {
              return (
                <Link key={cat} to="/category" className={baseCls}>
                  {label}
                </Link>
              );
            }
            return (
              <Link key={cat} to={`/category/${cat}`} className={baseCls}>
                {label}
              </Link>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl">
            <p className="text-muted-foreground">{t.events.empty}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ev, idx) => {
              const price = minPrice(ev);
              return (
                <article key={ev.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-bounce hover:-translate-y-2 hover:shadow-elevated animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                  <Link to={`/events/${ev.slug ?? ev.id}`} className="relative aspect-[4/3] overflow-hidden bg-muted block" aria-label={ev.title}>
                    {ev.image_url ? (
                      <img src={ev.image_url} alt={ev.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="h-full w-full bg-gradient-hero" />
                    )}
                    <div className="absolute inset-0 card-overlay" />
                    <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur ${ev.is_paid ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                        {ev.is_paid ? `${price} ₴` : t.events.free}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-background/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                        {ev.format === "hybrid" ? t.format.badgeHybrid : ev.format === "online" ? t.format.badgeOnline : t.format.badgeOffline}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
                      {activeDistances(ev).map((d, i) => (
                        <span key={i} className="rounded-md bg-background/95 px-2 py-1 text-xs font-bold text-foreground">
                          {d.distance_km} km
                        </span>
                      ))}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-bold leading-tight">{ev.title}</h3>
                    <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{fmtDate(ev.event_date)}</div>
                      {ev.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{ev.location}</div>}
                    </div>
                    
                    <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border">
                      <Button asChild className="flex-1"><Link to={`/events/${ev.slug ?? ev.id}`}>{t.events.register}</Link></Button>
                      <Button asChild variant="outline" size="icon" aria-label={t.events.details}>
                        <Link to={`/events/${ev.slug ?? ev.id}`}><ArrowUpRight className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

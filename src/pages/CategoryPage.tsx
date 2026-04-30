import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Calendar, MapPin, ArrowUpRight, Loader2, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/i18n";
import { categorySeo, formatEventDate } from "@/lib/seo";

interface EventCard {
  id: string; slug: string | null; title: string; description: string | null;
  organizer_name: string; event_date: string; event_time: string;
  location: string | null; image_url: string | null; is_paid: boolean;
  category: EventCategory;
  format: "offline" | "online" | "hybrid";
  distances: { distance_km: number; price: number; is_active?: boolean }[];
}

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const { t, lang } = useApp();
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 9;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const isValid = (EVENT_CATEGORIES as readonly string[]).includes(category ?? "");
  const cat = (isValid ? category : "run") as EventCategory;

  useEffect(() => {
    if (!isValid) return;
    supabase.from("events")
      .select("id, slug, title, description, organizer_name, event_date, event_time, location, image_url, is_paid, category, format, distances(distance_km, price, is_active)")
      .eq("status", "published")
      .eq("category", cat)
      .order("event_date", { ascending: true })
      .then(({ data }) => { setEvents((data as any) ?? []); setLoading(false); });
  }, [cat, isValid]);

  const seo = useMemo(() => categorySeo(cat, lang), [cat, lang]);

  if (!isValid) return <Navigate to="/" replace />;

  const heading = t.categories[cat];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    itemListElement: events.map((ev, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${window.location.origin}/events/${ev.slug ?? ev.id}`,
      name: ev.title,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seo.title} description={seo.description} canonical={`/category/${cat}`} jsonLd={jsonLd} />
      <Header />
      <main className="flex-1 container py-12 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t.events.backToEvents}
        </Link>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">{seo.description}</p>

        <div className="mt-8 mb-10 flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((c) => (
            <Link
              key={c}
              to={`/category/${c}`}
              className={`rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-base ${
                c === cat
                  ? "border-primary bg-primary text-primary-foreground shadow-card"
                  : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {t.categories[c]}
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl">
            <p className="text-muted-foreground">{t.events.empty}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => {
              const active = ev.distances.filter((d) => d.is_active !== false);
              const minPrice = active.length ? Math.min(...active.map((d) => d.price)) : 0;
              const url = `/events/${ev.slug ?? ev.id}`;
              return (
                <article key={ev.id} className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-bounce hover:-translate-y-2 hover:shadow-elevated">
                  <Link to={url} className="relative aspect-[4/3] overflow-hidden bg-muted block">
                    {ev.image_url
                      ? <img src={ev.image_url} alt={ev.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      : <div className="h-full w-full bg-gradient-hero" />}
                    <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur ${ev.is_paid ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                        {ev.is_paid ? `${minPrice} ₴` : t.events.free}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-background/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                        {ev.format === "hybrid" ? t.format.badgeHybrid : ev.format === "online" ? t.format.badgeOnline : t.format.badgeOffline}
                      </span>
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-xl font-bold leading-tight">{ev.title}</h2>
                    <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{formatEventDate(ev.event_date, lang)}</div>
                      {ev.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{ev.location}</div>}
                    </div>
                    <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border">
                      <Button asChild className="flex-1"><Link to={url}>{t.events.register}</Link></Button>
                      <Button asChild variant="outline" size="icon" aria-label={t.events.details}>
                        <Link to={url}><ArrowUpRight className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;

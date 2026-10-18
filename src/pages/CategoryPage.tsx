import { useEffect, useMemo, useState } from "react";
import { EventPoster } from "@/components/EventPoster";
import { Link, Navigate, useParams } from "@/lib/router-compat";
import {
  Calendar, MapPin, ArrowUpRight, Loader2, ArrowLeft, Search, Filter, X, ExternalLink,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/i18n";
import { categorySeo, formatEventDate } from "@/lib/seo";
import { isPastDate } from "@/lib/event-date";
import { canShowRegisterButton } from "@/lib/registration-status";
import { StartActions } from "@/components/StartActions";
import { MONTH_NAMES_UK, type SportType } from "@/lib/parseStart";
import {
  DISTANCE_BUCKETS, baseCity, categorySport, detectCity, matchesDistance, monthOf,
} from "@/lib/start-filters";

interface EventCard {
  id: string; slug: string | null; title: string; description: string | null;
  organizer_name: string; event_date: string; event_time: string;
  location: string | null; image_url: string | null; is_paid: boolean;
  category: EventCategory;
  format: "offline" | "online" | "hybrid";
  distances: { distance_km: number; price: number; is_active?: boolean }[];
}

interface StartRow {
  id: string; slug: string; title: string; description: string | null;
  image_url: string | null; register_url: string | null; results_url: string | null; registration_status: string | null; event_date: string | null;
  city: string | null; organizer_name: string | null; sport_types: string[] | null;
  distances_km: number[] | null; is_paid: boolean | null;
}

// One shape for both platform events and telegram starts so they share cards and filters.
interface CatItem {
  kind: "event" | "start";
  id: string;
  url: string;
  title: string;
  description: string | null;
  date: string | null;
  location: string | null;
  city: string | null;
  organizer: string | null;
  image: string | null;
  distances: number[];
  minPrice: number | null;
  isPaid: boolean | null;
  badges: string[];
  registerUrl: string | null;
  resultsUrl: string | null;
}

const PAGE_SIZE = 9;
const todayStr = new Date().toISOString().slice(0, 10);

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const { t, lang } = useApp();
  const [events, setEvents] = useState<EventCard[]>([]);
  const [starts, setStarts] = useState<StartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [completedCount, setCompletedCount] = useState(PAGE_SIZE);

  const [q, setQ] = useState("");
  const [month, setMonth] = useState("all");
  const [city, setCity] = useState("all");
  const [organizer, setOrganizer] = useState("all");
  const [distance, setDistance] = useState("all");
  const [paid, setPaid] = useState<"all" | "paid" | "free">("all");

  const isValid = (EVENT_CATEGORIES as readonly string[]).includes(category ?? "");
  const cat = (isValid ? category : "run") as EventCategory;
  const sport = categorySport(cat);

  useEffect(() => {
    if (!isValid) return;
    setLoading(true);
    (async () => {
      const [ev, st] = await Promise.all([
        supabase.from("events")
          .select("id, slug, title, description, organizer_name, event_date, event_time, location, image_url, is_paid, category, format, distances(distance_km, price, is_active)")
          .eq("status", "published")
          .eq("category", cat)
          .order("event_date", { ascending: true }),
        sport
          ? supabase.from("telegram_starts")
              .select("id, slug, title, description, image_url, register_url, results_url, registration_status, event_date, city, organizer_name, sport_types, distances_km, is_paid")
              .eq("status", "published")
              .contains("sport_types", [sport])
              .order("event_date", { ascending: true })
          : Promise.resolve({ data: [] as StartRow[] }),
      ]);
      setEvents(((ev.data ?? []) as any) as EventCard[]);
      setStarts(((st.data ?? []) as any) as StartRow[]);
      setLoading(false);
    })();
  }, [cat, isValid, sport]);

  // A new category means new facets — drop the old filters.
  useEffect(() => {
    setQ(""); setMonth("all"); setCity("all"); setOrganizer("all"); setDistance("all"); setPaid("all");
    setVisibleCount(PAGE_SIZE); setCompletedCount(PAGE_SIZE);
  }, [cat]);

  const items = useMemo<CatItem[]>(() => {
    const fromEvents: CatItem[] = events.map((ev) => {
      const active = ev.distances.filter((d) => d.is_active !== false);
      return {
        kind: "event",
        id: ev.id,
        url: `/events/${ev.slug ?? ev.id}`,
        title: ev.title,
        description: ev.description,
        date: ev.event_date ?? null,
        location: ev.location,
        city: detectCity(ev.location),
        organizer: ev.organizer_name || null,
        image: ev.image_url,
        distances: active.map((d) => Number(d.distance_km)).filter((n) => n > 0),
        minPrice: active.length ? Math.min(...active.map((d) => d.price)) : null,
        isPaid: ev.is_paid,
        badges: [ev.format === "hybrid" ? t.format.badgeHybrid : ev.format === "online" ? t.format.badgeOnline : t.format.badgeOffline],
        registerUrl: null,
      };
    });

    const fromStarts: CatItem[] = starts.map((s) => ({
      kind: "start",
      id: s.id,
      url: `/starts/${s.slug}`,
      title: s.title,
      description: s.description,
      date: s.event_date,
      location: s.city,
      city: baseCity(s.city) || null,
      organizer: s.organizer_name,
      image: s.image_url,
      distances: (s.distances_km ?? []).map(Number).filter((n) => n > 0),
      minPrice: null,
      isPaid: s.is_paid,
      badges: Array.from(new Set((s.sport_types ?? []).filter((x) => x in t.categories)))
        .slice(0, 2)
        .map((x) => t.categories[x as EventCategory]),
      resultsUrl: s.results_url,
      registerUrl: canShowRegisterButton({ explicit: s.registration_status, date: s.event_date, today: todayStr }) ? s.register_url : null,
    }));

    return [...fromEvents, ...fromStarts];
  }, [events, starts, t]);

  const cities = useMemo(
    () => Array.from(new Set(items.map((i) => i.city).filter(Boolean) as string[])).sort(),
    [items]
  );
  const organizers = useMemo(
    () => Array.from(new Set(items.map((i) => i.organizer).filter(Boolean) as string[])).sort(),
    [items]
  );

  const distanceBucket = distance === "all" ? null : DISTANCE_BUCKETS.find((b) => b.label === distance) ?? null;

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return items.filter((i) => {
      if (qLower) {
        const hay = `${i.title} ${i.description ?? ""} ${i.location ?? ""} ${i.organizer ?? ""}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      if (month !== "all") {
        if (!i.date || String(monthOf(i.date)) !== month) return false;
      }
      if (city !== "all" && i.city !== city) return false;
      if (organizer !== "all" && i.organizer !== organizer) return false;
      if (!matchesDistance(i.distances, distanceBucket)) return false;
      if (paid === "paid" && i.isPaid !== true) return false;
      if (paid === "free" && i.isPaid !== false) return false;
      return true;
    });
  }, [items, q, month, city, organizer, distanceBucket, paid]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingAll = filtered
    .filter((i) => !i.date || i.date >= todayStr)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const completedAll = filtered
    .filter((i) => i.date && i.date < todayStr)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const upcoming = upcomingAll.slice(0, visibleCount);
  const completed = completedAll.slice(0, completedCount);

  const activeFilters =
    (q ? 1 : 0) + (month !== "all" ? 1 : 0) + (city !== "all" ? 1 : 0) +
    (organizer !== "all" ? 1 : 0) + (distance !== "all" ? 1 : 0) + (paid !== "all" ? 1 : 0);

  const reset = () => {
    setQ(""); setMonth("all"); setCity("all"); setOrganizer("all"); setDistance("all"); setPaid("all");
    setVisibleCount(PAGE_SIZE); setCompletedCount(PAGE_SIZE);
  };

  const seo = useMemo(() => categorySeo(cat, lang), [cat, lang]);

  if (!isValid) return <Navigate to="/" replace />;

  const heading = t.categories[cat];
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    itemListElement: filtered.map((i, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${origin}${i.url}`,
      name: i.title,
    })),
  };

  const T = lang === "uk"
    ? {
        filters: "Фільтри", reset: "Скинути", search: "Пошук за назвою, описом, містом…",
        allMonths: "Усі місяці", allCities: "Усі міста", allOrganizers: "Усі організатори",
        anyDistance: "Будь-яка дистанція", allPaid: "Платні і безкоштовні", freeOnly: "Безкоштовні", paidOnly: "Платні",
        empty: "Нічого не знайдено за обраними фільтрами.", completed: "Завершені",
        more: "Завантажити ще", details: "Детальніше", register: "Зареєструватися", results: "Результати", free: t.events.free,
      }
    : {
        filters: "Filters", reset: "Reset", search: "Search by title, description, city…",
        allMonths: "All months", allCities: "All cities", allOrganizers: "All organizers",
        anyDistance: "Any distance", allPaid: "Paid and free", freeOnly: "Free", paidOnly: "Paid",
        empty: "Nothing matches the selected filters.", completed: "Completed",
        more: "Load more", details: "Details", register: "Sign up", results: "Results", free: t.events.free,
      };

  const renderCard = (i: CatItem) => {
    const past = !!i.date && isPastDate(i.date);
    return (
      <article key={`${i.kind}-${i.id}`} className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-bounce hover:-translate-y-2 hover:shadow-elevated">
        <Link to={i.url} className="relative aspect-video overflow-hidden bg-muted block">
          {i.image ? <EventPoster src={i.image} alt={i.title} /> : <div className="h-full w-full bg-gradient-hero" />}
        </Link>
        <div className="px-6 pt-4 flex flex-wrap items-start gap-1.5">
          {i.isPaid === false ? (
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground backdrop-blur">
              {T.free}
            </span>
          ) : i.minPrice != null ? (
            <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground backdrop-blur">
              {i.minPrice} ₴
            </span>
          ) : null}
          {i.badges.map((b) => (
            <span key={b} className="inline-flex items-center rounded-full bg-background/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
              {b}
            </span>
          ))}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h2 className="font-display text-xl font-bold leading-tight">{i.title}</h2>
          <StartActions source={i.kind} id={i.id} />
          <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
            {i.date && (
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{formatEventDate(i.date, lang)}</div>
            )}
            {i.location && (
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{i.location}</div>
            )}
          </div>
          {i.distances.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {[...i.distances].sort((a, b) => b - a).slice(0, 4).map((d) => (
                <span key={String(d)} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{d} км</span>
              ))}
            </div>
          )}
          <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border">
            {past ? (
              <Button asChild variant="secondary" className="flex-1"><Link to={i.url}>{T.details}</Link></Button>
            ) : i.kind === "start" && i.registerUrl ? (
              <Button asChild className="flex-1">
                <a href={i.registerUrl} target="_blank" rel="noreferrer">
                  {T.register} <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
            ) : (
              <Button asChild className="flex-1"><Link to={i.url}>{i.kind === "start" ? T.details : t.events.register}</Link></Button>
            )}
            <Button asChild variant="outline" size="icon" aria-label={t.events.details}>
              <Link to={i.url}><ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </article>
    );
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
        <p className="mt-3 text-muted-foreground">{seo.description}</p>

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

        {/* Filters — the same controls as on the Starts page */}
        <div className="rounded-lg border bg-card p-4 mb-8 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" /> {T.filters}
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={reset}>
                <X className="h-3.5 w-3.5 mr-1" /> {T.reset} ({activeFilters})
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.search} className="pl-9" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue placeholder={lang === "uk" ? "Місяць" : "Month"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{T.allMonths}</SelectItem>
                {MONTH_NAMES_UK.map((n, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={distance} onValueChange={setDistance}>
              <SelectTrigger><SelectValue placeholder={lang === "uk" ? "Дистанція" : "Distance"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{T.anyDistance}</SelectItem>
                {DISTANCE_BUCKETS.map((b) => (
                  <SelectItem key={b.label} value={b.label}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue placeholder={lang === "uk" ? "Місто" : "City"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{T.allCities}</SelectItem>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={organizer} onValueChange={setOrganizer}>
              <SelectTrigger><SelectValue placeholder={lang === "uk" ? "Організатор" : "Organizer"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{T.allOrganizers}</SelectItem>
                {organizers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={paid} onValueChange={(v) => setPaid(v as any)}>
              <SelectTrigger><SelectValue placeholder={lang === "uk" ? "Тип" : "Type"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{T.allPaid}</SelectItem>
                <SelectItem value="free">{T.freeOnly}</SelectItem>
                <SelectItem value="paid">{T.paidOnly}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl">
            <p className="text-muted-foreground">{activeFilters > 0 ? T.empty : t.events.empty}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map(renderCard)}
                </div>
                {visibleCount < upcomingAll.length && (
                  <div className="flex justify-center mt-10">
                    <Button variant="outline" size="lg" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                      {T.more} ({upcomingAll.length - visibleCount})
                    </Button>
                  </div>
                )}
              </>
            )}
            {completed.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold mb-6">{T.completed}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-75">
                  {completed.map(renderCard)}
                </div>
                {completedCount < completedAll.length && (
                  <div className="flex justify-center mt-8">
                    <Button variant="outline" onClick={() => setCompletedCount((n) => n + PAGE_SIZE)}>
                      {T.more} ({completedAll.length - completedCount})
                    </Button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;

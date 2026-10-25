import { useEffect, useMemo, useState } from "react";
import { YearFilterButtons, matchesYear } from "@/components/YearFilterButtons";
import { PageViews } from "@/components/PageViews";
import { EventPoster } from "@/components/EventPoster";
import { Link } from "@/lib/router-compat";
import { Calendar, MapPin, ArrowUpRight, Loader2, Search, X, Filter } from "lucide-react";
import { isCompletedDate } from "@/lib/event-date";
import { StartActions } from "@/components/StartActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { type EventCategory } from "@/lib/i18n";
import { eventCity } from "@/lib/utils";
import { availableStartCategories, showEventResults } from "@/lib/home-starts";
import { OtherStartsSection, DISTANCE_BUCKET_LABELS, type SharedStartFilters } from "@/components/OtherStartsSection";
import { useCallback } from "react";


const DISTANCE_BUCKETS_MATCH: Record<string, (d: number) => boolean> = {
  "до 5 км": (d) => d > 0 && d <= 5,
  "10 км": (d) => d > 5 && d <= 12,
  "21 км": (d) => d > 12 && d <= 25,
  "42 км": (d) => d > 25 && d <= 45,
  "> 50 км": (d) => d > 45,
};

interface EventCard {
  id: string; slug: string | null; title: string; description: string | null; organizer_name: string;
  event_date: string; event_time: string; location: string | null;
  image_url: string | null; is_paid: boolean;
  category: EventCategory;
  format: "offline" | "online" | "hybrid";
  registration_closed?: boolean;
  distances: { distance_km: number; price: number; is_active?: boolean }[];
}

export const EventsSection = () => {
  const { t, lang } = useApp();
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<EventCategory | "all">("all");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const onSearch = (e: Event) => setSearch(String((e as CustomEvent).detail ?? ""));
    window.addEventListener("fartlek:search", onSearch);
    return () => window.removeEventListener("fartlek:search", onSearch);
  }, []);
  const [city, setCity] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [format, setFormat] = useState<string>("all");
  const [paid, setPaid] = useState<"all" | "paid" | "free">("all");
  const [year, setYear] = useState<string>("all");
  const [distance, setDistance] = useState<string>("all");
  const [startFacets, setStartFacets] = useState<{ cities: string[]; months: string[]; sports: string[] }>({ cities: [], months: [], sports: [] });
  const handleFacets = useCallback((c: string[], m: string[], sports: string[]) => setStartFacets({ cities: c, months: m, sports }), []);
  const PAGE_SIZE = 9;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    supabase.from("events")
      .select("id, slug, title, description, organizer_name, event_date, event_time, location, image_url, is_paid, category, format, registration_closed, distances(distance_km, price, is_active)")
      .eq("status", "published")
      .order("event_date", { ascending: true })
      .then(({ data }) => {
        // Owner request: Bilka Run first, then EKIDEN KHARIKOFU right after it, above all other races.
        const pinned = (e: { slug?: string | null }) => {
          if (e.slug === "bilka-run-harkiv-2026") return 0;
          if (e.slug === "ekiden-kharikofu-10k-2026-harkiv-stadion-hpi-molodizhnyy-park-2026") return 1;
          return 2;
        };
        const sorted = [...((data as any[]) ?? [])].sort((a, b) => pinned(a) - pinned(b) || a.event_date.localeCompare(b.event_date));
        setEvents((sorted as EventCard[]).filter((event) => !isCompletedDate(event.event_date))); setLoading(false);
      });
  }, []);

  const getEventCity = (e: EventCard) => eventCity(e.location);
  const categories = useMemo(() => availableStartCategories(events, startFacets.sports), [events, startFacets.sports]);


  const cities = useMemo(() => {
    const s = new Set<string>();
    events.forEach((e) => { const c = getEventCity(e); if (c) s.add(c); });
    startFacets.cities.forEach((c) => { if (![...s].some((x) => x.toLowerCase() === c.toLowerCase())) s.add(c); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "uk"));
  }, [events, startFacets]);

  const months = useMemo(() => {
    const s = new Set<string>();
    events.forEach((e) => { if (e.event_date) s.add(e.event_date.slice(0, 7)); });
    startFacets.months.forEach((m) => s.add(m));
    return Array.from(s).filter((m) => year === "all" || m.startsWith(year)).sort();
  }, [events, startFacets, year]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (activeCat !== "all" && e.category !== activeCat) return false;
      if (city !== "all" && (getEventCity(e) ?? "").toLowerCase() !== city.toLowerCase()) return false;
      if (distance !== "all") {
        const b = DISTANCE_BUCKETS_MATCH[distance];
        if (b && !e.distances.some((d) => d.is_active !== false && b(Number(d.distance_km)))) return false;
      }
      if (month !== "all" && !(e.event_date ?? "").startsWith(month)) return false;
      if (!matchesYear(e.event_date, year)) return false;
      if (format !== "all" && e.format !== format) return false;
      if (paid === "paid" && !e.is_paid) return false;
      if (paid === "free" && e.is_paid) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q) ||
        (e.organizer_name ?? "").toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [events, activeCat, search, city, month, format, paid, year, distance]);


  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeCat, search, city, month, format, paid, year, distance]);

  const visible = filtered.slice(0, visibleCount);

  const activeFilters = (activeCat !== "all" ? 1 : 0) + (search ? 1 : 0) + (city !== "all" ? 1 : 0) + (month !== "all" ? 1 : 0) + (format !== "all" ? 1 : 0) + (paid !== "all" ? 1 : 0) + (year !== "all" ? 1 : 0) + (distance !== "all" ? 1 : 0);
  const sharedFilters = useMemo<SharedStartFilters>(() => ({ q: search, city, month, year, paid, distance, category: activeCat }), [search, city, month, year, paid, distance, activeCat]);
  const resetFilters = () => { setActiveCat("all"); setSearch(""); setCity("all"); setMonth("all"); setFormat("all"); setPaid("all"); setYear("all"); setDistance("all"); };

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

  const activeDistances = (ev: EventCard) =>
    ev.distances.filter((d) => d.is_active !== false).slice().sort((a, b) => b.distance_km - a.distance_km);

  return (
    <>
    <section id="events" className="relative scroll-mt-16 py-6 sm:py-8">
      <div className="container">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            {lang === "uk"
              ? `Сезон ${new Date().getFullYear()} — ${new Date().getFullYear() + 1}`
              : `${new Date().getFullYear()} — ${new Date().getFullYear() + 1} season`}
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {lang === "uk" ? "Каталог стартів" : "Race catalog"}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-4">
            <p className="text-base text-muted-foreground sm:text-lg">{t.events.sub}</p>
            <PageViews pageKey="page:events" />
          </div>

        </div>



        <div className="mb-6 rounded-2xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" /> {lang === "uk" ? "Фільтри" : "Filters"}
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={resetFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> {lang === "uk" ? `Скинути (${activeFilters})` : `Reset (${activeFilters})`}
              </Button>
            )}
          </div>
          <YearFilterButtons value={year} onChange={(y) => { setYear(y); if (month !== "all" && y !== "all" && !month.startsWith(y)) setMonth("all"); }} lang={lang} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "uk" ? "Пошук подій за назвою, місцем, організатором…" : "Search events by name, location, organizer…"}
              className="pl-9 pr-9"
              aria-label={lang === "uk" ? "Пошук подій" : "Search events"}
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                aria-label={lang === "uk" ? "Очистити" : "Clear"}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid min-w-0 grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-5 gap-2 [&>button]:min-w-0 [&>button>span]:truncate">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger aria-label={lang === "uk" ? "Місто" : "City"}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "uk" ? "Усі міста" : "All cities"}</SelectItem>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger aria-label={lang === "uk" ? "Місяць" : "Month"}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "uk" ? "Усі місяці" : "All months"}</SelectItem>
                {months.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={distance} onValueChange={setDistance}>
              <SelectTrigger aria-label={lang === "uk" ? "Дистанція" : "Distance"}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "uk" ? "Будь-яка дистанція" : "Any distance"}</SelectItem>
                {DISTANCE_BUCKET_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger aria-label={lang === "uk" ? "Формат" : "Format"}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "uk" ? "Будь-який формат" : "Any format"}</SelectItem>
                <SelectItem value="offline">{t.format.badgeOffline}</SelectItem>
                <SelectItem value="online">{t.format.badgeOnline}</SelectItem>
                <SelectItem value="hybrid">{t.format.badgeHybrid}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paid} onValueChange={(v) => setPaid(v as any)}>
              <SelectTrigger aria-label={lang === "uk" ? "Тип" : "Type"}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "uk" ? "Платні і безкоштовні" : "Paid and free"}</SelectItem>
                <SelectItem value="free">{lang === "uk" ? "Безкоштовні" : "Free"}</SelectItem>
                <SelectItem value="paid">{lang === "uk" ? "Платні" : "Paid"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label={lang === "uk" ? "Категорії стартів" : "Race categories"}>
          {(["all", ...categories] as const).map((cat) => {
            const label = cat === "all" ? t.categories.all : t.categories[cat];
            return (
              <Button key={cat} variant={activeCat === cat ? "default" : "outline"} onClick={() => setActiveCat(cat)} aria-pressed={activeCat === cat} className="text-sm font-semibold uppercase">
                {label}
              </Button>
            );
          })}
        </div>
      </div>
    </section>

    {showEventResults(filtered.length, loading) && <section aria-labelledby="home-events-heading" className="py-6 sm:py-8">
      <div className="container">
        <h2 id="home-events-heading" className="mb-6 font-display text-3xl font-bold sm:text-4xl">{lang === "uk" ? "Події" : "Events"}</h2>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((ev, idx) => {
              const price = minPrice(ev);
              return (
                <article key={ev.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-bounce hover:-translate-y-2 hover:shadow-elevated animate-fade-in-up" style={{ animationDelay: `${(idx % PAGE_SIZE) * 80}ms` }}>
                  <Link to={`/events/${ev.slug ?? ev.id}`} className="relative aspect-video overflow-hidden bg-muted block isolate" aria-label={ev.title}>
                    {ev.image_url ? (
                      <EventPoster src={ev.image_url} alt={ev.title} />
                    ) : (
                      <div className="h-full w-full bg-gradient-hero" />
                    )}
                  </Link>
                    <div className="px-6 pt-4 flex flex-wrap items-start gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur ${ev.is_paid ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                        {ev.is_paid ? `${price} ₴` : t.events.free}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-background/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                        {ev.format === "hybrid" ? t.format.badgeHybrid : ev.format === "online" ? t.format.badgeOnline : t.format.badgeOffline}
                      </span>
                    </div>
                    <div className="px-6 pt-2 flex flex-wrap gap-1.5">
                      {activeDistances(ev).map((d, i) => (
                        <span key={i} className="rounded-md bg-background/95 px-2 py-1 text-xs font-bold text-foreground">
                          {d.distance_km} km
                        </span>
                      ))}
                    </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-bold leading-tight">{ev.title}</h3>
                    <StartActions source="event" id={ev.id} />
                    <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{fmtDate(ev.event_date)}</div>
                      {ev.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{ev.location}</div>}
                    </div>
                    
                    <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border">
                      {isCompletedDate(ev.event_date) ? (
                        <Button asChild variant="secondary" className="flex-1">
                          <Link to={`/events/${ev.slug ?? ev.id}`}>{lang === "uk" ? "Детальніше" : "Details"}</Link>
                        </Button>
                      ) : ev.registration_closed ? (
                        <Button asChild variant="outline" className="flex-1" disabled>
                          <Link to={`/events/${ev.slug ?? ev.id}`}>
                            {lang === "uk" ? "Реєстрація закрита" : "Registration closed"}
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild className="flex-1"><Link to={`/events/${ev.slug ?? ev.id}`}>{t.events.register}</Link></Button>
                      )}
                      <Button asChild variant="outline" size="icon" aria-label={t.events.details}>
                        <Link to={`/events/${ev.slug ?? ev.id}`}><ArrowUpRight className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {visibleCount < filtered.length && (
            <div className="flex justify-center mt-10">
              <Button variant="outline" size="lg" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                {lang === "uk" ? "Завантажити ще" : "Load more"} ({filtered.length - visibleCount})
              </Button>
            </div>
          )}
          </>
        )}

      </div>
    </section>}
    <OtherStartsSection shared={sharedFilters} onFacets={handleFacets} />
    </>
  );
};

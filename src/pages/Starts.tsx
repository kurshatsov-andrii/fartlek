import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ExternalLink, Calendar as CalendarIcon, Search, X, Filter, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { SPORT_TYPES, SPORT_LABELS, MONTH_NAMES_UK, type SportType } from "@/lib/parseStart";

interface StartRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  register_url: string | null;
  event_date: string | null;
  city: string | null;
  region: string | null;
  organizer_name: string | null;
  sport_types: string[];
  distances_km: number[];
  is_paid: boolean | null;
}

const PAGE_SIZE = 9;
const DISTANCE_BUCKETS: { label: string; match: (d: number) => boolean }[] = [
  { label: "до 5 км", match: (d) => d > 0 && d <= 5 },
  { label: "10 км", match: (d) => d > 5 && d <= 12 },
  { label: "21 км", match: (d) => d > 12 && d <= 25 },
  { label: "42 км", match: (d) => d > 25 && d <= 45 },
  { label: "> 50 км", match: (d) => d > 45 },
];

const Starts = () => {
  const [rows, setRows] = useState<StartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingLimit, setUpcomingLimit] = useState(PAGE_SIZE);
  const [completedLimit, setCompletedLimit] = useState(PAGE_SIZE);

  const [q, setQ] = useState("");
  const [month, setMonth] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");
  const [organizer, setOrganizer] = useState<string>("all");
  const [sport, setSport] = useState<SportType | "all">("all");
  const [distance, setDistance] = useState<string>("all");
  const [paid, setPaid] = useState<"all" | "paid" | "free">("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("telegram_starts")
        .select("id,slug,title,description,image_url,register_url,event_date,city,region,organizer_name,sport_types,distances_km,is_paid")
        .eq("status", "published")
        .gte("event_date", "2026-07-01")
        .order("event_date", { ascending: true });
      setRows((data ?? []) as StartRow[]);
      setLoading(false);
    })();
  }, []);

  const fmtDate = (d: string | null) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  };

  // unique facet values from data
  const cities = useMemo(() => Array.from(new Set(rows.map((r) => r.city).filter(Boolean) as string[])).sort(), [rows]);
  const regions = useMemo(() => Array.from(new Set(rows.map((r) => r.region).filter(Boolean) as string[])).sort(), [rows]);
  const organizers = useMemo(() => Array.from(new Set(rows.map((r) => r.organizer_name).filter(Boolean) as string[])).sort(), [rows]);

  const distanceBucket = distance === "all" ? null : DISTANCE_BUCKETS.find((b) => b.label === distance);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (qLower) {
        const hay = `${r.title} ${r.description} ${r.city ?? ""} ${r.organizer_name ?? ""}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      if (month !== "all" && r.event_date) {
        const m = parseInt(r.event_date.split("-")[1], 10);
        if (String(m) !== month) return false;
      } else if (month !== "all" && !r.event_date) return false;
      if (city !== "all" && r.city !== city) return false;
      if (region !== "all" && r.region !== region) return false;
      if (organizer !== "all" && r.organizer_name !== organizer) return false;
      if (sport !== "all" && !(r.sport_types || []).includes(sport)) return false;
      if (distanceBucket && !(r.distances_km || []).some((d) => distanceBucket.match(Number(d)))) return false;
      if (paid === "paid" && r.is_paid !== true) return false;
      if (paid === "free" && r.is_paid !== false) return false;
      return true;
    });
  }, [rows, q, month, city, region, organizer, sport, distance, paid, distanceBucket]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingAll = filtered
    .filter((r) => !r.event_date || r.event_date >= todayStr)
    .sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""));
  const completedAll = filtered
    .filter((r) => r.event_date && r.event_date < todayStr)
    .sort((a, b) => (b.event_date || "").localeCompare(a.event_date || ""));
  const upcoming = upcomingAll.slice(0, upcomingLimit);
  const completed = completedAll.slice(0, completedLimit);

  const activeFilters =
    (q ? 1 : 0) + (month !== "all" ? 1 : 0) + (city !== "all" ? 1 : 0) + (region !== "all" ? 1 : 0) +
    (organizer !== "all" ? 1 : 0) + (sport !== "all" ? 1 : 0) + (distance !== "all" ? 1 : 0) + (paid !== "all" ? 1 : 0);

  const reset = () => { setQ(""); setMonth("all"); setCity("all"); setRegion("all"); setOrganizer("all"); setSport("all"); setDistance("all"); setPaid("all"); };

  const renderCard = (r: StartRow) => (
    <Card key={r.id} className="overflow-hidden flex flex-col">
      {r.image_url && (
        <Link to={`/starts/${r.slug}`} className="block aspect-video bg-muted overflow-hidden">
          <img src={r.image_url} alt={r.title} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform" />
        </Link>
      )}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {r.event_date && (<span className="inline-flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" />{fmtDate(r.event_date)}</span>)}
          {r.city && (<span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.city}</span>)}
        </div>
        <h2 className="font-semibold text-lg leading-snug">
          <Link to={`/starts/${r.slug}`} className="hover:underline">{r.title || "Без назви"}</Link>
        </h2>
        <div className="flex flex-wrap gap-1">
          {Array.from(new Set((r.sport_types || []).filter((s): s is SportType => s in SPORT_LABELS))).slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{SPORT_LABELS[s]}</span>
          ))}
          {(r.distances_km || []).slice(0, 4).map((d) => (
            <span key={String(d)} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{d} км</span>
          ))}
          {r.is_paid === false && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">Безкоштовно</span>}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{r.description}</p>
        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" variant="secondary" className="flex-1">
            <Link to={`/starts/${r.slug}`}>Детальніше</Link>
          </Button>
          {r.register_url && (
            <Button asChild size="sm" className="flex-1">
              <a href={r.register_url} target="_blank" rel="noreferrer">
                Зареєструватися <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Старти — Fartlek"
        description="Найближчі бігові, велосипедні та триатлонні старти. Фільтр за містом, місяцем, дистанцією та видом спорту."
      />
      <Header />
      <main className="flex-1 container py-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Старти</h1>
        <p className="text-muted-foreground mb-6">
          Анонси найближчих стартів з телеграм-каналу{" "}
          <a href="https://t.me/fartlekua" target="_blank" rel="noreferrer" className="underline">@fartlekua</a>.
        </p>

        {/* Filters */}
        <div className="rounded-lg border bg-card p-4 mb-8 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" /> Фільтри
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={reset}>
                <X className="h-3.5 w-3.5 mr-1" /> Скинути ({activeFilters})
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук за назвою, описом, містом…" className="pl-9" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue placeholder="Місяць" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі місяці</SelectItem>
                {MONTH_NAMES_UK.map((n, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sport} onValueChange={(v) => setSport(v as any)}>
              <SelectTrigger><SelectValue placeholder="Вид спорту" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі види</SelectItem>
                {SPORT_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>{SPORT_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={distance} onValueChange={setDistance}>
              <SelectTrigger><SelectValue placeholder="Дистанція" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Будь-яка дистанція</SelectItem>
                {DISTANCE_BUCKETS.map((b) => (
                  <SelectItem key={b.label} value={b.label}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue placeholder="Місто" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі міста</SelectItem>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue placeholder="Область" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі області</SelectItem>
                {regions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={organizer} onValueChange={setOrganizer}>
              <SelectTrigger><SelectValue placeholder="Організатор" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі організатори</SelectItem>
                {organizers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={paid} onValueChange={(v) => setPaid(v as any)}>
              <SelectTrigger><SelectValue placeholder="Тип" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Платні і безкоштовні</SelectItem>
                <SelectItem value="free">Безкоштовні</SelectItem>
                <SelectItem value="paid">Платні</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">Нічого не знайдено за обраними фільтрами.</div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map(renderCard)}
                </div>
                {upcomingLimit < upcomingAll.length && (
                  <div className="flex justify-center mt-8">
                    <Button variant="outline" onClick={() => setUpcomingLimit((n) => n + PAGE_SIZE)}>
                      Завантажити ще старти
                    </Button>
                  </div>
                )}
              </>
            )}
            {completed.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold mb-6">Завершені</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                  {completed.map(renderCard)}
                </div>
                {completedLimit < completedAll.length && (
                  <div className="flex justify-center mt-8">
                    <Button variant="outline" onClick={() => setCompletedLimit((n) => n + PAGE_SIZE)}>
                      Завантажити ще старти
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

export default Starts;

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Calendar as CalendarIcon, MapPin, ExternalLink, Loader2, Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { SPORT_TYPES, SPORT_LABELS, MONTH_NAMES_UK, type SportType } from "@/lib/parseStart";

interface StartRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  register_url: string | null;
  event_date: string | null;
  city: string | null;
  region: string | null;
  organizer_name: string | null;
  sport_types: string[] | null;
  distances_km: number[] | null;
  is_paid: boolean | null;
}

const PAGE_SIZE = 6;
const DISTANCE_BUCKETS: { label: string; match: (d: number) => boolean }[] = [
  { label: "до 5 км", match: (d) => d > 0 && d <= 5 },
  { label: "10 км", match: (d) => d > 5 && d <= 12 },
  { label: "21 км", match: (d) => d > 12 && d <= 25 },
  { label: "42 км", match: (d) => d > 25 && d <= 45 },
  { label: "> 50 км", match: (d) => d > 45 },
];

export const OtherStartsSection = () => {
  const { lang } = useApp();
  const [rows, setRows] = useState<StartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [q, setQ] = useState("");
  const [month, setMonth] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");
  const [organizer, setOrganizer] = useState<string>("all");
  const [sport, setSport] = useState<SportType | "all">("all");
  const [distance, setDistance] = useState<string>("all");
  const [paid, setPaid] = useState<"all" | "paid" | "free">("all");

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("telegram_starts")
      .select("id,slug,title,description,image_url,register_url,event_date,city,region,organizer_name,sport_types,distances_km,is_paid")
      .eq("status", "published")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .then(({ data }) => {
        setRows((data as any) ?? []);
        setLoading(false);
      });
  }, []);

  const fmtDate = (d: string | null) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  };

  const baseCity = (c: string | null) => (c ?? "").split(",")[0].trim();
  const cities = useMemo(
    () => Array.from(new Set(rows.map((r) => baseCity(r.city)).filter(Boolean))).sort(),
    [rows]
  );
  const regions = useMemo(() => Array.from(new Set(rows.map((r) => r.region).filter(Boolean) as string[])).sort(), [rows]);
  const organizers = useMemo(() => Array.from(new Set(rows.map((r) => r.organizer_name).filter(Boolean) as string[])).sort(), [rows]);

  const distanceBucket = distance === "all" ? null : DISTANCE_BUCKETS.find((b) => b.label === distance);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (qLower) {
        const hay = `${r.title} ${r.description ?? ""} ${r.city ?? ""} ${r.organizer_name ?? ""}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      if (month !== "all") {
        if (!r.event_date) return false;
        if (String(parseInt(r.event_date.split("-")[1], 10)) !== month) return false;
      }
      if (city !== "all" && baseCity(r.city) !== city) return false;
      if (region !== "all" && r.region !== region) return false;
      if (organizer !== "all" && r.organizer_name !== organizer) return false;
      if (sport !== "all" && !(r.sport_types || []).includes(sport)) return false;
      if (distanceBucket && !(r.distances_km || []).some((d) => distanceBucket.match(Number(d)))) return false;
      if (paid === "paid" && r.is_paid !== true) return false;
      if (paid === "free" && r.is_paid !== false) return false;
      return true;
    });
  }, [rows, q, month, city, region, organizer, sport, distance, paid, distanceBucket]);

  useEffect(() => { setLimit(PAGE_SIZE); }, [q, month, city, region, organizer, sport, distance, paid]);

  const activeFilters =
    (q ? 1 : 0) + (month !== "all" ? 1 : 0) + (city !== "all" ? 1 : 0) + (region !== "all" ? 1 : 0) +
    (organizer !== "all" ? 1 : 0) + (sport !== "all" ? 1 : 0) + (distance !== "all" ? 1 : 0) + (paid !== "all" ? 1 : 0);

  const reset = () => { setQ(""); setMonth("all"); setCity("all"); setRegion("all"); setOrganizer("all"); setSport("all"); setDistance("all"); setPaid("all"); };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) return null;

  const visible = filtered.slice(0, limit);

  return (
    <section className="border-t border-border pt-14 mt-20">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {lang === "uk" ? "Інші старти в Україні" : "Other races in Ukraine"}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {lang === "uk"
            ? "Анонси змагань від інших організаторів. Реєстрація відбувається на сайті організатора."
            : "Announcements from other organizers. Registration happens on the organizer's own website."}
        </p>
      </div>

      <div className="mb-10 rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" /> {lang === "uk" ? "Фільтри" : "Filters"}
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={reset}>
              <X className="h-3.5 w-3.5 mr-1" /> {lang === "uk" ? `Скинути (${activeFilters})` : `Reset (${activeFilters})`}
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "uk" ? "Пошук за назвою, описом, містом…" : "Search by name, description, city…"}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger><SelectValue placeholder="Місяць" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "uk" ? "Усі місяці" : "All months"}</SelectItem>
              {MONTH_NAMES_UK.map((n, i) => (
                <SelectItem key={i} value={String(i + 1)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sport} onValueChange={(v) => setSport(v as any)}>
            <SelectTrigger><SelectValue placeholder="Вид спорту" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "uk" ? "Усі види" : "All sports"}</SelectItem>
              {SPORT_TYPES.map((s) => (
                <SelectItem key={s} value={s}>{SPORT_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={distance} onValueChange={setDistance}>
            <SelectTrigger><SelectValue placeholder="Дистанція" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "uk" ? "Будь-яка дистанція" : "Any distance"}</SelectItem>
              {DISTANCE_BUCKETS.map((b) => (
                <SelectItem key={b.label} value={b.label}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger><SelectValue placeholder="Місто" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "uk" ? "Усі міста" : "All cities"}</SelectItem>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger><SelectValue placeholder="Область" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "uk" ? "Усі області" : "All regions"}</SelectItem>
              {regions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={organizer} onValueChange={setOrganizer}>
            <SelectTrigger><SelectValue placeholder="Організатор" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "uk" ? "Усі організатори" : "All organizers"}</SelectItem>
              {organizers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={paid} onValueChange={(v) => setPaid(v as any)}>
            <SelectTrigger><SelectValue placeholder="Тип" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "uk" ? "Платні і безкоштовні" : "Paid and free"}</SelectItem>
              <SelectItem value="free">{lang === "uk" ? "Безкоштовні" : "Free"}</SelectItem>
              <SelectItem value="paid">{lang === "uk" ? "Платні" : "Paid"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          {lang === "uk" ? "Нічого не знайдено за обраними фільтрами." : "Nothing found for the selected filters."}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <article key={r.id} className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-bounce hover:-translate-y-1 hover:shadow-elevated">
              <Link to={`/starts/${r.slug}`} className="relative aspect-video w-full overflow-hidden bg-muted block" aria-label={r.title}>
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} loading="lazy" className="h-full w-full max-w-full object-contain" />
                ) : (
                  <div className="h-full w-full bg-gradient-hero" />
                )}
                <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-background/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                  {lang === "uk" ? "Анонс" : "Announcement"}
                </span>
                {(r.distances_km || []).length > 0 && (
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
                    {[...(r.distances_km || [])].sort((a, b) => Number(b) - Number(a)).slice(0, 4).map((d) => (
                      <span key={String(d)} className="rounded-md bg-background/95 px-2 py-1 text-xs font-bold text-foreground">{d} km</span>
                    ))}
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl font-bold leading-tight">
                  <Link to={`/starts/${r.slug}`} className="hover:underline">{r.title}</Link>
                </h3>
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {r.event_date && (
                    <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" />{fmtDate(r.event_date)}</div>
                  )}
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{r.city || (lang === "uk" ? "Україна та весь світ" : "Ukraine and worldwide")}</div>
                </div>
                <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border">
                  <Button asChild variant="secondary" className="flex-1">
                    <Link to={`/starts/${r.slug}`}>{lang === "uk" ? "Детальніше" : "Details"}</Link>
                  </Button>
                  {r.register_url && (
                    <Button asChild variant="outline" className="flex-1">
                      <a href={r.register_url} target="_blank" rel="noreferrer">
                        {lang === "uk" ? "На сайт" : "Website"} <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-3 mt-10">
        {limit < filtered.length && (
          <Button variant="outline" size="lg" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
            {lang === "uk" ? "Завантажити ще" : "Load more"} ({filtered.length - limit})
          </Button>
        )}
        <Button asChild size="lg">
          <Link to="/starts">{lang === "uk" ? "Усі старти" : "All races"}</Link>
        </Button>
      </div>
    </section>
  );
};

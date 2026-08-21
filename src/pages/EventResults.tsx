import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, Search, Calendar as CalendarIcon, MapPin, Medal } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface ResultRow {
  id: string;
  distance_km: number;
  bib: number | null;
  full_name: string;
  gender: string | null;
  age: number | null;
  age_group: string | null;
  city: string | null;
  gun_time_seconds: number | null;
  chip_time_seconds: number | null;
  overall_rank: number | null;
}

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
}

const formatTime = (s: number | null): string => {
  if (s == null) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

const AGE_GROUP_ORDER = ["До 18", "18-29", "30-39", "40-49", "50-59", "60+"];

const EventResults = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useApp();
  const uk = lang === "uk";

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [distance, setDistance] = useState<string>("all");
  const [gender, setGender] = useState<string>("all");
  const [ageGroup, setAgeGroup] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("id, title, event_date, location")
        .eq("id", id)
        .maybeSingle();
      if (!ev) { setNotFound(true); setLoading(false); return; }
      setEvent(ev as EventInfo);

      const { data } = await (supabase as any)
        .from("event_external_results")
        .select("id, distance_km, bib, full_name, gender, age, age_group, city, gun_time_seconds, chip_time_seconds, overall_rank")
        .eq("event_id", id)
        .order("distance_km", { ascending: false })
        .order("chip_time_seconds", { ascending: true })
        .limit(5000);
      setRows((data ?? []) as ResultRow[]);
      setLoading(false);
    })();
  }, [id]);

  const distances = useMemo(
    () => Array.from(new Set(rows.map((r) => r.distance_km))).sort((a, b) => b - a),
    [rows],
  );

  const ageGroups = useMemo(() => {
    const set = new Set(rows.filter((r) => r.age_group).map((r) => r.age_group as string));
    return AGE_GROUP_ORDER.filter((g) => set.has(g)).concat(
      [...set].filter((g) => !AGE_GROUP_ORDER.includes(g)),
    );
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (distance !== "all" && r.distance_km !== Number(distance)) return false;
      if (gender !== "all" && r.gender !== gender) return false;
      if (ageGroup !== "all" && r.age_group !== ageGroup) return false;
      if (q) {
        const hay = `${r.full_name} ${r.bib ?? ""} ${r.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, distance, gender, ageGroup, query]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-20 text-center">
          <h1 className="font-display text-2xl mb-4">{uk ? "Подію не знайдено" : "Event not found"}</h1>
          <Link to="/" className="text-primary underline">{uk ? "На головну" : "Home"}</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const title = uk ? `Результати — ${event.title}` : `Results — ${event.title}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={title} description={uk ? `Офіційні результати ${event.title}` : `Official results of ${event.title}`} />
      <Header />
      <main className="flex-1 container max-w-6xl py-10">
        <Link to={`/events/${event.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {uk ? "До події" : "Back to event"}
        </Link>

        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
        <div className="flex flex-wrap gap-4 text-muted-foreground mb-8">
          <span className="inline-flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {new Date(event.event_date).toLocaleDateString(uk ? "uk-UA" : "en-US")}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {event.location}
            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <Medal className="h-4 w-4" />
            {uk ? `Фінішували: ${rows.length}` : `Finishers: ${rows.length}`}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl">
            <p className="text-muted-foreground">
              {uk ? "Результати ще не опубліковані" : "Results are not published yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setDistance("all")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold border transition-colors",
                  distance === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/50",
                )}
              >
                {uk ? "Всі дистанції" : "All distances"}
              </button>
              {distances.map((d) => (
                <button
                  key={d}
                  onClick={() => setDistance(String(d))}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold border transition-colors",
                    distance === String(d)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50",
                  )}
                >
                  {d} {uk ? "км" : "km"}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={uk ? "Пошук за ім'ям, номером, містом" : "Search by name, bib, city"}
                  className="pl-9"
                />
              </div>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder={uk ? "Стать" : "Gender"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{uk ? "Всі" : "All"}</SelectItem>
                  <SelectItem value="M">{uk ? "Чоловіки" : "Men"}</SelectItem>
                  <SelectItem value="F">{uk ? "Жінки" : "Women"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger>
                  <SelectValue placeholder={uk ? "Вікова категорія" : "Age category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{uk ? "Всі категорії" : "All categories"}</SelectItem>
                  {ageGroups.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {uk ? `Показано: ${filtered.length} з ${rows.length}` : `Showing ${filtered.length} of ${rows.length}`}
            </p>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">{uk ? "Місце" : "Place"}</th>
                    <th className="px-4 py-3 font-semibold">№</th>
                    <th className="px-4 py-3 font-semibold">{uk ? "Учасник" : "Athlete"}</th>
                    {distance === "all" && <th className="px-4 py-3 font-semibold">{uk ? "Дистанція" : "Distance"}</th>}
                    <th className="px-4 py-3 font-semibold">{uk ? "Стать" : "Sex"}</th>
                    <th className="px-4 py-3 font-semibold">{uk ? "Категорія" : "Cat."}</th>
                    <th className="px-4 py-3 font-semibold">{uk ? "Місто" : "City"}</th>
                    <th className="px-4 py-3 font-semibold text-right">{uk ? "Чіп" : "Chip"}</th>
                    <th className="px-4 py-3 font-semibold text-right">{uk ? "Ган" : "Gun"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-bold">
                        {r.overall_rank != null && r.overall_rank <= 3 ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Medal className="h-4 w-4" /> {r.overall_rank}
                          </span>
                        ) : (
                          r.overall_rank ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">{r.bib ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{r.full_name}</td>
                      {distance === "all" && <td className="px-4 py-3 whitespace-nowrap">{r.distance_km} {uk ? "км" : "km"}</td>}
                      <td className="px-4 py-3">{r.gender === "F" ? (uk ? "Ж" : "F") : r.gender === "M" ? (uk ? "Ч" : "M") : "—"}</td>
                      <td className="px-4 py-3">{r.age_group ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.city ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{formatTime(r.chip_time_seconds)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatTime(r.gun_time_seconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center py-10 text-muted-foreground">
                  {uk ? "Нічого не знайдено за обраними фільтрами" : "No results match the selected filters"}
                </p>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventResults;

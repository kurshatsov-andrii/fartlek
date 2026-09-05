import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, Search, Calendar as CalendarIcon, MapPin, Medal, UserX, ArrowLeftRight, Award } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { FinisherCertificate, type CertificateData } from "@/components/FinisherCertificate";

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
  status: "finished" | "dns" | "dnf";
  categoryRank?: number | null;
}


interface PlatformParticipant {
  registration_id: string;
  bib_number: number | null;
  full_name: string | null;
  gender: string | null;
  birth_year: number | null;
  city: string | null;
  distance_km: number | null;
  payment_status: string;
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

// Cyrillic -> latin transliteration for name matching
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "’": "", "ʼ": "",
  ё: "e", э: "e", ъ: "", ы: "y",
};

const translit = (s: string): string =>
  s
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("");

// Normalize a name into a sorted unique word list for comparison:
// lowercase, transliterate, drop stray characters (corrupted apostrophes etc.)
// so "Ivan Petrenko" matches "Petrenko Ivan" and "М?ясников" matches "Мʼясников".
const nameWords = (s: string): string[] => {
  const words = translit(s.toLowerCase())
    .replace(/-/g, " ")
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const significant = words.filter((w) => w.length > 1);
  const list = significant.length >= 2 ? significant : words;
  return Array.from(new Set(list)).sort();
};

// Two names match when they share at least 2 words (handles middle names,
// reversed order, transliteration differences).
const namesMatch = (a: string[], b: string[]): boolean => {
  const setB = new Set(b);
  return a.filter((w) => setB.has(w)).length >= 2;
};

const ageGroupOf = (birthYear: number | null, eventDate: string): string | null => {
  if (!birthYear) return null;
  const age = new Date(eventDate).getFullYear() - birthYear;
  if (age < 18) return "До 18";
  if (age <= 29) return "18-29";
  if (age <= 39) return "30-39";
  if (age <= 49) return "40-49";
  if (age <= 59) return "50-59";
  return "60+";
};

const EventResults = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useApp();
  const { user, loading: authLoading } = useAuth();
  const uk = lang === "uk";

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [participants, setParticipants] = useState<PlatformParticipant[]>([]);
  const [dnfIds, setDnfIds] = useState<Set<string>>(new Set());
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [distance, setDistance] = useState<string>("21.1");
  const [gender, setGender] = useState<string>("all");
  const [ageGroup, setAgeGroup] = useState<string>("all");
  const [status, setStatus] = useState<string>("finished");
  const [query, setQuery] = useState("");
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (!id) return;
    // Results are visible only to registered users — skip all data loads for guests
    if (!user) {
      setEvent(null);
      setRows([]);
      setParticipants([]);
      setDnfIds(new Set());
      setCanManage(false);
      setLoading(false);
      return;
    }
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
      setRows(((data ?? []) as Omit<ResultRow, "status">[]).map((r) => ({ ...r, status: "finished" as const })));

      // Platform registrations (returns rows only for authorized users)
      const { data: parts } = await (supabase as any).rpc("get_event_participants", { _event_id: id });
      setParticipants((parts ?? []) as PlatformParticipant[]);

      // DNF marks set by the organizer
      const { data: dnfData } = await (supabase as any).rpc("get_event_dnf_flags", { _event_id: id });
      setDnfIds(new Set(((dnfData ?? []) as { registration_id: string }[]).map((d) => d.registration_id)));

      if (user) {
        const { data: cm } = await (supabase as any).rpc("can_manage_event", { _event_id: id, _user_id: user.id });
        setCanManage(Boolean(cm));
      } else {
        setCanManage(false);
      }

      setLoading(false);
    })();
  }, [id, user]);

  // Registered participants who are NOT in the finishers list (DNS / DNF)
  const nonFinishers = useMemo<ResultRow[]>(() => {
    if (!event || participants.length === 0 || rows.length === 0) return [];

    const finisherNames = rows.map((r) => nameWords(r.full_name));

    return participants
      .filter((p) => p.full_name && (p.payment_status === "paid" || p.payment_status === "free"))
      .filter((p) => {
        const words = nameWords(p.full_name as string);
        return !finisherNames.some((fw) => namesMatch(fw, words));
      })
      .map((p) => ({
        id: p.registration_id,
        distance_km: p.distance_km ?? 0,
        bib: p.bib_number,
        full_name: p.full_name as string,
        gender: p.gender === "male" ? "M" : p.gender === "female" ? "F" : null,
        age: null,
        age_group: ageGroupOf(p.birth_year, event.event_date),
        city: p.city,
        gun_time_seconds: null,
        chip_time_seconds: null,
        overall_rank: null,
        status: dnfIds.has(p.registration_id) ? ("dnf" as const) : ("dns" as const),
      }));
  }, [event, participants, rows, dnfIds]);

  const dnsCount = useMemo(() => nonFinishers.filter((r) => r.status === "dns").length, [nonFinishers]);
  const dnfCount = useMemo(() => nonFinishers.filter((r) => r.status === "dnf").length, [nonFinishers]);

  const allRows = useMemo(() => [...rows, ...nonFinishers], [rows, nonFinishers]);

  // Місця у категоріях: абсолют по статі та вікова група всередині статі (незалежно від фільтрів)
  const categoryRanks = useMemo(() => {
    const genderMap = new Map<string, number>();
    const ageMap = new Map<string, number>();
    const buckets = new Map<string, ResultRow[]>();
    const ageBuckets = new Map<string, ResultRow[]>();

    allRows
      .filter((r) => r.status === "finished" && r.chip_time_seconds != null && r.gender)
      .forEach((r) => {
        const gk = `${r.distance_km}|${r.gender}`;
        if (!buckets.has(gk)) buckets.set(gk, []);
        buckets.get(gk)!.push(r);
        if (r.age_group) {
          const ak = `${gk}|${r.age_group}`;
          if (!ageBuckets.has(ak)) ageBuckets.set(ak, []);
          ageBuckets.get(ak)!.push(r);
        }
      });

    const rank = (list: ResultRow[], target: Map<string, number>) => {
      list
        .sort((a, b) => (a.chip_time_seconds as number) - (b.chip_time_seconds as number))
        .forEach((r, i) => target.set(r.id, i + 1));
    };
    buckets.forEach((list) => rank(list, genderMap));
    ageBuckets.forEach((list) => rank(list, ageMap));
    return { genderMap, ageMap };
  }, [allRows]);


  const toggleDnf = async (r: ResultRow) => {
    if (!canManage) return;
    const toDnf = r.status !== "dnf";
    const prev = new Set(dnfIds);
    setDnfIds((cur) => {
      const next = new Set(cur);
      if (toDnf) next.add(r.id); else next.delete(r.id);
      return next;
    });
    const { error } = await (supabase as any).from("registrations").update({ dnf: toDnf }).eq("id", r.id);
    if (error) setDnfIds(prev);
  };

  const distances = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.distance_km))).sort((a, b) => b - a),
    [allRows],
  );

  useEffect(() => {
    if (distances.length === 0) return;
    if (distances.map((d) => String(d)).includes(distance)) return;
    setDistance(distances.includes(21.1) ? "21.1" : String(distances[0]));
  }, [distances, distance]);

  const ageGroups = useMemo(() => {
    const set = new Set(allRows.filter((r) => r.age_group).map((r) => r.age_group as string));
    return AGE_GROUP_ORDER.filter((g) => set.has(g)).concat(
      [...set].filter((g) => !AGE_GROUP_ORDER.includes(g)),
    );
  }, [allRows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = allRows.filter((r) => {
      if (status === "finished" && r.status !== "finished") return false;
      if (status === "dns" && r.status !== "dns") return false;
      if (status === "dnf" && r.status !== "dnf") return false;
      if (distance !== "all" && r.distance_km !== Number(distance)) return false;
      if (gender !== "all" && r.gender !== gender) return false;
      if (ageGroup !== "all" && r.age_group !== ageGroup) return false;
      if (q) {
        const hay = `${r.full_name} ${r.bib ?? ""} ${r.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const hasCategoryFilter = ageGroup !== "all" || gender !== "all";
    if (!hasCategoryFilter) {
      return result.map((r) => ({ ...r, categoryRank: null }));
    }

    const finished = result
      .filter((r) => r.status === "finished" && r.chip_time_seconds != null)
      .sort((a, b) => (a.chip_time_seconds as number) - (b.chip_time_seconds as number));
    const rankMap = new Map<string, number>();
    finished.forEach((r, i) => rankMap.set(r.id, i + 1));
    const ranked = result.map((r) => ({ ...r, categoryRank: rankMap.get(r.id) ?? null }));

    return ranked.sort((a, b) => {
      if (a.status === "finished" && b.status !== "finished") return -1;
      if (a.status !== "finished" && b.status === "finished") return 1;
      if (a.categoryRank != null && b.categoryRank != null) return a.categoryRank - b.categoryRank;
      if (a.categoryRank != null) return -1;
      if (b.categoryRank != null) return 1;
      return (a.chip_time_seconds ?? Infinity) - (b.chip_time_seconds ?? Infinity);
    });
  }, [allRows, status, distance, gender, ageGroup, query]);


  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-20 text-center">
          <Medal className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-2xl mb-3">
            {uk ? "Результати доступні лише зареєстрованим користувачам" : "Results are available to registered users only"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {uk ? "Увійдіть або зареєструйтеся, щоб переглянути результати події." : "Sign in or create an account to view the event results."}
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            {uk ? "Увійти або зареєструватися" : "Sign in or sign up"}
          </Link>
        </main>
        <Footer />
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
          {dnsCount > 0 && (
            <span className="inline-flex items-center gap-2">
              <UserX className="h-4 w-4" />
              {uk ? `Не стартували: ${dnsCount}` : `Did not start: ${dnsCount}`}
            </span>
          )}
          {dnfCount > 0 && (
            <span className="inline-flex items-center gap-2">
              <UserX className="h-4 w-4" />
              {uk ? `Не фінішували: ${dnfCount}` : `Did not finish: ${dnfCount}`}
            </span>
          )}
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

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={uk ? "Пошук за ім'ям, номером, містом" : "Search by name, bib, city"}
                  className="pl-9"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={uk ? "Статус" : "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finished">{uk ? "Фінішували" : "Finishers"}</SelectItem>
                  {dnsCount > 0 && (
                    <SelectItem value="dns">{uk ? "Не стартували" : "Did not start"}</SelectItem>
                  )}
                  {dnfCount > 0 && (
                    <SelectItem value="dnf">{uk ? "Не фінішували" : "Did not finish"}</SelectItem>
                  )}
                  {dnsCount + dnfCount > 0 && (
                    <SelectItem value="all">{uk ? "Всі учасники" : "All participants"}</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
              {uk
                ? `Показано: ${filtered.length} з ${status === "all" ? allRows.length : status === "dns" ? dnsCount : status === "dnf" ? dnfCount : rows.length}`
                : `Showing ${filtered.length} of ${status === "all" ? allRows.length : status === "dns" ? dnsCount : status === "dnf" ? dnfCount : rows.length}`}
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
                    <th className="px-4 py-3 font-semibold text-right">{uk ? "Сертифікат" : "Certificate"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className={cn("border-b border-border/50 last:border-0 hover:bg-muted/40", r.status !== "finished" && "text-muted-foreground")}>
                      <td className="px-4 py-3 font-bold">
                        {r.status !== "finished" ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap",
                                r.status === "dnf" ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground",
                              )}
                              title={r.status === "dnf" ? (uk ? "Стартував, але не фінішував" : "Started but did not finish") : (uk ? "Не стартував" : "Did not start")}
                            >
                              <UserX className="h-3.5 w-3.5" /> {r.status === "dnf" ? "DNF" : "DNS"}
                            </span>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => toggleDnf(r)}
                                title={r.status === "dnf"
                                  ? (uk ? "Позначити як «не стартував»" : "Mark as did not start")
                                  : (uk ? "Позначити як «не фінішував»" : "Mark as did not finish")}
                                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <ArrowLeftRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </span>
                        ) : (r.categoryRank && r.categoryRank <= 3) ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Medal className="h-4 w-4" /> {r.categoryRank}
                          </span>
                        ) : r.overall_rank != null && r.overall_rank <= 3 ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Medal className="h-4 w-4" /> {r.overall_rank}
                          </span>
                        ) : (
                          (ageGroup !== "all" || gender !== "all") ? (r.categoryRank ?? "—") : (r.overall_rank ?? "—")
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
                      <td className="px-4 py-3 text-right">
                        {r.status === "finished" && (
                          <button
                            type="button"
                            onClick={() => {
                              const genderLabel = r.gender === "F" ? (uk ? "жінки" : "women") : r.gender === "M" ? (uk ? "чоловіки" : "men") : null;
                              setCertificate({
                                fullName: r.full_name,
                                eventTitle: event.title,
                                eventDate: event.event_date,
                                location: event.location,
                                distanceKm: r.distance_km,
                                timeSeconds: r.chip_time_seconds ?? r.gun_time_seconds,
                                bib: r.bib,
                                overallRank: r.overall_rank,
                                genderRank: categoryRanks.genderMap.get(r.id) ?? null,
                                genderLabel,
                                ageGroupRank: categoryRanks.ageMap.get(r.id) ?? null,
                                ageGroupLabel: [genderLabel, r.age_group].filter(Boolean).join(" "),
                                categoryRank: r.categoryRank ?? null,
                                categoryLabel: r.categoryRank != null
                                  ? [r.gender === "F" ? (uk ? "Ж" : "W") : r.gender === "M" ? (uk ? "Ч" : "M") : null, r.age_group]
                                      .filter(Boolean).join(" ") || null
                                  : null,
                              });
                            }}

                            title={uk ? "Сертифікат фінішера" : "Finisher certificate"}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                          >
                            <Award className="h-3.5 w-3.5" /> {uk ? "Сертифікат" : "Certificate"}
                          </button>
                        )}
                      </td>
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
      {certificate && (
        <FinisherCertificate
          open={!!certificate}
          onOpenChange={(v) => { if (!v) setCertificate(null); }}
          data={certificate}
          uk={uk}
        />
      )}
      <Footer />
    </div>
  );
};

export default EventResults;

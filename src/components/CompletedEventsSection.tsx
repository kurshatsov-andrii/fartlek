import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, FileText, Loader2, Search, X, Filter, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentDialog } from "@/components/DocumentDialog";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { eventCity } from "@/lib/utils";

interface CompletedEvent {
  id: string;
  slug: string | null;
  title: string;
  event_date: string;
  location: string | null;
  image_url: string | null;
  results_pdf_url: string | null;
  results_url: string | null;
  photos_url: string | null;
  format: "offline" | "online" | "hybrid";
  is_paid: boolean;
  description: string | null;
  organizer_name: string | null;
}

export const CompletedEventsSection = () => {
  const { t, lang } = useApp();
  const { user } = useAuth();
  const [events, setEvents] = useState<CompletedEvent[]>([]);
  const [resultsEventIds, setResultsEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [docDialog, setDocDialog] = useState<{ url: string; title: string } | null>(null);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [format, setFormat] = useState<string>("all");
  const [paid, setPaid] = useState<"all" | "paid" | "free">("all");

  useEffect(() => {
    supabase
      .from("events")
      .select("id, slug, title, event_date, location, image_url, results_pdf_url, results_url, photos_url, format, is_paid, description, organizer_name")
      .eq("status", "completed")
      .order("event_date", { ascending: false })
      .then(async ({ data }) => {
        const list = (data as any) ?? [];
        setEvents(list);
        if (list.length > 0) {
          const { data: res } = await (supabase as any)
            .from("event_external_results")
            .select("event_id")
            .in("event_id", list.map((e: CompletedEvent) => e.id))
            .limit(5000);
          setResultsEventIds(new Set(((res ?? []) as { event_id: string }[]).map((r) => r.event_id)));
        }
        setLoading(false);
      });
  }, []);

  const cities = useMemo(() => {
    const s = new Set<string>();
    events.forEach((e) => { const c = eventCity(e.location); if (c) s.add(c); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "uk"));
  }, [events]);

  const months = useMemo(() => {
    const s = new Set<string>();
    events.forEach((e) => { if (e.event_date) s.add(e.event_date.slice(0, 7)); });
    return Array.from(s).sort();
  }, [events]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (city !== "all" && eventCity(e.location) !== city) return false;
      if (month !== "all" && !(e.event_date ?? "").startsWith(month)) return false;
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
  }, [events, search, city, month, format, paid]);

  const activeFilters = (search ? 1 : 0) + (city !== "all" ? 1 : 0) + (month !== "all" ? 1 : 0) + (format !== "all" ? 1 : 0) + (paid !== "all" ? 1 : 0);
  const resetFilters = () => { setSearch(""); setCity("all"); setMonth("all"); setFormat("all"); setPaid("all"); };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  return (
    <section id="completed-events" className="relative py-20 sm:py-28 bg-muted/30">
      <div className="container">
        <div className="max-w-2xl mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {lang === "uk" ? "Архів" : "Archive"}
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t.events.completedHeading}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">{t.events.completedSub}</p>
        </div>

        <div className="mb-10 rounded-2xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" /> {lang === "uk" ? "Фільтри завершених подій" : "Completed event filters"}
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={resetFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> {lang === "uk" ? `Скинути (${activeFilters})` : `Reset (${activeFilters})`}
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "uk" ? "Пошук за назвою, місцем, організатором…" : "Search by name, location, organizer…"}
              className="pl-9 pr-9"
              aria-label={lang === "uk" ? "Пошук завершених подій" : "Search completed events"}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label={lang === "uk" ? "Очистити" : "Clear"}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl">
            <p className="text-muted-foreground">{t.events.completedEmpty}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ev) => (
              <article
                key={ev.id}
                className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-card transition-base hover:shadow-elevated"
              >
                <Link
                  to={`/events/${ev.slug ?? ev.id}`}
                  className="relative aspect-[16/9] overflow-hidden bg-muted block"
                >
                  {ev.image_url ? (
                    <img
                      src={ev.image_url}
                      alt={ev.title}
                      loading="lazy"
                      className="h-full w-full object-cover grayscale-[30%] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-hero" />
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                      {t.organizer.completed}
                    </span>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-base font-bold leading-tight">
                    <Link to={`/events/${ev.slug ?? ev.id}`} className="hover:text-primary transition-base">
                      {ev.title}
                    </Link>
                  </h3>
                  <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmtDate(ev.event_date)}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {ev.location}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border space-y-2">
                    {resultsEventIds.has(ev.id) ? (
                      <Button size="sm" className="w-full" asChild>
                        <Link to={`/events/${ev.id}/results`}>
                          <FileText className="h-4 w-4" /> {lang === "uk" ? "Переглянути результати" : "View results"}
                        </Link>
                      </Button>
                    ) : ev.results_pdf_url || ev.results_url ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          setDocDialog({
                            url: (ev.results_pdf_url || ev.results_url) as string,
                            title: t.events.results,
                          })
                        }
                      >
                        <FileText className="h-4 w-4" /> {t.events.results}
                      </Button>
                    ) : (
                      !ev.photos_url && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                          {t.events.resultsNone}
                        </p>
                      )
                    )}
                    {ev.photos_url && (
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <a href={ev.photos_url!} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4" /> {t.events.openPhotos}
                        </a>
                      </Button>
                    )}
                    {user && (
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link to={`/events/${ev.id}/participants`}>
                          <Users className="h-4 w-4" /> {t.events.participants}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {docDialog && (
        <DocumentDialog
          open={!!docDialog}
          onOpenChange={(o) => !o && setDocDialog(null)}
          url={docDialog.url}
          title={docDialog.title}
        />
      )}
    </section>
  );
};

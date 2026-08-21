import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Pencil, Trash2, ExternalLink, ArrowUpDown } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/i18n";
import { toast } from "sonner";

interface Row {
  id: string;
  source: "platform" | "calendar";
  title: string;
  event_date: string;
  location: string | null;
  distances: string;
  organizer_name: string | null;
  category: string | null;
  url: string | null;
  notes?: string | null;
  created_by?: string | null;
}

// Returns internal path if the URL points to this same site, otherwise null
const internalPath = (url: string): string | null => {
  if (!url) return null;
  try {
    if (url.startsWith("/")) return url;
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const current = window.location.hostname.replace(/^www\./, "");
    const known = ["fartlek.lovable.app", current];
    if (known.includes(host) || host.endsWith("--b87e16a4-d487-48fd-8f66-fbbf2b0ac3dd.lovable.app")) {
      return `${u.pathname}${u.search}${u.hash}` || "/";
    }
    return null;
  } catch {
    return null;
  }
};

const emptyForm = {

  id: "" as string | "",
  title: "",
  event_date: "",
  location: "",
  distances: "",
  organizer_name: "",
  category: "" as string,
  url: "",
  notes: "",
};

const CalendarPage = () => {
  const { lang, t } = useApp();
  const { isAdmin, isOrganizer, user } = useAuth();
  const canManage = isAdmin || isOrganizer;
  const [loading, setLoading] = useState(true);
  const [platformRows, setPlatformRows] = useState<Row[]>([]);
  const [calendarRows, setCalendarRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date_asc" | "date_desc" | "title_asc" | "location_asc">("date_asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  const load = async () => {
    setLoading(true);
    const [{ data: ev }, { data: cal }] = await Promise.all([
      supabase
        .from("events")
        .select("id, slug, title, event_date, location, organizer_name, category, distances(distance_km, is_active)")
        .eq("status", "published")
        .gte("event_date", todayIso)
        .order("event_date", { ascending: true }),
      supabase
        .from("calendar_events" as any)
        .select("*")
        .gte("event_date", todayIso)
        .order("event_date", { ascending: true }),
    ]);

    setPlatformRows(((ev as any[]) ?? []).map((e) => ({
      id: e.id,
      source: "platform",
      title: e.title,
      event_date: e.event_date,
      location: e.location,
      distances: (e.distances ?? [])
        .filter((d: any) => d.is_active !== false)
        .map((d: any) => `${d.distance_km} км`)
        .join(", "),
      organizer_name: e.organizer_name,
      category: e.category,
      url: `/events/${e.slug ?? e.id}`,
    })));

    setCalendarRows(((cal as any[]) ?? []).map((c) => ({
      id: c.id,
      source: "calendar",
      title: c.title,
      event_date: c.event_date,
      location: c.location,
      distances: c.distances ?? "",
      organizer_name: c.organizer_name,
      category: c.category,
      url: c.url,
      notes: c.notes,
      created_by: c.created_by,
    })));

    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const allRows = useMemo(() => [...platformRows, ...calendarRows], [platformRows, calendarRows]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => set.add(r.event_date.slice(0, 7)));
    return Array.from(set).sort();
  }, [allRows]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = allRows.filter((r) => {
      if (catFilter !== "all" && r.category !== catFilter) return false;
      if (monthFilter !== "all" && !r.event_date.startsWith(monthFilter)) return false;
      if (s && ![r.title, r.location ?? "", r.organizer_name ?? "", r.distances]
        .some((v) => v.toLowerCase().includes(s))) return false;
      return true;
    });
    list.sort((a, b) => {
      switch (sortBy) {
        case "date_desc": return b.event_date.localeCompare(a.event_date);
        case "title_asc": return a.title.localeCompare(b.title, lang);
        case "location_asc": return (a.location ?? "").localeCompare(b.location ?? "", lang);
        default: return a.event_date.localeCompare(b.event_date);
      }
    });
    return list;
  }, [allRows, search, catFilter, monthFilter, sortBy, lang]);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    filtered.forEach((r) => {
      const key = r.event_date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    const keys = Array.from(map.keys()).sort((a, b) =>
      sortBy === "date_desc" ? b.localeCompare(a) : a.localeCompare(b)
    );
    return keys.map((k) => {
      const d = new Date(k + "-01");
      const label = d.toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
        month: "long", year: "numeric",
      });
      return { key: k, label: label.charAt(0).toUpperCase() + label.slice(1), rows: map.get(k)! };
    });
  }, [filtered, sortBy, lang]);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
      day: "2-digit", month: "long", year: "numeric", weekday: "short",
    });
  };

  const openCreate = () => { setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: Row) => {
    setForm({
      id: r.id,
      title: r.title,
      event_date: r.event_date,
      location: r.location ?? "",
      distances: r.distances ?? "",
      organizer_name: r.organizer_name ?? "",
      category: r.category ?? "",
      url: r.url ?? "",
      notes: r.notes ?? "",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.title || !form.event_date) {
      toast.error(lang === "uk" ? "Назва і дата обов'язкові" : "Title and date are required");
      return;
    }
    setBusy(true);
    const payload: any = {
      title: form.title,
      event_date: form.event_date,
      location: form.location || null,
      distances: form.distances || null,
      organizer_name: form.organizer_name || null,
      category: form.category || null,
      url: form.url || null,
      notes: form.notes || null,
    };
    const { error } = form.id
      ? await supabase.from("calendar_events" as any).update(payload).eq("id", form.id)
      : await supabase.from("calendar_events" as any).insert({ ...payload, created_by: user?.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(lang === "uk" ? "Збережено" : "Saved");
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(lang === "uk" ? "Видалити подію з календаря?" : "Delete this calendar event?")) return;
    const { error } = await supabase.from("calendar_events" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(lang === "uk" ? "Видалено" : "Deleted");
    load();
  };

  const seoTitle = lang === "uk"
    ? "Календар майбутніх спортивних подій — Фартлек"
    : "Upcoming sports events calendar — Fartlek";
  const seoDesc = lang === "uk"
    ? "Календар майбутніх бігових, трейлових, вело, свім, триатлон стартів в Україні. Дата, місце, дистанції, організатор."
    : "Upcoming running, trail, cycling, swim and triathlon race calendar in Ukraine. Dates, locations, distances, organizers.";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seoTitle} description={seoDesc} canonical="/calendar" />
      <Header />
      <main className="flex-1 container py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
              {lang === "uk" ? "Календар майбутніх спортивних подій" : "Upcoming sports events calendar"}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">{seoDesc}</p>
          </div>
          {canManage ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  {lang === "uk" ? "Додати подію" : "Add event"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {form.id
                      ? (lang === "uk" ? "Редагувати подію" : "Edit event")
                      : (lang === "uk" ? "Нова подія в календарі" : "New calendar event")}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>{lang === "uk" ? "Назва" : "Title"} *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>{lang === "uk" ? "Дата" : "Date"} *</Label>
                      <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>{lang === "uk" ? "Категорія" : "Category"}</Label>
                      <Select value={form.category || "none"} onValueChange={(v) => setForm({ ...form, category: v === "none" ? "" : v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {EVENT_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{t.categories[c]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{lang === "uk" ? "Місце" : "Location"}</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{lang === "uk" ? "Дистанції" : "Distances"}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 3, 5, 10, 21.1, 42.2, 50, 100].map((km) => {
                        const label = `${km} ${lang === "uk" ? "км" : "km"}`;
                        const parts = form.distances.split(",").map((s) => s.trim()).filter(Boolean);
                        const active = parts.includes(label);
                        return (
                          <Button
                            key={km}
                            type="button"
                            size="sm"
                            variant={active ? "default" : "outline"}
                            onClick={() => {
                              const next = active
                                ? parts.filter((p) => p !== label)
                                : [...parts, label];
                              setForm({ ...form, distances: next.join(", ") });
                            }}
                          >
                            {label}
                          </Button>
                        );
                      })}
                    </div>
                    <Input
                      placeholder={lang === "uk" ? "5 км, 10 км, 21 км або своя дистанція" : "5 km, 10 km, 21 km or custom"}
                      value={form.distances}
                      onChange={(e) => setForm({ ...form, distances: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{lang === "uk" ? "Організатор" : "Organizer"}</Label>
                    <Input value={form.organizer_name} onChange={(e) => setForm({ ...form, organizer_name: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{lang === "uk" ? "Посилання" : "Link"}</Label>
                    <Input placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{lang === "uk" ? "Нотатки" : "Notes"}</Label>
                    <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    {lang === "uk" ? "Скасувати" : "Cancel"}
                  </Button>
                  <Button onClick={submit} disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {lang === "uk" ? "Зберегти" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                if (!user) {
                  toast.info(lang === "uk"
                    ? "Щоб додати подію, увійдіть як організатор або адмін"
                    : "Sign in as organizer or admin to add an event");
                } else {
                  toast.warning(lang === "uk"
                    ? "Лише організатори та адміністратори можуть додавати події в календар. Перейдіть у профіль і подайте заявку як організатор."
                    : "Only organizers and admins can add calendar events. Apply as an organizer in your profile.");
                }
              }}
            >
              <Plus className="h-4 w-4" />
              {lang === "uk" ? "Додати подію" : "Add event"}
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Input
            placeholder={lang === "uk" ? "Пошук за назвою, місцем…" : "Search by title, location…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger><SelectValue placeholder={lang === "uk" ? "Категорія" : "Category"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "uk" ? "Усі категорії" : "All categories"}</SelectItem>
              {EVENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{t.categories[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger><SelectValue placeholder={lang === "uk" ? "Місяць" : "Month"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "uk" ? "Усі місяці" : "All months"}</SelectItem>
              {monthOptions.map((m) => {
                const d = new Date(m + "-01");
                const label = d.toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", { month: "long", year: "numeric" });
                return <SelectItem key={m} value={m}>{label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_asc">{lang === "uk" ? "Дата ↑" : "Date ↑"}</SelectItem>
              <SelectItem value="date_desc">{lang === "uk" ? "Дата ↓" : "Date ↓"}</SelectItem>
              <SelectItem value="title_asc">{lang === "uk" ? "Назва А→Я" : "Title A→Z"}</SelectItem>
              <SelectItem value="location_asc">{lang === "uk" ? "Місце А→Я" : "Location A→Z"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {lang === "uk" ? "Подій не знайдено" : "No events found"}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {grouped.map((group) => (
                <section key={group.key}>
                  <div className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-2 border-b border-border">
                    <h2 className="font-display text-lg font-semibold tracking-tight">
                      {group.label}
                      <span className="ml-2 text-xs font-normal opacity-80">
                        {group.rows.length}
                      </span>
                    </h2>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{lang === "uk" ? "Дата" : "Date"}</TableHead>
                        <TableHead>{lang === "uk" ? "Назва" : "Title"}</TableHead>
                        <TableHead>{lang === "uk" ? "Місце" : "Location"}</TableHead>
                        <TableHead>{lang === "uk" ? "Дистанції" : "Distances"}</TableHead>
                        <TableHead>{lang === "uk" ? "Організатор" : "Organizer"}</TableHead>
                        <TableHead className="text-right">{lang === "uk" ? "Дії" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.rows.map((r, idx) => (
                        <TableRow
                          key={`${r.source}-${r.id}`}
                          className={idx % 2 === 0
                            ? "bg-background hover:!bg-background"
                            : "bg-muted/40 hover:!bg-muted/40"}
                        >
                          <TableCell className="whitespace-nowrap text-sm">{fmtDate(r.event_date)}</TableCell>
                          <TableCell className="font-medium">
                            {r.source === "platform" ? (
                              <Link to={r.url ?? "#"} className="hover:text-primary">{r.title}</Link>
                            ) : r.url ? (
                              internalPath(r.url) ? (
                                <Link to={internalPath(r.url)!} className="hover:text-primary">{r.title}</Link>
                              ) : (
                                <a href={r.url} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                                  {r.title}<ExternalLink className="h-3 w-3" />
                                </a>
                              )
                            ) : r.title}
                            {r.category && (
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                                {t.categories[r.category as EventCategory] ?? r.category}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.location || "онлайн"}</TableCell>
                          <TableCell className="text-sm">{r.distances || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.organizer_name || "—"}</TableCell>
                          <TableCell className="text-right">
                            {r.source === "platform" ? (
                              <Button asChild size="sm" variant="outline">
                                <Link to={r.url ?? "#"}>{lang === "uk" ? "Деталі" : "Details"}</Link>
                              </Button>
                            ) : (
                              <div className="flex justify-end items-center gap-1">
                                {r.url && (
                                  internalPath(r.url) ? (
                                    <Button asChild size="sm" variant="outline">
                                      <Link to={internalPath(r.url)!}>{lang === "uk" ? "Деталі" : "Details"}</Link>
                                    </Button>
                                  ) : (
                                    <Button asChild size="sm" variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                      <a href={r.url} target="_blank" rel="noreferrer">
                                        {lang === "uk" ? "Перейти" : "Open"}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  )
                                )}

                                {(isAdmin || (isOrganizer && r.created_by === user?.id)) && (
                                  <>
                                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title={lang === "uk" ? "Редагувати" : "Edit"}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)} title={lang === "uk" ? "Видалити" : "Delete"}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CalendarPage;

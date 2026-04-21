import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Plus, Edit, Trash2, Users, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OrganizerDashboard = () => {
  const { t, lang } = useApp();
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user]);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("events")
      .select("*, distances(*), registrations(count)")
      .eq("organizer_id", user!.id)
      .order("event_date", { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  };

  const remove = async (id: string) => {
    if (!confirm(t.organizer.confirmDelete)) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("OK"); refresh(); }
  };

  const exportData = async (eventId: string, eventTitle: string, format: "csv" | "xlsx") => {
    const { data: regs } = await supabase.from("registrations")
      .select("user_id, bib_number, payment_status, distances(distance_km, name)")
      .eq("event_id", eventId)
      .order("bib_number", { ascending: true, nullsFirst: false });
    const userIds = (regs ?? []).map((r: any) => r.user_id);
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase.from("profiles")
        .select("id, full_name, email, gender, birth_date, city, club")
        .in("id", userIds);
      profilesMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }
    const rows = (regs ?? []).map((r: any) => {
      const p = profilesMap[r.user_id] ?? {};
      return {
        Bib: r.bib_number ?? "",
        Name: p.full_name ?? "",
        Email: p.email ?? "",
        Gender: p.gender ?? "",
        BirthYear: p.birth_date ? new Date(p.birth_date).getFullYear() : "",
        City: p.city ?? "",
        Club: p.club ?? "",
        DistanceKm: r.distances?.distance_km ?? "",
        DistanceName: r.distances?.name ?? "",
        PaymentStatus: r.payment_status,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, `${eventTitle.replace(/[^a-z0-9]+/gi, "_")}_participants.${format}`, { bookType: format });
  };

  const assignBibs = async (eventId: string) => {
    const { data: regs } = await supabase.from("registrations")
      .select("id, distance_id, created_at")
      .eq("event_id", eventId)
      .order("distance_id").order("created_at");
    if (!regs) return;
    const counters = new Map<string, number>();
    for (const r of regs) {
      const next = (counters.get(r.distance_id) ?? 0) + 1;
      counters.set(r.distance_id, next);
      await supabase.from("registrations").update({ bib_number: next }).eq("id", r.id);
    }
    toast.success("OK");
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth?role=organizer" replace />;
  if (!isOrganizer) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-20 text-center">
        <p className="text-muted-foreground">403 — organizer access required</p>
        <Button asChild className="mt-4"><Link to="/">{t.common.backHome}</Link></Button>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-6xl py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold">{t.organizer.dashboard}</h1>
            <p className="text-muted-foreground mt-1">{t.organizer.myEvents}</p>
          </div>
          <Button asChild size="lg">
            <Link to="/organizer/events/new"><Plus className="h-4 w-4" /> {t.organizer.createEvent}</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl">
            <p className="text-muted-foreground">{t.organizer.noEvents}</p>
            <Button asChild className="mt-4"><Link to="/organizer/events/new">{t.organizer.createFirst}</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="bg-card p-5 rounded-2xl shadow-card">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        ev.status === "published" ? "bg-accent text-accent-foreground" :
                        ev.status === "draft" ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground"
                      }`}>{t.organizer[ev.status as keyof typeof t.organizer]}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ev.event_date).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US")}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold mt-1">{ev.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {ev.distances?.length ?? 0} {t.events.distances.toLowerCase()} · {ev.registrations?.[0]?.count ?? 0} {t.events.participants.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/events/${ev.id}/participants`}><Users className="h-4 w-4" /> {t.events.participants}</Link>
                    </Button>
                    <Button onClick={() => assignBibs(ev.id)} variant="outline" size="sm">{t.organizer.assignBibs}</Button>
                    <Button onClick={() => exportData(ev.id, ev.title, "csv")} variant="outline" size="sm"><Download className="h-4 w-4" /> CSV</Button>
                    <Button onClick={() => exportData(ev.id, ev.title, "xlsx")} variant="outline" size="sm"><Download className="h-4 w-4" /> XLSX</Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/organizer/events/${ev.id}`}><Edit className="h-4 w-4" /></Link>
                    </Button>
                    <Button onClick={() => remove(ev.id)} variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrganizerDashboard;

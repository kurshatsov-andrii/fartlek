import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, UserCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  city: string | null;
};

const AdminEventCoOrganizers = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [headOrganizer, setHeadOrganizer] = useState<Profile | null>(null);
  const [coOrgs, setCoOrgs] = useState<(Profile & { co_id: string })[]>([]);
  const [organizers, setOrganizers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAdmin || !eventId) return;
    refresh();
  }, [isAdmin, eventId]);

  const refresh = async () => {
    setLoading(true);

    const { data: ev } = await supabase.from("events").select("id, title, organizer_id, organizer_name, event_date").eq("id", eventId!).maybeSingle();
    setEvent(ev);

    // All users with organizer role
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "organizer");
    const orgIds = Array.from(new Set((roles ?? []).map((r) => r.user_id)));

    const allIds = Array.from(new Set([...(ev?.organizer_id ? [ev.organizer_id] : []), ...orgIds]));
    const { data: profs } = allIds.length
      ? await supabase.from("profiles").select("id, email, full_name, city").in("id", allIds)
      : { data: [] as any[] };

    const profMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    setHeadOrganizer(ev?.organizer_id ? profMap[ev.organizer_id] ?? null : null);
    setOrganizers(orgIds.map((id) => profMap[id]).filter(Boolean) as Profile[]);

    // Existing co-organizers
    const { data: cos } = await supabase
      .from("event_co_organizers")
      .select("id, user_id")
      .eq("event_id", eventId!);
    const coUserIds = (cos ?? []).map((c) => c.user_id);
    let coProfs: Record<string, Profile> = {};
    if (coUserIds.length) {
      const { data: cp } = await supabase.from("profiles").select("id, email, full_name, city").in("id", coUserIds);
      coProfs = Object.fromEntries((cp ?? []).map((p: any) => [p.id, p]));
    }
    setCoOrgs(
      (cos ?? []).map((c) => ({ ...(coProfs[c.user_id] ?? { id: c.user_id, email: "?", full_name: null, city: null }), co_id: c.id }))
    );

    setLoading(false);
  };

  const coUserIdSet = useMemo(() => new Set(coOrgs.map((c) => c.id)), [coOrgs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizers
      .filter((o) => o.id !== event?.organizer_id) // skip head organizer
      .filter((o) => !coUserIdSet.has(o.id)) // skip already added
      .filter((o) =>
        !q
          ? true
          : (o.full_name ?? "").toLowerCase().includes(q) ||
            (o.email ?? "").toLowerCase().includes(q) ||
            (o.city ?? "").toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [organizers, search, coUserIdSet, event?.organizer_id]);

  const addCo = async (userId: string) => {
    setBusy(true);
    const { error } = await supabase.from("event_co_organizers").insert({
      event_id: eventId!,
      user_id: userId,
      added_by: user!.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Співорганізатора додано");
    refresh();
  };

  const removeCo = async (coId: string) => {
    if (!confirm("Видалити співорганізатора?")) return;
    setBusy(true);
    const { error } = await supabase.from("event_co_organizers").delete().eq("id", coId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Видалено");
    refresh();
  };

  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!user) return <Navigate to="/auth?redirect=/admin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin"><ArrowLeft className="h-4 w-4" /> Назад до адмін-панелі</Link>
        </Button>

        <h1 className="font-display text-3xl font-bold">Співорганізатори події</h1>
        {event && (
          <p className="text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{event.title}</span> · {event.event_date}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Головний організатор
              </h2>
              <div className="bg-card p-4 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{headOrganizer?.full_name ?? event?.organizer_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{headOrganizer?.email ?? "—"}</div>
                </div>
                <Badge variant="secondary">Власник</Badge>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Співорганізатори ({coOrgs.length})
              </h2>
              {coOrgs.length === 0 ? (
                <div className="bg-card p-6 rounded-xl text-center text-muted-foreground text-sm">
                  Поки що немає співорганізаторів
                </div>
              ) : (
                <div className="space-y-2">
                  {coOrgs.map((c) => (
                    <div key={c.co_id} className="bg-card p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserCheck className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground truncate">{c.email}{c.city ? ` · ${c.city}` : ""}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={busy}
                        onClick={() => removeCo(c.co_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Додати співорганізатора
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                Доступні лише користувачі з роллю «Організатор». Додати роль можна на сторінці «Користувачі» в адмін-панелі.
              </p>
              <Input
                placeholder="Пошук за іменем, email або містом…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-3"
              />
              <div className="space-y-2">
                {filtered.length === 0 ? (
                  <div className="bg-card p-6 rounded-xl text-center text-muted-foreground text-sm">
                    {search ? "Нічого не знайдено" : "Немає доступних організаторів для додавання"}
                  </div>
                ) : (
                  filtered.map((o) => (
                    <div key={o.id} className="bg-card p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{o.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground truncate">{o.email}{o.city ? ` · ${o.city}` : ""}</div>
                      </div>
                      <Button size="sm" disabled={busy} onClick={() => addCo(o.id)}>
                        <Plus className="h-4 w-4" /> Додати
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminEventCoOrganizers;

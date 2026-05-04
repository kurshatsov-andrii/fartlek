import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ACTION_LABEL: Record<string, { uk: string; en: string }> = {
  distance_changed: { uk: "Зміна дистанції", en: "Distance changed" },
  transferred: { uk: "Передача іншому учаснику", en: "Transferred" },
  transfer_created: { uk: "Створено код передачі", en: "Transfer code created" },
  cancellation_requested: { uk: "Заявка на відміну", en: "Cancellation requested" },
  cancellation_rejected: { uk: "Відмову відхилено", en: "Cancellation rejected" },
  cancelled: { uk: "Реєстрацію скасовано", en: "Registration cancelled" },
};

const EventChangesAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: ev } = await supabase.from("events").select("id, title, organizer_id, changes_deadline_days").eq("id", id).maybeSingle();
      setEvent(ev);
      const { data: h } = await supabase
        .from("registration_history")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false })
        .limit(200);
      setHistory(h ?? []);
      const { data: r } = await supabase
        .from("registration_cancellation_requests")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });
      setRequests(r ?? []);

      const ids = new Set<string>();
      (h ?? []).forEach((x) => x.actor_id && ids.add(x.actor_id));
      (r ?? []).forEach((x) => ids.add(x.user_id));
      if (ids.size) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", Array.from(ids));
        setProfileMap(Object.fromEntries((profs ?? []).map((p: any) => [p.id, p])));
      }
      setLoading(false);
    })();
  }, [id, user]);

  const resolve = async (reqId: string, approve: boolean) => {
    setBusyId(reqId);
    try {
      const { error } = await supabase.rpc("organizer_resolve_cancellation", {
        _request_id: reqId,
        _approve: approve,
        _note: notes[reqId] || null,
      });
      if (error) throw error;
      toast.success(approve
        ? (lang === "uk" ? "Реєстрацію скасовано" : "Registration cancelled")
        : (lang === "uk" ? "Заявку відхилено" : "Request rejected"));
      // reload
      const { data: r } = await supabase
        .from("registration_cancellation_requests")
        .select("*")
        .eq("event_id", id!)
        .order("created_at", { ascending: false });
      setRequests(r ?? []);
      const { data: h } = await supabase
        .from("registration_history")
        .select("*")
        .eq("event_id", id!)
        .order("created_at", { ascending: false })
        .limit(200);
      setHistory(h ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const userName = (uid?: string) => uid && profileMap[uid] ? `${profileMap[uid].full_name ?? profileMap[uid].email ?? uid.slice(0, 8)}` : (uid?.slice(0, 8) ?? "—");
  const pending = requests.filter((r) => r.status === "pending");
  const past = requests.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-5xl py-10">
        <Link to="/organizer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {lang === "uk" ? "Назад" : "Back"}
        </Link>
        <h1 className="font-display text-3xl font-bold">
          {lang === "uk" ? "Зміни та відміни" : "Changes & cancellations"}
        </h1>
        <p className="text-muted-foreground mt-1">{event?.title}</p>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold mb-3">
            {lang === "uk" ? "Заявки на відміну" : "Cancellation requests"}
          </h2>
          {pending.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-card rounded-2xl p-4">
              {lang === "uk" ? "Немає активних заявок" : "No pending requests"}
            </div>
          ) : (
            <div className="grid gap-3">
              {pending.map((r) => (
                <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <div className="font-semibold">{userName(r.user_id)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString(lang === "uk" ? "uk-UA" : "en-US")}
                      </div>
                    </div>
                  </div>
                  {r.reason && <p className="text-sm mt-2">«{r.reason}»</p>}
                  <Input
                    className="mt-2"
                    placeholder={lang === "uk" ? "Коментар організатора (необов'язково)" : "Organizer note (optional)"}
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="destructive" disabled={busyId === r.id} onClick={() => resolve(r.id, true)}>
                      <CheckCircle2 className="h-4 w-4" /> {lang === "uk" ? "Підтвердити відміну" : "Approve cancellation"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => resolve(r.id, false)}>
                      <XCircle className="h-4 w-4" /> {lang === "uk" ? "Відхилити" : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                {lang === "uk" ? `Історія (${past.length})` : `History (${past.length})`}
              </summary>
              <div className="grid gap-2 mt-3">
                {past.map((r) => (
                  <div key={r.id} className="bg-card rounded-xl p-3 text-sm">
                    <span className={r.status === "approved" ? "text-destructive font-semibold" : "text-muted-foreground"}>
                      {r.status}
                    </span>
                    {" · "}{userName(r.user_id)}{" · "}
                    {new Date(r.resolved_at ?? r.created_at).toLocaleString(lang === "uk" ? "uk-UA" : "en-US")}
                    {r.resolution_note && <div className="text-xs text-muted-foreground mt-1">{r.resolution_note}</div>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold mb-3">
            {lang === "uk" ? "Журнал змін реєстрацій" : "Registration changes log"}
          </h2>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-card rounded-2xl p-4">
              {lang === "uk" ? "Поки що немає записів" : "No entries yet"}
            </div>
          ) : (
            <div className="grid gap-2">
              {history.map((h) => {
                const label = ACTION_LABEL[h.action]?.[lang] ?? h.action;
                const p = h.payload ?? {};
                return (
                  <div key={h.id} className="bg-card rounded-xl p-3 text-sm">
                    <div className="flex justify-between gap-2 flex-wrap">
                      <div className="font-semibold">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleString(lang === "uk" ? "uk-UA" : "en-US")}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {lang === "uk" ? "Хто" : "Actor"}: {userName(h.actor_id)}
                    </div>
                    {h.action === "distance_changed" && (
                      <div className="text-xs mt-1">
                        {p.from_distance_km} km → {p.to_distance_km} km · {lang === "uk" ? "номер" : "bib"} {p.old_bib} → {p.new_bib}
                        {p.price_diff ? ` · ${p.price_diff > 0 ? "+" : ""}${p.price_diff} ₴` : ""}
                      </div>
                    )}
                    {h.action === "transferred" && (
                      <div className="text-xs mt-1">
                        {userName(p.from_user_id)} → {userName(p.to_user_id)}
                      </div>
                    )}
                    {(h.action === "cancellation_requested" || h.action === "cancellation_rejected" || h.action === "cancelled") && p.reason && (
                      <div className="text-xs mt-1">«{p.reason}»</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EventChangesAdmin;

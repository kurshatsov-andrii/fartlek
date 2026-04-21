import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Participants = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: ev } = await supabase.from("events").select("title").eq("id", id).maybeSingle();
      setEventTitle(ev?.title ?? "");
      const { data: regs } = await supabase.from("registrations")
        .select("user_id, bib_number, distances(distance_km, name)")
        .eq("event_id", id)
        .order("bib_number", { ascending: true, nullsFirst: false });
      const userIds = (regs ?? []).map((r: any) => r.user_id);
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles")
          .select("id, full_name, gender, birth_date, city, club")
          .in("id", userIds);
        profilesMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
      }
      setRows((regs ?? []).map((r: any) => ({ ...r, profiles: profilesMap[r.user_id] })));
      setLoading(false);
    })();
  }, [id, user]);

  if (authLoading) return null;
  if (!user) return <Navigate to={`/auth?redirect=/events/${id}/participants`} replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-5xl py-10">
        <Link to={`/events/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t.events.backToEvents}
        </Link>
        <h1 className="font-display text-3xl font-bold">{t.events.participants}</h1>
        <p className="text-muted-foreground mt-1">{eventTitle} · {rows.length}</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="mt-6 bg-card rounded-2xl shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-semibold">#</th>
                  <th className="p-3 font-semibold">{t.auth.fullName}</th>
                  <th className="p-3 font-semibold">{t.profile.gender}</th>
                  <th className="p-3 font-semibold">Year</th>
                  <th className="p-3 font-semibold">{t.profile.city}</th>
                  <th className="p-3 font-semibold">{t.profile.club}</th>
                  <th className="p-3 font-semibold">km</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 font-bold text-primary">{r.bib_number ?? "—"}</td>
                    <td className="p-3">{r.profiles?.full_name ?? "—"}</td>
                    <td className="p-3">{r.profiles?.gender ?? "—"}</td>
                    <td className="p-3">{r.profiles?.birth_date ? new Date(r.profiles.birth_date).getFullYear() : "—"}</td>
                    <td className="p-3">{r.profiles?.city ?? "—"}</td>
                    <td className="p-3">{r.profiles?.club ?? "—"}</td>
                    <td className="p-3">{r.distances?.distance_km}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">—</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Participants;

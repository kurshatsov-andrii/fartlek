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
  const { t, lang } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: ev } = await supabase.from("events").select("title").eq("id", id).maybeSingle();
      setEventTitle(ev?.title ?? "");
      const { data: participants } = await (supabase.rpc as any)("get_event_participants", { _event_id: id });
      setRows(participants ?? []);
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
        ) : rows.length === 0 ? (
          <div className="mt-6 bg-card rounded-2xl shadow-card p-8 text-center text-muted-foreground">—</div>
        ) : (
          <div className="mt-6 space-y-8">
            {Object.entries(
              rows.reduce<Record<string, any[]>>((acc, r) => {
                const key = `${r.distance_km ?? "—"}`;
                (acc[key] ||= []).push(r);
                return acc;
              }, {})
            )
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([km, list]) => (
                <div key={km} className="bg-card rounded-2xl shadow-card overflow-x-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="font-display text-xl font-bold">
                      {km} {lang === "uk" ? "км" : "km"}
                    </h2>
                    <span className="text-sm text-muted-foreground">{list.length}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-3 font-semibold">#</th>
                        <th className="p-3 font-semibold">{t.auth.fullName}</th>
                        <th className="p-3 font-semibold">{t.profile.gender}</th>
                        <th className="p-3 font-semibold">{lang === "uk" ? "Рік" : "Year"}</th>
                        <th className="p-3 font-semibold">{t.profile.city}</th>
                        <th className="p-3 font-semibold">{t.profile.club}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="p-3 font-bold text-primary">{r.bib_number ?? "—"}</td>
                          <td className="p-3">{r.full_name ?? "—"}</td>
                          <td className="p-3">
                            {r.gender === "male"
                              ? lang === "uk" ? "чоловік" : "male"
                              : r.gender === "female"
                              ? lang === "uk" ? "жінка" : "female"
                              : r.gender ?? "—"}
                          </td>
                          <td className="p-3">{r.birth_year ?? "—"}</td>
                          <td className="p-3">{r.city ?? "—"}</td>
                          <td className="p-3">{r.club ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Participants;

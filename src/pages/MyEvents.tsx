import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, QrCode, Calendar, FileText, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const MyEvents = () => {
  const { t, lang } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [regs, setRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("registrations")
      .select("*, events(*), distances(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setRegs(data ?? []); setLoading(false); });
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl py-12">
        <h1 className="font-display text-4xl font-bold">{t.nav.myEvents}</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : regs.length === 0 ? (
          <div className="mt-8 text-center py-16 bg-card rounded-2xl">
            <p className="text-muted-foreground">{t.events.empty}</p>
            <Button asChild className="mt-4"><Link to="/#events">{t.nav.events}</Link></Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {regs.map((r) => {
              if (!r.events || !r.distances) return null;
              const isCompleted = r.events.status === "completed";
              const isCancelled = r.events.status === "cancelled";
              const isUpcoming = !isCompleted && !isCancelled && new Date(r.events.event_date) >= new Date(new Date().toDateString());
              const resultsHref = r.events.results_pdf_url || r.events.results_url;
              return (
                <div key={r.id} className="bg-card p-5 rounded-2xl shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg font-bold">{r.events.title}</h3>
                      {isCompleted && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t.organizer.completed}
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {lang === "uk" ? "Скоро" : "Upcoming"}
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                          {t.organizer.cancelled}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      {new Date(r.events.event_date).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US")}
                      · {r.distances.distance_km} km
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center shrink-0">
                    {isCompleted && resultsHref && (
                      <Button asChild variant="outline">
                        <a href={resultsHref} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4" /> {t.events.results}
                        </a>
                      </Button>
                    )}
                    <Button asChild variant="outline">
                      <Link to={`/events/${r.event_id}/participants`}><Users className="h-4 w-4" /> {t.events.participants}</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to={`/ticket/${r.id}`}><QrCode className="h-4 w-4" /> {t.events.viewTicket}</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyEvents;

import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, QrCode, Calendar } from "lucide-react";
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
            {regs.map((r) => (
              <div key={r.id} className="bg-card p-5 rounded-2xl shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold">{r.events.title}</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(r.events.event_date).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US")}
                    · {r.distances.distance_km} km
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link to={`/ticket/${r.id}`}><QrCode className="h-4 w-4" /> {t.events.viewTicket}</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyEvents;

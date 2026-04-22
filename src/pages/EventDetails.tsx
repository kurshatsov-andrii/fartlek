import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin, Users, Loader2, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startWayForPayCheckout } from "@/lib/wayforpay";

interface EventRow {
  id: string; title: string; description: string | null; organizer_name: string;
  event_date: string; event_time: string; location: string | null;
  image_url: string | null; is_paid: boolean; status: string;
}
interface DistanceRow { id: string; distance_km: number; name: string | null; price: number; is_active?: boolean; }

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [distances, setDistances] = useState<DistanceRow[]>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [selectedDistance, setSelectedDistance] = useState<string>("");
  const [registration, setRegistration] = useState<{ id: string; payment_status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: ev }, { data: ds }, { count }] = await Promise.all([
        supabase.from("events").select("*").eq("id", id).maybeSingle(),
        supabase.from("distances").select("*").eq("event_id", id).eq("is_active", true).order("distance_km"),
        supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", id),
      ]);
      setEvent(ev);
      setDistances(ds ?? []);
      setParticipantsCount(count ?? 0);
      if (ds && ds.length > 0) setSelectedDistance(ds[0].id);
      if (user) {
        const { data: reg } = await supabase.from("registrations").select("id, payment_status").eq("event_id", id).eq("user_id", user.id).maybeSingle();
        if (reg) setRegistration(reg);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const register = async () => {
    if (!user) { navigate(`/auth?redirect=/events/${id}`); return; }
    if (!selectedDistance || !event) return;
    setBusy(true);
    // Require complete profile before registering
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, birth_date, gender, city")
      .eq("id", user.id)
      .maybeSingle();
    const profileComplete =
      !!profile?.full_name?.trim() && !!profile?.birth_date && !!profile?.gender && !!profile?.city?.trim();
    if (!profileComplete) {
      setBusy(false);
      toast.error(t.profile.requiredToRegister);
      navigate(`/profile?redirect=/events/${id}`);
      return;
    }
    const dist = distances.find((d) => d.id === selectedDistance)!;
    const isPaidReg = event.is_paid && dist.price > 0;
    const qrPayload = JSON.stringify({ e: event.id, u: user.id, d: dist.id, t: Date.now() });
    const { data: reg, error } = await supabase.from("registrations").insert({
      event_id: event.id,
      user_id: user.id,
      distance_id: dist.id,
      payment_status: isPaidReg ? "pending" : "free",
      qr_code_data: qrPayload,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("OK");
    navigate(`/ticket/${reg.id}`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-20 text-center">
          <p className="text-muted-foreground">404</p>
          <Button asChild className="mt-4"><Link to="/">{t.common.backHome}</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const fmtDate = new Date(event.event_date).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {event.image_url && (
          <div className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
            <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        )}
        <div className="container max-w-5xl py-10">
          <Link to="/#events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> {t.events.backToEvents}
          </Link>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${event.is_paid ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                {event.is_paid ? t.events.paid : t.events.free}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">{event.title}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{fmtDate} · {event.event_time.slice(0, 5)}</div>
                {event.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{event.location}</div>}
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{participantsCount} {t.events.participants.toLowerCase()}</div>
              </div>
              {event.description && (
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{event.description}</div>
              )}
              <div className="text-sm text-muted-foreground">
                {t.events.organizer}: <span className="text-foreground font-medium">{event.organizer_name}</span>
              </div>
              <Button asChild variant="outline">
                <Link to={`/events/${event.id}/participants`}>
                  <Users className="h-4 w-4" /> {t.events.participants}
                </Link>
              </Button>
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-card p-6 rounded-2xl shadow-card space-y-4">
                <h3 className="font-display text-lg font-bold">{t.events.selectDistance}</h3>
                {registration ? (
                  <>
                    <p className="text-sm text-muted-foreground">{t.events.alreadyRegistered}</p>
                    {registration.payment_status === "pending" && (
                      <Button
                        className="w-full"
                        onClick={async () => {
                          setBusy(true);
                          try { await startWayForPayCheckout(registration.id); }
                          catch (e: any) { toast.error(e.message); setBusy(false); }
                        }}
                        disabled={busy}
                      >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Сплатити
                      </Button>
                    )}
                    <Button asChild variant={registration.payment_status === "pending" ? "outline" : "default"} className="w-full">
                      <Link to={`/ticket/${registration.id}`}>{t.events.viewTicket}</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      {distances.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDistance(d.id)}
                          className={`w-full text-left rounded-md border-2 px-4 py-3 transition-base ${selectedDistance === d.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold">{d.distance_km} km</div>
                              {d.name && <div className="text-xs text-muted-foreground">{d.name}</div>}
                            </div>
                            <div className="text-sm font-semibold">{event.is_paid && d.price > 0 ? `${d.price} ₴` : t.events.free}</div>
                          </div>
                        </button>
                      ))}
                      {distances.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
                    </div>
                    <Button onClick={register} className="w-full" disabled={busy || !selectedDistance}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.events.confirmRegister}
                    </Button>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetails;

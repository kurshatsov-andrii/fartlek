import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin, Users, Loader2, ArrowLeft, UserCircle2, FileText, CalendarPlus, Calculator } from "lucide-react";
import { PaceCalculatorDialog } from "@/components/PaceCalculatorDialog";
import { downloadIcs } from "@/lib/calendar";
import { GpxTracksList } from "@/components/GpxTracksList";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AthleteFormDialog, Athlete } from "@/components/AthleteFormDialog";
import { DocumentDialog } from "@/components/DocumentDialog";
import { VirtualResultPanel } from "@/components/VirtualResultPanel";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startAutomatedPaymentCheckout } from "@/lib/paymentCheckout";
import { buildEventSeo } from "@/lib/seo";
import { linkifyText } from "@/lib/linkify";
import { PromoCodeInput, PromoPreview } from "@/components/PromoCodeInput";
import { EventChat } from "@/components/EventChat";
import { NovaPoshtaDelivery, DeliveryData, emptyDelivery, validateDelivery } from "@/components/NovaPoshtaDelivery";
import type { EventCategory } from "@/lib/i18n";

interface EventRow {
  id: string; slug: string | null; title: string; description: string | null; organizer_name: string;
  organizer_id: string;
  event_date: string; event_time: string; location: string | null;
  image_url: string | null; is_paid: boolean; payment_url: string | null; status: string; category: EventCategory;
  format: "offline" | "online" | "hybrid";
  results_pdf_url: string | null;
  results_url: string | null;
  photos_url: string | null;
  regulations_pdf_url: string | null;
  description_image_url: string | null;
  registration_closed?: boolean;
}
interface SegmentRow { sport: string; distance_km: number; order?: number }
interface DistanceRow { id: string; distance_km: number; name: string | null; price: number; is_active?: boolean; is_relay?: boolean; relay_legs_count?: number | null; relay_categories?: string[] | null; relay_legs?: number[] | null; delivery_enabled?: boolean; segments?: SegmentRow[] | null; discipline?: string | null; obstacle_count?: number | null; max_participants?: number | null; }

interface RelayMember { full_name: string; gender: string; }

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [distances, setDistances] = useState<DistanceRow[]>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [distanceCounts, setDistanceCounts] = useState<Record<string, number>>({});
  const [selectedDistance, setSelectedDistance] = useState<string>("");
  const [registration, setRegistration] = useState<{ id: string; payment_status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string>("");
  const [athleteRegs, setAthleteRegs] = useState<Set<string>>(new Set()); // `${athleteId}:${distanceId}` already registered
  const [athleteDialogOpen, setAthleteDialogOpen] = useState(false);
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [hasPromoCodes, setHasPromoCodes] = useState(false);
  const [clubSlug, setClubSlug] = useState<string | null>(null);
  const [organizerSlug, setOrganizerSlug] = useState<string | null>(null);
  const [regulationsOpen, setRegulationsOpen] = useState(false);
  const [docDialog, setDocDialog] = useState<{ url: string; title: string } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamCategory, setTeamCategory] = useState<string>("");
  const [relayMembers, setRelayMembers] = useState<RelayMember[]>([]);
  const [delivery, setDelivery] = useState<DeliveryData>(emptyDelivery());
  const [hasExternalResults, setHasExternalResults] = useState(false);

  const selectedDist = distances.find((d) => d.id === selectedDistance);
  const isRelay = !!selectedDist?.is_relay;
  const relayLegs = selectedDist?.relay_legs_count ?? 4;

  // Sync relay members count to the selected relay distance
  useEffect(() => {
    if (!isRelay) return;
    setRelayMembers((prev) => {
      const target = relayLegs;
      if (prev.length === target) return prev;
      const next = [...prev];
      while (next.length < target) next.push({ full_name: "", gender: "male" });
      while (next.length > target) next.pop();
      return next;
    });
    if (!teamCategory && selectedDist?.relay_categories?.length) {
      setTeamCategory(selectedDist.relay_categories[0]);
    }
  }, [isRelay, relayLegs, selectedDistance]);
  useEffect(() => { setPromo(null); }, [selectedDistance]);
  // Auto-select the only available distance (e.g. for "jumps" category or single-distance events)
  useEffect(() => {
    if (!selectedDistance && distances.length === 1) {
      setSelectedDistance(distances[0].id);
    }
  }, [distances, selectedDistance]);
  useEffect(() => {
    const dist = distances.find((d) => d.id === selectedDistance);
    if (!dist?.delivery_enabled) setDelivery(emptyDelivery());
  }, [selectedDistance, distances]);

  const reloadAthletes = async (uid: string, eventId: string) => {
    const { data: ats } = await supabase.from("athletes").select("*").eq("owner_id", uid)
      .order("is_self", { ascending: false }).order("created_at");
    const list = (ats ?? []) as Athlete[];
    setAthletes(list);
    if (list.length > 0 && !selectedAthlete) {
      setSelectedAthlete(list.find((a) => a.is_self)?.id ?? list[0].id);
    }
    // Existing registrations of these athletes for this event
    if (list.length > 0) {
      const { data: regs } = await supabase.from("registrations")
        .select("athlete_id, distance_id")
        .eq("event_id", eventId)
        .in("athlete_id", list.map((a) => a.id));
      setAthleteRegs(new Set((regs ?? []).map((r: any) => `${r.athlete_id}:${r.distance_id}`)));
    }
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .eq(isUuid ? "id" : "slug", id)
        .maybeSingle();
      if (!ev) { setLoading(false); return; }
      setEvent(ev as EventRow);
      const [{ data: ds }, { data: cnt }] = await Promise.all([
        supabase.from("distances").select("*").eq("event_id", ev.id).eq("is_active", true).order("distance_km"),
        supabase.rpc("get_event_participants_count", { _event_id: ev.id }),
      ]);
      setDistances((ds ?? []) as any);
      setParticipantsCount((cnt as number) ?? 0);
      // Per-distance counts (for capacity display / blocking) — aggregated, no personal data
      const { data: regRows } = await supabase.rpc("get_event_distance_counts", { _event_id: ev.id });
      const counts: Record<string, number> = {};
      (regRows ?? []).forEach((r: any) => { counts[r.distance_id] = Number(r.cnt) || 0; });
      setDistanceCounts(counts);
      if (ds && ds.length > 0) setSelectedDistance(ds[0].id);
      const { data: hasPromo } = await supabase.rpc("event_has_active_promo_codes", { _event_id: ev.id });
      setHasPromoCodes(!!hasPromo);
      if (ev.status === "completed") {
        const { count } = await (supabase as any)
          .from("event_external_results")
          .select("id", { count: "exact", head: true })
          .eq("event_id", ev.id);
        setHasExternalResults((count ?? 0) > 0);
      }
      if (ev.organizer_name) {
        const [{ data: club }, { data: org }] = await Promise.all([
          supabase.from("clubs").select("slug").ilike("name", ev.organizer_name.trim()).not("slug", "is", null).maybeSingle(),
          supabase.from("organizers" as any).select("slug").ilike("name", ev.organizer_name.trim()).not("slug", "is", null).maybeSingle(),
        ]);
        setClubSlug(club?.slug ?? null);
        setOrganizerSlug((org as any)?.slug ?? null);
      }
      if (user) {
        const { data: reg } = await supabase.from("registrations").select("id, payment_status").eq("event_id", ev.id).eq("user_id", user.id).maybeSingle();
        if (reg) setRegistration(reg);
        await reloadAthletes(user.id, ev.id);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const isAlreadyRegistered = !!selectedAthlete && !!selectedDistance &&
    athleteRegs.has(`${selectedAthlete}:${selectedDistance}`);

  const register = async () => {
    if (!user) { navigate(`/auth?redirect=/events/${id}`); return; }
    if (!selectedDistance || !event) return;
    setBusy(true);
    // Require complete profile (self-athlete) before registering
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
    const distIsRelay = !!dist.is_relay;

    if (!distIsRelay && !selectedAthlete) {
      setBusy(false);
      toast.error(t.profile.fillRequired);
      return;
    }
    if (!distIsRelay && isAlreadyRegistered) {
      setBusy(false);
      toast.error(t.athletes.alreadyRegistered);
      return;
    }
    if (distIsRelay) {
      if (!teamName.trim()) { setBusy(false); toast.error(t.relay.teamName); return; }
      if (!teamCategory) { setBusy(false); toast.error(t.relay.teamCategory); return; }
      const expected = dist.relay_legs_count ?? relayMembers.length;
      if (relayMembers.length !== expected) {
        setBusy(false); toast.error(t.relay.legsCountMismatch); return;
      }
      const allFilled = relayMembers.every((m) => m.full_name.trim() && m.gender);
      if (!allFilled) { setBusy(false); toast.error(t.relay.fillAllMembers); return; }
    }

    const deliveryError = validateDelivery(delivery, lang);
    if (deliveryError) { setBusy(false); toast.error(deliveryError); return; }

    const isPaidReg = event.is_paid && dist.price > 0;
    const qrPayload = JSON.stringify({ e: event.id, u: user.id, a: distIsRelay ? null : selectedAthlete, d: dist.id, t: Date.now() });
    const insertPayload: any = {
      event_id: event.id,
      user_id: user.id,
      distance_id: dist.id,
      payment_status: isPaidReg ? "pending" : "free",
      qr_code_data: qrPayload,
    };
    if (distIsRelay) {
      insertPayload.team_name = teamName.trim();
      insertPayload.team_category = teamCategory;
      const legsKm = (dist.relay_legs && Array.isArray(dist.relay_legs)) ? dist.relay_legs : [];
      insertPayload.relay_members = relayMembers.map((m, idx) => ({
        full_name: m.full_name.trim(),
        gender: m.gender,
        leg_km: typeof legsKm[idx] === "number" ? legsKm[idx] : null,
      }));
      insertPayload.athlete_id = selectedAthlete || null;
    } else {
      insertPayload.athlete_id = selectedAthlete;
    }
    if (delivery.enabled) {
      insertPayload.delivery_enabled = true;
      insertPayload.delivery_recipient_name = delivery.recipient_name.trim();
      insertPayload.delivery_phone = delivery.phone;
      insertPayload.delivery_city_ref = delivery.city_ref;
      insertPayload.delivery_city_name = delivery.city_name;
      insertPayload.delivery_warehouse_ref = delivery.warehouse_ref;
      insertPayload.delivery_warehouse_name = delivery.warehouse_name;
      insertPayload.delivery_warehouse_type = delivery.warehouse_type;
    }
    const { data: reg, error } = await supabase.from("registrations").insert(insertPayload).select("id").single();
    if (error) { setBusy(false); toast.error(error.message); return; }
    // Apply promo code if previewed and event is paid
    if (isPaidReg && promo) {
      const { error: pErr } = await supabase.rpc("apply_promo_code", {
        _code: promo.code, _event_id: event.id, _distance_id: dist.id,
        _registration_id: reg.id, _base_price: dist.price,
      });
      if (pErr) toast.error(pErr.message);
      else toast.success(t.promo.discountApplied);
    }
    if (isPaidReg) {
      if (event.payment_url) {
        window.open(event.payment_url, "_blank", "noopener,noreferrer");
      } else {
        try {
          await startAutomatedPaymentCheckout(reg.id);
          return;
        } catch (e: any) {
          toast.error(e.message ?? t.common.error);
        }
      }
    }
    setBusy(false);
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

  // Public (guest) display overrides — logged-in users always see the real count
  const isKharkivHalf = /kharkiv\s*half\s*marathon/i.test(event.title ?? "") || /kharkiv-half-marathon/i.test(event.slug ?? "");
  const isSarzhynYar = /саржин\s*яр/i.test(event.title ?? "") || /sarzhyn/i.test(event.slug ?? "");
  const displayParticipantsCount = user
    ? participantsCount
    : isSarzhynYar
      ? 50
      : isKharkivHalf
        ? Math.min(participantsCount, 200)
        : participantsCount;


  const seo = buildEventSeo({
    title: event.title,
    city: event.location,
    isoDate: event.event_date,
    organizer: event.organizer_name,
    distancesKm: distances.map((d) => d.distance_km),
    lang,
  });

  const canonical = `/events/${event.slug ?? event.id}`;
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://fartlek.lovable.app";
  const startDateIso = `${event.event_date}T${event.event_time}`;
  // Подія триває умовно до кінця стартового дня
  const endDateIso = `${event.event_date}T23:59:59`;
  const offerUrl = `${siteOrigin}${canonical}`;
  // validFrom — момент, з якого діє пропозиція реєстрації (вважаємо: з моменту створення події)
  const validFromIso = new Date().toISOString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.title,
    startDate: startDateIso,
    endDate: endDateIso,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.format === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.format === "hybrid"
        ? "https://schema.org/MixedEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location: event.location
      ? { "@type": "Place", name: event.location, address: event.location }
      : { "@type": "Place", name: "Ukraine", address: "Ukraine" },
    image: event.image_url || undefined,
    description: event.description || seo.description,
    organizer: {
      "@type": "Organization",
      name: event.organizer_name,
      url: siteOrigin,
    },
    performer: {
      "@type": "PerformingGroup",
      name: event.organizer_name,
    },
    offers: distances.map((d) => ({
      "@type": "Offer",
      name: `${d.distance_km} km${d.name ? ` — ${d.name}` : ""}`,
      price: event.is_paid ? d.price : 0,
      priceCurrency: "UAH",
      availability: "https://schema.org/InStock",
      validFrom: validFromIso,
      url: offerUrl,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seo.title} description={seo.description} canonical={canonical} image={event.image_url ?? undefined} jsonLd={jsonLd} />
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
          <div className={event.status === "completed" ? "grid lg:grid-cols-3 gap-8" : "grid lg:grid-cols-3 gap-8"}>
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${event.is_paid ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                  {event.is_paid ? t.events.paid : t.events.free}
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground">
                  {event.format === "hybrid" ? t.format.badgeHybrid : event.format === "online" ? t.format.badgeOnline : t.format.badgeOffline}
                </span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">{event.title}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{fmtDate} · {event.event_time.slice(0, 5)}</div>
                {event.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{event.location}</div>}
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{displayParticipantsCount} {t.events.participants.toLowerCase()}</div>
                <div className="flex items-center gap-2" title={t.events.organizer}>
                  <UserCircle2 className="h-4 w-4 text-primary" />
                  {organizerSlug ? (
                    <Link to={`/organizers/${organizerSlug}`} className="font-medium underline underline-offset-4 hover:text-primary">
                      {event.organizer_name}
                    </Link>
                  ) : clubSlug ? (
                    <Link to={`/clubs/${clubSlug}`} className="font-medium underline underline-offset-4 hover:text-primary">
                      {event.organizer_name}
                    </Link>
                  ) : (
                    <span className="font-medium">{event.organizer_name}</span>
                  )}
                </div>
              </div>
              {event.description && (
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere] [&_a]:break-all">
                  {linkifyText(event.description)}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {event.regulations_pdf_url && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRegulationsOpen(true)}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {lang === "uk" ? "Регламент" : "Regulations"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCalcOpen(true)}
                  className="gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  {lang === "uk" ? "Біговий калькулятор" : "Running calculator"}
                </Button>
              </div>
              {event.description_image_url && (
                <img
                  src={event.description_image_url}
                  alt={event.title}
                  loading="lazy"
                  className="w-full rounded-xl border border-border object-contain max-h-[600px] bg-muted"
                />
              )}
              <GpxTracksList
                eventId={event.id}
                distances={distances.map((d) => ({ id: d.id, name: d.name, distance_km: d.distance_km }))}
              />
            </div>

            <aside className="lg:col-span-1">
              {event.status === "completed" ? (
                <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 space-y-3">
                  <h3 className="font-display text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {t.events.resultsTitle}
                  </h3>
                  {hasExternalResults || event.results_pdf_url || event.results_url || event.photos_url ? (
                    <div className="flex flex-col gap-2">
                      {hasExternalResults && (
                        <Button className="w-full" asChild>
                          <Link to={`/events/${event.id}/results`}>
                            <FileText className="h-4 w-4" /> {lang === "uk" ? "Переглянути результати" : "View results"}
                          </Link>
                        </Button>
                      )}
                      {event.results_pdf_url && (
                        <Button
                          variant={hasExternalResults ? "outline" : "default"}
                          className="w-full"
                          onClick={() => setDocDialog({ url: event.results_pdf_url!, title: t.events.resultsTitle })}
                        >
                          <FileText className="h-4 w-4" /> {t.events.results}
                        </Button>
                      )}
                      {event.results_url && !hasExternalResults && (
                        <Button
                          variant={event.results_pdf_url ? "outline" : "default"}
                          className="w-full"
                          onClick={() => setDocDialog({ url: event.results_url!, title: t.events.resultsTitle })}
                        >
                          <FileText className="h-4 w-4" /> {t.events.results}
                        </Button>
                      )}
                      {event.photos_url && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={event.photos_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" /> {t.events.openPhotos}
                          </a>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.events.resultsNone}</p>
                  )}
                </div>
              ) : event.registration_closed ? (
                <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 space-y-3">
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {t.events.registrationClosedTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t.events.registrationClosedHint}</p>
                  {registration && (
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/ticket/${registration.id}`}>{t.events.viewTicket}</Link>
                    </Button>
                  )}
                </div>
              ) : (
              <div className="relative sticky top-24 bg-card p-6 rounded-2xl shadow-card space-y-4">
                {registration && (
                  <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 space-y-2 text-sm">
                    <p className="text-foreground">{t.events.alreadyRegistered}</p>
                    <div className="flex flex-col gap-2">
                      {registration.payment_status === "pending" && (
                        event.payment_url ? (
                          <Button asChild size="sm" className="w-full">
                            <a href={event.payment_url} target="_blank" rel="noopener noreferrer">Сплатити</a>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={async () => {
                              setBusy(true);
                              try { await startAutomatedPaymentCheckout(registration.id); }
                              catch (e: any) { toast.error(e.message); setBusy(false); }
                            }}
                            disabled={busy}
                          >
                            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Сплатити
                          </Button>
                        )
                      )}
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <Link to={`/ticket/${registration.id}`}>{t.events.viewTicket}</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {user && registration && (
                  <VirtualResultPanel eventId={event.id} userId={user.id} />
                )}

                {event.category !== "jumps" && (
                  <h3 className="font-display text-lg font-bold">{t.events.selectDistance}</h3>
                )}

                {!isRelay && user && athletes.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t.athletes.pickerLabel}</Label>
                    <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {athletes.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.full_name}{a.is_self ? ` (${t.athletes.self})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setAthleteDialogOpen(true)}>
                      {t.athletes.addNew}
                    </Button>
                  </div>
                )}

                <div className={`space-y-2 ${event.category === "jumps" ? "hidden" : ""}`}>
                  {distances.map((d) => {
                    const cap = d.max_participants ?? null;
                    const cnt = distanceCounts[d.id] ?? 0;
                    const isFull = cap != null && cnt >= cap;
                    return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { if (!isFull) setSelectedDistance(d.id); }}
                      disabled={isFull}
                      className={`w-full text-left rounded-md border-2 px-4 py-3 transition-base ${selectedDistance === d.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"} ${isFull ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="font-bold flex items-center gap-2 flex-wrap">
                            {d.distance_km} km
                            {d.discipline && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                {d.discipline}
                              </span>
                            )}
                            {d.is_relay && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                                {t.organizer.isRelay} · {d.relay_legs_count ?? "?"}×
                              </span>
                            )}
                            {isFull && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground">
                                {lang === "uk" ? "Заповнено" : "Full"}
                              </span>
                            )}
                            {cap != null && !isFull && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {cnt}/{cap}
                              </span>
                            )}
                          </div>
                          {Array.isArray(d.segments) && d.segments.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {[...d.segments].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((s, idx) => {
                                const emoji = s.sport === "swim" ? "🏊" : s.sport === "bike" ? "🚴" : s.sport === "run" ? "🏃" : s.sport === "obstacle_run" ? "🪢" : s.sport === "kayak" ? "🛶" : s.sport === "ski" ? "🎿" : "•";
                                return (
                                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                                    {emoji} {s.distance_km} km
                                  </span>
                                );
                              })}
                              {typeof d.obstacle_count === "number" && d.obstacle_count > 0 && (
                                <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                                  · {d.obstacle_count} {lang === "uk" ? "перешкод" : "obstacles"}
                                </span>
                              )}
                            </div>
                          )}
                          {d.name && <div className="text-xs text-muted-foreground mt-0.5">{d.name}</div>}
                        </div>
                        <div className="text-sm font-semibold whitespace-nowrap pl-2">{event.is_paid && d.price > 0 ? `${d.price} ₴` : t.events.free}</div>
                      </div>
                    </button>
                    );
                  })}
                  {distances.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
                </div>

                {isRelay && user && (
                  <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
                    <div className="space-y-1.5">
                      <Label>{t.relay.teamName} *</Label>
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder={t.relay.teamNamePlaceholder}
                        value={teamName}
                        maxLength={100}
                        onChange={(e) => setTeamName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.relay.teamCategory} *</Label>
                      <Select value={teamCategory} onValueChange={setTeamCategory}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          {(selectedDist?.relay_categories ?? ["mix", "men", "women"]).map((c) => (
                            <SelectItem key={c} value={c}>
                              {c === "mix" ? t.relay.categoryMix : c === "men" ? t.relay.categoryMen : t.relay.categoryWomen}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">{t.relay.membersTitle} ({relayMembers.length}/{relayLegs})</Label>
                      {relayMembers.map((m, idx) => {
                        const legKm = selectedDist?.relay_legs?.[idx];
                        return (
                          <div key={idx} className="rounded-md border border-border p-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-semibold text-muted-foreground">{t.relay.member} #{idx + 1}</div>
                              {typeof legKm === "number" && legKm > 0 && (
                                <div className="text-xs text-primary font-medium">{legKm} км</div>
                              )}
                            </div>
                            <input
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                              placeholder={t.relay.memberFullName}
                              value={m.full_name}
                              maxLength={120}
                              onChange={(e) => { const c = [...relayMembers]; c[idx].full_name = e.target.value; setRelayMembers(c); }}
                            />
                            <Select value={m.gender} onValueChange={(v) => { const c = [...relayMembers]; c[idx].gender = v; setRelayMembers(c); }}>
                              <SelectTrigger className="h-9"><SelectValue placeholder={t.relay.memberGender} /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">{t.profile.male}</SelectItem>
                                <SelectItem value="female">{t.profile.female}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isRelay && isAlreadyRegistered && (
                  <p className="text-xs text-destructive">{t.athletes.alreadyRegistered}</p>
                )}

                {!isRelay && !!user && athletes.length === 0 && !isAlreadyRegistered && (
                  <Link
                    to="/profile"
                    className="block text-xs text-destructive hover:underline"
                  >
                    {t.profile.requiredToRegister}
                  </Link>
                )}

                {(() => {
                  const dist = distances.find((d) => d.id === selectedDistance);
                  const showPromo = !!user && event.is_paid && !!dist && dist.price > 0 && !isAlreadyRegistered && hasPromoCodes;
                  if (!showPromo) return null;
                  return (
                    <>
                      <PromoCodeInput
                        eventId={event.id}
                        distanceId={dist!.id}
                        basePrice={Number(dist!.price)}
                        applied={promo}
                        onApplied={setPromo}
                      />
                      {promo && (
                        <div className="text-sm flex justify-between border-t border-border pt-2">
                          <span className="text-muted-foreground line-through">{dist!.price} ₴</span>
                          <span className="font-bold text-primary">{t.promo.finalPrice}: {promo.final_price} ₴</span>
                        </div>
                      )}
                    </>
                  );
                })()}

                {!!user && !isAlreadyRegistered && selectedDist?.delivery_enabled && (
                  <NovaPoshtaDelivery value={delivery} onChange={setDelivery} />
                )}

                {(() => {
                  const cap = selectedDist?.max_participants ?? null;
                  const cnt = selectedDist ? (distanceCounts[selectedDist.id] ?? 0) : 0;
                  const isFull = cap != null && cnt >= cap;
                  return (
                    <>
                      {isFull && (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 text-sm p-3 text-destructive">
                          {lang === "uk"
                            ? `Реєстрацію на цю дистанцію закрито: досягнуто ліміту ${cap} учасників.`
                            : `Registration for this distance is closed: limit of ${cap} participants reached.`}
                        </div>
                      )}
                      <Button
                        onClick={register}
                        className="w-full"
                        disabled={busy || !selectedDistance || (!isRelay && !!user && !selectedAthlete) || (!isRelay && isAlreadyRegistered) || isFull}
                      >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {!!user && !!event.payment_url && event.is_paid && (selectedDist?.price ?? 0) > 0 ? t.events.payRegistration : t.events.confirmRegister}
                      </Button>
                    </>
                  );
                })()}
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/events/${event.id}/participants`}>
                    <Users className="h-4 w-4" /> {t.events.participants}
                  </Link>
                </Button>
                <AddToCalendarButton
                  className="w-full"
                  event={{
                    uid: event.id,
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    date: event.event_date,
                    time: event.event_time,
                    url: `${siteOrigin}${canonical}`,
                  }}
                />

                <img
                  src={tigerUp}
                  alt="Тигр-бігун Фартлек показує вгору на кнопки реєстрації"
                  className="pointer-events-none absolute left-1/2 top-[calc(100%-1.25rem)] z-10 w-32 origin-top animate-mascot-out sm:w-40"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              )}
            </aside>
          </div>
        </div>

        {user && (
          <AthleteFormDialog
            open={athleteDialogOpen}
            onOpenChange={setAthleteDialogOpen}
            ownerId={user.id}
            onSaved={async (a) => {
              await reloadAthletes(user.id, event.id);
              setSelectedAthlete(a.id);
            }}
          />
        )}

        <div className="mt-8">
          <EventChat eventId={event.id} eventOrganizerId={event.organizer_id} />
        </div>

        {event.regulations_pdf_url && (
          <DocumentDialog
            open={regulationsOpen}
            onOpenChange={setRegulationsOpen}
            url={event.regulations_pdf_url}
            title={lang === "uk" ? "Регламент події" : "Event regulations"}
          />
        )}
        {docDialog && (
          <DocumentDialog
            open={!!docDialog}
            onOpenChange={(o) => !o && setDocDialog(null)}
            url={docDialog.url}
            title={docDialog.title}
          />
        )}
        <PaceCalculatorDialog
          open={calcOpen}
          onOpenChange={setCalcOpen}
          distances={distances.map((d) => ({ distance_km: d.distance_km, name: d.name }))}
        />
      </main>
      <Footer />
    </div>
  );
};

export default EventDetails;

import { useEffect, useState, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Loader2, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

const EventAnalytics = () => {
  const { id } = useParams();
  const { t, lang } = useApp();
  const { user, isOrganizer, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [distances, setDistances] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [athletes, setAthletes] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      setLoading(true);
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      setEvent(ev);
      if (ev && (ev.organizer_id === user.id || isAdmin)) {
        const { data: dists } = await supabase.from("distances").select("*").eq("event_id", id);
        setDistances(dists ?? []);
        const { data: regs } = await supabase.from("registrations").select("*").eq("event_id", id);
        setRegistrations(regs ?? []);
        const userIds = Array.from(new Set((regs ?? []).map((r: any) => r.user_id)));
        const athleteIds = Array.from(new Set((regs ?? []).map((r: any) => r.athlete_id).filter(Boolean)));
        if (userIds.length) {
          const { data: profs } = await supabase.from("profiles")
            .select("id, gender, birth_date, city, club").in("id", userIds);
          setProfiles(Object.fromEntries((profs ?? []).map((p: any) => [p.id, p])));
        }
        if (athleteIds.length) {
          const { data: ath } = await supabase.from("athletes")
            .select("id, gender, birth_date, city, club").in("id", athleteIds);
          setAthletes(Object.fromEntries((ath ?? []).map((a: any) => [a.id, a])));
        }
      }
      setLoading(false);
    })();
  }, [id, user, isAdmin]);

  const enriched = useMemo(() => registrations.map((r: any) => {
    const src = (r.athlete_id && athletes[r.athlete_id]) || profiles[r.user_id] || {};
    return { ...r, _gender: src.gender, _birth: src.birth_date, _city: src.city, _club: src.club };
  }), [registrations, profiles, athletes]);

  const kpi = useMemo(() => {
    const total = enriched.length;
    const paid = enriched.filter((r: any) => r.payment_status === "paid").length;
    const pending = enriched.filter((r: any) => r.payment_status === "pending").length;
    const conv = total ? Math.round((paid / total) * 100) : 0;
    const distMap = Object.fromEntries(distances.map((d: any) => [d.id, Number(d.price ?? 0)]));
    const revenue = enriched.filter((r: any) => r.payment_status === "paid")
      .reduce((s: number, r: any) => s + (distMap[r.distance_id] ?? 0), 0);
    return { total, paid, pending, conv, revenue };
  }, [enriched, distances]);

  const overTime = useMemo(() => {
    const map = new Map<string, number>();
    enriched.forEach((r: any) => {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", { day: "2-digit", month: "2-digit" }),
        count,
      }));
  }, [enriched, lang]);

  const byDistance = useMemo(() => {
    return distances.map((d: any) => {
      const count = enriched.filter((r: any) => r.distance_id === d.id).length;
      const cap = d.max_participants ?? null;
      return {
        name: `${d.distance_km} ${lang === "uk" ? "км" : "km"}${d.name ? ` · ${d.name}` : ""}`,
        count,
        capacity: cap,
        fill: cap ? Math.round((count / cap) * 100) : null,
      };
    }).sort((a, b) => b.count - a.count);
  }, [distances, enriched, lang]);

  const byGender = useMemo(() => {
    const counts: Record<string, number> = {};
    enriched.forEach((r: any) => {
      const g = r._gender || "other";
      counts[g] = (counts[g] ?? 0) + 1;
    });
    const labels: Record<string, string> = {
      male: t.analytics.male, female: t.analytics.female,
      boy: t.analytics.male, girl: t.analytics.female, other: t.analytics.other,
    };
    const merged: Record<string, number> = {};
    Object.entries(counts).forEach(([k, v]) => {
      const label = labels[k] ?? t.analytics.other;
      merged[label] = (merged[label] ?? 0) + v;
    });
    return Object.entries(merged).map(([name, value]) => ({ name, value }));
  }, [enriched, t]);

  const byAge = useMemo(() => {
    const buckets = { age1829: 0, age3039: 0, age4049: 0, age50plus: 0, ageUnknown: 0 };
    const now = new Date();
    enriched.forEach((r: any) => {
      if (!r._birth) { buckets.ageUnknown++; return; }
      const age = now.getFullYear() - new Date(r._birth).getFullYear();
      if (age < 30) buckets.age1829++;
      else if (age < 40) buckets.age3039++;
      else if (age < 50) buckets.age4049++;
      else buckets.age50plus++;
    });
    return [
      { name: t.analytics.age1829, value: buckets.age1829 },
      { name: t.analytics.age3039, value: buckets.age3039 },
      { name: t.analytics.age4049, value: buckets.age4049 },
      { name: t.analytics.age50plus, value: buckets.age50plus },
      { name: t.analytics.ageUnknown, value: buckets.ageUnknown },
    ].filter(x => x.value > 0);
  }, [enriched, t]);

  const topList = (key: "_city" | "_club") => {
    const counts: Record<string, number> = {};
    enriched.forEach((r: any) => {
      const v = (r[key] ?? "").trim();
      if (!v) return;
      counts[v] = (counts[v] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };

  const topCities = useMemo(() => topList("_city"), [enriched]);
  const topClubs = useMemo(() => topList("_club"), [enriched]);

  const receipts = useMemo(() => {
    const confirmed = enriched.filter((r: any) => r.receipt_confirmed_at).length;
    const uploaded = enriched.filter((r: any) => r.receipt_url && !r.receipt_confirmed_at && !r.receipt_revoked_reason).length;
    const revoked = enriched.filter((r: any) => r.receipt_revoked_reason).length;
    const none = enriched.filter((r: any) => !r.receipt_url).length;
    return [
      { name: t.analytics.receiptConfirmed, value: confirmed },
      { name: t.analytics.receiptUploaded, value: uploaded },
      { name: t.analytics.receiptRevoked, value: revoked },
      { name: t.analytics.receiptPending, value: none },
    ].filter(x => x.value > 0);
  }, [enriched, t]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth?role=organizer" replace />;
  if (!isOrganizer && !isAdmin) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!event || (event.organizer_id !== user.id && !isAdmin)) {
    return <Navigate to="/organizer" replace />;
  }

  const empty = enriched.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-6xl py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/organizer">{t.analytics.backToDashboard}</Link>
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{t.analytics.title}</h1>
        </div>
        <p className="text-muted-foreground mb-2">{event.title}</p>
        <p className="text-sm text-muted-foreground mb-8">{t.analytics.subtitle}</p>

        {empty ? (
          <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground">
            {t.analytics.empty}
          </div>
        ) : (
          <div className="grid gap-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <KPI label={t.analytics.kpiTotal} value={kpi.total} />
              <KPI label={t.analytics.kpiPaid} value={kpi.paid} accent />
              <KPI label={t.analytics.kpiPending} value={kpi.pending} />
              <KPI label={t.analytics.kpiConversion} value={`${kpi.conv}%`} />
              <KPI label={t.analytics.kpiRevenue} value={kpi.revenue.toLocaleString(lang === "uk" ? "uk-UA" : "en-US")} />
            </div>

            {/* Registrations over time */}
            <Card title={t.analytics.registrationsOverTime} hint={t.analytics.registrationsOverTimeHint}>
              {overTime.length === 0 ? <Empty t={t.analytics.noData} /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={overTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Distance breakdown */}
            <Card title={t.analytics.distanceBreakdown} hint={t.analytics.distanceBreakdownHint}>
              {byDistance.length === 0 ? <Empty t={t.analytics.noData} /> : (
                <div className="space-y-3">
                  {byDistance.map((d) => (
                    <div key={d.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{d.name}</span>
                        <span className="text-muted-foreground">
                          {d.count} {t.analytics.participants}
                          {d.capacity ? ` / ${d.capacity}` : ""}
                          {d.fill !== null ? ` · ${d.fill}% ${t.analytics.capacityFull}` : ""}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: d.capacity ? `${Math.min(100, d.fill ?? 0)}%` : `${Math.min(100, (d.count / Math.max(1, byDistance[0].count)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Demographics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card title={t.analytics.gender}>
                {byGender.length === 0 ? <Empty t={t.analytics.noData} /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={byGender} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {byGender.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title={t.analytics.ageGroups}>
                {byAge.length === 0 ? <Empty t={t.analytics.noData} /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byAge}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title={t.analytics.topCities}>
                <TopList items={topCities} emptyText={t.analytics.noData} />
              </Card>

              <Card title={t.analytics.topClubs}>
                <TopList items={topClubs} emptyText={t.analytics.noData} />
              </Card>
            </div>

            {/* Receipts */}
            <Card title={t.analytics.receiptsStatus}>
              {receipts.length === 0 ? <Empty t={t.analytics.noData} /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={receipts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {receipts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const KPI = ({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) => (
  <div className={`bg-card rounded-2xl p-4 shadow-card ${accent ? "ring-1 ring-primary/30" : ""}`}>
    <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className={`text-2xl font-display font-bold mt-1 ${accent ? "text-primary" : ""}`}>{value}</div>
  </div>
);

const Card = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl p-5 shadow-card">
    <h3 className="font-display text-lg font-bold">{title}</h3>
    {hint && <p className="text-xs text-muted-foreground mt-0.5 mb-4">{hint}</p>}
    {!hint && <div className="mt-3" />}
    {children}
  </div>
);

const Empty = ({ t }: { t: string }) => (
  <div className="text-sm text-muted-foreground text-center py-8">{t}</div>
);

const TopList = ({ items, emptyText }: { items: { name: string; value: number }[]; emptyText: string }) => {
  if (items.length === 0) return <Empty t={emptyText} />;
  const max = items[0]?.value ?? 1;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="truncate pr-2">{it.name}</span>
            <span className="text-muted-foreground tabular-nums">{it.value}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventAnalytics;

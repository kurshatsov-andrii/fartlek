import { useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, Trophy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Props {
  eventId: string;
  userId: string;
}

interface Distance {
  id: string;
  name: string | null;
  distance_km: number;
  is_virtual: boolean;
  virtual_start_date: string | null;
  virtual_end_date: string | null;
}

interface Registration {
  id: string;
  distance_id: string;
}

interface ResultRow {
  registration_id: string;
  time_seconds: number;
  distance_meters: number | null;
  source: string;
  verified: boolean;
  strava_activity_id: number | null;
  activity_start_date: string | null;
}

const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

export const VirtualResultPanel = ({ eventId, userId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [distances, setDistances] = useState<Distance[]>([]);
  const [reg, setReg] = useState<Registration | null>(null);
  const [result, setResult] = useState<ResultRow | null>(null);
  const [hasStrava, setHasStrava] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: ds }, { data: r }, { data: sc }] = await Promise.all([
      supabase
        .from("distances")
        .select("id, name, distance_km, is_virtual, virtual_start_date, virtual_end_date")
        .eq("event_id", eventId),
      supabase
        .from("registrations")
        .select("id, distance_id")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("strava_connections").select("user_id").eq("user_id", userId).maybeSingle(),
    ]);
    setDistances((ds as any) ?? []);
    setReg((r as any) ?? null);
    setHasStrava(!!sc);

    if (r?.id) {
      const { data: res } = await supabase
        .from("event_results")
        .select("registration_id, time_seconds, distance_meters, source, verified, strava_activity_id, activity_start_date")
        .eq("registration_id", r.id)
        .maybeSingle();
      setResult((res as any) ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, userId]);

  const myDistance = reg ? distances.find((d) => d.id === reg.distance_id) : null;
  if (loading) return null;
  if (!reg || !myDistance?.is_virtual) return null;

  const sync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("strava-sync-activities", {
        body: { event_id: eventId },
      });
      if (error) throw error;
      const m = (data as any)?.matched ?? 0;
      if (m > 0) {
        toast.success(`Знайдено та зараховано: ${m}`);
        await load();
      } else {
        toast.info("Підходящої активності у Strava не знайдено");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Помилка синхронізації");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="mt-6 bg-card p-6 rounded-2xl shadow-card border border-[#FC4C02]/20">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FC4C02] text-white shrink-0">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h3 className="font-display text-lg font-bold">Віртуальна гонка</h3>
          <p className="text-xs text-muted-foreground">
            {myDistance.name ?? `${myDistance.distance_km} км`} ·{" "}
            {myDistance.virtual_start_date && myDistance.virtual_end_date
              ? `${myDistance.virtual_start_date} → ${myDistance.virtual_end_date}`
              : "вікно за датою події"}
          </p>

          {result ? (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Результат зараховано
              </div>
              <div className="mt-2 text-2xl font-bold font-display">{fmtTime(result.time_seconds)}</div>
              <div className="text-xs text-muted-foreground">
                {result.distance_meters ? `${(result.distance_meters / 1000).toFixed(2)} км` : "—"}
                {result.source === "strava" && " · Strava"}
                {result.activity_start_date && ` · ${new Date(result.activity_start_date).toLocaleDateString()}`}
              </div>
              {result.strava_activity_id && (
                <a
                  className="text-xs text-[#FC4C02] underline mt-2 inline-block"
                  href={`https://www.strava.com/activities/${result.strava_activity_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Переглянути на Strava
                </a>
              )}
            </div>
          ) : hasStrava ? (
            <div className="mt-4">
              <Button onClick={sync} disabled={syncing} className="bg-[#FC4C02] text-white hover:bg-[#e64502]">
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Синхронізувати зі Strava
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Підбираємо активність у вікні дат із дистанцією, що відповідає {myDistance.distance_km} км.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <Button asChild size="sm" className="bg-[#FC4C02] text-white hover:bg-[#e64502] w-full sm:w-auto">
                <Link to="/profile">
                  <Link2 className="h-4 w-4" />
                  Підключити Strava
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Підключіть акаунт у профілі, щоб синхронізувати результат.
              </p>
            </div>
          )}
        </div>

        {result && hasStrava && (
          <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Оновити
          </Button>
        )}
      </div>
    </section>
  );
};

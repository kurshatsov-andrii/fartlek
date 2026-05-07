import { useEffect, useState } from "react";
import { Loader2, Link2, Unlink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StravaConnectProps {
  userId: string;
}

interface Connection {
  strava_athlete_id: number;
  athlete_firstname: string | null;
  athlete_lastname: string | null;
  athlete_profile: string | null;
}

const STRAVA_CLIENT_ID = "237118";

export const StravaConnect = ({ userId }: StravaConnectProps) => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [conn, setConn] = useState<Connection | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("strava_connections")
      .select("strava_athlete_id, athlete_firstname, athlete_lastname, athlete_profile")
      .eq("user_id", userId)
      .maybeSingle();
    setConn((data as Connection | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const connect = () => {
    const redirectUri = `${window.location.origin}/strava/callback`;
    const scope = "read,activity:read";
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&approval_prompt=auto&scope=${scope}`;
    window.location.href = url;
  };

  const disconnect = async () => {
    if (!confirm("Відключити Strava?")) return;
    setBusy(true);
    const { error } = await supabase.from("strava_connections").delete().eq("user_id", userId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setConn(null);
    toast.success("Strava відключено");
  };

  return (
    <section className="mt-10 bg-card p-6 rounded-2xl shadow-card">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FC4C02] text-white shrink-0">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="font-display text-xl font-bold">Strava</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Підключіть свій акаунт Strava, щоб автоматично підтверджувати результати віртуальних забігів та ділитися активностями.
          </p>

          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Завантаження…
            </div>
          ) : conn ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                {conn.athlete_profile ? (
                  <img src={conn.athlete_profile} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                <div className="text-sm">
                  <div className="font-semibold">
                    {conn.athlete_firstname} {conn.athlete_lastname}
                  </div>
                  <div className="text-xs text-muted-foreground">Strava ID: {conn.strava_athlete_id}</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={disconnect} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                Відключити Strava
              </Button>
            </div>
          ) : (
            <Button
              onClick={connect}
              className="mt-4 bg-[#FC4C02] text-white hover:bg-[#e64502]"
            >
              <Link2 className="h-4 w-4" />
              Підключити Strava
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Loader2, Shield, ArrowLeft, Activity, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  login_at: string;
  last_seen_at: string;
  logout_at: string | null;
  duration_seconds: number | null;
  user_agent: string | null;
  ip_address: string | null;
}

const formatDuration = (sec: number | null) => {
  if (sec === null || sec === undefined || sec < 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}г ${m}хв`;
  if (m > 0) return `${m}хв ${s}с`;
  return `${s}с`;
};

const computeDuration = (s: SessionRow): number => {
  if (s.duration_seconds && s.duration_seconds > 0) return s.duration_seconds;
  const end = s.logout_at ? new Date(s.logout_at).getTime() : new Date(s.last_seen_at).getTime();
  const start = new Date(s.login_at).getTime();
  return Math.max(0, Math.round((end - start) / 1000));
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "medium" });

const isOnline = (s: SessionRow) => {
  if (s.logout_at) return false;
  const lastSeen = new Date(s.last_seen_at).getTime();
  return Date.now() - lastSeen < 90 * 1000; // active in last 90s
};

export default function AdminSessions() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_user_sessions_admin", { _limit: 500 });
    if (error) {
      toast.error("Не вдалося завантажити сесії");
    } else {
      setRows((data as SessionRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.full_name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q)
    );
  });

  const onlineCount = rows.filter(isOnline).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" />Адмін</Link>
            </Button>
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-bold">Сесії користувачів</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3 text-green-500" /> Онлайн: {onlineCount}
            </Badge>
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Оновити
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <Input
              placeholder="Пошук за іменем, email або телефоном…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Записів не знайдено</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Користувач</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Телефон</th>
                    <th className="p-3">Вхід</th>
                    <th className="p-3">Активність</th>
                    <th className="p-3">Тривалість</th>
                    <th className="p-3">Статус</th>
                    <th className="p-3">Пристрій</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const online = isOnline(r);
                    return (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 font-medium">{r.full_name || "—"}</td>
                        <td className="p-3 text-muted-foreground">{r.email || "—"}</td>
                        <td className="p-3 text-muted-foreground">{r.phone || "—"}</td>
                        <td className="p-3 whitespace-nowrap">{formatDate(r.login_at)}</td>
                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                          {formatDate(r.last_seen_at)}
                        </td>
                        <td className="p-3 whitespace-nowrap">{formatDuration(computeDuration(r))}</td>
                        <td className="p-3">
                          {online ? (
                            <Badge className="bg-green-500/15 text-green-500 border-green-500/30">Онлайн</Badge>
                          ) : r.logout_at ? (
                            <Badge variant="outline">Вийшов</Badge>
                          ) : (
                            <Badge variant="secondary">Офлайн</Badge>
                          )}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate" title={r.user_agent || ""}>
                          {r.user_agent || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, UserX, MailX, TrendingDown } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  email: string;
  reason: string;
  unsubscribed_at: string | null;
  full_name: string | null;
  city: string | null;
  has_profile: boolean;
  marketing_consent: boolean;
}

interface Summary {
  total_subscribed: number;
  total_unsubscribed: number;
  total_suppressed: number;
  unsubscribed_last_7d: number;
  unsubscribed_last_30d: number;
}

const reasonLabels: Record<string, string> = {
  unsubscribe: "Відписка через лист",
  bounce: "Лист не доставлено",
  complaint: "Скарга на спам",
  profile_opt_out: "Зняв галочку у профілі",
};

const AdminUnsubscribes = () => {
  const { user, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: list }, { data: sum }] = await Promise.all([
        supabase.rpc("get_unsubscribe_stats" as any),
        supabase.rpc("get_unsubscribe_summary" as any),
      ]);
      setRows((list ?? []) as Row[]);
      setSummary((Array.isArray(sum) ? sum[0] : sum) as Summary | null);
      setPageLoading(false);
    })();
  }, [isAdmin]);

  if (loading || pageLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!user) return <Navigate to="/auth?redirect=/admin/unsubscribes" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          (r.full_name ?? "").toLowerCase().includes(q) ||
          (r.city ?? "").toLowerCase().includes(q),
      )
    : rows;

  const stats = [
    {
      label: "Активних підписників",
      value: summary?.total_subscribed ?? 0,
      icon: TrendingDown,
      tone: "text-primary",
    },
    {
      label: "Усього відписалось",
      value: rows.length,
      icon: UserX,
      tone: "text-destructive",
    },
    {
      label: "За останні 7 днів",
      value: summary?.unsubscribed_last_7d ?? 0,
      icon: MailX,
      tone: "text-orange-500",
    },
    {
      label: "За останні 30 днів",
      value: summary?.unsubscribed_last_30d ?? 0,
      icon: MailX,
      tone: "text-muted-foreground",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-10 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <UserX className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">Відписки від розсилки</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Усі користувачі, які відписалися від маркетингової розсилки — через лист, скаргу на
          спам або вимкнули галочку у профілі.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-card p-4 rounded-2xl shadow-card">
              <s.icon className={`h-5 w-5 mb-2 ${s.tone}`} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <Input
            placeholder="Пошук за email, ім'ям або містом..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm p-6 text-center">
              {rows.length === 0 ? "Поки немає відписок." : "Нічого не знайдено."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Ім'я</TableHead>
                  <TableHead>Місто</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={`${r.email}-${i}`}>
                    <TableCell className="font-mono text-xs">{r.email}</TableCell>
                    <TableCell>
                      {r.full_name ?? <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {r.city ?? <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.reason === "complaint" ? "destructive" : "secondary"}>
                        {reasonLabels[r.reason] ?? r.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.unsubscribed_at
                        ? new Date(r.unsubscribed_at).toLocaleString("uk-UA")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Показано {filtered.length} із {rows.length} записів.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUnsubscribes;

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Send, Mail, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventLite {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  status: string;
}

interface Campaign {
  id: string;
  subject: string;
  intro_text: string | null;
  event_ids: string[];
  status: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
}

const AdminCampaigns = () => {
  const { user, isAdmin, loading } = useAuth();
  const [events, setEvents] = useState<EventLite[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [subject, setSubject] = useState("Нові події на Фартлек");
  const [intro, setIntro] = useState(
    "Ділимось добіркою найближчих подій на платформі. Обирай свою та реєструйся!"
  );
  const [cityFilter, setCityFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [testEmail, setTestEmail] = useState("");
  const [batchSize, setBatchSize] = useState(50);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: ev }, { data: c }] = await Promise.all([
        supabase
          .from("events")
          .select("id, title, event_date, location, status")
          .eq("status", "published")
          .gte("event_date", new Date().toISOString().slice(0, 10))
          .order("event_date"),
        supabase
          .from("marketing_campaigns" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setEvents((ev ?? []) as EventLite[]);
      setCampaigns((c ?? []) as unknown as Campaign[]);
      setPageLoading(false);
    })();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      let q = supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("marketing_consent", true)
        .not("email", "is", null);
      if (cityFilter.trim()) q = q.ilike("city", cityFilter.trim());
      const { count } = await q;
      setRecipientCount(count ?? 0);
    })();
  }, [isAdmin, cityFilter]);

  if (loading || pageLoading)
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth?redirect=/admin/campaigns" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const createAndSend = async (mode: "test" | "real") => {
    if (mode === "real" && selectedIds.size === 0) {
      toast.error("Оберіть хоча б одну подію");
      return;
    }
    if (mode === "test" && !testEmail.trim()) {
      toast.error("Вкажіть email для тесту");
      return;
    }
    if (!subject.trim()) {
      toast.error("Тема обов'язкова");
      return;
    }
    if (mode === "real" && !confirm(`Надіслати розсилку ${recipientCount ?? "?"} користувачам батчами по ${batchSize}?`)) {
      return;
    }

    setBusy(true);
    setProgress(null);
    try {
      // Create campaign
      const { data: campaign, error: cErr } = await supabase
        .from("marketing_campaigns" as any)
        .insert({
          subject: subject.trim(),
          intro_text: intro.trim(),
          event_ids: Array.from(selectedIds),
          audience_filter: cityFilter.trim() ? { city: cityFilter.trim() } : {},
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (cErr || !campaign) throw new Error(cErr?.message ?? "Не вдалося створити");
      const campaignId = (campaign as any).id;

      if (mode === "test") {
        const { data, error } = await supabase.functions.invoke("send-marketing-campaign", {
          body: { campaign_id: campaignId, test_email: testEmail.trim() },
        });
        if (error) throw new Error(error.message);
        const r = data as any;
        toast.success(`Тест надіслано: ${r.sent}/${r.total}`);
      } else {
        // Loop batches
        let offset = 0;
        let totalSent = 0;
        let totalFailed = 0;
        let total = recipientCount ?? 0;
        let batchNum = 0;

        while (true) {
          batchNum++;
          const { data, error } = await supabase.functions.invoke("send-marketing-campaign", {
            body: { campaign_id: campaignId, batch_size: batchSize, batch_offset: offset },
          });
          if (error) throw new Error(error.message);
          const r = data as any;
          totalSent += r.sent;
          totalFailed += r.failed;
          total = r.total_recipients ?? total;
          setProgress({ sent: totalSent, failed: totalFailed, total });
          toast.message(`Батч ${batchNum}: відправлено ${r.sent}, помилок ${r.failed}`);

          if (r.done || !r.next_offset) break;
          offset = r.next_offset;
          // Pause between batches to avoid Resend rate limits
          await new Promise((res) => setTimeout(res, 5000));
        }

        toast.success(`Готово: ${totalSent}/${total}, помилок ${totalFailed}`);
        const { data: c } = await supabase
          .from("marketing_campaigns" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);
        setCampaigns((c ?? []) as unknown as Campaign[]);
        setSelectedIds(new Set());
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Помилка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">Маркетингові розсилки</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Надсилайте підбірки подій усім користувачам, які підписані на розсилки. Лист іде з{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">news@fartlek.com.ua</code>.
        </p>

        <section className="bg-card p-6 rounded-2xl shadow-card space-y-5">
          <h2 className="font-display text-xl font-bold">Нова розсилка</h2>

          <div className="space-y-2">
            <Label>Тема листа</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} />
          </div>

          <div className="space-y-2">
            <Label>Вступний текст</Label>
            <Textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Короткий привітальний текст перед списком подій"
            />
          </div>

          <div className="space-y-2">
            <Label>Опубліковані майбутні події ({events.length})</Label>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">Немає опублікованих майбутніх подій.</p>
            ) : (
              <div className="grid gap-2 max-h-96 overflow-y-auto border border-border rounded-lg p-2">
                {events.map((e) => {
                  const checked = selectedIds.has(e.id);
                  return (
                    <label
                      key={e.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(e.id)}
                        className="mt-1 h-4 w-4 accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{e.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.event_date).toLocaleDateString("uk-UA", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          {e.location ? ` · ${e.location}` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Фільтр за містом (необов'язково)</Label>
              <Input
                placeholder="напр. Київ"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Аудиторія</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-muted/50 border border-border">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {recipientCount === null ? "..." : `${recipientCount} підписників`}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-5 space-y-4">
            <div>
              <Label>Тестова відправка</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Спочатку надішліть тестовий лист собі, щоб перевірити вигляд.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={busy || selectedIds.size === 0}
                  onClick={() => createAndSend("test")}
                >
                  Тест
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Розмір батчу (листів за раз)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(1, Math.min(200, Number(e.target.value) || 50)))}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Між батчами пауза 5 сек. Рекомендовано 50, щоб не перевищити ліміт Resend (~2 листи/сек).
                </p>
              </div>
            </div>

            {progress && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                Прогрес: <strong>{progress.sent}</strong> / {progress.total}
                {progress.failed > 0 && <span className="text-destructive"> · помилок: {progress.failed}</span>}
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              disabled={busy || selectedIds.size === 0 || !recipientCount}
              onClick={() => createAndSend("real")}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Надіслати {recipientCount ?? 0} підписникам (батчами по {batchSize})
            </Button>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold mb-4">Історія розсилок</h2>
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm">Розсилок ще не було.</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => (
                <div key={c.id} className="bg-card p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{c.subject}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(c.created_at).toLocaleString("uk-UA")} ·{" "}
                      {c.event_ids.length} подій
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm shrink-0">
                    {c.status === "sent" && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {c.sent_count}/{c.recipient_count}
                      </Badge>
                    )}
                    {c.status === "failed" && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" /> Помилка
                      </Badge>
                    )}
                    {c.status === "draft" && <Badge variant="secondary">Чернетка</Badge>}
                    {c.status === "sending" && <Badge variant="secondary">Відправка...</Badge>}
                    {c.failed_count > 0 && (
                      <span className="text-xs text-destructive">помилок: {c.failed_count}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCampaigns;

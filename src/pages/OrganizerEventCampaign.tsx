import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Loader2, Send, Mail, ArrowLeft, Eye } from "lucide-react";
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

const OrganizerEventCampaign = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isOrganizer, isAdmin, loading } = useAuth();
  const [event, setEvent] = useState<{ id: string; title: string; organizer_id: string } | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [intro, setIntro] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [batchSize, setBatchSize] = useState(50);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("id, title, organizer_id")
        .eq("id", id)
        .maybeSingle();
      setEvent(ev as any);
      if (ev) {
        setSubject(`Оновлення по події: ${ev.title}`);
        setIntro("Невелике оновлення для тих, хто зареєструвався на нашу подію.");

        // Count recipients (registered users with marketing_consent)
        const { data: regs } = await supabase
          .from("registrations")
          .select("user_id")
          .eq("event_id", ev.id);
        const userIds = Array.from(new Set((regs ?? []).map((r) => r.user_id)));
        if (userIds.length === 0) {
          setRecipientCount(0);
        } else {
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .in("id", userIds)
            .eq("marketing_consent", true)
            .not("email", "is", null);
          setRecipientCount(count ?? 0);
        }

        const { data: h } = await supabase
          .from("marketing_campaigns" as any)
          .select("*")
          .contains("audience_filter", { event_id: ev.id })
          .order("created_at", { ascending: false })
          .limit(20);
        setHistory((h ?? []) as any[]);
      }
      setPageLoading(false);
    })();
  }, [id, user]);

  if (loading || pageLoading)
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return <Navigate to={`/auth?redirect=/organizer/events/${id}/campaign`} replace />;
  if (!isOrganizer && !isAdmin) return <Navigate to="/" replace />;
  if (!event) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">404</div>;
  if (event.organizer_id !== user.id && !isAdmin) return <Navigate to="/organizer" replace />;

  const send = async (mode: "test" | "real") => {
    if (mode === "test" && !testEmail.trim()) { toast.error("Вкажіть email для тесту"); return; }
    if (!subject.trim()) { toast.error("Тема обов'язкова"); return; }
    if (!intro.trim()) { toast.error("Текст листа обов'язковий"); return; }
    if (mode === "real" && !confirm(`Надіслати лист ${recipientCount ?? 0} учасникам цієї події?`)) return;

    setBusy(true);
    setProgress(null);
    try {
      const { data: campaign, error: cErr } = await supabase
        .from("marketing_campaigns" as any)
        .insert({
          subject: subject.trim(),
          intro_text: intro.trim(),
          event_ids: [],
          audience_filter: { event_id: event.id },
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
          toast.message(`Батч ${batchNum}: ${r.sent} відправлено, ${r.failed} помилок`);
          if (r.done || !r.next_offset) break;
          offset = r.next_offset;
          await new Promise((res) => setTimeout(res, 5000));
        }
        toast.success(`Готово: ${totalSent}/${total}, помилок ${totalFailed}`);

        const { data: h } = await supabase
          .from("marketing_campaigns" as any)
          .select("*")
          .contains("audience_filter", { event_id: event.id })
          .order("created_at", { ascending: false })
          .limit(20);
        setHistory((h ?? []) as any[]);
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
      <main className="flex-1 container py-10 max-w-3xl">
        <Link to="/organizer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> До дашборду
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">Лист учасникам</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Подія: <strong>{event.title}</strong>. Лист отримають усі зареєстровані учасники, які підписані на розсилки.
        </p>

        <section className="bg-card p-6 rounded-2xl shadow-card space-y-5">
          <div className="space-y-2">
            <Label>Тема</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} />
          </div>

          <div className="space-y-2">
            <Label>Текст листа</Label>
            <Textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={8}
              maxLength={2000}
              placeholder="Час старту, локація, стартовий пакет, погода, важливі деталі..."
            />
            <p className="text-xs text-muted-foreground">До 2000 символів. Переноси рядків зберігаються.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Аудиторія</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-muted/50 border border-border">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{recipientCount === null ? "..." : `${recipientCount} учасників`}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Розмір батчу</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, Math.min(200, Number(e.target.value) || 50)))}
              />
            </div>
          </div>

          <div className="border-t border-border pt-5 space-y-4">
            <div>
              <Label>Тестова відправка</Label>
              <p className="text-xs text-muted-foreground mb-2">Перевір вигляд, надіславши лист собі.</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button variant="outline" disabled={busy} onClick={() => send("test")}>Тест</Button>
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
              disabled={busy || !recipientCount}
              onClick={() => send("real")}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Надіслати {recipientCount ?? 0} учасникам
            </Button>
          </div>
        </section>

        {history.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold mb-4">Історія листів по цій події</h2>
            <div className="space-y-2">
              {history.map((c) => (
                <div key={c.id} className="bg-card p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{c.subject}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(c.created_at).toLocaleString("uk-UA")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm shrink-0">
                    {c.status === "sent" && <Badge>{c.sent_count}/{c.recipient_count}</Badge>}
                    {c.status === "sending" && <Badge variant="secondary">Відправка...</Badge>}
                    {c.status === "draft" && <Badge variant="secondary">Чернетка</Badge>}
                    {c.status === "failed" && <Badge variant="destructive">Помилка</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrganizerEventCampaign;

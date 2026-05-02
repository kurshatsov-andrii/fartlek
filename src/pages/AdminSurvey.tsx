import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Loader2, Shield, Trash2, ArrowLeft, MessageSquareHeart } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FEATURE_LABELS: Record<string, string> = {
  mobile_app: "📱 Мобільний застосунок",
  race_history: "📊 Історія стартів",
  race_photos: "📸 Фото з забігів",
  virtual_races: "🏆 Віртуальні забіги",
  results_tracking: "⏱️ Трекінг результатів",
  ratings: "🥇 Рейтинги",
  training_plans: "📅 Тренувальні плани",
  race_series: "🏅 Серії змагань",
  strava: "🔗 Strava",
  gpx_route: "🗺️ GPX маршрут",
  team_registration: "👥 Командні реєстрації",
  communities: "Спільноти",
  push: "Push-сповіщення",
  other: "Інше",
};

const FACTOR_LABELS: Record<string, string> = {
  price: "💰 Ціна",
  location: "📍 Локація",
  route: "🛣️ Траса",
  atmosphere: "🎉 Атмосфера",
  medal_merch: "🏅 Медаль/мерч",
  results_chip: "⏱️ Хронометраж",
  organization: "✅ Організація",
};

const DISCOVERY_LABELS: Record<string, string> = {
  google: "Google",
  instagram: "Instagram",
  facebook: "Facebook",
  friends: "Друзі",
  club: "Клуб",
  organizer: "Організатор",
  other: "Інше",
};

const FREQUENCY_LABELS: Record<string, string> = {
  first_time: "Вперше",
  "1_2_year": "1–2 на рік",
  "3_5_year": "3–5 на рік",
  monthly: "Щомісяця+",
};

const ROLE_LABELS: Record<string, string> = {
  guest: "Гість",
  participant: "Учасник",
  organizer: "Організатор",
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="text-sm">
    <span className="text-muted-foreground">{label}: </span>
    <span className="font-medium">{children}</span>
  </div>
);

const AdminSurvey = () => {
  const { isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  const fetchData = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("survey_responses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Не вдалося завантажити відповіді");
    setRows(data ?? []);
    setBusy(false);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("survey_responses").delete().eq("id", id);
    if (error) return toast.error("Помилка видалення");
    toast.success("Видалено");
    setRows((r) => r.filter((x) => x.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const stats = {
    total: rows.length,
    avgEase: avg(rows.map((r) => r.ease_of_use).filter(Boolean)),
    avgNps: avg(rows.map((r) => r.nps_score).filter((n) => n !== null && n !== undefined)),
    avgDesign: avg(rows.map((r) => r.design_rating).filter(Boolean)),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <MessageSquareHeart className="h-7 w-7" />
              Опитування ({rows.length})
            </h1>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-2" />До адмінки</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Усього" value={stats.total} />
          <StatCard label="Зручність (ср., /10)" value={stats.avgEase} />
          <StatCard label="NPS (ср., /10)" value={stats.avgNps} />
          <StatCard label="Дизайн (ср., /5)" value={stats.avgDesign} />
        </div>

        {busy ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Поки немає відповідей</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{ROLE_LABELS[r.user_role] ?? r.user_role ?? "—"}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("uk-UA")}
                      </span>
                      {r.contact_email && (
                        <a href={`mailto:${r.contact_email}`} className="text-xs text-primary hover:underline">
                          {r.contact_email}
                        </a>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Видалити відповідь?</AlertDialogTitle>
                          <AlertDialogDescription>Дію не можна скасувати.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(r.id)}>Видалити</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {r.ease_of_use != null && <Field label="Зручність">{r.ease_of_use}/10</Field>}
                    {r.nps_score != null && <Field label="NPS">{r.nps_score}/10</Field>}
                    {r.design_rating != null && <Field label="Дизайн">{r.design_rating}/5</Field>}
                    {r.easy_to_find_event && <Field label="Знайти подію">{r.easy_to_find_event}</Field>}
                    {r.registration_clarity != null && <Field label="Зрозумілість реєстрації">{r.registration_clarity}/5</Field>}
                    {r.organizer_event_creation != null && <Field label="Створення події">{r.organizer_event_creation}/5</Field>}
                    {r.organizer_payments_clear && <Field label="Оплати зрозумілі">{r.organizer_payments_clear}</Field>}
                  </div>

                  {r.registration_difficulty && (
                    <TextBlock label="Найскладніше при реєстрації">{r.registration_difficulty}</TextBlock>
                  )}

                  {r.missing_features?.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Бракує функцій:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.missing_features.map((f: string) => (
                          <Badge key={f} variant="outline">{FEATURE_LABELS[f] ?? f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.event_choice_factors?.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Важливо при виборі події:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.event_choice_factors.map((f: string) => (
                          <Badge key={f} variant="secondary">{FACTOR_LABELS[f] ?? f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(r.discovery_source || r.participation_frequency) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {r.discovery_source && (
                        <Field label="Дізнався з">{DISCOVERY_LABELS[r.discovery_source] ?? r.discovery_source}</Field>
                      )}
                      {r.participation_frequency && (
                        <Field label="Частота участі">{FREQUENCY_LABELS[r.participation_frequency] ?? r.participation_frequency}</Field>
                      )}
                    </div>
                  )}

                  {r.organizer_missing_tools && <TextBlock label="Інструменти для організаторів">{r.organizer_missing_tools}</TextBlock>}
                  {r.liked_most && <TextBlock label="Подобається найбільше">{r.liked_most}</TextBlock>}
                  {r.would_change && <TextBlock label="Що змінити">{r.would_change}</TextBlock>}
                  {r.suggestions && <TextBlock label="Пропозиції">{r.suggestions}</TextBlock>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <Card>
    <CardContent className="py-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const TextBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-sm text-muted-foreground mb-1">{label}:</div>
    <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3">{children}</div>
  </div>
);

const avg = (arr: number[]) => {
  if (!arr.length) return "—" as any;
  const a = arr.reduce((s, n) => s + Number(n), 0) / arr.length;
  return a.toFixed(1);
};

export default AdminSurvey;

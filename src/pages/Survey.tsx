import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, MessageSquareHeart } from "lucide-react";

const MISSING_FEATURES = [
  { v: "mobile_app", l: "📱 Мобільний застосунок (iOS/Android)" },
  { v: "race_history", l: "📊 Історія стартів та особисті рекорди" },
  { v: "race_photos", l: "📸 Фото з забігів (пошук за номером)" },
  { v: "virtual_races", l: "🏆 Віртуальні забіги / челенджі" },
  { v: "results_tracking", l: "⏱️ Трекінг результатів у реальному часі" },
  { v: "ratings", l: "🥇 Рейтинги учасників" },
  { v: "training_plans", l: "📅 Тренувальні плани" },
  { v: "race_series", l: "🏅 Серії змагань / кубки" },
  { v: "strava", l: "🔗 Інтеграція зі Strava" },
  { v: "gpx_route", l: "🗺️ Карта маршруту з GPX" },
  { v: "team_registration", l: "👥 Командні реєстрації / естафети" },
  { v: "other", l: "✏️ Інше" },
];

const DISCOVERY_SOURCES = [
  { v: "google", l: "Google" },
  { v: "instagram", l: "Instagram" },
  { v: "facebook", l: "Facebook" },
  { v: "telegram", l: "Telegram" },
  { v: "friends", l: "Друзі / знайомі" },
  { v: "club", l: "Біговий клуб" },
  { v: "organizer", l: "Організатор події" },
  { v: "other", l: "Інше" },
];

const PARTICIPATION_FREQUENCY = [
  { v: "first_time", l: "Вперше" },
  { v: "1_2_year", l: "1–2 рази на рік" },
  { v: "3_5_year", l: "3–5 разів на рік" },
  { v: "monthly", l: "Щомісяця або частіше" },
];

const EVENT_CHOICE_FACTORS = [
  { v: "price", l: "💰 Ціна" },
  { v: "location", l: "📍 Локація" },
  { v: "route", l: "🛣️ Траса / дистанція" },
  { v: "atmosphere", l: "🎉 Атмосфера" },
  { v: "medal_merch", l: "🏅 Медаль / мерч" },
  { v: "results_chip", l: "⏱️ Результати / електронний хронометраж" },
  { v: "organization", l: "✅ Якість організації" },
];

const Scale = ({
  value,
  onChange,
  max,
  minLabel,
  maxLabel,
}: { value: number | null; onChange: (n: number) => void; max: number; minLabel?: string; maxLabel?: string }) => (
  <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-10 w-10 rounded-md border text-sm font-medium transition-colors ${
            value === n
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-accent hover:text-accent-foreground border-input"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
    {(minLabel || maxLabel) && (
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    )}
  </div>
);

const Survey = () => {
  const { user, roles } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const [easeOfUse, setEaseOfUse] = useState<number | null>(null);
  const [designRating, setDesignRating] = useState<number | null>(null);
  const [nps, setNps] = useState<number | null>(null);
  const [easyFind, setEasyFind] = useState<string>("");
  const [regClarity, setRegClarity] = useState<number | null>(null);
  const [regDifficulty, setRegDifficulty] = useState<string>("");
  const [missing, setMissing] = useState<string[]>([]);
  const [orgEventCreation, setOrgEventCreation] = useState<number | null>(null);
  const [orgPaymentsClear, setOrgPaymentsClear] = useState<string>("");
  const [orgMissingTools, setOrgMissingTools] = useState("");
  const [likedMost, setLikedMost] = useState("");
  const [wouldChange, setWouldChange] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [discoverySource, setDiscoverySource] = useState<string>("");
  const [participationFrequency, setParticipationFrequency] = useState<string>("");
  const [eventChoiceFactors, setEventChoiceFactors] = useState<string[]>([]);

  const isOrganizer = roles.includes("organizer") || roles.includes("admin");
  const userRole = !user ? "guest" : isOrganizer ? "organizer" : "participant";

  const toggleMissing = (v: string) => {
    setMissing((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const toggleFactor = (v: string) => {
    setEventChoiceFactors((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.from("survey_responses").insert({
        user_id: user?.id ?? null,
        user_role: userRole,
        ease_of_use: easeOfUse,
        design_rating: designRating,
        nps_score: nps,
        easy_to_find_event: easyFind || null,
        registration_clarity: regClarity,
        registration_difficulty: regDifficulty || null,
        missing_features: missing,
        discovery_source: discoverySource || null,
        participation_frequency: participationFrequency || null,
        event_choice_factors: eventChoiceFactors,
        organizer_event_creation: isOrganizer ? orgEventCreation : null,
        organizer_payments_clear: isOrganizer ? orgPaymentsClear || null : null,
        organizer_missing_tools: isOrganizer ? orgMissingTools.trim() || null : null,
        liked_most: likedMost.trim() || null,
        would_change: wouldChange.trim() || null,
        suggestions: suggestions.trim() || null,
        contact_email: contactEmail.trim() || null,
        user_agent: navigator.userAgent.slice(0, 500),
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Дякуємо! Ваша відповідь збережена.");
    } catch (err: any) {
      console.error(err);
      toast.error("Не вдалося надіслати. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Опитування — Fartlek Events"
        description="Допоможіть зробити платформу зручнішою — пройдіть коротке опитування."
        canonical="/survey"
      />
      <Header />
      <main className="flex-1 py-10 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-4">
              <MessageSquareHeart className="h-3.5 w-3.5" />
              Опитування
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Зробімо платформу кращою — разом
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Наша мета — створити зручну, функціональну і корисну платформу для учасників та організаторів.
              Ваші відповіді анонімні (за бажанням можна залишити email) і допомагають нам розвиватися.
            </p>
          </div>

          {submitted ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Дякуємо за відповідь!</h2>
                <p className="text-muted-foreground">Ми прочитаємо кожен коментар і врахуємо при розвитку платформи.</p>
                <Button asChild variant="outline">
                  <a href="/">Повернутися на головну</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={onSubmit} className="space-y-8">
              <Card>
                <CardContent className="pt-6 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-base">1. Наскільки зручно користуватися платформою?</Label>
                    <Scale value={easeOfUse} onChange={setEaseOfUse} max={10} minLabel="Незручно" maxLabel="Дуже зручно" />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">2. Чи рекомендували б ви Fartlek друзям?</Label>
                    <Scale value={nps} onChange={setNps} max={10} minLabel="Точно ні" maxLabel="Точно так" />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">3. Як ви оцінюєте дизайн та зовнішній вигляд?</Label>
                    <Scale value={designRating} onChange={setDesignRating} max={5} minLabel="Поганий" maxLabel="Чудовий" />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">4. Чи легко знайти потрібну подію?</Label>
                    <RadioGroup value={easyFind} onValueChange={setEasyFind} className="flex flex-wrap gap-4">
                      {[
                        { v: "yes", l: "Так" },
                        { v: "partly", l: "Частково" },
                        { v: "no", l: "Ні" },
                      ].map((o) => (
                        <div key={o.v} className="flex items-center gap-2">
                          <RadioGroupItem value={o.v} id={`find-${o.v}`} />
                          <Label htmlFor={`find-${o.v}`} className="font-normal cursor-pointer">{o.l}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">5. Наскільки зрозумілий процес реєстрації?</Label>
                    <Scale value={regClarity} onChange={setRegClarity} max={5} minLabel="Заплутаний" maxLabel="Дуже зрозумілий" />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="reg-diff" className="text-base">6. Що було найскладнішим при реєстрації?</Label>
                    <Input
                      id="reg-diff"
                      value={regDifficulty}
                      onChange={(e) => setRegDifficulty(e.target.value)}
                      placeholder="Напр.: оплата, заповнення даних, пошук події…"
                      maxLength={300}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">7. Яких функцій вам не вистачає?</Label>
                    <p className="text-xs text-muted-foreground">Можна обрати кілька варіантів</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MISSING_FEATURES.map((f) => (
                        <div key={f.v} className="flex items-center gap-2">
                          <Checkbox
                            id={`miss-${f.v}`}
                            checked={missing.includes(f.v)}
                            onCheckedChange={() => toggleMissing(f.v)}
                          />
                          <Label htmlFor={`miss-${f.v}`} className="font-normal cursor-pointer">{f.l}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">8. Що для вас найважливіше при виборі події?</Label>
                    <p className="text-xs text-muted-foreground">Можна обрати кілька варіантів</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EVENT_CHOICE_FACTORS.map((f) => (
                        <div key={f.v} className="flex items-center gap-2">
                          <Checkbox
                            id={`fac-${f.v}`}
                            checked={eventChoiceFactors.includes(f.v)}
                            onCheckedChange={() => toggleFactor(f.v)}
                          />
                          <Label htmlFor={`fac-${f.v}`} className="font-normal cursor-pointer">{f.l}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">9. Як ви дізналися про Fartlek?</Label>
                    <RadioGroup value={discoverySource} onValueChange={setDiscoverySource} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DISCOVERY_SOURCES.map((o) => (
                        <div key={o.v} className="flex items-center gap-2">
                          <RadioGroupItem value={o.v} id={`disc-${o.v}`} />
                          <Label htmlFor={`disc-${o.v}`} className="font-normal cursor-pointer">{o.l}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">10. Як часто берете участь у забігах?</Label>
                    <RadioGroup value={participationFrequency} onValueChange={setParticipationFrequency} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PARTICIPATION_FREQUENCY.map((o) => (
                        <div key={o.v} className="flex items-center gap-2">
                          <RadioGroupItem value={o.v} id={`freq-${o.v}`} />
                          <Label htmlFor={`freq-${o.v}`} className="font-normal cursor-pointer">{o.l}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>

              {isOrganizer && (
                <Card>
                  <CardContent className="pt-6 space-y-8">
                    <h3 className="font-semibold text-lg">Для організаторів</h3>
                    <div className="space-y-3">
                      <Label className="text-base">8. Наскільки зручно створювати подію?</Label>
                      <Scale value={orgEventCreation} onChange={setOrgEventCreation} max={5} />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">9. Чи зрозуміла система оплат (WayForPay / LiqPay)?</Label>
                      <RadioGroup value={orgPaymentsClear} onValueChange={setOrgPaymentsClear} className="flex flex-wrap gap-4">
                        {[
                          { v: "yes", l: "Так" },
                          { v: "no", l: "Ні" },
                          { v: "not_used", l: "Не використовував" },
                        ].map((o) => (
                          <div key={o.v} className="flex items-center gap-2">
                            <RadioGroupItem value={o.v} id={`pay-${o.v}`} />
                            <Label htmlFor={`pay-${o.v}`} className="font-normal cursor-pointer">{o.l}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="org-tools" className="text-base">10. Яких інструментів вам бракує для роботи з учасниками?</Label>
                      <Textarea
                        id="org-tools"
                        value={orgMissingTools}
                        onChange={(e) => setOrgMissingTools(e.target.value)}
                        rows={3}
                        maxLength={1000}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="liked" className="text-base">11. Що подобається найбільше?</Label>
                    <Textarea id="liked" value={likedMost} onChange={(e) => setLikedMost(e.target.value)} rows={3} maxLength={1000} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="change" className="text-base">12. Що б ви змінили в першу чергу?</Label>
                    <Textarea id="change" value={wouldChange} onChange={(e) => setWouldChange(e.target.value)} rows={3} maxLength={1000} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="suggestions" className="text-base">13. Ваші пропозиції та ідеї</Label>
                    <Textarea
                      id="suggestions"
                      value={suggestions}
                      onChange={(e) => setSuggestions(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Будь-які думки, побажання, критика — нам важливо все"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-base">14. Email для зворотного зв'язку (необов'язково)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@example.com"
                      maxLength={255}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button type="submit" size="lg" disabled={busy} className="min-w-[240px]">
                  {busy ? "Надсилаємо…" : "Надіслати відповідь"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Survey;

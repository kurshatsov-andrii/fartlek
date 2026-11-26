import { useL } from "@/lib/use-l";
import { useApp } from "@/contexts/AppContext";
import { localizeStart } from "@/lib/start-translations";
import { RegistrationStatus } from "@/components/RegistrationStatus";
import { deriveRegistrationState } from "@/lib/registration-status";
import { kyivToday } from "@/lib/calendar-discovery";
import { useEffect, useState } from "react";
import { PageViews } from "@/components/PageViews";
import { EventPoster } from "@/components/EventPoster";
import { SiSPartnerBanner } from "@/components/SiSPartnerBanner";
import { InsuranceBanner } from "@/components/InsuranceBanner";
import { Link, useParams } from "@/lib/router-compat";
import { Loader2, ExternalLink, Calendar as CalendarIcon, ArrowLeft, MapPin, FileText } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { linkifyText } from "@/lib/linkify";
import { SPORT_LABELS, SPORT_LABELS_EN, type SportType } from "@/lib/parseStart";
import { isEventCompleted } from "@/lib/event-date";
import { StartActions } from "@/components/StartActions";

interface StartRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  title_en: string | null;
  description_en: string | null;
  image_url: string | null;
  register_url: string | null;
  results_url: string | null;
  registration_status: string | null;
  registration_opens_on: string | null;
  registration_open_until: string | null;
  info_source_url: string | null;
  info_checked_on: string | null;
  event_date: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_title_en: string | null;
  seo_description_en: string | null;
  city: string | null;
  region: string | null;
  city_en: string | null;
  region_en: string | null;
  sport_types: string[];
  distances_km: number[];
  is_paid: boolean | null;
}

const StartDetails = () => {
  const L = useL();
  const { lang } = useApp();
  const { slug } = useParams<{ slug: string }>();
  const [row, setRow] = useState<StartRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("telegram_starts")
        .select("id,slug,title,description,title_en,description_en,image_url,register_url,results_url,registration_status,registration_opens_on,registration_open_until,info_source_url,info_checked_on,event_date,seo_title,seo_description,seo_title_en,seo_description_en,city,region,city_en,region_en,sport_types,distances_km,is_paid")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setRow(data as StartRow);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  );

  if (notFound || !row) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-20 text-center">
        <h1 className="font-display text-2xl mb-4">{L("Старт не знайдено", "Start not found")}</h1>
        <Button asChild><Link to="/starts">{L("До всіх стартів", "All starts")}</Link></Button>
      </main>
      <Footer />
    </div>
  );

  const content = localizeStart(row, lang);

  const regState = deriveRegistrationState({
    explicit: row.registration_status,
    opensOn: row.registration_opens_on,
    openUntil: row.registration_open_until,
    date: row.event_date,
    today: kyivToday(),
  });

  const fmtDate = (d: string | null) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={content.seo_title || `${content.title} — ${L("Старти", "Starts")} Fartlek`}
        description={(content.seo_description || content.description || "").slice(0, 160)}
        image={row.image_url || undefined}
      />
      <Header />
      <main className="flex-1 container py-10 max-w-3xl">
        <Link to="/starts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {L("До всіх стартів", "All starts")}
        </Link>

        {row.image_url && (
          <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-muted">
            <EventPoster src={row.image_url} alt={content.title} loading="eager" fit="cover" />
          </div>
        )}

        <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{content.title || L("Без назви", "Untitled")}</h1>
        <StartActions source="start" id={row.id} />

        {row.event_date && (
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CalendarIcon className="h-4 w-4" />{fmtDate(row.event_date)}
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />{content.city || L("Україна та весь світ", "Ukraine and worldwide")}
        </div>
        <div className="mb-4">
          <RegistrationStatus uk={lang === "uk"} info={{
            state: regState,
            opensOn: row.registration_opens_on,
            openUntil: row.registration_open_until,
            sourceUrl: row.info_source_url ?? row.register_url,
            sourceLabel: null,
            checkedOn: row.info_checked_on,
          }} />
        </div>
        <PageViews pageKey={`start:${row.id}`} className="mb-6" />

        <div className="flex flex-wrap gap-1 mb-4">
          {Array.from(new Set((row.sport_types || []).filter((s): s is SportType => s in SPORT_LABELS))).map((s) => (
            <span key={s} className="text-xs px-2 py-1 rounded bg-muted">{L(SPORT_LABELS[s], SPORT_LABELS_EN[s])}</span>
          ))}
          {(row.distances_km || []).length > 0 ? [...(row.distances_km || [])].sort((a, b) => Number(b) - Number(a)).map((d) => (
            <span key={String(d)} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{d} {L("км", "km")}</span>
          )) : (
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{L("Вільна дистанція", "Open distance")}</span>
          )}
          {row.is_paid === false && <span className="text-xs px-2 py-1 rounded bg-accent text-accent-foreground">{L("Безкоштовно", "Free")}</span>}
        </div>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words mb-8 text-foreground">
          {linkifyText(content.description || "")}
        </div>

        {row.results_url && (
          <Button asChild size="lg" className="w-full sm:w-auto mb-8">
            <a href={row.results_url} target="_blank" rel="noreferrer">
              {L("Результати", "Results")} {content.title || ""} <FileText className="h-4 w-4 ml-2" />
            </a>
          </Button>
        )}

        {row.register_url && !isEventCompleted(row.event_date, row.registration_open_until) && !row.results_url && regState !== "cancelled" && regState !== "closed" && (
          <Button asChild size="lg" className="w-full sm:w-auto mb-8">
            <a href={row.register_url} target="_blank" rel="noreferrer">
              {L("Зареєструватися", "Register")} <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        )}

        {row.event_date && !isEventCompleted(row.event_date, row.registration_open_until) && (
          <div className="mb-8"><SiSPartnerBanner /></div>
        )}
        <div className="mb-8"><InsuranceBanner /></div>
      </main>
      <Footer />
    </div>
  );
};

export default StartDetails;

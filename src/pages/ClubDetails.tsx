import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Globe, Mail, Phone, Calendar, Users, Instagram, Facebook, Youtube, Send } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { CLUB_ACTIVITY_LABELS, type Club } from "@/lib/clubs";

const linkLabel = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};

const ClubDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useApp();
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);
  const [notFound, setNotFound] = useState(false);

  const T = lang === "uk" ? {
    back: "До каталогу клубів",
    activities: "Тип діяльності", description: "Опис", contacts: "Контакти", socials: "Соцмережі",
    about: "Про клуб", training: "Тренування",
    founded: "Заснований", members: "Учасників", trainingLocation: "Місце", trainingSchedule: "Розклад",
  } : {
    back: "Back to catalog",
    activities: "Activity types", description: "About", contacts: "Contacts", socials: "Socials",
    about: "Club info", training: "Training",
    founded: "Founded", members: "Members", trainingLocation: "Location", trainingSchedule: "Schedule",
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      let { data } = await supabase.from("clubs" as any).select("*").eq("slug", slug).maybeSingle();
      if (!data) {
        const r = await supabase.from("clubs" as any).select("*").eq("id", slug).maybeSingle();
        data = r.data;
      }
      if (!data) setNotFound(true); else setClub(data as any);
      setLoading(false);
    })();
  }, [slug]);

  if (notFound) return <Navigate to="/clubs" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl py-10">
        <Link to="/clubs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {T.back}
        </Link>

        {loading || !club ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-2xl shadow-card flex flex-col sm:flex-row gap-6 items-start">
              {club.logo_url ? (
                <img src={club.logo_url} alt={club.name} className="h-28 w-28 rounded-xl object-cover border border-border" />
              ) : (
                <div className="h-28 w-28 rounded-xl bg-muted flex items-center justify-center text-4xl">🏃</div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-3xl font-bold">{club.name}</h1>
                {club.city && (
                  <p className="text-muted-foreground inline-flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" /> {club.city}
                  </p>
                )}
                {(club.activity_types ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {club.activity_types.map((a) => (
                      <Badge key={a} variant="secondary">{CLUB_ACTIVITY_LABELS[lang as "uk" | "en"][a]}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {club.description && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.description}</h2>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{club.description}</p>
              </div>
            )}

            {(club.founded_year || club.members_count) && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.about}</h2>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {club.founded_year && (
                    <div className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{T.founded}:</span> <strong>{club.founded_year}</strong></div>
                  )}
                  {club.members_count != null && (
                    <div className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{T.members}:</span> <strong>{club.members_count}</strong></div>
                  )}
                </div>
              </div>
            )}

            {(club.training_location || club.training_schedule) && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.training}</h2>
                {club.training_location && <p className="text-sm"><span className="text-muted-foreground">{T.trainingLocation}: </span>{club.training_location}</p>}
                {club.training_schedule && <p className="text-sm whitespace-pre-wrap mt-2"><span className="text-muted-foreground">{T.trainingSchedule}:</span><br />{club.training_schedule}</p>}
              </div>
            )}

            {(club.contact_email || club.contact_phone) && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.contacts}</h2>
                <div className="flex flex-col gap-2 text-sm">
                  {club.contact_email && <a href={`mailto:${club.contact_email}`} className="inline-flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /> {club.contact_email}</a>}
                  {club.contact_phone && <a href={`tel:${club.contact_phone}`} className="inline-flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" /> {club.contact_phone}</a>}
                </div>
              </div>
            )}

            {(club.website_url || club.instagram_url || club.facebook_url || club.telegram_url || club.strava_url || club.youtube_url) && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.socials}</h2>
                <div className="flex flex-wrap gap-2">
                  {club.website_url && <Button asChild variant="outline" size="sm"><a href={club.website_url} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /> {linkLabel(club.website_url)}</a></Button>}
                  {club.instagram_url && <Button asChild variant="outline" size="sm"><a href={club.instagram_url} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4" /> Instagram</a></Button>}
                  {club.facebook_url && <Button asChild variant="outline" size="sm"><a href={club.facebook_url} target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4" /> Facebook</a></Button>}
                  {club.telegram_url && <Button asChild variant="outline" size="sm"><a href={club.telegram_url} target="_blank" rel="noopener noreferrer"><Send className="h-4 w-4" /> Telegram</a></Button>}
                  {club.strava_url && <Button asChild variant="outline" size="sm"><a href={club.strava_url} target="_blank" rel="noopener noreferrer">Strava</a></Button>}
                  {club.youtube_url && <Button asChild variant="outline" size="sm"><a href={club.youtube_url} target="_blank" rel="noopener noreferrer"><Youtube className="h-4 w-4" /> YouTube</a></Button>}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ClubDetails;

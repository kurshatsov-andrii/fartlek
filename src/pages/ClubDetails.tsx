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

const buildAutoDescription = (club: Club, lang: "uk" | "en"): string => {
  const types = (club.activity_types ?? []) as string[];
  const isTrail = types.includes("trail");
  const isOcr = types.includes("ocr");
  const isTri = (types as string[]).includes("triathlon");

  if (lang === "uk") {
    const kind = isTrail ? "Трейловий клуб" : isOcr ? "OCR клуб" : isTri ? "Триатлон клуб" : "Біговий клуб";
    const parts: string[] = [];
    parts.push(club.city ? `${kind} ${club.name} у місті ${club.city}` : `${kind} ${club.name}`);
    if (club.founded_year) parts.push(`заснований у ${club.founded_year} році`);
    if (club.members_count != null) parts.push(`кількість учасників клубу — ${club.members_count}`);
    return parts.join(", ") + ".";
  }
  const kind = isTrail ? "Trail running club" : isOcr ? "OCR club" : isTri ? "Triathlon club" : "Running club";
  const parts: string[] = [];
  parts.push(club.city ? `${kind} ${club.name} in ${club.city}` : `${kind} ${club.name}`);
  if (club.founded_year) parts.push(`founded in ${club.founded_year}`);
  if (club.members_count != null) parts.push(`${club.members_count} members`);
  return parts.join(", ") + ".";
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

  // SEO: title, meta description, canonical, OG, JSON-LD
  useEffect(() => {
    if (!club) return;

    const types = (club.activity_types ?? []) as string[];
    const isTrail = types.includes("trail");
    const isOcr = types.includes("ocr");
    const isTri = types.includes("triathlon");

    const kindUk = isTrail ? "Трейловий клуб"
      : isOcr ? "OCR клуб"
      : isTri ? "Триатлон клуб"
      : "Біговий клуб";
    const kindEn = isTrail ? "Trail running club"
      : isOcr ? "OCR club"
      : isTri ? "Triathlon club"
      : "Running club";

    const titleUk = club.city ? `${kindUk} ${club.name} в ${club.city}` : `${kindUk} ${club.name}`;
    const titleEn = club.city ? `${kindEn} ${club.name} in ${club.city}` : `${kindEn} ${club.name}`;
    const title = (lang === "uk" ? titleUk : titleEn).slice(0, 60);

    const descBase = club.description?.replace(/\s+/g, " ").trim();
    const descFallback = lang === "uk"
      ? `${kindUk} ${club.name}${club.city ? ` в ${club.city}` : ""}. Тренування, контакти, соцмережі та інформація про клуб на Fartlek.`
      : `${kindEn} ${club.name}${club.city ? ` in ${club.city}` : ""}. Training, contacts, socials and club info on Fartlek.`;
    const description = (descBase && descBase.length > 40 ? descBase : descFallback).slice(0, 160);

    const url = `${window.location.origin}/clubs/${club.slug ?? club.id}`;
    const image = club.logo_url || `${window.location.origin}/og-image.png`;

    document.title = title;

    const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta(`meta[name="description"]`, "name", "description", description);
    setMeta(`meta[property="og:title"]`, "property", "og:title", title);
    setMeta(`meta[property="og:description"]`, "property", "og:description", description);
    setMeta(`meta[property="og:type"]`, "property", "og:type", "profile");
    setMeta(`meta[property="og:url"]`, "property", "og:url", url);
    setMeta(`meta[property="og:image"]`, "property", "og:image", image);
    setMeta(`meta[name="twitter:card"]`, "name", "twitter:card", "summary_large_image");
    setMeta(`meta[name="twitter:title"]`, "name", "twitter:title", title);
    setMeta(`meta[name="twitter:description"]`, "name", "twitter:description", description);
    setMeta(`meta[name="twitter:image"]`, "name", "twitter:image", image);

    let canonical = document.head.querySelector<HTMLLinkElement>(`link[rel="canonical"]`);
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    const ldId = "club-jsonld";
    document.getElementById(ldId)?.remove();
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = ldId;
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SportsClub",
      name: club.name,
      description,
      url,
      image: club.logo_url || undefined,
      address: club.city ? { "@type": "PostalAddress", addressLocality: club.city } : undefined,
      email: club.contact_email || undefined,
      telephone: club.contact_phone || undefined,
      foundingDate: club.founded_year ? String(club.founded_year) : undefined,
      sameAs: [club.website_url, club.instagram_url, club.facebook_url, club.telegram_url, club.strava_url, club.youtube_url].filter(Boolean),
    });
    document.head.appendChild(ld);

    return () => {
      document.getElementById(ldId)?.remove();
    };
  }, [club, lang]);

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

import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Globe, Mail, Phone, Calendar, Users, Instagram, Facebook, Youtube, Send } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { CLUB_ACTIVITY_LABELS } from "@/lib/clubs";
import type { Organizer } from "@/lib/organizers";

const linkLabel = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};

const buildAutoDescription = (o: Organizer, lang: "uk" | "en"): string => {
  if (lang === "uk") {
    const parts: string[] = [];
    parts.push(o.city ? `Організатор спортивних подій ${o.name} у місті ${o.city}` : `Організатор ${o.name}`);
    if (o.founded_year) parts.push(`з ${o.founded_year} року`);
    if (o.members_count != null) parts.push(`команда — ${o.members_count}`);
    return parts.join(", ") + ".";
  }
  const parts: string[] = [];
  parts.push(o.city ? `Sports event organizer ${o.name} in ${o.city}` : `Organizer ${o.name}`);
  if (o.founded_year) parts.push(`since ${o.founded_year}`);
  if (o.members_count != null) parts.push(`team — ${o.members_count}`);
  return parts.join(", ") + ".";
};

const OrganizerProfileDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useApp();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Organizer | null>(null);
  const [notFound, setNotFound] = useState(false);

  const T = lang === "uk" ? {
    back: "До каталогу організаторів",
    activities: "Тип діяльності", description: "Опис", contacts: "Контакти", socials: "Соцмережі",
    about: "Про організатора", training: "Локація",
    founded: "Заснований", members: "Команда", trainingLocation: "Локація", trainingSchedule: "Розклад",
  } : {
    back: "Back to organizers",
    activities: "Activity types", description: "About", contacts: "Contacts", socials: "Socials",
    about: "Organizer info", training: "Location",
    founded: "Founded", members: "Team", trainingLocation: "Location", trainingSchedule: "Schedule",
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      let { data } = await supabase.from("organizers" as any).select("*").eq("slug", slug).maybeSingle();
      if (!data) {
        const r = await supabase.from("organizers" as any).select("*").eq("id", slug).maybeSingle();
        data = r.data;
      }
      if (!data) setNotFound(true); else setOrg(data as any);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!org) return;
    const titleUk = org.city ? `Організатор ${org.name} в ${org.city}` : `Організатор ${org.name}`;
    const titleEn = org.city ? `Organizer ${org.name} in ${org.city}` : `Organizer ${org.name}`;
    const title = (lang === "uk" ? titleUk : titleEn).slice(0, 60);
    const descBase = org.description?.replace(/\s+/g, " ").trim();
    const descFallback = buildAutoDescription(org, lang as "uk" | "en");
    const description = (descBase && descBase.length > 40 ? descBase : descFallback).slice(0, 160);
    const url = `${window.location.origin}/organizers/${org.slug ?? org.id}`;
    const image = org.logo_url || `${window.location.origin}/og-image.png`;

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

    let canonical = document.head.querySelector<HTMLLinkElement>(`link[rel="canonical"]`);
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    const ldId = "organizer-jsonld";
    document.getElementById(ldId)?.remove();
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = ldId;
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: org.name,
      description,
      url,
      image: org.logo_url || undefined,
      address: org.city ? { "@type": "PostalAddress", addressLocality: org.city } : undefined,
      email: org.contact_email || undefined,
      telephone: org.contact_phone || undefined,
      foundingDate: org.founded_year ? String(org.founded_year) : undefined,
      sameAs: [org.website_url, org.instagram_url, org.facebook_url, org.telegram_url, org.strava_url, org.youtube_url].filter(Boolean),
    });
    document.head.appendChild(ld);
    return () => { document.getElementById(ldId)?.remove(); };
  }, [org, lang]);

  if (notFound) return <Navigate to="/organizers" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl py-10">
        <Link to="/organizers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {T.back}
        </Link>

        {loading || !org ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-2xl shadow-card flex flex-col sm:flex-row gap-6 items-start">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="h-28 w-28 rounded-xl object-cover border border-border" />
              ) : (
                <div className="h-28 w-28 rounded-xl bg-muted flex items-center justify-center text-4xl">🎽</div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-3xl font-bold">{org.name}</h1>
                {org.city && (
                  <p className="text-muted-foreground inline-flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" /> {org.city}
                  </p>
                )}
                {(org.activity_types ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {org.activity_types.map((a) => (
                      <Badge key={a} variant="secondary">{CLUB_ACTIVITY_LABELS[lang as "uk" | "en"][a]}</Badge>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-3">
                  {buildAutoDescription(org, lang as "uk" | "en")}
                </p>
              </div>
            </div>

            {org.description && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.description}</h2>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{org.description}</p>
              </div>
            )}

            {(org.founded_year || org.members_count) && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.about}</h2>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {org.founded_year && (
                    <div className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{T.founded}:</span> <strong>{org.founded_year}</strong></div>
                  )}
                  {org.members_count != null && (
                    <div className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{T.members}:</span> <strong>{org.members_count}</strong></div>
                  )}
                </div>
              </div>
            )}

            {(org.training_location || org.training_schedule) && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.training}</h2>
                {org.training_location && <p className="text-sm"><span className="text-muted-foreground">{T.trainingLocation}: </span>{org.training_location}</p>}
                {org.training_schedule && <p className="text-sm whitespace-pre-wrap mt-2"><span className="text-muted-foreground">{T.trainingSchedule}:</span><br />{org.training_schedule}</p>}
              </div>
            )}

            {(org.contact_email || org.contact_phone) && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.contacts}</h2>
                <div className="flex flex-col gap-2 text-sm">
                  {org.contact_email && <a href={`mailto:${org.contact_email}`} className="inline-flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /> {org.contact_email}</a>}
                  {org.contact_phone && <a href={`tel:${org.contact_phone}`} className="inline-flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" /> {org.contact_phone}</a>}
                </div>
              </div>
            )}

            {(org.website_url || org.instagram_url || org.facebook_url || org.telegram_url || org.strava_url || org.youtube_url) && (
              <div className="bg-card p-6 rounded-2xl shadow-card">
                <h2 className="font-semibold mb-3">{T.socials}</h2>
                <div className="flex flex-wrap gap-2">
                  {org.website_url && <Button asChild variant="outline" size="sm"><a href={org.website_url} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /> {linkLabel(org.website_url)}</a></Button>}
                  {org.instagram_url && <Button asChild variant="outline" size="sm"><a href={org.instagram_url} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4" /> Instagram</a></Button>}
                  {org.facebook_url && <Button asChild variant="outline" size="sm"><a href={org.facebook_url} target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4" /> Facebook</a></Button>}
                  {org.telegram_url && <Button asChild variant="outline" size="sm"><a href={org.telegram_url} target="_blank" rel="noopener noreferrer"><Send className="h-4 w-4" /> Telegram</a></Button>}
                  {org.strava_url && <Button asChild variant="outline" size="sm"><a href={org.strava_url} target="_blank" rel="noopener noreferrer">Strava</a></Button>}
                  {org.youtube_url && <Button asChild variant="outline" size="sm"><a href={org.youtube_url} target="_blank" rel="noopener noreferrer"><Youtube className="h-4 w-4" /> YouTube</a></Button>}
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

export default OrganizerProfileDetails;

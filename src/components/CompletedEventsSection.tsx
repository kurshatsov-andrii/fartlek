import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";

interface CompletedEvent {
  id: string;
  slug: string | null;
  title: string;
  event_date: string;
  location: string | null;
  image_url: string | null;
  results_pdf_url: string | null;
}

export const CompletedEventsSection = () => {
  const { t, lang } = useApp();
  const [events, setEvents] = useState<CompletedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("events")
      .select("id, slug, title, event_date, location, image_url, results_pdf_url")
      .eq("status", "completed")
      .order("event_date", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        setEvents((data as any) ?? []);
        setLoading(false);
      });
  }, []);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  return (
    <section id="completed-events" className="relative py-20 sm:py-28 bg-muted/30">
      <div className="container">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {lang === "uk" ? "Архів" : "Archive"}
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t.events.completedHeading}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">{t.events.completedSub}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <article
              key={ev.id}
              className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-card transition-base hover:shadow-elevated"
            >
              <Link
                to={`/events/${ev.slug ?? ev.id}`}
                className="relative aspect-[16/9] overflow-hidden bg-muted block"
              >
                {ev.image_url ? (
                  <img
                    src={ev.image_url}
                    alt={ev.title}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale-[30%] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-hero" />
                )}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                    {t.organizer.completed}
                  </span>
                </div>
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-base font-bold leading-tight">
                  <Link to={`/events/${ev.slug ?? ev.id}`} className="hover:text-primary transition-base">
                    {ev.title}
                  </Link>
                </h3>
                <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {fmtDate(ev.event_date)}
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {ev.location}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  {ev.results_pdf_url ? (
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <a href={ev.results_pdf_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4" /> {t.events.results}
                      </a>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      {t.events.resultsNone}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

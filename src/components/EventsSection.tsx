import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { SAMPLE_EVENTS } from "@/data/events";

export const EventsSection = () => {
  const { t, lang } = useApp();

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <section id="events" className="relative py-24 sm:py-32">
      <div className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-14">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              {String(new Date().getFullYear())} — {String(new Date().getFullYear() + 1)} season
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {t.events.heading}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t.events.sub}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_EVENTS.map((ev, idx) => (
            <article
              key={ev.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-bounce hover:-translate-y-2 hover:shadow-elevated animate-fade-in-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={ev.image}
                  alt={ev.title[lang]}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 card-overlay" />
                <div className="absolute top-4 left-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur ${
                      ev.isPaid
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {ev.isPaid ? `${ev.price} ₴` : t.events.free}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
                  {ev.distances.map((d) => (
                    <span
                      key={d}
                      className="rounded-md bg-background/95 px-2 py-1 text-xs font-bold text-foreground"
                    >
                      {d} km
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl font-bold leading-tight">{ev.title[lang]}</h3>
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {fmtDate(ev.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {ev.location[lang]}
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                  {ev.description[lang]}
                </p>

                <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border">
                  <Button asChild className="flex-1">
                    <Link to={`/events/${ev.id}`}>{t.events.register}</Link>
                  </Button>
                  <Button asChild variant="outline" size="icon" aria-label={t.events.details}>
                    <Link to={`/events/${ev.id}`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

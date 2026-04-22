import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, User, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-runners.jpg";

const formatCount = (n: number) => {
  if (n >= 1000) {
    const k = n / 1000;
    return (k >= 10 ? Math.floor(k) : Math.round(k * 10) / 10) + "k";
  }
  return String(n);
};

export const Hero = () => {
  const { t } = useApp();
  const { user } = useAuth();
  const [stats, setStats] = useState({ events: 0, runners: 0, cities: 0, clubs: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.rpc as any)("get_public_stats");
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setStats({
          events: row.events_count ?? 0,
          runners: row.runners_count ?? 0,
          cities: row.cities_count ?? 0,
          clubs: row.clubs_count ?? 0,
        });
      }
    })();
  }, []);

  return (
    <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImg}
          alt=""
          className="h-full w-full object-cover opacity-40"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-secondary/40 to-secondary" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 flex min-h-[88vh] flex-col justify-center py-20">
        <div className="max-w-3xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {t.hero.kicker}
          </div>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            {t.hero.title.split(" ").map((word, i) => (
              <span key={i} className={i === 2 ? "text-gradient" : ""}>
                {word}{" "}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-2xl text-base text-secondary-foreground/70 sm:text-lg leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group h-14 px-8 text-base shadow-glow">
              <Link to="/auth?role=participant">
                <User className="mr-2 h-5 w-5" />
                {t.hero.ctaParticipant}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base border-secondary-foreground/20 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
            >
              <Link to="/auth?role=organizer">
                <Trophy className="mr-2 h-5 w-5" />
                {t.hero.ctaOrganizer}
              </Link>
            </Button>
          </div>

          <dl className="mt-16 grid max-w-xl grid-cols-2 gap-6 border-t border-secondary-foreground/10 pt-8 sm:grid-cols-4">
            {[
              { v: `${stats.events}`, l: t.hero.stats.events },
              { v: formatCount(stats.runners), l: t.hero.stats.runners },
              { v: `${stats.cities}`, l: t.hero.stats.cities },
              { v: `${stats.clubs}`, l: t.hero.stats.clubs },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-display text-3xl font-bold text-primary sm:text-4xl">{s.v}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-secondary-foreground/60">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

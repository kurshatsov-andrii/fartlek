import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, User, Trophy, Play, Pause, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-runners.jpg";
import tigerMascot from "@/assets/tiger-mascot.png.asset.json";


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
  const [stats, setStats] = useState({ events: 0, runners: 0, cities: 0, clubs: 0, organizers: 0, registrations: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAnthem = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

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
          organizers: row.organizers_count ?? 0,
          registrations: row.registrations_count ?? 0,
        });
      }
    })();
  }, []);

  if (user) return null;

  return (
    <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImg}
          alt=""
          className="h-full w-full object-cover opacity-40"
          width={1920}
          height={1280}
          fetchPriority="high"
          decoding="async"
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

          {!user && (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <img
                  src={tigerMascot.url}
                  alt="Тигр-бігун Фартлек показує на кнопку входу для учасників"
                  className="pointer-events-none absolute bottom-[62%] left-[-24%] z-20 hidden w-52 origin-bottom animate-mascot-out drop-shadow-2xl md:block lg:w-64"
                  loading="lazy"
                  decoding="async"
                />
                <Button asChild size="lg" className="group relative z-10 h-14 w-full px-8 text-base shadow-glow">
                  <Link to="/auth?role=participant">
                    <User className="mr-2 h-5 w-5" />
                    {t.hero.ctaParticipant}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
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
          )}


          <div className="mt-8 inline-flex max-w-full items-center gap-3 rounded-full border border-secondary-foreground/15 bg-secondary-foreground/5 py-2 pl-2 pr-4 backdrop-blur">
            <button
              type="button"
              onClick={toggleAnthem}
              aria-label={isPlaying ? "Pause Fartlek Events anthem" : "Play Fartlek Events anthem"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <Music2 className="h-4 w-4 text-primary" />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">Fartlek Events — гімн</span>
              <span className="truncate text-[11px] uppercase tracking-wider text-secondary-foreground/60">
                Музика для мотивації
              </span>
            </div>
            <audio
              ref={audioRef}
              src="https://fartlek.com.ua/wp-content/uploads/2026/04/Fartlek-Events.mp3"
              preload="none"
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />
          </div>

          <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-6 border-t border-secondary-foreground/10 pt-8 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { v: `${stats.events}`, l: t.hero.stats.events },
              { v: formatCount(stats.runners), l: t.hero.stats.runners },
              { v: formatCount(stats.registrations), l: t.hero.stats.registrations },
              { v: `${stats.organizers}`, l: t.hero.stats.organizers },
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

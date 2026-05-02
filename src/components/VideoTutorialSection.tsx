import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

const VIDEO_ID = "fHiYFoLo7aY";
const YOUTUBE_URL = `https://youtu.be/${VIDEO_ID}`;
const THUMB = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`;

export const VideoTutorialSection = () => {
  const { lang } = useApp();
  const [playing, setPlaying] = useState(false);

  const copy = lang === "uk"
    ? {
        eyebrow: "Гайд",
        title: "Як користуватися платформою",
        description:
          "Коротке відео-знайомство: як знайти забіг, зареєструватися (себе або дитину), оплатити та отримати QR-квиток.",
        cta: "Дивитись на YouTube",
        features: "Усі можливості платформи",
        play: "Відтворити відео",
      }
    : {
        eyebrow: "Guide",
        title: "How to use the platform",
        description:
          "A short walkthrough: find a race, register (yourself or your child), pay and get your QR ticket.",
        cta: "Watch on YouTube",
        features: "All platform features",
        play: "Play video",
      };

  return (
    <section className="py-16 md:py-24 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Text */}
          <div className="space-y-5 text-center lg:text-left order-2 lg:order-1">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary">
              {copy.eyebrow}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              {copy.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
              {copy.description}
            </p>
            <div className="pt-2">
              <Button asChild variant="outline" size="lg">
                <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                  <Play className="mr-2 h-4 w-4" />
                  {copy.cta}
                </a>
              </Button>
            </div>
          </div>

          {/* Vertical video */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div
              className="relative w-full max-w-[300px] md:max-w-[340px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-border bg-black"
              style={{ aspectRatio: "9 / 16" }}
            >
              {playing ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
                  title={copy.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  aria-label={copy.play}
                  className="group absolute inset-0 w-full h-full"
                >
                  <img
                    src={THUMB}
                    alt={copy.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 group-hover:from-black/70 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-7 w-7 md:h-8 md:w-8 ml-1" fill="currentColor" />
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

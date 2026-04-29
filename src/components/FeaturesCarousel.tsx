import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import participants from "@/assets/features/participants.png";
import organizers1 from "@/assets/features/organizers-1.png";
import organizers2 from "@/assets/features/organizers-2.png";
import technical from "@/assets/features/technical.png";
import admin from "@/assets/features/admin.png";

const slides = [
  { src: participants, uk: "Для учасників", en: "For participants" },
  { src: organizers1, uk: "Для організаторів", en: "For organizers" },
  { src: organizers2, uk: "Промокоди, фінанси, результати", en: "Promo codes, finances, results" },
  { src: technical, uk: "Технічні можливості", en: "Technical features" },
  { src: admin, uk: "Для адміністратора", en: "For administrator" },
];

export const FeaturesCarousel = () => {
  const { lang } = useApp();
  const plugin = useRef(Autoplay({ delay: 4500, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {lang === "uk" ? "Можливості платформи" : "Platform features"}
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {lang === "uk" ? (
              <>Все що потрібно для <span className="text-gradient">ваших забігів</span></>
            ) : (
              <>Everything you need for <span className="text-gradient">your races</span></>
            )}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {lang === "uk"
              ? "Повний набір інструментів для учасників, організаторів та адміністраторів."
              : "A complete toolkit for participants, organizers and administrators."}
          </p>
        </div>

        <div className="mt-14">
          <Carousel
            opts={{ align: "center", loop: true }}
            plugins={[plugin.current]}
            setApi={setApi}
            className="mx-auto max-w-5xl"
          >
            <CarouselContent>
              {slides.map((s, i) => (
                <CarouselItem key={i} className="basis-[85%] sm:basis-full md:basis-2/3 lg:basis-1/2">
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-elegant transition-transform hover:scale-[1.01]">
                    <img
                      src={s.src}
                      alt={lang === "uk" ? s.uk : s.en}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      width={1240}
                      height={1240}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>

          {/* Mobile swipe hint: arrows + dots */}
          <div className="mt-6 flex items-center justify-center gap-4 sm:hidden">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => api?.scrollPrev()}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm active:scale-95 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => api?.scrollTo(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    current === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => api?.scrollNext()}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm active:scale-95 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground sm:hidden">
            {lang === "uk" ? "← Гортайте, щоб побачити більше →" : "← Swipe to see more →"}
          </p>
        </div>
      </div>
    </section>
  );
};

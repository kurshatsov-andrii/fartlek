import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
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
            className="mx-auto max-w-5xl"
          >
            <CarouselContent>
              {slides.map((s, i) => (
                <CarouselItem key={i} className="md:basis-2/3 lg:basis-1/2">
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
        </div>
      </div>
    </section>
  );
};

import { useL } from "@/lib/use-l";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Instagram, MessagesSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTAGRAM_URL, TELEGRAM_CHAT_URL } from "@/lib/blog";
import { ABOUT_FAQ, ABOUT_FAQ_EN } from "@/lib/about-faq";
import { PLATFORM_SINCE_UK, PLATFORM_SINCE_EN } from "@/lib/platform-since";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { CommunityIntro } from "@/components/CommunityIntro";
import { FounderInvite } from "@/components/FounderInvite";
import { AnthemPlayer } from "@/components/AnthemPlayer";
import logoFartlek from "@/assets/fartlek-logo.png.asset.json";
import photo3465 from "@/assets/about/DSC_3465.jpg.asset.json";
import photo4308 from "@/assets/about/DSC_4308.jpg.asset.json";
import photo5718 from "@/assets/about/DSC_5718.jpg.asset.json";
import photo7432 from "@/assets/about/DSC_7432.jpg.asset.json";
import photo7832 from "@/assets/about/DSC_7832.jpg.asset.json";
import photo8596 from "@/assets/about/DSC_8596.jpg.asset.json";
import photo9832 from "@/assets/about/DSC_9832.jpg.asset.json";
import photoRoksolana from "@/assets/about/roksolana-run-1.jpg.asset.json";

const PHOTOS = [
  { src: photo9832.url, alt: "Спільнота Фартлек з прапором перед спільною пробіжкою" },
  { src: photo4308.url, alt: "Бігуни з медалями після змагань" },
  { src: photo7432.url, alt: "Групове тренування Фартлек у парку" },
  { src: photo7832.url, alt: "Бігуни біля прапора Фартлек" },
  { src: photo8596.url, alt: "Фартлек на старті забігу в парку" },
  { src: photo3465.url, alt: "Нагородження переможців Kharkiv Half Marathon" },
  { src: photo5718.url, alt: "Фінішери марафонської дистанції під аркою Kharkiv Sport City" },
  { src: photoRoksolana.url, alt: "Команда Фартлек на Roksolana Run" },
];

const VALUES = [
  { icon: "🏃", text: "Бігайте там, де вам подобається.", en: "Run wherever you like." },
  { icon: "🤝", text: "Тренуйтеся в різних клубах та спільнотах.", en: "Train with different clubs and communities." },
  { icon: "🔥", text: "Відвідуйте різні пробіжки та змагання.", en: "Join different runs and races." },
  { icon: "❤️", text: "Знайомтеся з новими людьми.", en: "Meet new people." },
  { icon: "💪", text: "Обирайте те, що підходить саме вам.", en: "Choose what suits you best." },
];

const MOTTO = [
  { icon: "🏃‍♂️", text: "Більше бігу.", en: "More running." },
  { icon: "🤝", text: "Більше дружби.", en: "More friendship." },
  { icon: "❤️", text: "Менше поділу.", en: "Less division." },
  { icon: "🔥", text: "Більше спільних стартів.", en: "More races together." },
];

const About = () => {
  const L = useL();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => setOpenIndex((i) => (i === null ? null : (i - 1 + PHOTOS.length) % PHOTOS.length)), []);
  const next = useCallback(() => setOpenIndex((i) => (i === null ? null : (i + 1) % PHOTOS.length)), []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null || openIndex === null) return;
    const dx = e.changedTouches[0]?.clientX - start;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  };

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, prev, next]);

  useEffect(() => {
    if (openIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={L("Фартлек — бігова спільнота Харкова | Про нас", "Fartlek — Kharkiv running community | About")}
        description={L("Фартлек — бігова спільнота Харкова: спільні пробіжки щонеділі, тренування й забіги. Приєднуйтеся до Telegram-чату, Instagram та читайте блог.", "Fartlek is a Kharkiv running community: Sunday group runs, training sessions and races. Join our Telegram chat and Instagram, and read the blog.")}
        canonical="/about"
      />
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
          <div className="container relative z-10 py-16 sm:py-20 max-w-3xl animate-fade-in-up">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-secondary-foreground/70 hover:text-secondary-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> {L("На головну", "Home")}
            </Link>
            <img
              src={logoFartlek.url}
              alt={L("Фартлек — бігова спільнота Харкова", "Fartlek — Kharkiv running community")}
              width={112}
              height={112}
              className="mb-6 h-28 w-28 rounded-full object-cover ring-1 ring-primary/40 shadow-glow sm:h-32 sm:w-32"
            />
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              {L("ФАРТЛЕК — ", "Fartlek — ")}<span className="text-gradient">{L("ЗА ОБ'ЄДНАННЯ ВСІХ БІГУНІВ!", "FOR UNITING ALL RUNNERS!")}</span>
            </h1>
            <p className="mt-6 text-lg text-secondary-foreground/80 leading-relaxed">
              {L("Ми віримо, що бігове місто — це не одна команда, один клуб чи одна спільнота.", "We believe a running city is not one team, one club or one community.")}
            </p>
            <p className="mt-4 text-lg font-semibold text-secondary-foreground">
              {L("Це всі ми разом. ❤️", "It’s all of us together. ❤️")}
            </p>
            <p className="mt-4">
              <Link to="/results" className="font-semibold text-primary hover:underline">{L("Фартлек у цифрах →", "Fartlek in numbers →")}</Link>
            </p>
          </div>
        </section>

        <section className="container pt-12 sm:pt-16">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-card space-y-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              {L("Фартлек — українська платформа ", "Fartlek — a Ukrainian ")}<span className="text-gradient">{L("спортивних подій", "sports events")}</span>{L(" та бігова спільнота", " platform and running community")}
            </h2>
            <div className="space-y-4 text-base sm:text-lg leading-relaxed">
              <p>
                {L(`Fartlek.com.ua — українська платформа, що об'єднує бігунів, бігові клуби й організаторів спортивних подій. Вона працює з ${PLATFORM_SINCE_UK}.`, `Fartlek.com.ua is a Ukrainian platform that brings together runners, running clubs and sports event organizers. It has been running since ${PLATFORM_SINCE_EN}.`)}
              </p>
              <p>
                {L("На Фартлек можна знайти забіги, марафони, напівмарафони, трейли та інші спортивні старти в Україні, переглянути календар і мапу подій, обрати дистанцію та зареєструватися онлайн.", "On Fartlek you can find races, marathons, half marathons, trails and other sports events in Ukraine, browse the event calendar and map, choose a distance and register online.")}
              </p>
              <p>
                {L("Фартлек допомагає організаторам створювати сторінки подій, приймати реєстрації й оплати, керувати учасниками, публікувати результати та видавати цифрові сертифікати.", "Fartlek helps organizers create event pages, accept registrations and payments, manage participants, publish results and issue digital certificates.")}
              </p>
              <p>
                {L("Платформа розвивається разом зі спортивною спільнотою: нові інструменти допомагають спортсменам знаходити старти, клубам — залучати учасників, а організаторам — простіше проводити спортивні заходи.", "The platform grows together with the sports community: new tools help athletes find races, clubs attract members and organizers run events more easily.")}
              </p>
              <p className="font-semibold">
                {L("Місія Фартлек — зробити спортивні події в Україні доступнішими, а бігову спільноту — більш об'єднаною.", "Fartlek’s mission is to make sports events in Ukraine more accessible and the running community more united.")}
              </p>
            </div>
          </div>
        </section>

        <section className="container pt-12 sm:pt-16 max-w-3xl">
          <CommunityIntro variant="plain" />
        </section>

        <section className="container pt-12 sm:pt-16 max-w-5xl">
          <FounderInvite />
        </section>


        <section className="container py-12 sm:py-16 max-w-3xl">
          <div className="space-y-5 text-base sm:text-lg leading-relaxed">
            <p>{L("Ми за те, щоб кожен бігун мав вибір, альтернативу та свободу.", "We want every runner to have choice, alternatives and freedom.")}</p>

            <ul className="grid gap-3 sm:grid-cols-2">
              {VALUES.map((v) => (
                <li
                  key={v.text}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <span className="text-xl shrink-0" aria-hidden>{v.icon}</span>
                  <span className="font-medium">{L(v.text, v.en)}</span>
                </li>
              ))}
            </ul>

            <p>
              {L("Ми не хочемо, щоб бігуни були прив'язані тільки до однієї спільноти.", "We don’t want runners to be tied to just one community.")}
            </p>
            <p className="font-semibold">
              {L("Навпаки — ми хочемо, щоб біг об'єднував, а не розділяв.", "On the contrary, we want running to unite, not divide.")}
            </p>
            <p>
              {L("Фартлек завжди радий бачити вас на наших спільних пробіжках, тренуваннях та змаганнях — незалежно від того, в яких ще клубах або командах ви бігаєте.", "Fartlek is always happy to see you at our group runs, training sessions and races, whatever other clubs or teams you run with.")}
            </p>
            <p>
              {L("Ви можете сьогодні бігти з нами, завтра — з іншою спільнотою, а післязавтра — знову з нами.", "You can run with us today, with another community tomorrow, and with us again the day after.")}
            </p>
            <p className="text-lg font-semibold">{L("І це нормально. 🙌", "And that’s fine. 🙌")}</p>
            <p className="text-lg font-semibold text-gradient">{L("Бо біг — це свобода.", "Because running is freedom.")}</p>
          </div>
        </section>

        <section className="container pb-12 sm:pb-16 max-w-3xl">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-5 shadow-card">
            <p className="text-base sm:text-lg leading-relaxed">
              {L("Наша мета — не зібрати всіх тільки у Фартлек.", "Our goal isn’t to gather everyone only in Fartlek.")}
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              {L("Наша мета — об'єднати всіх бігунів Харкова та інших міст в одну велику бігову спільноту, де немає поділу на «наших» і «чужих».", "Our goal is to unite all runners in Kharkiv and other cities into one big running community with no division into “ours” and “theirs”.")}
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              {L("Де можна підтримувати одне одного, разом бігати, проводити тренування та змагання, знайомитися, дружити й розвивати бігову культуру.", "A place to support each other, run together, hold training sessions and races, meet people, make friends and grow running culture.")}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              {MOTTO.map((m) => (
                <div
                  key={m.text}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3"
                >
                  <span className="text-xl shrink-0" aria-hidden>{m.icon}</span>
                  <span className="font-display font-bold text-lg">{L(m.text, m.en)}</span>
                </div>
              ))}
            </div>

            <p className="font-display text-xl sm:text-2xl font-bold pt-4">
              {L("Фартлек — за єдність усіх бігунів.", "Fartlek stands for the unity of all runners.")}
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              {L("Бігайте там, де хочете.", "Run wherever you want.")}
              <br />
              {L("Будьте там, де вам добре.", "Be wherever you feel good.")}
              <br />
              {L("А ми завжди будемо раді бачити вас у Фартлек. 🫶", "And we’ll always be glad to see you at Fartlek. 🫶")}
            </p>

            <div className="flex justify-center pt-4">
              <AnthemPlayer />
            </div>
          </div>
        </section>

        <section className="container pb-16 sm:pb-20 max-w-5xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-center">
            {L("ФАРТЛЕК", "Fartlek")} <span className="text-gradient">{L("У РУСІ", "IN MOTION")}</span> 📸
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            {L("Спільні пробіжки, тренування та змагання — дивіться, як це виглядає наживо.", "Group runs, training sessions and races — see what it looks like in real life.")}
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {PHOTOS.map((photo, i) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={photo.alt}
                className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card aspect-[4/3] cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </section>

        <section className="container pb-16 sm:pb-20 max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-center">
            {L("Бігова спільнота Харкова: ", "Kharkiv running community: ")}<span className="text-gradient">{L("питання та відповіді", "questions and answers")}</span>
          </h2>
          <div className="mt-8 space-y-3">
            {L(ABOUT_FAQ, ABOUT_FAQ_EN).map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card px-5 py-4" open>
                <summary className="cursor-pointer font-display font-bold text-lg">{f.q}</summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild><a href={TELEGRAM_CHAT_URL} target="_blank" rel="noopener noreferrer"><MessagesSquare className="h-4 w-4" />{L("Telegram-чат Фартлек", "Fartlek Telegram chat")}</a></Button>
            <Button asChild variant="outline"><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4" />{L("Instagram Фартлек", "Fartlek Instagram")}</a></Button>
            <Button asChild variant="outline"><Link to="/blog"><BookOpen className="h-4 w-4" />{L("Блог Фартлек", "Fartlek blog")}</Link></Button>
            <Button asChild variant="outline"><Link to="/clubs">{L("Бігові клуби Харкова", "Kharkiv running clubs")}</Link></Button>
            <Button asChild variant="outline"><Link to="/calendar">{L("Календар забігів", "Race calendar")}</Link></Button>
          </div>
        </section>
      </main>
      <Footer />
      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center touch-pan-y"
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            aria-label={L("Закрити", "Close")}
            onClick={close}
            className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-md transition hover:bg-card"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={L("Попереднє фото", "Previous photo")}
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 sm:left-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-md transition hover:bg-card"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label={L("Наступне фото", "Next photo")}
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 sm:right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-md transition hover:bg-card"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <figure
            className="flex max-h-full max-w-full flex-col items-center gap-3 p-12 sm:p-16"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={PHOTOS[openIndex].src}
              alt={PHOTOS[openIndex].alt}
              className="max-h-[78vh] max-w-full rounded-xl object-contain"
              key={PHOTOS[openIndex].src}
            />
            <figcaption className="text-sm text-muted-foreground text-center">
              {PHOTOS[openIndex].alt} · {openIndex + 1} / {PHOTOS.length}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
};

export default About;

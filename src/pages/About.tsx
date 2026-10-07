import { Link } from "@/lib/router-compat";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const VALUES = [
  { icon: "🏃", text: "Бігайте там, де вам подобається." },
  { icon: "🤝", text: "Тренуйтеся в різних клубах та спільнотах." },
  { icon: "🔥", text: "Відвідуйте різні пробіжки та змагання." },
  { icon: "❤️", text: "Знайомтеся з новими людьми." },
  { icon: "💪", text: "Обирайте те, що підходить саме вам." },
];

const MOTTO = [
  { icon: "🏃‍♂️", text: "Більше бігу." },
  { icon: "🤝", text: "Більше дружби." },
  { icon: "❤️", text: "Менше поділу." },
  { icon: "🔥", text: "Більше спільних стартів." },
];

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Про нас — Фартлек за об'єднання всіх бігунів"
        description="Бігова спільнота Фартлек: ми за свободу вибору бігуна, єдність бігунів Харкова та інших міст і бігову культуру без поділу на «наших» і «чужих»."
        canonical="/about"
      />
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
          <div className="container relative z-10 py-16 sm:py-20 max-w-3xl animate-fade-in-up">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-secondary-foreground/70 hover:text-secondary-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> На головну
            </Link>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              ФАРТЛЕК — <span className="text-gradient">ЗА ОБ'ЄДНАННЯ ВСІХ БІГУНІВ!</span>
            </h1>
            <p className="mt-6 text-lg text-secondary-foreground/80 leading-relaxed">
              Ми віримо, що бігове місто — це не одна команда, один клуб чи одна спільнота.
            </p>
            <p className="mt-4 text-lg font-semibold text-secondary-foreground">
              Це всі ми разом. ❤️
            </p>
          </div>
        </section>

        <section className="container py-12 sm:py-16 max-w-3xl">
          <div className="space-y-5 text-base sm:text-lg leading-relaxed">
            <p>Ми за те, щоб кожен бігун мав вибір, альтернативу та свободу.</p>

            <ul className="grid gap-3 sm:grid-cols-2">
              {VALUES.map((v) => (
                <li
                  key={v.text}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <span className="text-xl shrink-0" aria-hidden>{v.icon}</span>
                  <span className="font-medium">{v.text}</span>
                </li>
              ))}
            </ul>

            <p>
              Ми не хочемо, щоб бігуни були прив'язані тільки до однієї спільноти.
            </p>
            <p className="font-semibold">
              Навпаки — ми хочемо, щоб біг об'єднував, а не розділяв.
            </p>
            <p>
              Фартлек завжди радий бачити вас на наших спільних пробіжках,
              тренуваннях та змаганнях — незалежно від того, в яких ще клубах або
              командах ви бігаєте.
            </p>
            <p>
              Ви можете сьогодні бігти з нами, завтра — з іншою спільнотою,
              а післязавтра — знову з нами.
            </p>
            <p className="text-lg font-semibold">І це нормально. 🙌</p>
            <p className="text-lg font-semibold text-gradient">Бо біг — це свобода.</p>
          </div>
        </section>

        <section className="container pb-12 sm:pb-16 max-w-3xl">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-5 shadow-card">
            <p className="text-base sm:text-lg leading-relaxed">
              Наша мета — не зібрати всіх тільки у Фартлек.
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              Наша мета — об'єднати всіх бігунів Харкова та інших міст в одну
              велику бігову спільноту, де немає поділу на «наших» і «чужих».
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              Де можна підтримувати одне одного, разом бігати, проводити
              тренування та змагання, знайомитися, дружити й розвивати бігову
              культуру.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              {MOTTO.map((m) => (
                <div
                  key={m.text}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3"
                >
                  <span className="text-xl shrink-0" aria-hidden>{m.icon}</span>
                  <span className="font-display font-bold text-lg">{m.text}</span>
                </div>
              ))}
            </div>

            <p className="font-display text-xl sm:text-2xl font-bold pt-4">
              Фартлек — за єдність усіх бігунів.
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              Бігайте там, де хочете.
              <br />
              Будьте там, де вам добре.
              <br />
              А ми завжди будемо раді бачити вас у Фартлек. 🫶
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;

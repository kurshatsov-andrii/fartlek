import { useL } from "@/lib/use-l";
import { SEO } from "@/components/SEO";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";
import { PLATFORM_SINCE_UK, PLATFORM_SINCE_EN } from "@/lib/platform-since";
import { GrowthCharts } from "@/components/GrowthCharts";
import { getPlatformStats } from "@/lib/platform-stats.functions";

const TITLE = "Фартлек у цифрах — результати бігової платформи";
const DESCRIPTION = "Ключові показники Фартлек: зареєстровані бігуни, онлайн-реєстрації, події та старти, організатори, міста й клуби. Цифри оновлюються автоматично.";
const URL = "https://fartlek.com.ua/results";

export const Route = createFileRoute("/results")({
  loader: () => getPlatformStats(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Фартлек у цифрах", path: "/results" }]))],
  }),
  component: ResultsPage,
});



function ResultsPage() {
  const L = useL();
  const fmt = (n: number) => n.toLocaleString(L("uk-UA", "en-GB"));
  const { stats: s, growth } = Route.useLoaderData();
  const metrics = s ? [
    { v: s.runners, l: L("зареєстрованих бігунів", "registered runners") },
    { v: s.registrations, l: L("онлайн-реєстрацій на змагання", "online race registrations") },
    { v: s.events, l: L("подій та стартів на платформі", "events and races on the platform") },
    { v: s.organizers, l: L("організаторів", "organizers") },
    { v: s.cities, l: L("міст", "cities") },
    { v: s.clubs, l: L("бігових клубів", "running clubs") },
  ] : [];
  const features = [
    { t: L("Повний цикл реєстрації", "Complete registration journey"), d: L("Онлайн-реєстрація, оплата, квитки з QR-кодом, стартові номери та списки учасників — в одному місці.", "Online registration, payments, QR-code tickets, race bibs and participant lists — all in one place.") },
    { t: L("Календар стартів України", "Ukraine race calendar"), d: L("Події Фартлек і старти організаторів з усієї країни: фільтри за містом, дистанцією, місяцем, окремі міські календарі та мапа.", "Fartlek events and races from organizers across Ukraine: filters by city, distance and month, dedicated city calendars and a map.") },
    { t: L("Планувальник бігуна", "Runner planner"), d: L("Збереження стартів, нагадування про відкриття реєстрації та зміну дати, експорт у календар телефону.", "Saved races, reminders about registration opening and date changes, and export to your phone calendar.") },
    { t: L("Інструменти для організаторів", "Organizer tools"), d: L("Сторінка події, керування учасниками, естафетні команди, PDF-списки для друку.", "Event pages, participant management, relay teams and printable PDF lists.") },
    { t: L("Спільнота", "Community"), d: L("Клуби, організатори, відгуки, поради та блог — найбільша бігова спільнота Харкова.", "Clubs, organizers, reviews, tips and a blog — Kharkiv’s largest running community.") },
    { t: L("Дві мови та мобільність", "Two languages, every device"), d: L("Українська й англійська версії, зручний інтерфейс на телефоні, планшеті та комп'ютері.", "Ukrainian and English versions, with a convenient experience on phones, tablets and computers.") },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={L(TITLE, "Fartlek in numbers — running platform results")} description={L(DESCRIPTION, "Fartlek key figures: registered runners, online registrations, events and races, organizers, cities and clubs. Figures update automatically.")} canonical="/results" />
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">{L("Фартлек у цифрах", "Fartlek in numbers")}</h1>
        <p className="text-muted-foreground text-lg mb-10">{L(`Фартлек — українська платформа спортивних подій та бігова спільнота. Платформу запущено ${PLATFORM_SINCE_UK}. Показники нижче оновлюються автоматично з реальних даних сайту.`, `Fartlek is a Ukrainian sports events platform and running community. The platform launched on ${PLATFORM_SINCE_EN}. The figures below update automatically from actual website data.`)}</p>

        {metrics.length > 0 && (
          <section aria-labelledby="metrics" className="mb-12">
            <h2 id="metrics" className="text-2xl font-bold mb-6">{L("Ключові показники", "Key figures")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((m) => (
                <div key={m.l} className="rounded-2xl border border-border bg-card p-6">
                  <div className="text-4xl md:text-5xl font-bold text-primary">{fmt(m.v)}</div>
                  <div className="mt-2 text-muted-foreground">{m.l}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {growth.length > 1 && <GrowthCharts data={growth} />}

        <section aria-labelledby="features" className="mb-12">
          <h2 id="features" className="text-2xl font-bold mb-6">{L("Що вміє платформа", "Platform capabilities")}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.t} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold text-lg mb-2">{f.t}</h3>
                <p className="text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 flex flex-wrap gap-3">
          <Link to="/starts" className="rounded-full bg-primary text-primary-foreground px-5 py-2 font-medium">{L("Знайти старт", "Find a race")}</Link>
          <Link to="/for-organizers" className="rounded-full border border-border px-5 py-2 font-medium hover:text-primary">{L("Організаторам", "For organizers")}</Link>
          <Link to="/contacts" className="rounded-full border border-border px-5 py-2 font-medium hover:text-primary">{L("Контакти", "Contacts")}</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

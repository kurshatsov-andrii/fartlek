import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";
import { PLATFORM_SINCE_UK } from "@/lib/platform-since";
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

const fmt = (n: number) => n.toLocaleString("uk-UA");

function ResultsPage() {
  const { stats: s, growth } = Route.useLoaderData();
  const metrics = s ? [
    { v: s.runners, l: "зареєстрованих бігунів" },
    { v: s.registrations, l: "онлайн-реєстрацій на змагання" },
    { v: s.events, l: "подій та стартів на платформі" },
    { v: s.organizers, l: "організаторів" },
    { v: s.cities, l: "міст" },
    { v: s.clubs, l: "бігових клубів" },
  ] : [];
  const features = [
    { t: "Повний цикл реєстрації", d: "Онлайн-реєстрація, оплата, квитки з QR-кодом, стартові номери та списки учасників — в одному місці." },
    { t: "Календар стартів України", d: "Події Фартлек і старти організаторів з усієї країни: фільтри за містом, дистанцією, місяцем, окремі міські календарі та мапа." },
    { t: "Планувальник бігуна", d: "Збереження стартів, нагадування про відкриття реєстрації та зміну дати, експорт у календар телефону." },
    { t: "Інструменти для організаторів", d: "Сторінка події, керування учасниками, естафетні команди, PDF-списки для друку." },
    { t: "Спільнота", d: "Клуби, організатори, відгуки, поради та блог — найбільша бігова спільнота Харкова." },
    { t: "Дві мови та мобільність", d: "Українська й англійська версії, зручний інтерфейс на телефоні, планшеті та комп'ютері." },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">Фартлек у цифрах</h1>
        <p className="text-muted-foreground text-lg mb-10">Фартлек — українська платформа спортивних подій та бігова спільнота. Платформу запущено {PLATFORM_SINCE_UK}. Показники нижче оновлюються автоматично з реальних даних сайту.</p>

        {metrics.length > 0 && (
          <section aria-labelledby="metrics" className="mb-12">
            <h2 id="metrics" className="text-2xl font-bold mb-6">Ключові показники</h2>
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
          <h2 id="features" className="text-2xl font-bold mb-6">Що вміє платформа</h2>
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
          <Link to="/starts" className="rounded-full bg-primary text-primary-foreground px-5 py-2 font-medium">Знайти старт</Link>
          <Link to="/for-organizers" className="rounded-full border border-border px-5 py-2 font-medium hover:text-primary">Організаторам</Link>
          <Link to="/contacts" className="rounded-full border border-border px-5 py-2 font-medium hover:text-primary">Контакти</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

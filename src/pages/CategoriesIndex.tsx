import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useApp } from "@/contexts/AppContext";
import { EVENT_CATEGORIES } from "@/lib/i18n";

const CategoriesIndex = () => {
  const { t, lang } = useApp();
  const seo = lang === "uk"
    ? {
        title: "Категорії подій — Fartlek Events",
        description: "Усі категорії спортивних подій в Україні: забіги, напівмарафони, марафони, ультра, трейли, OCR та онлайн-старти.",
      }
    : {
        title: "Event categories — Fartlek Events",
        description: "All sports event categories in Ukraine: runs, half marathons, marathons, ultras, trails, OCR and online races.",
      };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seo.title} description={seo.description} canonical="/category" />
      <Header />
      <main className="flex-1 container py-12 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t.events.backToEvents}
        </Link>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
          {lang === "uk" ? "Категорії подій" : "Event categories"}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">{seo.description}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_CATEGORIES.map((c) => (
            <Link
              key={c}
              to={`/category/${c}`}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-bounce hover:-translate-y-1 hover:border-primary hover:shadow-elevated"
            >
              <h2 className="font-display text-2xl font-bold group-hover:text-primary transition-base">
                {t.categories[c]}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {lang === "uk" ? "Переглянути події" : "Browse events"} →
              </p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoriesIndex;

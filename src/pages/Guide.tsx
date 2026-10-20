import { Link } from "@/lib/router-compat";
import { Sparkles, MessagesSquare, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { VideoTutorialSection } from "@/components/VideoTutorialSection";

export default function Guide() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Гайд — Як користуватися платформою Фартлек"
        description="Відео-гайд Фартлек: як знайти забіг, зареєструватися (себе або дитину), оплатити участь та отримати QR-квиток."
        canonical="/guide"
      />
      <Header />

      <main>
        <section className="container pt-12 sm:pt-16 pb-4 text-center max-w-3xl">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary">
            Гайд
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Як користуватися <span className="text-gradient">платформою</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Коротке відео-знайомство: як знайти забіг, зареєструватися (себе або дитину),
            оплатити та отримати QR-квиток.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/features" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> Усі можливості платформи
            </Link>
            <Link to="/survey" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              <MessagesSquare className="h-4 w-4" /> Пройти опитування
            </Link>
            <Link to="/testimonials" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              <Star className="h-4 w-4" /> Відгуки користувачів
            </Link>
          </div>
        </section>

        <VideoTutorialSection />
      </main>

      <Footer />
    </div>
  );
}

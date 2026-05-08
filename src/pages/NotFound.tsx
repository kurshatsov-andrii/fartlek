import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="404 — сторінку не знайдено | Fartlek"
        description="Здається, ви забігли не туди. Поверніться на головну і знайдіть свій наступний старт."
        canonical="/404"
      />
      <Header />
      <main className="flex-1 container flex items-center justify-center py-20">
        <div className="max-w-2xl text-center">
          <div className="font-display text-[120px] sm:text-[180px] font-bold leading-none text-primary">
            404
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-4">
            Здається, ви звернули не на той маршрут
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Навіть найкращі бігуни іноді збиваються з траси. Головне — не зупинятись.
            Поверніться на старт, виберіть свою наступну дистанцію та продовжуйте рухатись уперед.
          </p>
          <p className="mt-4 text-base text-muted-foreground italic">
            «Кожен фініш починається з рішення зробити перший крок.»
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="h-4 w-4" />
                На головну
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/calendar">
                Календар забігів
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;

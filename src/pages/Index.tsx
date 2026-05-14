import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { VideoTutorialSection } from "@/components/VideoTutorialSection";
import { FeaturesCarousel } from "@/components/FeaturesCarousel";
import { EventsSection } from "@/components/EventsSection";
import { CompletedEventsSection } from "@/components/CompletedEventsSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { lang } = useApp();
  const { user } = useAuth();
  const seo = lang === "uk"
    ? {
        title: "Fartlek Events — реєстрація на забіги в Україні",
        description: "Забіги, напівмарафони, марафони, ультра, трейли, OCR та онлайн-старти по всій Україні. Онлайн-реєстрація, QR-квитки, миттєві результати.",
      }
    : {
        title: "Fartlek Events — race registration in Ukraine",
        description: "Runs, half marathons, marathons, ultras, trails, OCR and online races across Ukraine. Online registration, QR tickets, instant results.",
      };
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Fartlek Events",
      url: "https://fartlek.lovable.app/",
      logo: "https://fartlek.lovable.app/favicon.ico",
      sameAs: ["https://fartlek.com.ua"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Fartlek Events",
      url: "https://fartlek.lovable.app/",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://fartlek.lovable.app/calendar?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seo.title} description={seo.description} canonical="/" jsonLd={jsonLd} />
      <Header />
      <main className="flex-1">
        <Hero />
        {!user && <VideoTutorialSection />}
        {!user && <FeaturesCarousel />}
        <EventsSection />
        <CompletedEventsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

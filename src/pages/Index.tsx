import { Link } from "@/lib/router-compat";
import { Header } from "@/components/Header";
import { HomeSearchHero } from "@/components/HomeSearchHero";
import { HomeDirectory } from "@/components/HomeDirectory";
import { EventsSection } from "@/components/EventsSection";
import { CompletedEventsSection } from "@/components/CompletedEventsSection";
import { SiSPartnerBanner } from "@/components/SiSPartnerBanner";
import { TelegramCommunity } from "@/components/TelegramCommunity";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useApp } from "@/contexts/AppContext";
import { discoverySeo } from "@/lib/discovery-seo";

const Index = () => {
  const { lang } = useApp();
  const about = lang === "uk"
    ? {
        eyebrow: "Про нас",
        title: "ФАРТЛЕК — ЗА ОБ'ЄДНАННЯ ВСІХ БІГУНІВ!",
        text: "Ми — бігова спільнота Фартлек: за свободу вибору бігуна, єдність бігунів Харкова та інших міст і бігову культуру без поділу на «наших» і «чужих». Більше бігу. Більше дружби. Менше поділу.",
        cta: "Дізнатися більше про нас",
      }
    : {
        eyebrow: "About us",
        title: "FARTLEK — FOR UNITING ALL RUNNERS!",
        text: "We are the Fartlek running community: for the runner's freedom of choice, unity of runners in Kharkiv and beyond, and running culture without division.",
        cta: "Learn more about us",
      };
  const seo = discoverySeo("/", lang);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Fartlek Events",
      url: "https://fartlek.com.ua/",
      logo: "https://fartlek.com.ua/favicon.png",
      sameAs: ["https://fartlek.com.ua"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Fartlek Events",
      url: "https://fartlek.com.ua/",
    },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seo.title} description={seo.description} canonical="/" jsonLd={jsonLd} />
      <Header />
      <main className="flex-1">
        <HomeSearchHero />
        <EventsSection />
        <HomeDirectory />
        <TelegramCommunity />
        <CompletedEventsSection />
        <section className="container pb-12">
          <SiSPartnerBanner />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {about.text.split(".")[0]}.{" "}
            <Link to="/about" className="font-semibold text-primary hover:underline">{about.cta}</Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

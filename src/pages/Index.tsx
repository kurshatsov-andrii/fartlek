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
  const seo = discoverySeo("/", lang);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seo.title} description={seo.description} canonical="/" />
      <Header />
      <main className="flex-1">
        <HomeSearchHero />
        <EventsSection />
        <HomeDirectory />
        <TelegramCommunity showBlog />
        <section className="container py-6 sm:py-8">
          <h2 className="mb-4 text-center font-display text-2xl font-bold sm:text-3xl">{lang === "uk" ? "ПАРТНЕРИ" : "PARTNERS"}</h2>
          <SiSPartnerBanner />
        </section>
        <CompletedEventsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

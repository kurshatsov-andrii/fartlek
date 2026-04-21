import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { EventsSection } from "@/components/EventsSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <EventsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

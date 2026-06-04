import { Link } from "react-router-dom";
import { Mail, Phone, Send, MapPin, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useApp } from "@/contexts/AppContext";

const Contacts = () => {
  const { lang } = useApp();

  const seo = lang === "uk"
    ? { title: "Контакти — Fartlek Events", description: "Зв'яжіться з командою Fartlek Events: email, телефон, Telegram. Україна, Харків." }
    : { title: "Contacts — Fartlek Events", description: "Get in touch with Fartlek Events: email, phone, Telegram. Ukraine, Kharkiv." };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seo.title} description={seo.description} canonical="/contacts" />
      <Header />
      <main className="flex-1 container py-12 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {lang === "uk" ? "До списку подій" : "Back to events"}
        </Link>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
          {lang === "uk" ? "Контакти" : "Contacts"}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">{seo.description}</p>

        <div className="mt-10 grid gap-4 max-w-2xl">
          <a href="mailto:info@fartlek.com.ua" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-base hover:border-primary">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Email</div>
              <div className="font-semibold">info@fartlek.com.ua</div>
            </div>
          </a>
          <a href="tel:+380972520551" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-base hover:border-primary">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{lang === "uk" ? "Телефон" : "Phone"}</div>
              <div className="font-semibold">+38 097 252 05 51</div>
            </div>
          </a>
          <a href="https://t.me/Andres_K" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-base hover:border-primary">
            <Send className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Telegram</div>
              <div className="font-semibold">@Andres_K</div>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{lang === "uk" ? "Адреса" : "Address"}</div>
              <div className="font-semibold">{lang === "uk" ? "Харків, вул. Власенка 24" : "Kharkiv, Vlasenka St. 24"}</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contacts;

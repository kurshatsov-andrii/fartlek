import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, ExternalLink, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { linkify } from "@/lib/linkify";

interface StartRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  register_url: string | null;
  event_date: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

const StartDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [row, setRow] = useState<StartRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("telegram_starts")
        .select("id,slug,title,description,image_url,register_url,event_date,seo_title,seo_description")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setRow(data as StartRow);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  );

  if (notFound || !row) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-20 text-center">
        <h1 className="font-display text-2xl mb-4">Старт не знайдено</h1>
        <Button asChild><Link to="/starts">До всіх стартів</Link></Button>
      </main>
      <Footer />
    </div>
  );

  const fmtDate = (d: string | null) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={row.seo_title || `${row.title} — Старти Fartlek`}
        description={(row.seo_description || row.description || "").slice(0, 160)}
        image={row.image_url || undefined}
      />
      <Header />
      <main className="flex-1 container py-10 max-w-3xl">
        <Link to="/starts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> До всіх стартів
        </Link>

        {row.image_url && (
          <div className="rounded-lg overflow-hidden mb-6 bg-muted">
            <img src={row.image_url} alt={row.title} className="w-full h-auto" />
          </div>
        )}

        <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{row.title || "Без назви"}</h1>

        {row.event_date && (
          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <CalendarIcon className="h-4 w-4" />{fmtDate(row.event_date)}
          </div>
        )}

        <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words mb-8 text-foreground">
          {linkify(row.description || "")}
        </div>

        {row.register_url && (
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href={row.register_url} target="_blank" rel="noreferrer">
              Зареєструватися <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StartDetails;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface StartRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  register_url: string | null;
  event_date: string | null;
}

const Starts = () => {
  const [rows, setRows] = useState<StartRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("telegram_starts")
        .select("id,slug,title,description,image_url,register_url,event_date")
        .eq("status", "published")
        .gte("event_date", "2026-07-01")
        .order("event_date", { ascending: true });
      setRows((data ?? []) as StartRow[]);
      setLoading(false);
    })();
  }, []);

  const fmtDate = (d: string | null) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Старти — Fartlek"
        description="Найближчі бігові, велосипедні та триатлонні старти. Реєстрація, опис, дати — оновлюємо щодня з телеграм-каналу Фартлек."
      />
      <Header />
      <main className="flex-1 container py-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Старти</h1>
        <p className="text-muted-foreground mb-8">
          Анонси найближчих стартів з телеграм-каналу{" "}
          <a href="https://t.me/fartlekua" target="_blank" rel="noreferrer" className="underline">@fartlekua</a>.
        </p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">Поки що немає опублікованих стартів.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map((r) => (
              <Card key={r.id} className="overflow-hidden flex flex-col">
                {r.image_url && (
                  <Link to={`/starts/${r.slug}`} className="block aspect-video bg-muted overflow-hidden">
                    <img src={r.image_url} alt={r.title} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </Link>
                )}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {r.event_date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3.5 w-3.5" />{fmtDate(r.event_date)}
                    </div>
                  )}
                  <h2 className="font-semibold text-lg leading-snug">
                    <Link to={`/starts/${r.slug}`} className="hover:underline">{r.title || "Без назви"}</Link>
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{r.description}</p>
                  <div className="flex gap-2 pt-1">
                    <Button asChild size="sm" variant="secondary" className="flex-1">
                      <Link to={`/starts/${r.slug}`}>Детальніше</Link>
                    </Button>
                    {r.register_url && (
                      <Button asChild size="sm" className="flex-1">
                        <a href={r.register_url} target="_blank" rel="noreferrer">
                          Зареєструватися <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Starts;

import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Calendar as CalendarIcon, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";

interface StartRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  register_url: string | null;
  event_date: string | null;
  city: string | null;
  distances_km: number[] | null;
}

const PAGE_SIZE = 6;

export const OtherStartsSection = () => {
  const { lang } = useApp();
  const [rows, setRows] = useState<StartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("telegram_starts")
      .select("id,slug,title,description,image_url,register_url,event_date,city,distances_km")
      .eq("status", "published")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .then(({ data }) => {
        setRows((data as any) ?? []);
        setLoading(false);
      });
  }, []);

  const fmtDate = (d: string | null) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) return null;

  const visible = rows.slice(0, limit);

  return (
    <section className="border-t border-border pt-14 mt-20">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {lang === "uk" ? "Інші старти в Україні" : "Other races in Ukraine"}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {lang === "uk"
            ? "Анонси змагань від інших організаторів. Реєстрація відбувається на сайті організатора."
            : "Announcements from other organizers. Registration happens on the organizer's own website."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((r) => (
          <article key={r.id} className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-bounce hover:-translate-y-1 hover:shadow-elevated">
            <Link to={`/starts/${r.slug}`} className="relative aspect-video w-full overflow-hidden bg-muted block" aria-label={r.title}>
              {r.image_url ? (
                <img src={r.image_url} alt={r.title} loading="lazy" className="h-full w-full max-w-full object-contain transition-transform duration-700 group-hover:scale-105" />

              ) : (
                <div className="h-full w-full bg-gradient-hero" />
              )}
              <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-background/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                {lang === "uk" ? "Анонс" : "Announcement"}
              </span>
              {(r.distances_km || []).length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
                  {[...(r.distances_km || [])].sort((a, b) => Number(b) - Number(a)).slice(0, 4).map((d) => (
                    <span key={String(d)} className="rounded-md bg-background/95 px-2 py-1 text-xs font-bold text-foreground">{d} km</span>
                  ))}
                </div>
              )}
            </Link>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-display text-xl font-bold leading-tight">
                <Link to={`/starts/${r.slug}`} className="hover:underline">{r.title}</Link>
              </h3>
              <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                {r.event_date && (
                  <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" />{fmtDate(r.event_date)}</div>
                )}
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{r.city || (lang === "uk" ? "Україна та весь світ" : "Ukraine and worldwide")}</div>
              </div>
              <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border">
                <Button asChild variant="secondary" className="flex-1">
                  <Link to={`/starts/${r.slug}`}>{lang === "uk" ? "Детальніше" : "Details"}</Link>
                </Button>
                {r.register_url && (
                  <Button asChild variant="outline" className="flex-1">
                    <a href={r.register_url} target="_blank" rel="noreferrer">
                      {lang === "uk" ? "На сайт" : "Website"} <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex justify-center gap-3 mt-10">
        {limit < rows.length && (
          <Button variant="outline" size="lg" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
            {lang === "uk" ? "Завантажити ще" : "Load more"} ({rows.length - limit})
          </Button>
        )}
        <Button asChild size="lg">
          <Link to="/starts">{lang === "uk" ? "Усі старти" : "All races"}</Link>
        </Button>
      </div>
    </section>
  );
};

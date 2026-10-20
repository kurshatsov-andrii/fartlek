import { useEffect, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { formatBlogDate, youtubeEmbed } from "@/lib/blog";
import { tipCategory, type RunningTip } from "@/lib/tips";

const TipArticle = () => {
  const { slug } = useParams() as { slug: string };
  const [tip, setTip] = useState<RunningTip | null | undefined>(undefined);

  useEffect(() => {
    supabase.from("running_tips").select("*").eq("slug", slug).maybeSingle()
      .then(({ data }) => setTip((data as RunningTip) ?? null));
  }, [slug]);

  const cat = tip ? tipCategory(tip.category) : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8 space-y-8">
        <Link to={cat ? `/tips/${cat.slug}` : "/tips"} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />{cat ? `Поради: ${cat.name}` : "Поради бігунам"}
        </Link>
        {tip === undefined ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : tip === null ? (
          <p className="text-muted-foreground">Статтю не знайдено.</p>
        ) : (
          <article className="space-y-6">
            <header className="space-y-3">
              <h1 className="font-display text-3xl md:text-4xl font-bold">{tip.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {cat && <Link to={`/tips/${cat.slug}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{cat.name}</Link>}
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatBlogDate(tip.published_on)}</span>
              </div>
            </header>
            {tip.cover_url && <img src={tip.cover_url} alt={tip.title} className="w-full rounded-2xl object-cover max-h-[520px]" />}
            {tip.excerpt && <p className="text-lg text-muted-foreground">{tip.excerpt}</p>}
            {tip.content && <div className="whitespace-pre-line leading-relaxed text-foreground/90">{tip.content}</div>}
            {youtubeEmbed(tip.youtube_url ?? null) && (
              <div className="aspect-video rounded-2xl overflow-hidden border border-border">
                <iframe src={youtubeEmbed(tip.youtube_url ?? null)!} title={tip.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TipArticle;

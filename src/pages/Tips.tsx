import { useL } from "@/lib/use-l";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Calendar, Loader2, Settings } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { EventPoster } from "@/components/EventPoster";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBlogDate } from "@/lib/blog";
import { localizeTip, TIP_CATEGORIES, tipCategory, tipPath, type RunningTip } from "@/lib/tips";
import logo from "@/assets/logo-fartlek.jpg";

const TIP_NAMES_EN: Record<string, string> = {
  ekipiruvannia: "Gear", hodynnyky: "Watches", trenuvannia: "Training",
  starty: "Races", kharchuvannia: "Nutrition", vidnovlennia: "Recovery",
};

const Tips = ({ category }: { category?: string }) => {
  const L = useL();
  const catName = (c: { slug: string; name: string }) => L(c.name, TIP_NAMES_EN[c.slug] ?? c.name);
  const { isAdmin } = useAuth();
  const [tips, setTips] = useState<RunningTip[] | null>(null);
  const cat = category ? tipCategory(category) : undefined;

  useEffect(() => {
    setTips(null);
    let q = supabase.from("running_tips").select("*").eq("is_published", true).order("published_on", { ascending: false });
    if (category) q = q.eq("category", category);
    q.then(({ data }) => setTips((data as RunningTip[]) ?? []));
  }, [category]);

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-base ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              {cat ? L(`Поради бігунам: ${cat.name.toLowerCase()}`, `Running tips: ${catName(cat).toLowerCase()}`) : L("Поради бігунам — підготовка до забігів, екіпірування та тренування", "Running tips — race preparation, gear and training")}
            </h1>
            {cat ? (
              L(<p className="text-muted-foreground">{cat.description}</p>, null)
            ) : (
              <div className="space-y-3 text-muted-foreground">
                <h2 className="font-display text-xl font-semibold text-foreground">{L("Поради бігунам — усе, що потрібно знати про біг", "Running tips — everything you need to know about running")}</h2>
                <p>{L("Як почати бігати, правильно обрати екіпірування, підготуватися до першого забігу або подолати марафон? У розділі «Поради бігунам» від Фартлек зібрані практичні статті, які допоможуть бігати комфортніше, тренуватися ефективніше та впевнено виходити на старт.", "How do you start running, choose the right gear, prepare for your first race or finish a marathon? Fartlek’s running tips collect practical articles to help you run more comfortably, train more effectively and line up at the start with confidence.")}</p>
                <p>{L("Читайте про бігові кросівки та правильне шнурування, спортивні годинники й GPS, контроль пульсу, техніку бігу, спортивне харчування, відновлення після тренувань і підготовку до дистанцій 5 км, 10 км, напівмарафону та марафону.", "Read about running shoes and lacing, sports watches and GPS, heart rate, running technique, sports nutrition, recovery and preparing for 5K, 10K, half marathon and marathon distances.")}</p>
                <p>{L("Фартлек — ваш помічник у світі бігу: від перших кілометрів до нових особистих рекордів.", "Fartlek is your running companion, from the first kilometres to new personal bests.")}</p>
              </div>
            )}
          </div>
          {isAdmin && <Button asChild variant="outline"><Link to="/admin/tips"><Settings className="h-4 w-4" />{L("Керувати порадами", "Manage tips")}</Link></Button>}
        </div>

        <nav aria-label={L("Категорії порад", "Tip categories")} className="flex flex-wrap gap-2">
          <Link to="/tips" className={pill(!category)}>{L("Усі", "All")}</Link>
          {TIP_CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/tips/${c.slug}`} className={pill(category === c.slug)}>{catName(c)}</Link>
          ))}
        </nav>

        {tips === null ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : tips.length === 0 ? (
          <p className="text-muted-foreground">{L("Статей у цьому розділі поки немає — незабаром з'являться.", "No articles in this section yet — coming soon.")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tips.map((raw) => localizeTip(raw, L("uk", "en"))).map((t) => (
              <Link key={t.id} to={tipPath(t)} className="group rounded-2xl overflow-hidden border border-border bg-card transition-bounce hover:-translate-y-2 hover:shadow-elevated isolate">
                <div className="aspect-video bg-muted overflow-hidden">
                  <EventPoster src={t.cover_url || logo} alt={t.title} />
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{(() => { const c = tipCategory(t.category); return c ? catName(c) : null; })()}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatBlogDate(t.published_on, L("uk", "en"))}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold group-hover:text-primary transition-base">{t.title}</h2>
                  {t.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{t.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Tips;

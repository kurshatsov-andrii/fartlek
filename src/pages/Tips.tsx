import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Calendar, Loader2, Settings } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBlogDate } from "@/lib/blog";
import { TIP_CATEGORIES, tipCategory, tipPath, type RunningTip } from "@/lib/tips";
import logo from "@/assets/logo-fartlek.jpg";

const Tips = ({ category }: { category?: string }) => {
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
              {cat ? `Поради бігунам: ${cat.name.toLowerCase()}` : "Поради бігунам — підготовка до забігів, екіпірування та тренування"}
            </h1>
            {cat ? (
              <p className="text-muted-foreground">{cat.description}</p>
            ) : (
              <div className="space-y-3 text-muted-foreground">
                <h2 className="font-display text-xl font-semibold text-foreground">Поради бігунам — усе, що потрібно знати про біг</h2>
                <p>Як почати бігати, правильно обрати екіпірування, підготуватися до першого забігу або подолати марафон? У розділі «Поради бігунам» від Фартлек зібрані практичні статті, які допоможуть бігати комфортніше, тренуватися ефективніше та впевнено виходити на старт.</p>
                <p>Читайте про бігові кросівки та правильне шнурування, спортивні годинники й GPS, контроль пульсу, техніку бігу, спортивне харчування, відновлення після тренувань і підготовку до дистанцій 5 км, 10 км, напівмарафону та марафону.</p>
                <p>Фартлек — ваш помічник у світі бігу: від перших кілометрів до нових особистих рекордів.</p>
              </div>
            )}
          </div>
          {isAdmin && <Button asChild variant="outline"><Link to="/admin/tips"><Settings className="h-4 w-4" />Керувати порадами</Link></Button>}
        </div>

        <nav aria-label="Категорії порад" className="flex flex-wrap gap-2">
          <Link to="/tips" className={pill(!category)}>Усі</Link>
          {TIP_CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/tips/${c.slug}`} className={pill(category === c.slug)}>{c.name}</Link>
          ))}
        </nav>

        {tips === null ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : tips.length === 0 ? (
          <p className="text-muted-foreground">Статей у цьому розділі поки немає — незабаром з'являться.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tips.map((t) => (
              <Link key={t.id} to={tipPath(t)} className="group rounded-2xl overflow-hidden border border-border bg-card transition-bounce hover:-translate-y-2 hover:shadow-elevated isolate">
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  <img src={t.cover_url || logo} alt={t.title} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{tipCategory(t.category)?.name}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatBlogDate(t.published_on)}</span>
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

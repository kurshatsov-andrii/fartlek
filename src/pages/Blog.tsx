import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Calendar, MapPin, Loader2, Settings } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BlogSocialLinks } from "@/components/BlogSocialLinks";
import { PageViews } from "@/components/PageViews";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BlogPost, formatBlogDate } from "@/lib/blog";
import logo from "@/assets/logo-fartlek.jpg";
import { BlogHeadingEditor } from "@/components/BlogHeadingEditor";

const DEFAULT_H1 = "Блог Фартлек";
const DEFAULT_SUB = "Бігова команда та спільнота Харкова: фото, відео та історії з наших забігів.";

const Blog = () => {
  const { isAdmin, user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [head, setHead] = useState({ h1: "", subtitle: "", title: "", description: "" });

  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("is_published", true)
      .order("event_date", { ascending: false })
      .then(({ data }) => setPosts((data as BlogPost[]) ?? []));
    supabase.from("seo_overrides").select("h1,subtitle,title,description").eq("path", "/blog").maybeSingle()
      .then(({ data }) => data && setHead({
        h1: data.h1 ?? "", subtitle: data.subtitle ?? "", title: data.title ?? "", description: data.description ?? "",
      }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-10 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">{head.h1 || DEFAULT_H1}</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl whitespace-pre-line">{head.subtitle || DEFAULT_SUB}</p>
            <PageViews pageKey="page:blog" className="mt-3" />
          </div>
          {isAdmin && user && (
            <div className="flex flex-wrap gap-2">
              <BlogHeadingEditor path="/blog" userId={user.id} {...head} onSaved={setHead} />
              <Button asChild variant="outline"><Link to="/admin/blog"><Settings className="h-4 w-4" />Керувати блогом</Link></Button>
            </div>
          )}
        </div>

        <BlogSocialLinks />

        {posts === null ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">Записів поки немає.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group rounded-2xl overflow-hidden border border-border bg-card transition-bounce hover:-translate-y-2 hover:shadow-elevated isolate">
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  <img src={p.cover_url || p.photos[0] || logo} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {p.event_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatBlogDate(p.event_date)}</span>}
                    {p.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.location}</span>}
                  </div>
                  <h2 className="font-display text-xl font-bold group-hover:text-primary transition-base">{p.title}</h2>
                  {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
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

export default Blog;

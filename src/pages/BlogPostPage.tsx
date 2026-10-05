import { useEffect, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ArrowLeft, Calendar, MapPin, Images, Loader2, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BlogSocialLinks } from "@/components/BlogSocialLinks";
import { PageViews } from "@/components/PageViews";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, formatBlogDate, youtubeEmbed } from "@/lib/blog";

const BlogPostPage = () => {
  const { slug } = useParams() as { slug: string };
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle()
      .then(({ data }) => setPost((data as BlogPost) ?? null));
  }, [slug]);

  const embed = youtubeEmbed(post?.youtube_url ?? null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8 max-w-4xl space-y-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />До блогу</Link>
        {post === undefined ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : post === null ? (
          <p className="text-muted-foreground">Запис не знайдено.</p>
        ) : (
          <>
            <header className="space-y-3">
              <h1 className="font-display text-3xl md:text-4xl font-bold">{post.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {post.event_date && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatBlogDate(post.event_date)}</span>}
                {post.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{post.location}</span>}
                <PageViews pageKey={`blog:${post.slug}`} />
              </div>
            </header>
            {post.cover_url && <img src={post.cover_url} alt={post.title} className="w-full rounded-2xl object-cover max-h-[520px]" />}
            {post.content && <div className="whitespace-pre-line leading-relaxed text-foreground/90">{post.content}</div>}

            {embed && (
              <div className="aspect-video rounded-2xl overflow-hidden border border-border">
                <iframe src={embed} title={post.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            )}

            {post.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {post.photos.map((src) => (
                  <button key={src} onClick={() => setOpen(src)} className="aspect-square overflow-hidden rounded-xl bg-muted">
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {post.photos_album_url && (
              <Button asChild size="lg"><a href={post.photos_album_url} target="_blank" rel="noopener noreferrer"><Images className="h-4 w-4" />Усі фото події</a></Button>
            )}
          </>
        )}
        <BlogSocialLinks />
      </main>
      <Footer />
      {open && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <button className="absolute top-4 right-4" aria-label="Закрити"><X className="h-7 w-7" /></button>
          <img src={open} alt="" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
};

export default BlogPostPage;

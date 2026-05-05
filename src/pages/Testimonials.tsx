import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Quote, Trash2, Pencil } from "lucide-react";
import { linkifyText } from "@/lib/linkify";
import { useRef } from "react";

interface Testimonial {
  id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

const Stars = ({
  value,
  onChange,
  size = 24,
}: { value: number; onChange?: (n: number) => void; size?: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={onChange ? () => onChange(n) : undefined}
        className={onChange ? "transition-transform hover:scale-110" : "cursor-default"}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
        disabled={!onChange}
      >
        <Star
          style={{ width: size, height: size }}
          className={n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"}
        />
      </button>
    ))}
  </div>
);

const Testimonials = () => {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("id,user_id,rating,content,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Не вдалося завантажити відгуки");
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Testimonial[];
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    if (ids.length) {
      const { data: authors } = await supabase.rpc("get_chat_authors", { _user_ids: ids });
      const map = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      (authors ?? []).forEach((a: any) => map.set(a.id, { full_name: a.full_name, avatar_url: a.avatar_url }));
      rows.forEach((r) => (r.author = map.get(r.user_id) ?? null));
    }
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const myExisting = items.find((i) => i.user_id === user?.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Увійдіть, щоб залишити відгук");
      return;
    }
    const trimmed = content.trim();
    if (trimmed.length < 3) {
      toast.error("Відгук занадто короткий");
      return;
    }
    if (trimmed.length > 2000) {
      toast.error("Відгук занадто довгий (макс. 2000 символів)");
      return;
    }
    setBusy(true);
    try {
      if (myExisting) {
        const { error } = await supabase
          .from("testimonials")
          .update({ rating, content: trimmed })
          .eq("id", myExisting.id);
        if (error) throw error;
        toast.success("Відгук оновлено");
      } else {
        const { error } = await supabase
          .from("testimonials")
          .insert({ user_id: user.id, rating, content: trimmed });
        if (error) throw error;
        toast.success("Дякуємо за відгук!");
      }
      setContent("");
      setRating(5);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error("Не вдалося надіслати");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Видалити відгук?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) {
      toast.error("Не вдалося видалити");
      return;
    }
    toast.success("Видалено");
    load();
  };

  useEffect(() => {
    if (myExisting && !content) {
      setRating(myExisting.rating);
      setContent(myExisting.content);
    }
  }, [myExisting?.id]);

  const avg = items.length ? items.reduce((s, i) => s + i.rating, 0) / items.length : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Відгуки — Fartlek Events"
        description="Що кажуть учасники та організатори про платформу Fartlek Events."
        canonical="/testimonials"
      />
      <Header />
      <main className="flex-1 py-10 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-4">
              <Quote className="h-3.5 w-3.5" />
              Відгуки
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Що кажуть про Fartlek
            </h1>
            {items.length > 0 && (
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Stars value={Math.round(avg)} size={20} />
                <span className="text-sm">
                  {avg.toFixed(1)} / 5 · {items.length} {items.length === 1 ? "відгук" : "відгуків"}
                </span>
              </div>
            )}
          </div>

          {user ? (
            <Card className="mb-10">
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-lg font-semibold">
                  {myExisting ? "Оновити свій відгук" : "Залишити відгук"}
                </h2>
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ваша оцінка</Label>
                    <Stars value={rating} onChange={setRating} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Ваш відгук</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Поділіться враженнями про платформу…"
                    />
                    <div className="text-xs text-muted-foreground text-right">{content.length}/2000</div>
                  </div>
                  <Button type="submit" disabled={busy}>
                    {busy ? "Надсилаємо…" : myExisting ? "Оновити" : "Надіслати"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-10">
              <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-muted-foreground text-center sm:text-left">
                  Лише користувачі платформи можуть залишати відгуки.
                </p>
                <Button asChild>
                  <Link to="/auth">Увійти / зареєструватися</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground">Завантаження…</p>
            ) : items.length === 0 ? (
              <p className="text-center text-muted-foreground">Ще немає відгуків. Будьте першим!</p>
            ) : (
              items.map((it) => {
                const name = it.author?.full_name || "Користувач";
                const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
                const canDelete = isAdmin || it.user_id === user?.id;
                return (
                  <Card key={it.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          {it.author?.avatar_url && <AvatarImage src={it.author.avatar_url} alt={name} />}
                          <AvatarFallback>{initials || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">{name}</span>
                              <Stars value={it.rating} size={16} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(it.created_at).toLocaleDateString("uk-UA")}
                              </span>
                              {canDelete && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => remove(it.id)}
                                  className="h-7 w-7"
                                  aria-label="Видалити"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-foreground/90">{it.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Testimonials;

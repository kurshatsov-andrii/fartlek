import { useEffect, useState } from "react";
import { Navigate, Link } from "@/lib/router-compat";
import { Loader2, Trash2, Plus, Pencil, X, Upload } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, formatBlogDate } from "@/lib/blog";
import { toast } from "sonner";

const BUCKET = "home-carousel";
const MAX_PHOTOS = 10;

const empty: Omit<BlogPost, "id"> = {
  slug: "", title: "", event_date: null, location: "Харків", excerpt: "", content: "",
  cover_url: null, photos: [], youtube_url: "", photos_album_url: "", is_published: true,
};

const translit = (s: string) => {
  const map: Record<string, string> = { а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ye",ж:"zh",з:"z",и:"y",і:"i",ї:"yi",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"yu",я:"ya","'":"" };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};

const uploadFile = async (file: File) => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

const AdminBlog = () => {
  const { user, isAdmin, loading } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [edit, setEdit] = useState<(Omit<BlogPost, "id"> & { id?: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("blog_posts").select("*").order("event_date", { ascending: false });
    if (error) toast.error(error.message);
    setPosts((data as BlogPost[]) ?? []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const set = (patch: Partial<BlogPost>) => setEdit((e) => (e ? { ...e, ...patch } : e));

  const onCover = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { set({ cover_url: await uploadFile(f) }); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const onPhotos = async (files: FileList | null) => {
    if (!files || !edit) return;
    const room = MAX_PHOTOS - edit.photos.length;
    if (room <= 0) { toast.error(`Максимум ${MAX_PHOTOS} фото`); return; }
    const list = Array.from(files).slice(0, room);
    if (files.length > room) toast.warning(`Додано лише ${room} фото — максимум ${MAX_PHOTOS}`);
    setBusy(true);
    try {
      const urls = await Promise.all(list.map(uploadFile));
      setEdit((e) => (e ? { ...e, photos: [...e.photos, ...urls] } : e));
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const save = async () => {
    if (!edit) return;
    if (!edit.title.trim()) { toast.error("Вкажіть назву"); return; }
    const slug = (edit.slug || translit(edit.title)) || `post-${Date.now()}`;
    const payload = {
      slug, title: edit.title.trim(), event_date: edit.event_date || null, location: edit.location || null,
      excerpt: edit.excerpt || null, content: edit.content || null, cover_url: edit.cover_url,
      photos: edit.photos, youtube_url: edit.youtube_url || null, photos_album_url: edit.photos_album_url || null,
      is_published: edit.is_published,
    };
    setBusy(true);
    const { error } = edit.id
      ? await supabase.from("blog_posts").update(payload).eq("id", edit.id)
      : await supabase.from("blog_posts").insert({ ...payload, created_by: user.id });
    setBusy(false);
    if (error) { toast.error(error.message.includes("duplicate") ? "Такий адрес сторінки вже існує" : error.message); return; }
    toast.success("Збережено");
    setEdit(null);
    load();
  };

  const remove = async (p: BlogPost) => {
    if (!confirm(`Видалити «${p.title}»?`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", p.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Адмін-панель</Link>
            <h1 className="font-display text-3xl font-bold">Блог</h1>
          </div>
          {!edit && <Button onClick={() => setEdit({ ...empty })}><Plus className="h-4 w-4" />Додати подію</Button>}
        </div>

        {edit ? (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Назва *</Label><Input value={edit.title} onChange={(e) => set({ title: e.target.value })} /></div>
              <div><Label>Дата</Label><Input type="date" value={edit.event_date ?? ""} onChange={(e) => set({ event_date: e.target.value })} /></div>
              <div><Label>Місце</Label><Input value={edit.location ?? ""} onChange={(e) => set({ location: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Адреса сторінки (необов'язково)</Label><Input placeholder="створиться з назви" value={edit.slug} onChange={(e) => set({ slug: translit(e.target.value) })} /></div>
              <div className="sm:col-span-2"><Label>Короткий опис</Label><Textarea rows={2} value={edit.excerpt ?? ""} onChange={(e) => set({ excerpt: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Текст</Label><Textarea rows={6} value={edit.content ?? ""} onChange={(e) => set({ content: e.target.value })} /></div>
              <div><Label>Посилання на відео YouTube</Label><Input placeholder="https://youtube.com/..." value={edit.youtube_url ?? ""} onChange={(e) => set({ youtube_url: e.target.value })} /></div>
              <div><Label>Посилання на всі фото</Label><Input placeholder="Google Photos, Drive..." value={edit.photos_album_url ?? ""} onChange={(e) => set({ photos_album_url: e.target.value })} /></div>
            </div>

            <div className="space-y-2">
              <Label>Обкладинка</Label>
              {edit.cover_url && (
                <div className="relative w-64">
                  <img src={edit.cover_url} alt="" className="rounded-lg aspect-[16/10] object-cover w-full" />
                  <button className="absolute top-1 right-1 bg-background/80 rounded-full p-1" onClick={() => set({ cover_url: null })}><X className="h-4 w-4" /></button>
                </div>
              )}
              <Input type="file" accept="image/*" disabled={busy} onChange={(e) => onCover(e.target.files?.[0])} />
            </div>

            <div className="space-y-2">
              <Label>Фото ({edit.photos.length}/{MAX_PHOTOS})</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {edit.photos.map((src) => (
                  <div key={src} className="relative">
                    <img src={src} alt="" className="aspect-square object-cover rounded-lg w-full" />
                    <button className="absolute top-1 right-1 bg-background/80 rounded-full p-1" onClick={() => set({ photos: edit.photos.filter((x) => x !== src) })}><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
              {edit.photos.length < MAX_PHOTOS && (
                <Input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => { onPhotos(e.target.files); e.target.value = ""; }} />
              )}
            </div>

            <div className="flex items-center gap-2"><Switch checked={edit.is_published} onCheckedChange={(v) => set({ is_published: v })} /><span className="text-sm">Опубліковано</span></div>

            <div className="flex gap-2">
              <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Зберегти</Button>
              <Button variant="outline" onClick={() => setEdit(null)} disabled={busy}>Скасувати</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
                {p.cover_url ? <img src={p.cover_url} alt="" className="h-14 w-20 rounded object-cover" /> : <div className="h-14 w-20 rounded bg-muted" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.title} {!p.is_published && <span className="text-xs text-muted-foreground">(чернетка)</span>}</div>
                  <div className="text-xs text-muted-foreground">{formatBlogDate(p.event_date)} · {p.photos.length} фото{p.youtube_url ? " · відео" : ""}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setEdit({ ...p })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminBlog;

import { useEffect, useState } from "react";
import { compressImage } from "@/lib/compress-image";
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
import { formatBlogDate } from "@/lib/blog";
import { TIP_CATEGORIES, tipCategory, type RunningTip } from "@/lib/tips";
import { toast } from "sonner";

const BUCKET = "home-carousel";
type Draft = Omit<RunningTip, "id"> & { id?: string };
const today = () => new Date().toISOString().slice(0, 10);
const empty = (): Draft => ({ slug: "", category: TIP_CATEGORIES[0].slug, title: "", excerpt: "", content: "", cover_url: null, youtube_url: "", published_on: today(), is_published: true });

const translit = (s: string) => {
  const map: Record<string, string> = { а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ye",ж:"zh",з:"z",и:"y",і:"i",ї:"yi",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"yu",я:"ya","'":"" };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};

const AdminTips = () => {
  const { user, isAdmin, loading } = useAuth();
  const [tips, setTips] = useState<RunningTip[]>([]);
  const [edit, setEdit] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("running_tips").select("*").order("published_on", { ascending: false });
    if (error) toast.error(error.message);
    setTips((data as RunningTip[]) ?? []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const set = (patch: Partial<Draft>) => setEdit((e) => (e ? { ...e, ...patch } : e));

  const onCover = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const file = await compressImage(f);
      const path = `tips/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split(".").pop() || "jpg"}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) throw error;
      set({ cover_url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const save = async () => {
    if (!edit) return;
    if (!edit.title.trim()) { toast.error("Вкажіть назву"); return; }
    const payload = {
      slug: (edit.slug || translit(edit.title)) || `tip-${Date.now()}`,
      category: edit.category, title: edit.title.trim(), excerpt: edit.excerpt || null, content: edit.content || null,
      cover_url: edit.cover_url, youtube_url: edit.youtube_url?.trim() || null, youtube_title: edit.youtube_title?.trim() || null,
      youtube_url_2: edit.youtube_url_2?.trim() || null, youtube_title_2: edit.youtube_title_2?.trim() || null,
      published_on: edit.published_on || today(), is_published: edit.is_published,
      updated_at: new Date().toISOString(),
    };
    setBusy(true);
    const { error } = edit.id
      ? await supabase.from("running_tips").update(payload).eq("id", edit.id)
      : await supabase.from("running_tips").insert({ ...payload, created_by: user.id });
    setBusy(false);
    if (error) { toast.error(error.message.includes("duplicate") ? "Такий адрес сторінки вже існує" : error.message); return; }
    toast.success("Збережено");
    setEdit(null);
    load();
  };

  const remove = async (t: RunningTip) => {
    if (!confirm(`Видалити «${t.title}»?`)) return;
    const { error } = await supabase.from("running_tips").delete().eq("id", t.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Адмін-панель</Link>
            <h1 className="font-display text-3xl font-bold">Поради бігунам</h1>
          </div>
          {!edit && <Button onClick={() => setEdit(empty())}><Plus className="h-4 w-4" />Додати статтю</Button>}
        </div>

        {edit ? (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Назва *</Label><Input value={edit.title} onChange={(e) => set({ title: e.target.value })} /></div>
              <div>
                <Label>Категорія</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={edit.category} onChange={(e) => set({ category: e.target.value })}>
                  {TIP_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div><Label>Дата публікації</Label><Input type="date" value={edit.published_on} onChange={(e) => set({ published_on: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Адреса сторінки (необов'язково)</Label><Input placeholder="створиться з назви" value={edit.slug} onChange={(e) => set({ slug: translit(e.target.value) })} /></div>
              <div className="sm:col-span-2"><Label>Короткий анонс</Label><Textarea rows={2} value={edit.excerpt ?? ""} onChange={(e) => set({ excerpt: e.target.value })} /></div>
              <div><Label>Відео 1 — заголовок (H2)</Label><Input value={edit.youtube_title ?? ""} onChange={(e) => set({ youtube_title: e.target.value })} /></div>
              <div><Label>Відео 1 — посилання YouTube</Label><Input placeholder="https://youtube.com/..." value={edit.youtube_url ?? ""} onChange={(e) => set({ youtube_url: e.target.value })} /></div>
              <div><Label>Відео 2 — заголовок (H2)</Label><Input value={edit.youtube_title_2 ?? ""} onChange={(e) => set({ youtube_title_2: e.target.value })} /></div>
              <div><Label>Відео 2 — посилання YouTube</Label><Input placeholder="https://youtube.com/..." value={edit.youtube_url_2 ?? ""} onChange={(e) => set({ youtube_url_2: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Текст статті</Label><Textarea rows={12} value={edit.content ?? ""} onChange={(e) => set({ content: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Зображення</Label>
              {edit.cover_url && (
                <div className="relative w-64">
                  <img src={edit.cover_url} alt="" className="rounded-lg aspect-[16/10] object-cover w-full" />
                  <button className="absolute top-1 right-1 bg-background/80 rounded-full p-1" onClick={() => set({ cover_url: null })}><X className="h-4 w-4" /></button>
                </div>
              )}
              <Input type="file" accept="image/*" disabled={busy} onChange={(e) => onCover(e.target.files?.[0])} />
            </div>
            <div className="flex items-center gap-2"><Switch checked={edit.is_published} onCheckedChange={(v) => set({ is_published: v })} /><span className="text-sm">Опубліковано</span></div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Зберегти</Button>
              <Button variant="outline" onClick={() => setEdit(null)} disabled={busy}>Скасувати</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {tips.length === 0 && <p className="text-muted-foreground">Статей поки немає.</p>}
            {tips.map((t) => (
              <div key={t.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
                {t.cover_url ? <img src={t.cover_url} alt="" className="h-14 w-20 rounded object-cover" /> : <div className="h-14 w-20 rounded bg-muted" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{t.title} {!t.is_published && <span className="text-xs text-muted-foreground">(чернетка)</span>}</div>
                  <div className="text-xs text-muted-foreground">{tipCategory(t.category)?.name} · {formatBlogDate(t.published_on)}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setEdit({ ...t })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(t)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminTips;

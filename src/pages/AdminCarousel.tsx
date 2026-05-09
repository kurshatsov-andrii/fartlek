import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Loader2, Trash2, ArrowUp, ArrowDown, Upload } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Slide = {
  id: string;
  image_url: string;
  storage_path: string | null;
  title_uk: string | null;
  title_en: string | null;
  position: number;
  is_active: boolean;
};

const AdminCarousel = () => {
  const { user, isAdmin, loading } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [busy, setBusy] = useState(false);
  const [titleUk, setTitleUk] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("home_carousel_slides" as any)
      .select("*")
      .order("position", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setSlides((data as any) ?? []);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const upload = async () => {
    if (!file) { toast.error("Оберіть зображення"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("home-carousel").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("home-carousel").getPublicUrl(path);
      const maxPos = slides.reduce((m, s) => Math.max(m, s.position), -1);
      const { error } = await supabase.from("home_carousel_slides" as any).insert({
        image_url: pub.publicUrl,
        storage_path: path,
        title_uk: titleUk || null,
        title_en: titleEn || null,
        position: maxPos + 1,
        is_active: true,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Слайд додано");
      setFile(null); setTitleUk(""); setTitleEn("");
      (document.getElementById("carousel-file") as HTMLInputElement | null)?.value && ((document.getElementById("carousel-file") as HTMLInputElement).value = "");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Помилка завантаження");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: Slide) => {
    if (!confirm("Видалити слайд?")) return;
    setBusy(true);
    try {
      if (s.storage_path) await supabase.storage.from("home-carousel").remove([s.storage_path]);
      const { error } = await supabase.from("home_carousel_slides" as any).delete().eq("id", s.id);
      if (error) throw error;
      toast.success("Видалено");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= slides.length) return;
    const a = slides[idx], b = slides[j];
    setBusy(true);
    try {
      await supabase.from("home_carousel_slides" as any).update({ position: b.position }).eq("id", a.id);
      await supabase.from("home_carousel_slides" as any).update({ position: a.position }).eq("id", b.id);
      await load();
    } finally { setBusy(false); }
  };

  const toggleActive = async (s: Slide) => {
    await supabase.from("home_carousel_slides" as any).update({ is_active: !s.is_active }).eq("id", s.id);
    await load();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold">Карусель головної</h1>
          <Button asChild variant="outline" size="sm"><Link to="/admin">← В адмінку</Link></Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
          <h2 className="font-semibold">Додати слайд</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Заголовок (UA)</Label>
              <Input value={titleUk} onChange={(e) => setTitleUk(e.target.value)} placeholder="Напр. Для учасників" />
            </div>
            <div>
              <Label>Title (EN)</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="e.g. For participants" />
            </div>
          </div>
          <div>
            <Label>Зображення</Label>
            <Input id="carousel-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button onClick={upload} disabled={busy || !file}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Додати
          </Button>
        </div>

        <div className="space-y-3">
          {slides.length === 0 && (
            <p className="text-sm text-muted-foreground">Слайдів ще немає. Додайте перший — або на головній буде показано стандартні зображення.</p>
          )}
          {slides.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <img src={s.image_url} alt="" className="h-20 w-20 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.title_uk || s.title_en || "(без назви)"}</div>
                <div className="text-xs text-muted-foreground truncate">{s.image_url}</div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                <Button size="icon" variant="outline" disabled={i === 0 || busy} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="outline" disabled={i === slides.length - 1 || busy} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="destructive" onClick={() => remove(s)} disabled={busy}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCarousel;

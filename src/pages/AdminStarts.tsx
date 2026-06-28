import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2, Plus, ExternalLink, Eye, EyeOff, Pencil } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "draft" | "published" | "hidden";

interface Row {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  register_url: string | null;
  event_date: string | null;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  status: Status;
  telegram_message_id: number | null;
  created_at: string;
}

const AdminStarts = () => {
  const { isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const base = (editing.title || "start").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "start";
      const path = `telegram-starts/${base}-${Date.now()}.${ext}`;
      const contentType = file.type || (ext === "png" ? "image/png" : "image/jpeg");
      const { error } = await supabase.storage.from("event-images").upload(path, file, { contentType, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("event-images").getPublicUrl(path);
      setEditing({ ...editing, image_url: data.publicUrl });
      toast.success("Зображення завантажено");
    } catch (e: any) {
      toast.error(e.message || "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  };

  const fetchAll = async () => {
    const { data } = await supabase
      .from("telegram_starts")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: false });
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const createNew = () => {
    setEditing({
      id: "", title: "", description: "", image_url: "", register_url: "",
      event_date: "", slug: "", seo_title: "", seo_description: "",
      status: "draft", telegram_message_id: null, created_at: new Date().toISOString(),
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const payload: any = {
      title: editing.title.trim(),
      description: editing.description,
      image_url: editing.image_url?.trim() || null,
      register_url: editing.register_url?.trim() || null,
      event_date: editing.event_date || null,
      seo_title: editing.seo_title?.trim() || null,
      seo_description: editing.seo_description?.trim() || null,
      status: editing.status,
    };
    if (editing.slug) payload.slug = editing.slug.trim();
    const { error } = editing.id
      ? await supabase.from("telegram_starts").update(payload).eq("id", editing.id)
      : await supabase.from("telegram_starts").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Збережено");
    setEditing(null);
    fetchAll();
  };

  const setStatus = async (id: string, status: Status) => {
    const patch: any = { status };
    if (status === "published") patch.published_at = new Date().toISOString();
    const { error } = await supabase.from("telegram_starts").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const del = async (id: string) => {
    if (!confirm("Видалити цей старт?")) return;
    const { error } = await supabase.from("telegram_starts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-10">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> До адмін-панелі
        </Link>

        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Старти (Telegram)</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Пости з <a href="https://t.me/fartlekua" target="_blank" rel="noreferrer" className="underline">@fartlekua</a> приходять як чернетки. Опубліковані з датою ≥ 01.07.2026 показуються на /starts.
            </p>
          </div>
          <Button onClick={createNew}><Plus className="h-4 w-4 mr-1" /> Додати вручну</Button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "draft", "published", "hidden"] as const).map((s) => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
              {s === "all" ? "Усі" : s === "draft" ? "Чернетки" : s === "published" ? "Опубліковані" : "Приховані"}
              <span className="ml-1.5 text-xs opacity-70">
                {s === "all" ? rows.length : rows.filter((r) => r.status === s).length}
              </span>
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <div className="text-sm text-muted-foreground text-center py-12">Порожньо.</div>}
          {filtered.map((r) => (
            <div key={r.id} className="rounded-lg border p-4 flex gap-4 flex-col md:flex-row">
              {r.image_url && (
                <img src={r.image_url} alt="" className="w-full md:w-40 h-32 object-cover rounded" loading="lazy" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={r.status === "published" ? "default" : r.status === "draft" ? "secondary" : "outline"}>
                    {r.status === "draft" ? "чернетка" : r.status === "published" ? "опубліковано" : "приховано"}
                  </Badge>
                  {r.event_date && <span className="text-xs text-muted-foreground">{r.event_date}</span>}
                  {r.telegram_message_id && <span className="text-xs text-muted-foreground">tg #{r.telegram_message_id}</span>}
                </div>
                <h3 className="font-semibold truncate">{r.title || "(без назви)"}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5 mr-1" /> Редагувати</Button>
                  {r.status !== "published" ? (
                    <Button size="sm" onClick={() => setStatus(r.id, "published")}><Eye className="h-3.5 w-3.5 mr-1" /> Опублікувати</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "hidden")}><EyeOff className="h-3.5 w-3.5 mr-1" /> Сховати</Button>
                  )}
                  {r.status === "published" && r.slug && (
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/starts/${r.slug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Відкрити</Link>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Редагувати старт" : "Новий старт"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Назва</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Дата події</Label>
                <Input type="date" value={editing.event_date ?? ""} onChange={(e) => setEditing({ ...editing, event_date: e.target.value })} />
              </div>
              <div>
                <Label>Опис</Label>
                <Textarea rows={6} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>Зображення (URL)</Label>
                <Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." />
                {editing.image_url && <img src={editing.image_url} alt="" className="mt-2 max-h-40 rounded" />}
              </div>
              <div>
                <Label>Посилання на реєстрацію</Label>
                <Input value={editing.register_url ?? ""} onChange={(e) => setEditing({ ...editing, register_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Slug (URL: /starts/...)</Label>
                <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="auto" />
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-sm">SEO (необов'язково)</h4>
                <div className="space-y-3">
                  <div>
                    <Label>SEO Title (до 60 символів)</Label>
                    <Input value={editing.seo_title ?? ""} maxLength={60} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} />
                  </div>
                  <div>
                    <Label>SEO Description (до 160 символів)</Label>
                    <Textarea rows={2} value={editing.seo_description ?? ""} maxLength={160} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} />
                  </div>
                </div>
              </div>
              <div>
                <Label>Статус</Label>
                <div className="flex gap-2 mt-1">
                  {(["draft","published","hidden"] as const).map((s) => (
                    <Button key={s} type="button" size="sm" variant={editing.status === s ? "default" : "outline"} onClick={() => setEditing({ ...editing, status: s })}>
                      {s === "draft" ? "Чернетка" : s === "published" ? "Опубліковано" : "Приховано"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Скасувати</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Збереження…" : "Зберегти"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStarts;

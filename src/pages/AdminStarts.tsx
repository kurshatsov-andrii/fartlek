import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2, Plus, ExternalLink, Eye, EyeOff, Pencil, Sparkles } from "lucide-react";
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
import { parseStartContent, generateStartSeo, SPORT_TYPES, SPORT_LABELS, type SportType } from "@/lib/parseStart";

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
  city: string | null;
  region: string | null;
  organizer_name: string | null;
  sport_types: string[];
  distances_km: number[];
  is_paid: boolean | null;
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
      city: "", region: "", organizer_name: "", sport_types: [], distances_km: [], is_paid: null,
    });
  };

  const reparse = () => {
    if (!editing) return;
    const p = parseStartContent(`${editing.title}\n${editing.description || ""}`);
    setEditing({
      ...editing,
      sport_types: p.sport_types,
      distances_km: p.distances_km,
      city: editing.city || p.city || "",
      region: editing.region || p.region || "",
      organizer_name: editing.organizer_name || p.organizer_name || "",
      is_paid: editing.is_paid ?? p.is_paid,
    });
    toast.success("Автозаповнено з опису");
  };

  const toggleSport = (s: SportType) => {
    if (!editing) return;
    const cur = new Set(editing.sport_types as SportType[]);
    if (cur.has(s)) cur.delete(s); else cur.add(s);
    setEditing({ ...editing, sport_types: Array.from(cur) });
  };

  const save = async () => {
    if (!editing) return;
    // Auto-fill SEO if empty so the fields are never blank
    let seoTitle = editing.seo_title?.trim() || "";
    let seoDesc = editing.seo_description?.trim() || "";
    if (!seoTitle || !seoDesc) {
      const gen = generateStartSeo({
        title: editing.title,
        description: editing.description,
        event_date: editing.event_date,
        city: editing.city,
        distances_km: editing.distances_km,
        sport_types: editing.sport_types,
        organizer_name: editing.organizer_name,
      });
      if (!seoTitle) seoTitle = gen.seo_title;
      if (!seoDesc) seoDesc = gen.seo_description;
    }
    setSaving(true);
    const payload: any = {
      title: editing.title.trim(),
      description: editing.description,
      image_url: editing.image_url?.trim() || null,
      register_url: editing.register_url?.trim() || null,
      event_date: editing.event_date || null,
      seo_title: seoTitle,
      seo_description: seoDesc,
      status: editing.status,
      city: editing.city?.trim() || null,
      region: editing.region?.trim() || null,
      organizer_name: editing.organizer_name?.trim() || null,
      sport_types: editing.sport_types || [],
      distances_km: editing.distances_km || [],
      is_paid: editing.is_paid,
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
                  {r.city && <span className="text-xs text-muted-foreground">📍 {r.city}</span>}
                  {r.telegram_message_id && <span className="text-xs text-muted-foreground">tg #{r.telegram_message_id}</span>}
                </div>
                <h3 className="font-semibold truncate">{r.title || "(без назви)"}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(r.sport_types || []).map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{SPORT_LABELS[s as SportType] ?? s}</span>
                  ))}
                  {(r.distances_km || []).map((d) => (
                    <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{d} км</span>
                  ))}
                </div>
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

              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={reparse}>
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Автозаповнити з опису
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Місто</Label>
                  <Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
                </div>
                <div>
                  <Label>Область / регіон</Label>
                  <Input value={editing.region ?? ""} onChange={(e) => setEditing({ ...editing, region: e.target.value })} />
                </div>
                <div>
                  <Label>Організатор</Label>
                  <Input value={editing.organizer_name ?? ""} onChange={(e) => setEditing({ ...editing, organizer_name: e.target.value })} />
                </div>
                <div>
                  <Label>Тип</Label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { v: null as null | boolean, l: "—" },
                      { v: true, l: "Платний" },
                      { v: false, l: "Безкоштовний" },
                    ].map((o) => (
                      <Button key={String(o.v)} type="button" size="sm" variant={editing.is_paid === o.v ? "default" : "outline"} onClick={() => setEditing({ ...editing, is_paid: o.v })}>{o.l}</Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Види спорту</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SPORT_TYPES.map((s) => {
                    const active = editing.sport_types?.includes(s);
                    return (
                      <button key={s} type="button" onClick={() => toggleSport(s)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary"}`}>
                        {SPORT_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Дистанції (км, через кому)</Label>
                <Input
                  value={(editing.distances_km || []).join(", ")}
                  onChange={(e) => {
                    const arr = e.target.value.split(/[,\s]+/).map((x) => parseFloat(x.replace(",", "."))).filter((n) => !isNaN(n) && n > 0);
                    setEditing({ ...editing, distances_km: arr });
                  }}
                  placeholder="5, 10, 21.1, 42.2"
                />
              </div>

              <div>
                <Label>Зображення</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                </div>
                <Input className="mt-2" value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="або вставте URL https://..." />
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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">SEO <span className="text-destructive">*</span></h4>
                  <Button type="button" size="sm" variant="outline" onClick={() => {
                    const gen = generateStartSeo({
                      title: editing.title,
                      description: editing.description,
                      event_date: editing.event_date,
                      city: editing.city,
                      distances_km: editing.distances_km,
                      sport_types: editing.sport_types,
                      organizer_name: editing.organizer_name,
                    });
                    setEditing({ ...editing, seo_title: gen.seo_title, seo_description: gen.seo_description });
                    toast.success("SEO згенеровано");
                  }}>
                    <Sparkles className="w-4 h-4 mr-1" /> Згенерувати
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Поля обов'язкові. Якщо залишити пустими — заповняться автоматично при збереженні.</p>
                <div className="space-y-3">
                  <div>
                    <Label>SEO Title (до 60 символів)</Label>
                    <Input required value={editing.seo_title ?? ""} maxLength={60} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} />
                  </div>
                  <div>
                    <Label>SEO Description (до 160 символів)</Label>
                    <Textarea required rows={2} value={editing.seo_description ?? ""} maxLength={160} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} />
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

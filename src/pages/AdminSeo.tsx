import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSeoOverride } from "@/components/SEO";
import { toast } from "sonner";

interface Row {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  updated_at: string;
}

const AdminSeo = () => {
  const { isAdmin, loading, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // New entry
  const [newPath, setNewPath] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchAll = async () => {
    const { data } = await supabase
      .from("seo_overrides")
      .select("id,path,title,description,updated_at")
      .order("path");
    setRows(data ?? []);
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = rows.filter((r) =>
    r.path.toLowerCase().includes(search.toLowerCase()) ||
    (r.title ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const save = async (row: Row) => {
    setBusy(true);
    const { error } = await supabase
      .from("seo_overrides")
      .update({
        title: row.title?.trim() || null,
        description: row.description?.trim() || null,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    invalidateSeoOverride(row.path);
    toast.success("Збережено");
  };

  const del = async (row: Row) => {
    if (!confirm(`Видалити SEO для ${row.path}?`)) return;
    const { error } = await supabase.from("seo_overrides").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    invalidateSeoOverride(row.path);
    setRows((r) => r.filter((x) => x.id !== row.id));
    toast.success("Видалено");
  };

  const create = async () => {
    const path = newPath.trim();
    if (!path.startsWith("/")) {
      toast.error("Шлях має починатися з /");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("seo_overrides").upsert(
      {
        path,
        title: newTitle.trim() || null,
        description: newDesc.trim() || null,
        updated_by: user?.id,
      },
      { onConflict: "path" },
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    invalidateSeoOverride(path);
    setNewPath("");
    setNewTitle("");
    setNewDesc("");
    toast.success("Додано");
    fetchAll();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-10">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> До адмін-панелі
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">SEO сторінок</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Підказка: відкрийте потрібну сторінку та натисніть кнопку <b>SEO</b> у нижньому правому куті — це найшвидший спосіб.
        </p>

        <div className="rounded-lg border p-4 mb-8 space-y-3">
          <h2 className="font-semibold">Додати/оновити вручну</h2>
          <div>
            <Label>Шлях (наприклад, /, /clubs, /category/run)</Label>
            <Input value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="/" />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={newTitle} maxLength={60} onChange={(e) => setNewTitle(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={newDesc} maxLength={160} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <Button onClick={create} disabled={busy || !newPath.trim()}>Зберегти</Button>
        </div>

        <Input
          placeholder="Пошук за шляхом або title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 max-w-md"
        />

        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">Поки що немає overrides.</div>
          )}
          {filtered.map((row, idx) => (
            <div key={row.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <code className="text-sm font-mono break-all">{row.path}</code>
                <Button size="sm" variant="ghost" onClick={() => del(row)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={row.title ?? ""}
                  maxLength={60}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows((rs) => rs.map((r, i) => (i === rows.indexOf(row) ? { ...r, title: v } : r)));
                  }}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={row.description ?? ""}
                  maxLength={160}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows((rs) => rs.map((r, i) => (i === rows.indexOf(row) ? { ...r, description: v } : r)));
                  }}
                />
              </div>
              <Button size="sm" onClick={() => save(row)} disabled={busy}>
                Зберегти
              </Button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSeo;

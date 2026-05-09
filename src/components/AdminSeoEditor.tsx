import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSeoOverride } from "@/components/SEO";
import { toast } from "sonner";

export const AdminSeoEditor = () => {
  const { isAdmin, user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [defaults, setDefaults] = useState({ title: "", description: "" });

  const path = location.pathname;
  const hideOnRoutes = ["/auth", "/reset-password"];
  if (!isAdmin || !user || hideOnRoutes.includes(path)) return null;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seo_overrides")
      .select("title,description")
      .eq("path", path)
      .maybeSingle();
    setTitle(data?.title ?? "");
    setDescription(data?.description ?? "");
    setDefaults({
      title: document.title ?? "",
      description:
        document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? "",
    });
    setLoading(false);
  };

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) load();
  };

  const save = async () => {
    setSaving(true);
    const payload: any = {
      path,
      title: title.trim() || null,
      description: description.trim() || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("seo_overrides")
      .upsert(payload, { onConflict: "path" });
    setSaving(false);
    if (error) {
      toast.error("Помилка: " + error.message);
      return;
    }
    invalidateSeoOverride(path);
    toast.success("SEO збережено. Оновіть сторінку для перевірки.");
    setOpen(false);
  };

  const reset = async () => {
    setSaving(true);
    const { error } = await supabase.from("seo_overrides").delete().eq("path", path);
    setSaving(false);
    if (error) {
      toast.error("Помилка: " + error.message);
      return;
    }
    invalidateSeoOverride(path);
    setTitle("");
    setDescription("");
    toast.success("Скинуто до шаблону.");
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-4 right-4 z-[60] shadow-lg gap-2"
        title="Редагувати SEO для цієї сторінки"
      >
        <Settings2 className="h-4 w-4" />
        SEO
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>SEO для сторінки</DialogTitle>
            <DialogDescription className="break-all">{path}</DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Завантаження…</div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="seo-title">Title (до 60 символів)</Label>
                <Input
                  id="seo-title"
                  value={title}
                  maxLength={60}
                  placeholder={defaults.title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {title.length}/60 · Дефолт: {defaults.title || "—"}
                </div>
              </div>
              <div>
                <Label htmlFor="seo-desc">Description (до 160 символів)</Label>
                <Textarea
                  id="seo-desc"
                  value={description}
                  maxLength={160}
                  placeholder={defaults.description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {description.length}/160 · Дефолт: {defaults.description || "—"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={reset} disabled={saving || loading}>
              Скинути до шаблону
            </Button>
            <Button onClick={save} disabled={saving || loading}>
              {saving ? "Збереження…" : "Зберегти"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

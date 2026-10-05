import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSeoOverride } from "@/components/SEO";
import { toast } from "sonner";

type Props = {
  path: string;
  userId: string;
  h1: string;
  subtitle: string;
  title: string;
  description: string;
  onSaved: (v: { h1: string; subtitle: string; title: string; description: string }) => void;
};

export const BlogHeadingEditor = ({ path, userId, onSaved, ...init }: Props) => {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(init);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("seo_overrides").upsert(
      {
        path,
        h1: v.h1.trim() || null,
        subtitle: v.subtitle.trim() || null,
        title: v.title.trim() || null,
        description: v.description.trim() || null,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "path" },
    );
    setSaving(false);
    if (error) return toast.error("Помилка: " + error.message);
    invalidateSeoOverride(path);
    onSaved(v);
    toast.success("Збережено");
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => { setV(init); setOpen(true); }}>
        <Pencil className="h-4 w-4" />Редагувати заголовок
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Заголовок та опис сторінки «Блог»</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Заголовок H1</Label><Input value={v.h1} onChange={(e) => setV({ ...v, h1: e.target.value })} /></div>
            <div><Label>Підзаголовок</Label><Textarea rows={3} value={v.subtitle} onChange={(e) => setV({ ...v, subtitle: e.target.value })} /></div>
            <div><Label>SEO title (до 60)</Label><Input maxLength={60} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></div>
            <div><Label>SEO опис (до 160)</Label><Textarea maxLength={160} rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save} disabled={saving}>{saving ? "Збереження…" : "Зберегти"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

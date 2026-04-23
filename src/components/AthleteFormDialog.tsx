import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Athlete {
  id: string;
  owner_id: string;
  full_name: string;
  birth_date: string;
  gender: string;
  city: string;
  club: string | null;
  is_self: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ownerId: string;
  athlete?: Athlete | null;
  onSaved: (a: Athlete) => void;
}

export const AthleteFormDialog = ({ open, onOpenChange, ownerId, athlete, onSaved }: Props) => {
  const { t } = useApp();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", birth_date: "", gender: "", city: "", club: "" });

  useEffect(() => {
    if (open) {
      setForm({
        full_name: athlete?.full_name ?? "",
        birth_date: athlete?.birth_date ?? "",
        gender: athlete?.gender ?? "",
        city: athlete?.city ?? "",
        club: athlete?.club ?? "",
      });
    }
  }, [open, athlete]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.birth_date || !form.gender || !form.city.trim()) {
      toast.error(t.profile.fillRequired);
      return;
    }
    setBusy(true);
    const payload = {
      owner_id: ownerId,
      full_name: form.full_name.trim(),
      birth_date: form.birth_date,
      gender: form.gender as any,
      city: form.city.trim(),
      club: form.club.trim() || null,
    };
    const q = athlete
      ? supabase.from("athletes").update(payload).eq("id", athlete.id).select().single()
      : supabase.from("athletes").insert({ ...payload, is_self: false }).select().single();
    const { data, error } = await q;
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t.profile.saved);
    onSaved(data as Athlete);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{athlete ? t.athletes.editTitle : t.athletes.addTitle}</DialogTitle>
          <DialogDescription>{t.athletes.formHint}</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label>{t.auth.fullName} <span className="text-destructive">*</span></Label>
            <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.profile.birthDate} <span className="text-destructive">*</span></Label>
              <Input type="date" required value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.profile.gender} <span className="text-destructive">*</span></Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t.profile.male}</SelectItem>
                  <SelectItem value="female">{t.profile.female}</SelectItem>
                  <SelectItem value="boy">{t.profile.boy}</SelectItem>
                  <SelectItem value="girl">{t.profile.girl}</SelectItem>
                  <SelectItem value="other">{t.profile.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.profile.city} <span className="text-destructive">*</span></Label>
              <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.profile.club} <span className="text-muted-foreground text-xs">({t.profile.clubOptional})</span></Label>
              <Input value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t.organizer.cancel}</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.profile.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

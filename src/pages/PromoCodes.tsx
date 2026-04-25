import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Loader2, Plus, Trash2, Pencil, Ticket as TicketIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PromoRow {
  id: string;
  event_id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  distance_ids: string[];
  max_uses: number | null;
  uses_count: number;
  valid_until: string | null;
  is_active: boolean;
}
interface DistanceRow { id: string; distance_km: number; name: string | null; }

const empty = (eventId: string): Omit<PromoRow, "id" | "uses_count"> => ({
  event_id: eventId, code: "", discount_type: "percent",
  discount_value: 10, distance_ids: [], max_uses: null,
  valid_until: null, is_active: true,
});

const PromoCodes = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useApp();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<PromoRow[]>([]);
  const [distances, setDistances] = useState<DistanceRow[]>([]);
  const [editing, setEditing] = useState<(Omit<PromoRow, "id" | "uses_count"> & { id?: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!id) return;
    const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    setEvent(ev);
    const [{ data: ds }, { data: pcs }] = await Promise.all([
      supabase.from("distances").select("id, distance_km, name").eq("event_id", id).order("distance_km"),
      supabase.from("promo_codes").select("*").eq("event_id", id).order("created_at", { ascending: false }),
    ]);
    setDistances(ds ?? []);
    setCodes((pcs ?? []) as PromoRow[]);
    setLoading(false);
  };

  useEffect(() => { if (user && id) reload(); }, [user, id]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth?role=organizer" replace />;
  if (!loading && event && event.organizer_id !== user.id && !isAdmin) return <Navigate to="/" replace />;

  const save = async () => {
    if (!editing || !user || !id) return;
    const code = editing.code.trim();
    if (!code) { toast.error(t.promo.code); return; }
    if (editing.discount_type === "percent" && (editing.discount_value <= 0 || editing.discount_value > 100)) {
      toast.error(t.promo.discountValuePercent); return;
    }
    if (editing.discount_value <= 0) { toast.error(t.promo.discountValue); return; }
    setBusy(true);
    const payload = {
      event_id: id,
      code,
      discount_type: editing.discount_type,
      discount_value: editing.discount_value,
      distance_ids: editing.distance_ids,
      max_uses: editing.max_uses,
      valid_until: editing.valid_until,
      is_active: editing.is_active,
      created_by: user.id,
    };
    const { error } = editing.id
      ? await supabase.from("promo_codes").update(payload).eq("id", editing.id)
      : await supabase.from("promo_codes").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t.promo.saved);
    setEditing(null);
    reload();
  };

  const remove = async (pid: string) => {
    if (!confirm(t.promo.deleteConfirm)) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", pid);
    if (error) { toast.error(error.message); return; }
    toast.success(t.promo.deleted);
    reload();
  };

  const statusOf = (p: PromoRow): { label: string; cls: string } => {
    if (!p.is_active) return { label: t.promo.statusInactive, cls: "bg-muted text-muted-foreground" };
    if (p.valid_until && new Date(p.valid_until) < new Date()) return { label: t.promo.statusExpired, cls: "bg-destructive/15 text-destructive" };
    if (p.max_uses != null && p.uses_count >= p.max_uses) return { label: t.promo.statusUsedUp, cls: "bg-destructive/15 text-destructive" };
    return { label: t.promo.statusActive, cls: "bg-primary/15 text-primary" };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-5xl py-10">
        <Link to="/organizer" className="text-sm text-muted-foreground hover:text-foreground">{t.promo.backToDashboard}</Link>
        <div className="flex items-center justify-between gap-3 mt-3 mb-6 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2"><TicketIcon className="h-7 w-7 text-primary" /> {t.promo.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{event?.title}</p>
          </div>
          <Button onClick={() => setEditing(empty(id!))}><Plus className="h-4 w-4" /> {t.promo.create}</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : codes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl">{t.promo.empty}</div>
        ) : (
          <div className="space-y-3">
            {codes.map((p) => {
              const s = statusOf(p);
              const distLabel = p.distance_ids.length === 0
                ? t.promo.distancesAll
                : distances.filter((d) => p.distance_ids.includes(d.id)).map((d) => `${d.distance_km}km`).join(", ");
              return (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-display text-xl font-bold tracking-wider">{p.code}</div>
                    <div className="text-sm text-muted-foreground">
                      {p.discount_type === "percent" ? `−${p.discount_value}%` : `−${p.discount_value} ₴`} · {distLabel}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div>{t.promo.usesCount}: <b>{p.uses_count}{p.max_uses != null ? ` / ${p.max_uses}` : ""}</b></div>
                    <div className="text-muted-foreground">{p.valid_until ? new Date(p.valid_until).toLocaleDateString() : t.promo.noExpiry}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing({
                      id: p.id, event_id: p.event_id, code: p.code,
                      discount_type: p.discount_type, discount_value: Number(p.discount_value),
                      distance_ids: p.distance_ids ?? [], max_uses: p.max_uses,
                      valid_until: p.valid_until ? p.valid_until.slice(0, 10) : null,
                      is_active: p.is_active,
                    })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing?.id ? t.promo.edit : t.promo.createNew}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div>
                  <Label>{t.promo.code}</Label>
                  <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder={t.promo.codePlaceholder} maxLength={32} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t.promo.discountType}</Label>
                    <Select value={editing.discount_type} onValueChange={(v: "percent" | "fixed") => setEditing({ ...editing, discount_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">{t.promo.percent}</SelectItem>
                        <SelectItem value="fixed">{t.promo.fixed}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{editing.discount_type === "percent" ? t.promo.discountValuePercent : t.promo.discountValueFixed}</Label>
                    <Input type="number" min={1} max={editing.discount_type === "percent" ? 100 : undefined}
                      value={editing.discount_value}
                      onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label>{t.promo.distances}</Label>
                  <div className="border border-border rounded-md p-3 space-y-2 max-h-40 overflow-auto">
                    {distances.length === 0 ? (
                      <p className="text-sm text-muted-foreground">—</p>
                    ) : distances.map((d) => {
                      const checked = editing.distance_ids.includes(d.id);
                      return (
                        <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={checked} onCheckedChange={(c) => {
                            const set = new Set(editing.distance_ids);
                            if (c) set.add(d.id); else set.delete(d.id);
                            setEditing({ ...editing, distance_ids: Array.from(set) });
                          }} />
                          {d.distance_km} km {d.name ? `· ${d.name}` : ""}
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {editing.distance_ids.length === 0 ? t.promo.distancesAll : `${editing.distance_ids.length} ${t.promo.distancesPick}`}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t.promo.maxUses}</Label>
                    <Input type="number" min={1} value={editing.max_uses ?? ""}
                      placeholder="∞"
                      onChange={(e) => setEditing({ ...editing, max_uses: e.target.value ? Number(e.target.value) : null })} />
                    <p className="text-xs text-muted-foreground mt-1">{t.promo.maxUsesHint}</p>
                  </div>
                  <div>
                    <Label>{t.promo.validUntil}</Label>
                    <Input type="date" value={editing.valid_until ?? ""}
                      onChange={(e) => setEditing({ ...editing, valid_until: e.target.value || null })} />
                    <p className="text-xs text-muted-foreground mt-1">{t.promo.validUntilHint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <Label className="!mt-0">{t.promo.isActive}</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>{t.promo.cancel}</Button>
              <Button onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.promo.save}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default PromoCodes;

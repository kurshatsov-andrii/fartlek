import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Pencil, Trash2, UserCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AthleteFormDialog, Athlete } from "@/components/AthleteFormDialog";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

const Profile = () => {
  const { t } = useApp();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "", birth_date: "", gender: "", city: "", club: "", email: "", phone: "", marketing_consent: true,
  });
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Athlete | null>(null);

  // Phone format: +38 (XXX) XXX-XX-XX (9 digits after +38)
  const PHONE_RE = /^\+38 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
  const isPhoneValid = PHONE_RE.test(form.phone);

  const formatPhone = (raw: string): string => {
    // Strip all non-digits, drop leading 38 if present
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("38")) digits = digits.slice(2);
    digits = digits.slice(0, 10);
    let out = "+38";
    if (digits.length === 0) return out;
    out += " (" + digits.slice(0, 3);
    if (digits.length < 3) return out;
    out += ")";
    if (digits.length > 3) out += " " + digits.slice(3, 6);
    if (digits.length > 6) out += "-" + digits.slice(6, 8);
    if (digits.length > 8) out += "-" + digits.slice(8, 10);
    return out;
  };

  const isComplete =
    !!form.full_name.trim() && !!form.birth_date && !!form.gender && !!form.city.trim() && isPhoneValid;

  const reloadAthletes = async (uid: string) => {
    const { data } = await supabase.from("athletes").select("*").eq("owner_id", uid)
      .order("is_self", { ascending: false }).order("created_at");
    setAthletes((data ?? []) as Athlete[]);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          birth_date: data.birth_date ?? "",
          gender: data.gender ?? "",
          city: data.city ?? "",
          club: data.club ?? "",
          email: data.email,
          phone: (data as any).phone ?? "",
          marketing_consent: (data as any).marketing_consent ?? true,
        });
      }
      await reloadAthletes(user.id);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.birth_date || !form.gender || !form.city.trim()) {
      toast.error(t.profile.fillRequired);
      return;
    }
    if (!isPhoneValid) {
      toast.error(t.profile.phoneInvalid);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      birth_date: form.birth_date,
      gender: form.gender as any,
      city: form.city.trim(),
      club: form.club.trim() || null,
      phone: form.phone,
      marketing_consent: form.marketing_consent,
      marketing_consent_at: form.marketing_consent ? new Date().toISOString() : null,
    } as any).eq("id", user.id);
    if (!error) await reloadAthletes(user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.profile.saved);
    if (redirectTo) navigate(redirectTo, { replace: true });
  };

  const deleteAthlete = async (a: Athlete) => {
    if (a.is_self) { toast.error(t.athletes.cannotDeleteSelf); return; }
    if (!window.confirm(t.athletes.deleteConfirm)) return;
    const { error } = await supabase.from("athletes").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t.athletes.deleted);
    await reloadAthletes(user.id);
  };

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (a: Athlete) => { setEditing(a); setDialogOpen(true); };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-2xl py-12">
        <h1 className="font-display text-4xl font-bold">{t.profile.title}</h1>
        <p className="text-muted-foreground mt-2">{t.profile.sub}</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            {!isComplete && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-foreground">
                  {!form.phone && form.full_name && form.birth_date && form.gender && form.city
                    ? t.profile.phoneRequiredBanner
                    : redirectTo
                    ? t.profile.requiredToRegister
                    : t.profile.requiredBanner}
                </p>
              </div>
            )}
            <form onSubmit={save} className="mt-8 space-y-5 bg-card p-6 rounded-2xl shadow-card">
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-3 border border-border">
                🔒 {t.profile.privacyNote}
              </p>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.profile.phone} <span className="text-destructive">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  placeholder={t.profile.phonePlaceholder}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  onFocus={(e) => { if (!e.target.value) setForm({ ...form, phone: "+38 (" }); }}
                />
                {form.phone && !isPhoneValid && (
                  <p className="text-xs text-destructive">{t.profile.phoneInvalid}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fn">{t.auth.fullName} <span className="text-destructive">*</span></Label>
                <Input id="fn" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bd">{t.profile.birthDate} <span className="text-destructive">*</span></Label>
                  <Input id="bd" type="date" required value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
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
                  <Label htmlFor="city">{t.profile.city} <span className="text-destructive">*</span></Label>
                  <Input id="city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club">
                    {t.profile.club} <span className="text-muted-foreground text-xs">({t.profile.clubOptional})</span>
                  </Label>
                  <Input id="club" value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/30 p-3 border border-border leading-snug">
                📧 Ми надсилаємо вам тільки важливі оновлення по ваших забігах та події платформи. Відписатися можна в будь-який момент через посилання внизу будь-якого листа.
              </p>
              <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.profile.save}
              </Button>
            </form>

            <section className="mt-10">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-display text-2xl font-bold">{t.athletes.sectionTitle}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{t.athletes.sectionHint}</p>
                </div>
                <Button onClick={openAdd} disabled={!isComplete}>{t.athletes.addBtn}</Button>
              </div>
              <div className="mt-4 grid gap-3">
                {athletes.map((a) => (
                  <div key={a.id} className="bg-card p-4 rounded-xl shadow-card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserCircle2 className="h-8 w-8 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold flex items-center gap-2 flex-wrap">
                          {a.full_name}
                          {a.is_self && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                              {t.athletes.self}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(a.birth_date).getFullYear()} · {a.city}{a.club ? ` · ${a.club}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!a.is_self && (
                        <Button size="icon" variant="ghost" onClick={() => deleteAthlete(a)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {athletes.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">—</p>
                )}
              </div>
            </section>

            <AthleteFormDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              ownerId={user.id}
              athlete={editing}
              onSaved={() => reloadAthletes(user.id)}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

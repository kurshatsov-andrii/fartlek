import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    full_name: "", birth_date: "", gender: "", city: "", club: "", email: "",
  });

  const isComplete =
    !!form.full_name.trim() && !!form.birth_date && !!form.gender && !!form.city.trim();

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          birth_date: data.birth_date ?? "",
          gender: data.gender ?? "",
          city: data.city ?? "",
          club: data.club ?? "",
          email: data.email,
        });
      }
      setLoading(false);
    });
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.birth_date || !form.gender || !form.city.trim()) {
      toast.error(t.profile.fillRequired);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      birth_date: form.birth_date,
      gender: form.gender as any,
      city: form.city.trim(),
      club: form.club.trim() || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.profile.saved);
    if (redirectTo) navigate(redirectTo, { replace: true });
  };

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
                  {redirectTo ? t.profile.requiredToRegister : t.profile.requiredBanner}
                </p>
              </div>
            )}
            <form onSubmit={save} className="mt-8 space-y-5 bg-card p-6 rounded-2xl shadow-card">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} disabled />
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
              <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.profile.save}
              </Button>
            </form>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Navigate } from "react-router-dom";

const Profile = () => {
  const { t } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "", birth_date: "", gender: "", city: "", club: "", email: "",
  });

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
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      birth_date: form.birth_date || null,
      gender: (form.gender || null) as any,
      city: form.city || null,
      club: form.club || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(t.profile.saved);
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
          <form onSubmit={save} className="mt-8 space-y-5 bg-card p-6 rounded-2xl shadow-card">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fn">{t.auth.fullName}</Label>
              <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bd">{t.profile.birthDate}</Label>
                <Input id="bd" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.profile.gender}</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t.profile.male}</SelectItem>
                    <SelectItem value="female">{t.profile.female}</SelectItem>
                    <SelectItem value="other">{t.profile.other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t.profile.city}</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club">{t.profile.club}</Label>
                <Input id="club" value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.profile.save}
            </Button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

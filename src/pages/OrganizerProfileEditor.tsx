import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, X, Trash2 } from "lucide-react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CLUB_ACTIVITY_TYPES, CLUB_ACTIVITY_LABELS, type ClubActivityType } from "@/lib/clubs";
import type { Organizer } from "@/lib/organizers";

const httpsUrl = z
  .string().trim().max(500)
  .refine((v) => /^https?:\/\//i.test(v), { message: "must_start_with_https" })
  .refine((v) => { try { new URL(v); return true; } catch { return false; } }, { message: "invalid_url" });

const urlOrEmpty = z.literal("").or(httpsUrl);

const hostUrl = (hosts: string[]) =>
  z.literal("").or(
    httpsUrl.refine((v) => {
      try {
        const h = new URL(v).hostname.toLowerCase().replace(/^www\./, "");
        return hosts.some((d) => h === d || h.endsWith(`.${d}`));
      } catch { return false; }
    }, { message: "wrong_host" })
  );

const phoneRegex = /^\+?[0-9][0-9\s\-().]{6,30}[0-9]$/;
const phoneOrEmpty = z.literal("").or(
  z.string().trim().max(40).refine((v) => {
    const digits = v.replace(/\D/g, "");
    return phoneRegex.test(v) && digits.length >= 7 && digits.length <= 15;
  }, { message: "invalid_phone" })
);

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(1, "city_required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  website_url: urlOrEmpty,
  instagram_url: hostUrl(["instagram.com"]),
  facebook_url: hostUrl(["facebook.com", "fb.com", "fb.me"]),
  telegram_url: hostUrl(["t.me", "telegram.me", "telegram.org"]),
  strava_url: hostUrl(["strava.com", "strava.app.link"]),
  youtube_url: hostUrl(["youtube.com", "youtu.be"]),
  contact_email: z.string().trim().max(255).email().or(z.literal("")),
  contact_phone: phoneOrEmpty,
  founded_year: z.string().regex(/^\d{4}$/, "year_required"),
  members_count: z.string().regex(/^\d{1,7}$/, "members_required"),
  training_location: z.string().trim().max(300).optional().or(z.literal("")),
  training_schedule: z.string().trim().max(1000).optional().or(z.literal("")),
});

const empty = {
  name: "", city: "", description: "",
  website_url: "", instagram_url: "", facebook_url: "", telegram_url: "", strava_url: "", youtube_url: "",
  contact_email: "", contact_phone: "",
  founded_year: "", members_count: "",
  training_location: "", training_schedule: "",
};

const OrganizerProfileEditor = () => {
  const { lang } = useApp();
  const { user, isOrganizer, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [activities, setActivities] = useState<ClubActivityType[]>([]);
  const [form, setForm] = useState(empty);

  const T = lang === "uk" ? {
    title: "Профіль організатора", back: "Назад",
    name: "Назва", city: "Місто", description: "Опис", activities: "Тип діяльності",
    logo: "Логотип", upload: "Завантажити", replace: "Замінити", remove: "Видалити",
    socials: "Соцмережі та посилання",
    website: "Сайт", instagram: "Instagram", facebook: "Facebook", telegram: "Telegram", strava: "Strava", youtube: "YouTube",
    contacts: "Контакти", email: "Email", phone: "Телефон",
    about: "Про організатора", founded: "Рік заснування", members: "Кількість учасників/команди",
    training: "Тренування / Локація", trainingLocation: "Локація", trainingSchedule: "Розклад / Графік",
    save: "Зберегти", cancel: "Скасувати", deleteOrg: "Видалити", confirmDelete: "Видалити профіль назавжди?",
    saved: "Збережено", deleted: "Видалено",
    invalidLogo: "Файл має бути зображенням до 5 МБ", logoRequired: "Завантажте логотип",
    nameRequired: "Введіть назву (мінімум 2 символи)", cityRequired: "Вкажіть місто",
    yearRequired: "Вкажіть рік заснування", membersRequired: "Вкажіть кількість",
    invalidUrl: "Некоректне посилання (має починатись з https://)", invalidEmail: "Некоректний email",
    invalidPhone: "Некоректний номер телефону",
    wrongHost: (f: string) => `Посилання має вести на ${f}`,
  } : {
    title: "Organizer profile", back: "Back",
    name: "Name", city: "City", description: "Description", activities: "Activity types",
    logo: "Logo", upload: "Upload", replace: "Replace", remove: "Remove",
    socials: "Socials & links",
    website: "Website", instagram: "Instagram", facebook: "Facebook", telegram: "Telegram", strava: "Strava", youtube: "YouTube",
    contacts: "Contacts", email: "Email", phone: "Phone",
    about: "About", founded: "Founded year", members: "Team / members count",
    training: "Location / Training", trainingLocation: "Location", trainingSchedule: "Schedule",
    save: "Save", cancel: "Cancel", deleteOrg: "Delete", confirmDelete: "Delete profile permanently?",
    saved: "Saved", deleted: "Deleted",
    invalidLogo: "File must be an image up to 5 MB", logoRequired: "Upload a logo",
    nameRequired: "Enter a name (min 2 characters)", cityRequired: "Enter a city",
    yearRequired: "Enter founded year", membersRequired: "Enter a count",
    invalidUrl: "Invalid URL (must start with https://)", invalidEmail: "Invalid email",
    invalidPhone: "Invalid phone number",
    wrongHost: (f: string) => `Link must point to ${f}`,
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const query = editId
        ? supabase.from("organizers" as any).select("*").eq("id", editId).maybeSingle()
        : supabase.from("organizers" as any).select("*").eq("owner_id", user.id).maybeSingle();
      const { data } = await query;
      if (data) {
        const o = data as any as Organizer;
        setOrganizer(o);
        setLogoUrl(o.logo_url ?? "");
        setActivities(o.activity_types ?? []);
        setForm({
          name: o.name ?? "", city: o.city ?? "", description: o.description ?? "",
          website_url: o.website_url ?? "", instagram_url: o.instagram_url ?? "",
          facebook_url: o.facebook_url ?? "", telegram_url: o.telegram_url ?? "",
          strava_url: o.strava_url ?? "", youtube_url: o.youtube_url ?? "",
          contact_email: o.contact_email ?? "", contact_phone: o.contact_phone ?? "",
          founded_year: o.founded_year ? String(o.founded_year) : "",
          members_count: o.members_count != null ? String(o.members_count) : "",
          training_location: o.training_location ?? "", training_schedule: o.training_schedule ?? "",
        });
      }
      setLoading(false);
    })();
  }, [user, editId]);

  const uploadLogo = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error(T.invalidLogo); return;
    }
    setUploading(true);
    try {
      const mimeExt = file.type.split("/")[1]?.split("+")[0]?.toLowerCase();
      const nameExt = file.name.includes(".")
        ? file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")
        : "";
      const ext = (nameExt && nameExt.length <= 5 ? nameExt : mimeExt) || "png";
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error(lang === "uk" ? "Сесія завершилась, увійдіть знову" : "Session expired");
        setUploading(false); return;
      }
      const path = `${authUser.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("organizer-logos")
        .upload(path, file, { upsert: true, contentType: file.type || `image/${ext}`, cacheControl: "3600" });
      if (error) {
        console.error("organizer-logo upload error:", error);
        toast.error(error.message);
        setUploading(false); return;
      }
      const { data } = supabase.storage.from("organizer-logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || T.invalidLogo);
    } finally {
      setUploading(false);
    }
  };

  const toggleActivity = (a: ClubActivityType) => {
    setActivities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!logoUrl) { toast.error(T.logoRequired); return; }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const field = String(first.path[0] ?? "");
      const code = first.message;
      const hostLabels: Record<string, string> = {
        instagram_url: "instagram.com", facebook_url: "facebook.com",
        telegram_url: "t.me", strava_url: "strava.com", youtube_url: "youtube.com",
      };
      let msg: string;
      if (field === "name") msg = T.nameRequired;
      else if (field === "city") msg = T.cityRequired;
      else if (field === "founded_year") msg = T.yearRequired;
      else if (field === "members_count") msg = T.membersRequired;
      else if (field === "contact_email") msg = T.invalidEmail;
      else if (field === "contact_phone") msg = T.invalidPhone;
      else if (code === "wrong_host" && hostLabels[field]) msg = T.wrongHost(hostLabels[field]);
      else msg = T.invalidUrl;
      toast.error(msg); return;
    }
    const fy = form.founded_year ? parseInt(form.founded_year, 10) : null;
    if (fy == null || fy < 1800 || fy > new Date().getFullYear()) { toast.error(T.yearRequired); return; }

    setBusy(true);
    const payload: any = {
      owner_id: organizer ? organizer.owner_id : user.id,
      name: form.name.trim(),
      city: form.city.trim() || null,
      description: form.description.trim() || null,
      activity_types: activities,
      logo_url: logoUrl || null,
      website_url: form.website_url || null,
      instagram_url: form.instagram_url || null,
      facebook_url: form.facebook_url || null,
      telegram_url: form.telegram_url || null,
      strava_url: form.strava_url || null,
      youtube_url: form.youtube_url || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone.trim() || null,
      founded_year: fy,
      members_count: form.members_count ? parseInt(form.members_count, 10) : null,
      training_location: form.training_location.trim() || null,
      training_schedule: form.training_schedule.trim() || null,
    };
    if (!organizer) {
      // Safety net: ensure the current user has the organizer role before insert
      const { error: roleErr } = await supabase.rpc("become_organizer" as any);
      if (roleErr) console.warn("become_organizer error:", roleErr);
    }
    const { error } = organizer
      ? await supabase.from("organizers" as any).update(payload).eq("id", organizer.id)
      : await supabase.from("organizers" as any).insert(payload);
    setBusy(false);
    if (error) {
      console.error("organizer save error:", error);
      toast.error(`${error.message}${error.details ? ` — ${error.details}` : ""}`);
      return;
    }
    toast.success(T.saved);
    navigate(editId ? "/admin" : "/organizers");
  };

  const remove = async () => {
    if (!organizer) return;
    if (!confirm(T.confirmDelete)) return;
    const { error } = await supabase.from("organizers" as any).delete().eq("id", organizer.id);
    if (error) { toast.error(error.message); return; }
    toast.success(T.deleted);
    navigate("/organizers");
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth?role=organizer" replace />;
  if (!isOrganizer && !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-3xl py-10">
        <Link to="/organizers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {T.back}
        </Link>
        <h1 className="font-display text-3xl font-bold mb-6">{T.title}</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <form onSubmit={save} className="space-y-6 bg-card p-6 rounded-2xl shadow-card">
            <div className="space-y-2">
              <Label>{T.name} *</Label>
              <Input required value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>{T.logo} *</Label>
              <div className="flex flex-wrap items-center gap-3">
                {logoUrl && <img src={logoUrl} alt="" className="h-20 w-20 rounded-lg object-cover border border-border" />}
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-base">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {logoUrl ? T.replace : T.upload}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </label>
                {logoUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl("")}>
                    <X className="h-4 w-4" /> {T.remove}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{T.city} *</Label>
              <Input required value={form.city} maxLength={120} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>{T.activities}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLUB_ACTIVITY_TYPES.map((a) => (
                  <label key={a} className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-accent">
                    <Checkbox checked={activities.includes(a)} onCheckedChange={() => toggleActivity(a)} />
                    <span className="text-sm">{CLUB_ACTIVITY_LABELS[lang as "uk" | "en"][a]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{T.description}</Label>
              <Textarea rows={4} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <h2 className="font-semibold">{T.socials}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>{T.website}</Label><Input type="url" placeholder="https://..." value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>{T.instagram}</Label><Input type="url" placeholder="https://instagram.com/..." value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>{T.facebook}</Label><Input type="url" placeholder="https://facebook.com/..." value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>{T.telegram}</Label><Input type="url" placeholder="https://t.me/..." value={form.telegram_url} onChange={(e) => setForm({ ...form, telegram_url: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>{T.strava}</Label><Input type="url" placeholder="https://strava.com/..." value={form.strava_url} onChange={(e) => setForm({ ...form, strava_url: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>{T.youtube}</Label><Input type="url" placeholder="https://youtube.com/@..." value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} /></div>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <h2 className="font-semibold">{T.contacts}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>{T.email}</Label><Input type="email" maxLength={255} value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>{T.phone}</Label><Input type="tel" maxLength={40} value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <h2 className="font-semibold">{T.about}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>{T.founded} *</Label><Input required type="number" min={1800} max={new Date().getFullYear()} value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>{T.members} *</Label><Input required type="number" min={0} value={form.members_count} onChange={(e) => setForm({ ...form, members_count: e.target.value })} /></div>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <h2 className="font-semibold">{T.training}</h2>
              <div className="space-y-1.5"><Label>{T.trainingLocation}</Label><Input maxLength={300} value={form.training_location} onChange={(e) => setForm({ ...form, training_location: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>{T.trainingSchedule}</Label><Textarea rows={3} maxLength={1000} value={form.training_schedule} onChange={(e) => setForm({ ...form, training_schedule: e.target.value })} /></div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              <Button type="submit" disabled={busy} className="flex-1 min-w-[140px]">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {T.save}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/organizers")}>{T.cancel}</Button>
              {organizer && (
                <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={remove}>
                  <Trash2 className="h-4 w-4" /> {T.deleteOrg}
                </Button>
              )}
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrganizerProfileEditor;

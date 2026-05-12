import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, X, Upload, ChevronsUpDown, Check, Copy, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useApp } from "@/contexts/AppContext";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GpxTracksManager } from "@/components/GpxTracksManager";
import { ResultsApiKeyManager } from "@/components/ResultsApiKeyManager";
import { DistanceSegmentsEditor, type Segment } from "@/components/DistanceSegmentsEditor";

interface DistanceForm { id?: string; distance_km: string; name: string; price: string; bib_start: string; is_relay: boolean; relay_legs_count: string; relay_categories: string[]; relay_legs: string[]; delivery_enabled: boolean; is_virtual: boolean; virtual_start_date: string; virtual_end_date: string; virtual_start_time: string; virtual_end_time: string; distance_tolerance_percent: string; segments: Segment[]; discipline: string; obstacle_count: string; }

const EMPTY_DISTANCE = (km = ""): DistanceForm => ({ distance_km: km, name: "", price: "0", bib_start: "", is_relay: false, relay_legs_count: "4", relay_categories: ["mix", "men", "women"], relay_legs: ["", "", "", ""], delivery_enabled: false, is_virtual: false, virtual_start_date: "", virtual_end_date: "", virtual_start_time: "", virtual_end_time: "", distance_tolerance_percent: "5", segments: [], discipline: "", obstacle_count: "" });

const RELAY_CAT_OPTIONS = ["mix", "men", "women"] as const;

const EventEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const { t, lang } = useApp();
  const { user, isOrganizer, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [originalOrganizerId, setOriginalOrganizerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", organizer_name: "",
    event_date: "", event_time: "", location: "",
    image_url: "", is_paid: false, payment_url: "", status: "draft", registration_closed: false, changes_deadline_days: 1,
    category: "run" as EventCategory,
    format: "offline" as "offline" | "online" | "hybrid",
    results_pdf_url: "",
    regulations_pdf_url: "",
    results_url: "",
    photos_url: "",
    description_image_url: "",
    wfp_merchant_login: "",
    wfp_secret_key: "",
    wfp_merchant_domain: "",
    liqpay_public_key: "",
    liqpay_private_key: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"link" | "wfp" | "liqpay">("link");

  const isWayForPayUrl = (url: string) => /wayforpay/i.test(url || "");
  const isLiqPayUrl = (url: string) => /liqpay/i.test(url || "");
  const [uploadingResults, setUploadingResults] = useState(false);
  const [uploadingRegulations, setUploadingRegulations] = useState(false);
  const [uploadingDescImage, setUploadingDescImage] = useState(false);
  const [distances, setDistances] = useState<DistanceForm[]>([EMPTY_DISTANCE("10")]);
  const [clubOptions, setClubOptions] = useState<{ id: string; name: string; city: string | null }[]>([]);
  const [clubPickerOpen, setClubPickerOpen] = useState(false);
  const [organizerOptions, setOrganizerOptions] = useState<{ id: string; name: string; city: string | null }[]>([]);
  const [organizerPickerOpen, setOrganizerPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: clubs }, { data: orgs }] = await Promise.all([
        supabase.from("clubs" as any).select("id,name,city").order("name"),
        supabase.from("organizers" as any).select("id,name,city").order("name"),
      ]);
      setClubOptions((clubs ?? []) as any);
      setOrganizerOptions((orgs ?? []) as any);
    })();
  }, []);

  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  useEffect(() => {
    if (isNew || !user) return;
    if (loadedFor === id) return;
    (async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (ev) {
        setOriginalOrganizerId(ev.organizer_id);
      }
      if (ev) {
        const { data: pset } = await supabase
          .from("event_payment_settings" as any)
          .select("wayforpay_merchant_login, wayforpay_secret_key, wayforpay_merchant_domain, liqpay_public_key, liqpay_private_key")
          .eq("event_id", id)
          .maybeSingle();
        setForm({
          title: ev.title, description: ev.description ?? "",
          organizer_name: ev.organizer_name, event_date: ev.event_date,
          event_time: ev.event_time.slice(0, 5), location: ev.location ?? "",
          image_url: ev.image_url ?? "", is_paid: ev.is_paid,
          payment_url: (ev as any).payment_url ?? "",
          status: ev.status,
          registration_closed: !!(ev as any).registration_closed,
          changes_deadline_days: (ev as any).changes_deadline_days ?? 1,
          category: ((ev as any).category ?? "run") as EventCategory,
          format: ((ev as any).format ?? "offline") as "offline" | "online" | "hybrid",
          results_pdf_url: (ev as any).results_pdf_url ?? "",
          regulations_pdf_url: (ev as any).regulations_pdf_url ?? "",
          results_url: (ev as any).results_url ?? "",
          photos_url: (ev as any).photos_url ?? "",
          description_image_url: (ev as any).description_image_url ?? "",
          wfp_merchant_login: (pset as any)?.wayforpay_merchant_login ?? "",
          wfp_secret_key: (pset as any)?.wayforpay_secret_key ?? "",
          wfp_merchant_domain: (pset as any)?.wayforpay_merchant_domain ?? "",
          liqpay_public_key: (pset as any)?.liqpay_public_key ?? "",
          liqpay_private_key: (pset as any)?.liqpay_private_key ?? "",
        });
        const wfpFilled = !!((pset as any)?.wayforpay_merchant_login || (pset as any)?.wayforpay_secret_key);
        const liqFilled = !!((pset as any)?.liqpay_public_key || (pset as any)?.liqpay_private_key);
        setPaymentMethod(wfpFilled ? "wfp" : liqFilled ? "liqpay" : "link");
      }
      const { data: ds } = await supabase.from("distances").select("*").eq("event_id", id).eq("is_active", true).order("distance_km");
      if (ds) setDistances(ds.map((d: any) => ({
        id: d.id,
        distance_km: String(d.distance_km),
        name: d.name ?? "",
        price: String(d.price),
        bib_start: d.bib_start != null ? String(d.bib_start) : "",
        is_relay: !!d.is_relay,
        relay_legs_count: d.relay_legs_count != null ? String(d.relay_legs_count) : "4",
        relay_categories: (d.relay_categories ?? ["mix", "men", "women"]) as string[],
        relay_legs: Array.isArray(d.relay_legs)
          ? (d.relay_legs as any[]).map((x) => String(x ?? ""))
          : Array.from({ length: d.relay_legs_count ?? 4 }, () => ""),
        delivery_enabled: !!d.delivery_enabled,
        is_virtual: !!(d as any).is_virtual,
        virtual_start_date: (d as any).virtual_start_date ?? "",
        virtual_end_date: (d as any).virtual_end_date ?? "",
        virtual_start_time: ((d as any).virtual_start_time ?? "").toString().slice(0, 5),
        virtual_end_time: ((d as any).virtual_end_time ?? "").toString().slice(0, 5),
        distance_tolerance_percent: (d as any).distance_tolerance_percent != null ? String((d as any).distance_tolerance_percent) : "5",
        segments: Array.isArray((d as any).segments)
          ? ((d as any).segments as any[]).map((s) => ({ sport: s.sport, distance_km: String(s.distance_km ?? "") }))
          : [],
        discipline: (d as any).discipline ?? "",
        obstacle_count: (d as any).obstacle_count != null ? String((d as any).obstacle_count) : "",
      })));
      setLoadedFor(id ?? null);
      setLoading(false);
    })();
  }, [id, isNew, user, loadedFor]);

  const uploadImage = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    setForm({ ...form, image_url: data.publicUrl });
    setUploading(false);
  };

  const uploadResults = async (file: File) => {
    if (!user || isNew) return;
    if (file.type !== "application/pdf") { toast.error(t.events.resultsInvalidType); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error(t.events.resultsTooBig); return; }
    setUploadingResults(true);
    const path = `${id}/results-${Date.now()}.pdf`;
    const { error } = await supabase.storage.from("event-results").upload(path, file, { contentType: "application/pdf", upsert: true });
    if (error) { toast.error(error.message); setUploadingResults(false); return; }
    const { data } = supabase.storage.from("event-results").getPublicUrl(path);
    setForm((f) => ({ ...f, results_pdf_url: data.publicUrl }));
    setUploadingResults(false);
    toast.success(t.events.resultsUploaded);
  };

  const removeResults = () => {
    setForm((f) => ({ ...f, results_pdf_url: "" }));
  };

  const uploadRegulations = async (file: File) => {
    if (!user || isNew) return;
    if (file.type !== "application/pdf") { toast.error("Файл має бути у форматі PDF"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Файл занадто великий (макс. 20 МБ)"); return; }
    setUploadingRegulations(true);
    const path = `${id}/regulations-${Date.now()}.pdf`;
    const { error } = await supabase.storage.from("event-results").upload(path, file, { contentType: "application/pdf", upsert: true });
    if (error) { toast.error(error.message); setUploadingRegulations(false); return; }
    const { data } = supabase.storage.from("event-results").getPublicUrl(path);
    setForm((f) => ({ ...f, regulations_pdf_url: data.publicUrl }));
    setUploadingRegulations(false);
    toast.success("Регламент завантажено");
  };

  const removeRegulations = () => {
    setForm((f) => ({ ...f, regulations_pdf_url: "" }));
  };

  const uploadDescImage = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) { toast.error("Файл має бути зображенням"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Файл занадто великий (макс. 10 МБ)"); return; }
    setUploadingDescImage(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/desc-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file);
    if (error) { toast.error(error.message); setUploadingDescImage(false); return; }
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    setForm((f) => ({ ...f, description_image_url: data.publicUrl }));
    setUploadingDescImage(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.image_url) { toast.error("Додай фото обкладинки"); return; }

    const wfp = form.is_paid && paymentMethod === "wfp";
    const liqpay = form.is_paid && paymentMethod === "liqpay";
    if (wfp) {
      if (!form.wfp_merchant_login.trim() || !form.wfp_secret_key.trim()) {
        toast.error("Заповни всі поля WayForPay (Merchant Login та Secret Key)");
        return;
      }
    }
    if (liqpay) {
      if (!form.liqpay_public_key.trim() || !form.liqpay_private_key.trim()) {
        toast.error("Заповни обидва ключі LiqPay (Public Key і Private Key)");
        return;
      }
    }

    setBusy(true);
    const { wfp_merchant_login, wfp_secret_key, wfp_merchant_domain, liqpay_public_key, liqpay_private_key, ...rest } = form;
    const payload = {
      ...rest,
      organizer_id: !isNew && originalOrganizerId ? originalOrganizerId : user.id,
      status: form.status as any,
      event_time: form.event_time + ":00",
      image_url: form.image_url || null,
      location: form.location,
      description: form.description || null,
      payment_url: form.is_paid && paymentMethod === "link" ? (form.payment_url || null) : null,
      results_pdf_url: form.results_pdf_url || null,
      regulations_pdf_url: form.regulations_pdf_url || null,
      results_url: form.results_url || null,
      photos_url: form.photos_url || null,
      description_image_url: form.description_image_url || null,
    } as any;
    let eventId = id!;
    if (isNew) {
      const { data, error } = await supabase.from("events").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setBusy(false); return; }
      eventId = data.id;
    } else {
      const { error } = await supabase.from("events").update(payload).eq("id", id);
      if (error) { toast.error(error.message); setBusy(false); return; }
    }

    // Зберігаємо платіжні реквізити (WayForPay або LiqPay) — upsert
    if (wfp) {
      const { error: psErr } = await supabase
        .from("event_payment_settings" as any)
        .upsert({
          event_id: eventId,
          provider: "wayforpay",
          wayforpay_merchant_login: form.wfp_merchant_login.trim(),
          wayforpay_secret_key: form.wfp_secret_key.trim(),
          wayforpay_merchant_domain: null,
          liqpay_public_key: null,
          liqpay_private_key: null,
        } as any, { onConflict: "event_id" });
      if (psErr) { toast.error("Не вдалось зберегти реквізити: " + psErr.message); setBusy(false); return; }
    } else if (liqpay) {
      const { error: psErr } = await supabase
        .from("event_payment_settings" as any)
        .upsert({
          event_id: eventId,
          provider: "liqpay",
          liqpay_public_key: form.liqpay_public_key.trim(),
          liqpay_private_key: form.liqpay_private_key.trim(),
          wayforpay_merchant_login: null,
          wayforpay_secret_key: null,
          wayforpay_merchant_domain: null,
        } as any, { onConflict: "event_id" });
      if (psErr) { toast.error("Не вдалось зберегти реквізити: " + psErr.message); setBusy(false); return; }
    } else if (!isNew) {
      // якщо більше не WFP/LiqPay — приберемо налаштування
      await supabase.from("event_payment_settings" as any).delete().eq("event_id", eventId);
    }

    // sync distances: update existing by id, insert new, hide removed
    // For relay distances, auto-derive total distance_km from sum of leg KM if not provided
    const computeKm = (d: DistanceForm): number => {
      // segments win when present
      if (d.segments && d.segments.length > 0) {
        const sum = d.segments.reduce((acc, s) => acc + (parseFloat(s.distance_km) || 0), 0);
        if (sum > 0) return Math.round(sum * 100) / 100;
      }
      const direct = parseFloat(d.distance_km);
      if (!isNaN(direct) && direct > 0) return direct;
      if (d.is_relay) {
        const legs = d.relay_legs.slice(0, parseInt(d.relay_legs_count || "0", 10) || d.relay_legs.length);
        const sum = legs.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
        return sum;
      }
      return 0;
    };
    const valid = distances.filter((d) => computeKm(d) > 0);
    const keepIds = valid.filter((d) => d.id).map((d) => d.id!);

    // fetch existing active distances to know what to hide
    if (!isNew) {
      const { data: existing } = await supabase.from("distances").select("id").eq("event_id", eventId).eq("is_active", true);
      const toHide = (existing ?? []).map((e: any) => e.id).filter((eid: string) => !keepIds.includes(eid));
      if (toHide.length > 0) {
        const { error: hideErr } = await supabase.from("distances").update({ is_active: false } as any).in("id", toHide);
        if (hideErr) {
          toast.error("Не вдалось прибрати дистанцію: " + hideErr.message);
          setBusy(false); return;
        }
      }
    }

    // update existing
    for (const d of valid.filter((x) => x.id)) {
      const { error: uErr } = await supabase.from("distances").update({
        distance_km: computeKm(d),
        name: d.name || null,
        price: parseFloat(d.price) || 0,
        bib_start: d.bib_start ? parseInt(d.bib_start, 10) : null,
        is_relay: d.is_relay,
        relay_legs_count: d.is_relay && d.relay_legs_count ? parseInt(d.relay_legs_count, 10) : null,
        relay_categories: d.is_relay && d.relay_categories.length > 0 ? d.relay_categories : ["mix", "men", "women"],
        relay_legs: d.is_relay ? d.relay_legs.slice(0, parseInt(d.relay_legs_count || "0", 10) || d.relay_legs.length).map((v) => parseFloat(v) || 0) : null,
        delivery_enabled: d.delivery_enabled,
        is_virtual: d.is_virtual,
        virtual_start_date: d.is_virtual && d.virtual_start_date ? d.virtual_start_date : null,
        virtual_end_date: d.is_virtual && d.virtual_end_date ? d.virtual_end_date : null,
        virtual_start_time: d.is_virtual && d.virtual_start_time ? d.virtual_start_time : null,
        virtual_end_time: d.is_virtual && d.virtual_end_time ? d.virtual_end_time : null,
        distance_tolerance_percent: d.is_virtual ? (parseFloat(d.distance_tolerance_percent) || 5) : 5,
        segments: d.segments && d.segments.length > 0
          ? d.segments.map((s, idx) => ({ sport: s.sport, distance_km: parseFloat(s.distance_km) || 0, order: idx + 1 }))
          : null,
        discipline: d.discipline?.trim() || null,
        obstacle_count: d.obstacle_count ? parseInt(d.obstacle_count, 10) : null,
      } as any).eq("id", d.id!);
      if (uErr) { toast.error(uErr.message); setBusy(false); return; }
    }

    // insert new
    const newRows = valid.filter((x) => !x.id).map((d) => ({
      event_id: eventId,
      distance_km: computeKm(d),
      name: d.name || null,
      price: parseFloat(d.price) || 0,
      bib_start: d.bib_start ? parseInt(d.bib_start, 10) : null,
      is_active: true,
      is_relay: d.is_relay,
      relay_legs_count: d.is_relay && d.relay_legs_count ? parseInt(d.relay_legs_count, 10) : null,
      relay_categories: d.is_relay && d.relay_categories.length > 0 ? d.relay_categories : ["mix", "men", "women"],
      relay_legs: d.is_relay ? d.relay_legs.slice(0, parseInt(d.relay_legs_count || "0", 10) || d.relay_legs.length).map((v) => parseFloat(v) || 0) : null,
      delivery_enabled: d.delivery_enabled,
      is_virtual: d.is_virtual,
      virtual_start_date: d.is_virtual && d.virtual_start_date ? d.virtual_start_date : null,
      virtual_end_date: d.is_virtual && d.virtual_end_date ? d.virtual_end_date : null,
      virtual_start_time: d.is_virtual && d.virtual_start_time ? d.virtual_start_time : null,
      virtual_end_time: d.is_virtual && d.virtual_end_time ? d.virtual_end_time : null,
      distance_tolerance_percent: d.is_virtual ? (parseFloat(d.distance_tolerance_percent) || 5) : 5,
      segments: d.segments && d.segments.length > 0
        ? d.segments.map((s, idx) => ({ sport: s.sport, distance_km: parseFloat(s.distance_km) || 0, order: idx + 1 }))
        : null,
      discipline: d.discipline?.trim() || null,
      obstacle_count: d.obstacle_count ? parseInt(d.obstacle_count, 10) : null,
    }));
    if (newRows.length > 0) {
      const { error: iErr } = await supabase.from("distances").insert(newRows as any);
      if (iErr) { toast.error(iErr.message); setBusy(false); return; }
    }
    toast.success("OK");
    setBusy(false);
    navigate("/organizer");
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth?role=organizer" replace />;
  if (!isOrganizer) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-3xl py-10">
        <Link to="/organizer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t.organizer.backToDashboard}
        </Link>
        <h1 className="font-display text-3xl font-bold mb-6">{isNew ? t.organizer.createEvent : t.organizer.edit}</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <form onSubmit={save} className="space-y-6 bg-card p-6 rounded-2xl shadow-card">
            <div className="space-y-2">
              <Label>{t.organizer.title} *</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.events.organizer} *</Label>
              <div className="flex gap-2">
                <Input
                  required
                  className="flex-1"
                  placeholder={lang === "uk" ? "Введіть назву або оберіть клуб" : "Enter name or pick a club"}
                  value={form.organizer_name}
                  onChange={(e) => setForm({ ...form, organizer_name: e.target.value })}
                />
                <Popover open={clubPickerOpen} onOpenChange={setClubPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="shrink-0">
                      <ChevronsUpDown className="h-4 w-4" />
                      {lang === "uk" ? "З клубів" : "From clubs"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder={lang === "uk" ? "Пошук клубу..." : "Search club..."} />
                      <CommandList>
                        <CommandEmpty>{lang === "uk" ? "Не знайдено" : "Not found"}</CommandEmpty>
                        <CommandGroup>
                          {clubOptions.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.city ?? ""}`}
                              onSelect={() => {
                                setForm((f) => ({ ...f, organizer_name: c.name }));
                                setClubPickerOpen(false);
                              }}
                            >
                              <Check className={cn("h-4 w-4", form.organizer_name === c.name ? "opacity-100" : "opacity-0")} />
                              <span className="truncate">{c.name}</span>
                              {c.city && <span className="ml-auto text-xs text-muted-foreground">{c.city}</span>}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === "uk"
                  ? "Можна ввести вручну або вибрати клуб з каталогу."
                  : "Type a name or pick a club from the catalog."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.organizer.date} *</Label>
                <Input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.organizer.time} *</Label>
                <Input type="time" required value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.organizer.location} *</Label>
              <Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.organizer.description}</Label>
              <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Зображення в описі</Label>
              <p className="text-xs text-muted-foreground">Необов'язкове. Одне зображення, яке буде показано під описом події (наприклад, мапа траси, схема старту).</p>
              <div className="flex flex-wrap items-center gap-3">
                {form.description_image_url && (
                  <img src={form.description_image_url} alt="" className="h-20 w-20 rounded object-cover border border-border" />
                )}
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-base">
                  {uploadingDescImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {form.description_image_url ? "Замінити" : "Завантажити"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDescImage(e.target.files[0])} />
                </label>
                {form.description_image_url && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, description_image_url: "" }))}>
                    <X className="h-4 w-4" /> Видалити
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.organizer.image} *</Label>
              <div className="flex items-center gap-3">
                {form.image_url && <img src={form.image_url} alt="" className="h-16 w-16 rounded object-cover" />}
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-base">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-4">
              <Label htmlFor="paid" className="cursor-pointer">{t.organizer.isPaid}</Label>
              <Switch id="paid" checked={form.is_paid} onCheckedChange={(v) => setForm({ ...form, is_paid: v })} />
            </div>

            {form.is_paid && (
              <div className="space-y-2">
                <Label>{t.organizer.paymentUrl}</Label>
                <Input
                  type="url"
                  placeholder="https://... (Monobank, Privat24 тощо)"
                  value={form.payment_url}
                  onChange={(e) => setForm({ ...form, payment_url: e.target.value })}
                  disabled={paymentMethod !== "link"}
                />
                <p className="text-xs text-muted-foreground">
                  {paymentMethod === "link"
                    ? "Просте посилання на оплату — учасник сам введе суму. Для автоматичного підтвердження оплати з правильною сумою — увімкни WayForPay або LiqPay нижче."
                    : "Поле вимкнено: ти використовуєш автоматичну інтеграцію нижче. Сума буде підставлятись автоматично з ціни дистанції."}
                </p>
              </div>
            )}

            {form.is_paid && (
              <div className="space-y-3 rounded-md border border-border p-4">
                <div>
                  <h3 className="font-semibold text-sm">Спосіб прийому оплати</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Обери один із способів. WayForPay та LiqPay автоматично підставляють суму дистанції і самі підтверджують оплату.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="pm-link" className="cursor-pointer text-sm font-medium">Тільки посилання</Label>
                      <p className="text-xs text-muted-foreground">Учасник вводить суму вручну на сторінці оплати</p>
                    </div>
                    <Switch
                      id="pm-link"
                      checked={paymentMethod === "link"}
                      onCheckedChange={(v) => v && setPaymentMethod("link")}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="pm-wfp" className="cursor-pointer text-sm font-medium">WayForPay (автосума)</Label>
                      <p className="text-xs text-muted-foreground">Сума підставляється автоматично, оплата підтверджується сама</p>
                    </div>
                    <Switch
                      id="pm-wfp"
                      checked={paymentMethod === "wfp"}
                      onCheckedChange={(v) => v && setPaymentMethod("wfp")}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="pm-liqpay" className="cursor-pointer text-sm font-medium">LiqPay (автосума)</Label>
                      <p className="text-xs text-muted-foreground">Сума підставляється автоматично, оплата підтверджується сама</p>
                    </div>
                    <Switch
                      id="pm-liqpay"
                      checked={paymentMethod === "liqpay"}
                      onCheckedChange={(v) => v && setPaymentMethod("liqpay")}
                    />
                  </div>
                </div>
              </div>
            )}

            {form.is_paid && paymentMethod === "wfp" && (
              <div className="space-y-3 rounded-md border border-primary/40 bg-primary/5 p-4">
                <div>
                  <h3 className="font-semibold">Реквізити WayForPay</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Дані з твого кабінету WayForPay → Налаштування → Реквізити мерчанта. Зберігаються приватно — їх бачиш тільки ти.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Merchant Login *</Label>
                  <Input
                    placeholder="наприклад: my_shop_com"
                    value={form.wfp_merchant_login}
                    onChange={(e) => setForm({ ...form, wfp_merchant_login: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Merchant Secret Key *</Label>
                  <Input
                    type="password"
                    placeholder="секретний ключ (32 символи)"
                    value={form.wfp_secret_key}
                    onChange={(e) => setForm({ ...form, wfp_secret_key: e.target.value })}
                    maxLength={200}
                  />
                </div>
                <div className="rounded-md bg-background border border-border p-3 text-xs text-muted-foreground">
                  Домен мерчанта підставляється автоматично з адреси сайту, де користувач натискає «Сплатити». У кабінеті WayForPay вкажи домен <code className="font-mono">fartlek.lovable.app</code> (або свій кастомний домен, якщо підключиш).
                </div>
                <div className="rounded-md bg-background border border-border p-3 text-xs space-y-3">
                  <p className="font-semibold">⚙️ Налаштуй у кабінеті WayForPay:</p>
                  {(() => {
                    const serviceUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/wayforpay-callback`;
                    const returnUrl = `${window.location.origin}/payment-success`;
                    const copy = async (val: string, label: string) => {
                      try {
                        await navigator.clipboard.writeText(val);
                        toast.success(`${label} скопійовано`);
                      } catch {
                        toast.error("Не вдалося скопіювати");
                      }
                    };
                    return (
                      <>
                        <div>
                          <p className="mb-1"><strong>Service URL:</strong></p>
                          <div className="flex items-stretch gap-1">
                            <code className="flex-1 bg-muted p-2 rounded text-[10px] break-all">{serviceUrl}</code>
                            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => copy(serviceUrl, "Service URL")}>
                              <Copy className="h-3 w-3 mr-1" /> Копіювати
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1"><strong>Return URL:</strong></p>
                          <div className="flex items-stretch gap-1">
                            <code className="flex-1 bg-muted p-2 rounded text-[10px] break-all">{returnUrl}</code>
                            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => copy(returnUrl, "Return URL")}>
                              <Copy className="h-3 w-3 mr-1" /> Копіювати
                            </Button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {form.is_paid && paymentMethod === "liqpay" && (
              <div className="space-y-3 rounded-md border border-primary/40 bg-primary/5 p-4">
                <div>
                  <h3 className="font-semibold">Реквізити LiqPay</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Дані з твого кабінету LiqPay → Налаштування → API. Зберігаються приватно — їх бачиш тільки ти.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Public Key *</Label>
                  <Input
                    placeholder="наприклад: i12345678901"
                    value={form.liqpay_public_key}
                    onChange={(e) => setForm({ ...form, liqpay_public_key: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Private Key *</Label>
                  <Input
                    type="password"
                    placeholder="приватний ключ"
                    value={form.liqpay_private_key}
                    onChange={(e) => setForm({ ...form, liqpay_private_key: e.target.value })}
                    maxLength={200}
                  />
                </div>
                <div className="rounded-md bg-background border border-border p-3 text-xs space-y-3">
                  <p className="font-semibold">⚙️ Налаштуй у кабінеті LiqPay:</p>
                  {(() => {
                    const serverUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/liqpay-callback`;
                    const resultUrl = `${window.location.origin}/payment-success`;
                    const copy = async (val: string, label: string) => {
                      try {
                        await navigator.clipboard.writeText(val);
                        toast.success(`${label} скопійовано`);
                      } catch {
                        toast.error("Не вдалося скопіювати");
                      }
                    };
                    return (
                      <>
                        <div>
                          <p className="mb-1"><strong>Server URL (callback):</strong></p>
                          <div className="flex items-stretch gap-1">
                            <code className="flex-1 bg-muted p-2 rounded text-[10px] break-all">{serverUrl}</code>
                            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => copy(serverUrl, "Server URL")}>
                              <Copy className="h-3 w-3 mr-1" /> Копіювати
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1"><strong>Result URL (повернення):</strong></p>
                          <div className="flex items-stretch gap-1">
                            <code className="flex-1 bg-muted p-2 rounded text-[10px] break-all">{resultUrl}</code>
                            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => copy(resultUrl, "Result URL")}>
                              <Copy className="h-3 w-3 mr-1" /> Копіювати
                            </Button>
                          </div>
                        </div>
                        <p className="text-muted-foreground pt-1">
                          Server URL вкажи у налаштуваннях магазину LiqPay як URL для callback. Result URL — куди повертається учасник після оплати.
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {!isNew && (
              <div className="space-y-3 rounded-md border border-border p-4">
                <Label>Регламент події</Label>
                <p className="text-xs text-muted-foreground">
                  Завантажте PDF або вставте посилання на Google Doc / іншу сторінку. Учасники зможуть переглянути регламент у модальному вікні на сторінці події.
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="regulations_url" className="text-xs text-muted-foreground">Посилання (Google Doc, PDF тощо)</Label>
                  <Input
                    id="regulations_url"
                    type="url"
                    placeholder="https://docs.google.com/document/d/..."
                    value={form.regulations_pdf_url}
                    onChange={(e) => setForm((f) => ({ ...f, regulations_pdf_url: e.target.value }))}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {form.regulations_pdf_url && (
                    <a
                      href={form.regulations_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
                    >
                      <Upload className="h-4 w-4 rotate-180" /> Переглянути регламент
                    </a>
                  )}
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-base">
                    {uploadingRegulations ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {form.regulations_pdf_url ? "Замінити PDF" : "Завантажити PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadRegulations(e.target.files[0])}
                    />
                  </label>
                  {form.regulations_pdf_url && (
                    <Button type="button" variant="ghost" size="sm" onClick={removeRegulations}>
                      <X className="h-4 w-4" /> {t.organizer.delete}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!isNew && (
              <div className="space-y-2 rounded-md border border-border p-4">
                <Label>{t.events.resultsTitle}</Label>
                <p className="text-xs text-muted-foreground">{t.events.resultsHint}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {form.results_pdf_url && (
                    <a
                      href={form.results_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
                    >
                      <Upload className="h-4 w-4 rotate-180" /> {t.events.downloadResults}
                    </a>
                  )}
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-base">
                    {uploadingResults ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {form.results_pdf_url ? t.events.replaceResults : t.events.uploadResults}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadResults(e.target.files[0])}
                    />
                  </label>
                  {form.results_pdf_url && (
                    <Button type="button" variant="ghost" size="sm" onClick={removeResults}>
                      <X className="h-4 w-4" /> {t.organizer.delete}
                    </Button>
                  )}
                </div>
                <div className="pt-3 border-t border-border space-y-1.5">
                  <Label className="text-sm">{t.events.resultsExternalUrl}</Label>
                  <p className="text-xs text-muted-foreground">{t.events.resultsExternalHint}</p>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={form.results_url}
                    onChange={(e) => setForm({ ...form, results_url: e.target.value })}
                  />
                </div>
                <div className="pt-3 border-t border-border space-y-1.5">
                  <Label className="text-sm">{t.events.photosUrl}</Label>
                  <p className="text-xs text-muted-foreground">{t.events.photosHint}</p>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={form.photos_url}
                    onChange={(e) => setForm({ ...form, photos_url: e.target.value })}
                  />
                </div>
              </div>
            )}

            {!isNew && id && <ResultsApiKeyManager eventId={id} />}

            <div className="space-y-2">
              <Label>{t.organizer.status}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t.organizer.draft}</SelectItem>
                  <SelectItem value="published">{t.organizer.published}</SelectItem>
                  <SelectItem value="cancelled">{t.organizer.cancelled}</SelectItem>
                  <SelectItem value="completed">{t.organizer.completed}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <Switch
                id="registration_closed"
                checked={form.registration_closed}
                onCheckedChange={(v) => setForm({ ...form, registration_closed: v })}
              />
              <div className="flex-1">
                <Label htmlFor="registration_closed" className="cursor-pointer">
                  {lang === "uk" ? "Реєстрація закрита (слоти закінчились)" : "Registration closed (slots full)"}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === "uk"
                    ? "Подія залишиться на сайті, але учасники не зможуть зареєструватись."
                    : "Event stays visible, but new registrations will be disabled."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="changes_deadline_days">
                {lang === "uk" ? "За скільки днів до події припинити самостійні зміни" : "Stop self-service changes N days before event"}
              </Label>
              <Input
                id="changes_deadline_days"
                type="number"
                min={0}
                max={60}
                value={form.changes_deadline_days ?? 1}
                onChange={(e) => setForm({ ...form, changes_deadline_days: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                {lang === "uk"
                  ? "Учасник зможе сам змінювати дистанцію, передавати реєстрацію або просити відміну до цього дедлайну."
                  : "Participants can change distance, transfer or request cancellation only before this deadline."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t.categories.label} *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as EventCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{t.categories[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.format.label} *</Label>
              <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v as "offline" | "online" | "hybrid" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">{t.format.offline}</SelectItem>
                  <SelectItem value="online">{t.format.online}</SelectItem>
                  <SelectItem value="hybrid">{t.format.hybrid}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t.format.hint}</p>
            </div>

            <div className="space-y-3">
              <Label>{t.organizer.distances} *</Label>
              <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-xs text-muted-foreground">
                <span className="col-span-2">{t.organizer.distanceKm}</span>
                <span className="col-span-5">{t.organizer.distanceName}</span>
                <span className="col-span-2">{t.organizer.distancePrice}</span>
                <span className="col-span-2">{t.organizer.bibStart}</span>
                <span className="col-span-1" />
              </div>
              {distances.map((d, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                  <div className="sm:grid sm:grid-cols-12 sm:gap-2 space-y-3 sm:space-y-0">
                    <div className="flex items-center justify-between sm:hidden">
                      <span className="text-sm font-medium text-muted-foreground">#{i + 1}</span>
                      <Button type="button" variant="ghost" size="sm"
                        onClick={() => setDistances(distances.filter((_, k) => k !== i))}>
                        <X className="h-4 w-4" /> {t.organizer.cancel}
                      </Button>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="sm:hidden text-xs text-muted-foreground">{t.organizer.distanceKm}</Label>
                      <Input type="number" step="0.1" placeholder="км" value={d.distance_km}
                        onChange={(e) => { const c = [...distances]; c[i].distance_km = e.target.value; setDistances(c); }} />
                    </div>
                    <div className="sm:col-span-5 space-y-1">
                      <Label className="sm:hidden text-xs text-muted-foreground">{t.organizer.distanceName}</Label>
                      <Input placeholder={t.organizer.distanceName} value={d.name}
                        onChange={(e) => { const c = [...distances]; c[i].name = e.target.value; setDistances(c); }} />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="sm:hidden text-xs text-muted-foreground">{t.organizer.distancePrice}</Label>
                      <Input type="number" step="1" placeholder="₴" value={d.price}
                        onChange={(e) => { const c = [...distances]; c[i].price = e.target.value; setDistances(c); }} />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="sm:hidden text-xs text-muted-foreground">{t.organizer.bibStart}</Label>
                      <Input type="number" step="1" placeholder="1001" value={d.bib_start}
                        onChange={(e) => { const c = [...distances]; c[i].bib_start = e.target.value; setDistances(c); }} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="hidden sm:inline-flex sm:col-span-1"
                      onClick={() => setDistances(distances.filter((_, k) => k !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <DistanceSegmentsEditor
                    lang={lang as "uk" | "en"}
                    segments={d.segments}
                    discipline={d.discipline}
                    obstacleCount={d.obstacle_count}
                    onChange={(next) => {
                      const c = [...distances];
                      c[i] = { ...c[i], segments: next.segments, discipline: next.discipline, obstacle_count: next.obstacleCount };
                      if (next.segments.length > 0) {
                        const sum = next.segments.reduce((acc, s) => acc + (parseFloat(s.distance_km) || 0), 0);
                        if (sum > 0) c[i].distance_km = String(Math.round(sum * 100) / 100);
                      }
                      setDistances(c);
                    }}
                  />

                  <div className="pt-2 border-t border-border space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id={`relay-${i}`}
                        checked={d.is_relay}
                        onCheckedChange={(v) => { const c = [...distances]; c[i].is_relay = v; setDistances(c); }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`relay-${i}`} className="cursor-pointer">{t.organizer.isRelay}</Label>
                        <p className="text-xs text-muted-foreground">{t.organizer.isRelayHint}</p>
                      </div>
                    </div>
                    {d.is_relay && (
                      <div className="space-y-3 pl-1">
                        <div className="space-y-1 max-w-[200px]">
                          <Label className="text-xs">{t.organizer.relayLegs}</Label>
                          <Input type="number" min={2} max={10} step="1" value={d.relay_legs_count}
                            onChange={(e) => {
                              const c = [...distances];
                              const n = Math.max(2, Math.min(10, parseInt(e.target.value || "0", 10) || 0));
                              c[i].relay_legs_count = e.target.value;
                              const cur = [...c[i].relay_legs];
                              while (cur.length < n) cur.push("");
                              while (cur.length > n) cur.pop();
                              c[i].relay_legs = cur;
                              setDistances(c);
                            }} />
                          <p className="text-xs text-muted-foreground">{t.organizer.relayLegsHint}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">{t.organizer.relayLegsKm}</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Array.from({ length: parseInt(d.relay_legs_count || "0", 10) || 0 }).map((_, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-10">#{idx + 1}</span>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  pattern="[0-9]*[.,]?[0-9]*"
                                  placeholder={t.organizer.kmPlaceholder}
                                  value={d.relay_legs[idx] ?? ""}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                                    const c = [...distances];
                                    const arr = [...c[i].relay_legs];
                                    arr[idx] = raw;
                                    c[i].relay_legs = arr;
                                    setDistances(c);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">{t.organizer.relayLegsKmHint}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border space-y-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          id={`virtual-${i}`}
                          checked={d.is_virtual}
                          onCheckedChange={(v) => { const c = [...distances]; c[i].is_virtual = v; setDistances(c); }}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`virtual-${i}`} className="cursor-pointer">Віртуальна гонка (Strava)</Label>
                          <p className="text-xs text-muted-foreground">Учасники синхронізують активність зі Strava — час підтверджується автоматично за дистанцією і датою.</p>
                        </div>
                      </div>
                      {d.is_virtual && (
                        <TooltipProvider delayDuration={150}>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pl-1">
                            <div className="space-y-1">
                              <Label className="text-xs flex items-center gap-1">
                                Початкова дата
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="text-muted-foreground hover:text-foreground"><HelpCircle className="h-3.5 w-3.5" /></button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    Перший день, з якого приймаються активності зі Strava. Тренування раніше цієї дати не зарахуються.
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input type="date" value={d.virtual_start_date}
                                onChange={(e) => { const c = [...distances]; c[i].virtual_start_date = e.target.value; setDistances(c); }} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs flex items-center gap-1">
                                Остання дата
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="text-muted-foreground hover:text-foreground"><HelpCircle className="h-3.5 w-3.5" /></button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    Останній день, коли учасник може виконати дистанцію. Активності пізніше цієї дати не зарахуються.
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input type="date" value={d.virtual_end_date}
                                onChange={(e) => { const c = [...distances]; c[i].virtual_end_date = e.target.value; setDistances(c); }} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs flex items-center gap-1">
                                Час початку
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="text-muted-foreground hover:text-foreground"><HelpCircle className="h-3.5 w-3.5" /></button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    Не обов'язково. Якщо вказано — активність має початись не раніше цього часу. Залиште порожнім, щоб приймати з 00:00.
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input type="time" value={d.virtual_start_time}
                                onChange={(e) => { const c = [...distances]; c[i].virtual_start_time = e.target.value; setDistances(c); }} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs flex items-center gap-1">
                                Час завершення
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="text-muted-foreground hover:text-foreground"><HelpCircle className="h-3.5 w-3.5" /></button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    Не обов'язково. Активність має завершитись не пізніше цього часу. Залиште порожнім, щоб приймати до 23:59.
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input type="time" value={d.virtual_end_time}
                                onChange={(e) => { const c = [...distances]; c[i].virtual_end_time = e.target.value; setDistances(c); }} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs flex items-center gap-1">
                                Допуск, %
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="text-muted-foreground hover:text-foreground"><HelpCircle className="h-3.5 w-3.5" /></button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    Наскільки фактична дистанція у Strava може відрізнятися від заявленої. Наприклад, 10 км з допуском 5% — зарахуються пробіжки від 9.5 до 10.5 км. Потрібно через похибку GPS.
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input type="number" min="0" max="50" step="0.5" value={d.distance_tolerance_percent}
                                onChange={(e) => { const c = [...distances]; c[i].distance_tolerance_percent = e.target.value; setDistances(c); }} />
                            </div>
                          </div>
                        </TooltipProvider>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      <Switch
                        id={`delivery-${i}`}
                        checked={d.delivery_enabled}
                        onCheckedChange={(v) => { const c = [...distances]; c[i].delivery_enabled = v; setDistances(c); }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`delivery-${i}`} className="cursor-pointer">
                          {lang === "uk" ? "Доставка Новою Поштою" : "Nova Poshta delivery"}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {lang === "uk"
                            ? "Дозволити учасникам цієї дистанції замовити доставку медалі / стартового пакету (рекомендовано для онлайн-дистанцій)."
                            : "Let participants on this distance order delivery of the medal / starter pack (recommended for online distances)."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {lang === "uk" ? "Швидко додати стандартну дистанцію" : "Quick add a standard distance"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 5, 10, 21.1, 42.2, 50, 100].map((km) => {
                    const exists = distances.some((d) => parseFloat(d.distance_km) === km);
                    return (
                      <Button
                        key={km}
                        type="button"
                        variant={exists ? "secondary" : "outline"}
                        size="sm"
                        disabled={exists}
                        onClick={() => setDistances([...distances, { ...EMPTY_DISTANCE(String(km)), name: `${km} ${lang === "uk" ? "км" : "km"}` }])}
                      >
                        {km} {lang === "uk" ? "км" : "km"}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <Button type="button" variant="outline" size="sm"
                onClick={() => setDistances([...distances, EMPTY_DISTANCE()])}>
                <Plus className="h-4 w-4" /> {t.organizer.addDistance} ({lang === "uk" ? "нестандартна" : "custom"})
              </Button>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="submit" disabled={busy} className="flex-1">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.organizer.save}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/organizer")}>{t.organizer.cancel}</Button>
            </div>
          </form>
        )}

        {!isNew && id && (
          <div className="mt-6">
            <GpxTracksManager
              eventId={id}
              distances={distances
                .filter((d) => d.id)
                .map((d) => ({ id: d.id!, name: d.name, distance_km: parseFloat(d.distance_km) || 0 }))}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventEditor;

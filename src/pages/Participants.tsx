import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, FileText, RotateCcw, Trash2, X, Bell, ArrowRightLeft, Download, Package, Mail, Trophy } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Participants = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useApp();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [distancePriceMap, setDistancePriceMap] = useState<Record<string, number>>({});
  const [reminderOpen, setReminderOpen] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [distances, setDistances] = useState<any[]>([]);
  const [moveTarget, setMoveTarget] = useState<any | null>(null);
  const [moveToId, setMoveToId] = useState<string>("");
  const [moving, setMoving] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState<{ url: string; isImage: boolean; isHeic?: boolean } | null>(null);
  const [resultsMap, setResultsMap] = useState<Record<string, { time_seconds: number; distance_meters: number | null; source: string; strava_activity_id: number | null; verified: boolean }>>({});
  const [syncingAll, setSyncingAll] = useState(false);

  // Filters
  const [fGender, setFGender] = useState<string>("all");
  const [fYear, setFYear] = useState<string>("all");
  const [fAge, setFAge] = useState<string>("all");
  const [fCity, setFCity] = useState<string>("all");
  const [fClub, setFClub] = useState<string>("all");
  const [fPayment, setFPayment] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!id || !user) return;
    const { data: ev } = await supabase
      .from("events")
      .select("title, is_paid, organizer_id")
      .eq("id", id)
      .maybeSingle();
    setEventTitle(ev?.title ?? "");
    setIsPaid(!!ev?.is_paid);
    let isOrg = ev?.organizer_id === user.id || isAdmin;
    if (!isOrg) {
      const { data: co } = await supabase
        .from("event_co_organizers")
        .select("user_id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (co) isOrg = true;
    }
    setIsOrganizer(isOrg);
    const { data: dists } = await supabase
      .from("distances")
      .select("id, distance_km, name, price, max_participants, is_active, is_virtual")
      .eq("event_id", id)
      .order("distance_km", { ascending: true });
    const priceMap: Record<string, number> = {};
    (dists ?? []).forEach((d: any) => {
      const key = `${d.distance_km}|${d.name ?? ""}`;
      priceMap[key] = Number(d.price ?? 0);
    });
    setDistancePriceMap(priceMap);
    setDistances(dists ?? []);
    const { data: participants } = await (supabase.rpc as any)("get_event_participants", { _event_id: id });
    setRows(participants ?? []);
    const { data: resData } = await supabase
      .from("event_results")
      .select("registration_id, time_seconds, distance_meters, source, strava_activity_id, verified")
      .eq("event_id", id);
    const rmap: Record<string, any> = {};
    (resData ?? []).forEach((r: any) => { rmap[r.registration_id] = r; });
    setResultsMap(rmap);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user]);

  const openReceipt = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) { toast.error(error?.message ?? "Error"); return; }
    // HEIC/HEIF are not renderable by most browsers — treat as non-image so we show a download fallback.
    const isImage = /\.(png|jpe?g|gif|webp|bmp)$/i.test(path);
    const isHeic = /\.(heic|heif)$/i.test(path);
    setReceiptDialog({ url: data.signedUrl, isImage, isHeic } as any);
  };

  const revoke = async (regId: string) => {
    const reason = window.prompt(lang === "uk" ? "Причина відхилення (необов'язково):" : "Reason (optional):") ?? "";
    setBusyId(regId);
    const { error } = await supabase
      .from("registrations")
      .update({ payment_status: "pending", receipt_revoked_reason: reason || "—", receipt_confirmed_at: null })
      .eq("id", regId);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("OK");
    load();
  };

  const confirm = async (regId: string) => {
    setBusyId(regId);
    const { error } = await supabase
      .from("registrations")
      .update({ payment_status: "paid", receipt_confirmed_at: new Date().toISOString(), receipt_revoked_reason: null })
      .eq("id", regId);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("OK");
    load();
  };

  const removeParticipant = async (regId: string, name: string) => {
    const ok = window.confirm(
      lang === "uk"
        ? `Видалити учасника${name ? ` «${name}»` : ""}? Цю дію не можна скасувати.`
        : `Delete participant${name ? ` "${name}"` : ""}? This cannot be undone.`
    );
    if (!ok) return;
    setBusyId(regId);
    const { error } = await supabase.from("registrations").delete().eq("id", regId);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "uk" ? "Учасника видалено" : "Participant removed");
    load();
  };

  const openMoveDialog = (r: any) => {
    setMoveTarget(r);
    setMoveToId("");
  };

  const confirmMove = async () => {
    if (!moveTarget || !moveToId) return;
    setMoving(true);
    const { data, error } = await (supabase.rpc as any)("move_registration_to_distance", {
      _registration_id: moveTarget.registration_id,
      _new_distance_id: moveToId,
    });
    setMoving(false);
    if (error) {
      const msg = error.message || "";
      const map: Record<string, string> = {
        DISTANCE_FULL: lang === "uk" ? "Немає вільних місць на обраній дистанції" : "Selected distance is full",
        INVALID_DISTANCE: lang === "uk" ? "Невірна дистанція" : "Invalid distance",
        NOT_AUTHORIZED: lang === "uk" ? "Немає прав" : "Not authorized",
      };
      const matched = Object.keys(map).find((k) => msg.includes(k));
      toast.error(matched ? map[matched] : msg);
      return;
    }
    const newBib = Array.isArray(data) ? data[0]?.new_bib_number : (data as any)?.new_bib_number;
    toast.success(
      lang === "uk"
        ? `Учасника переміщено. Новий номер: ${newBib ?? "—"}`
        : `Participant moved. New bib: ${newBib ?? "—"}`
    );
    setMoveTarget(null);
    load();
  };

  // Recipients = those without a confirmed (green check) payment.
  // Two groups: no receipt uploaded → payment-reminder; receipt uploaded but not yet confirmed → receipt-reminder.
  const reminderTargets = useMemo(() => {
    return rows
      .filter((r) => r.email && r.payment_status !== "paid")
      .map((r) => ({
        email: r.email as string,
        name: (r.full_name as string) ?? "",
        registration_id: r.registration_id as string,
        kind: r.receipt_url ? "receipt" : "payment",
        amount: distancePriceMap[`${r.distance_km}|${r.distance_name ?? ""}`] ?? 0,
      }));
  }, [rows, distancePriceMap]);

  const pendingPaymentCount = reminderTargets.filter((r) => r.kind === "payment").length;
  const pendingReceiptCount = reminderTargets.filter((r) => r.kind === "receipt").length;

  const reminderCooldownKey = id ? `reminder-sent:${id}` : "";

  const sendReminders = async () => {
    if (!id || reminderTargets.length === 0) return;
    // 24h cooldown per event
    const lastSentRaw = localStorage.getItem(reminderCooldownKey);
    if (lastSentRaw) {
      const lastSent = new Date(lastSentRaw);
      const nextAllowed = new Date(lastSent.getTime() + 24 * 60 * 60 * 1000);
      if (nextAllowed > new Date()) {
        const timeStr = nextAllowed.toLocaleString(lang === "uk" ? "uk-UA" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        });
        toast.error(
          lang === "uk"
            ? `Наступна розсилка можлива ${timeStr}`
            : `Next reminder available at ${timeStr}`
        );
        setReminderOpen(false);
        return;
      }
    }
    setSendingReminders(true);
    // Завжди використовуємо production URL у листах, щоб лінки не ламались,
    // якщо нагадування надсилається з preview-середовища.
    const ticketBase = `https://fartlek.lovable.app/ticket/`;
    let ok = 0;
    let fail = 0;
    for (const t of reminderTargets) {
      const templateName = t.kind === "receipt" ? "receipt-reminder" : "payment-reminder";
      const templateData: Record<string, any> = {
        name: t.name?.split(" ")[0] || t.name,
        eventTitle,
        ticketUrl: `${ticketBase}${t.registration_id}`,
      };
      if (t.kind === "payment" && t.amount > 0) templateData.amount = t.amount;
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName,
          recipientEmail: t.email,
          idempotencyKey: `reminder-${t.kind}-${t.registration_id}-${new Date().toISOString().slice(0, 10)}`,
          templateData,
        },
      });
      if (error) fail++;
      else ok++;
    }
    setSendingReminders(false);
    setReminderOpen(false);
    if (ok > 0) {
      localStorage.setItem(reminderCooldownKey, new Date().toISOString());
      toast.success(
        lang === "uk"
          ? `Розсилку надіслано: ${ok} лист(ів)${fail ? `, ${fail} не вдалося` : ""}`
          : `Reminders sent: ${ok}${fail ? `, ${fail} failed` : ""}`
      );
    } else if (fail > 0) {
      toast.error(lang === "uk" ? "Не вдалося надіслати нагадування" : "Failed to send reminders");
    }
  };

  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.birth_year).filter(Boolean))).sort((a: any, b: any) => b - a),
    [rows]
  );
  const cities = useMemo(
    () => Array.from(new Set(rows.map((r) => r.city).filter(Boolean))).sort() as string[],
    [rows]
  );
  const clubs = useMemo(
    () => Array.from(new Set(rows.map((r) => r.club).filter(Boolean))).sort() as string[],
    [rows]
  );

  const ageRanges: Record<string, [number, number]> = {
    "1-17": [1, 17],
    "18-29": [18, 29],
    "30-39": [30, 39],
    "40-49": [40, 49],
    "50-59": [50, 59],
    "60-69": [60, 69],
    "70-79": [70, 79],
    "80-100": [80, 100],
  };

  const filteredRows = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return rows.filter((r) => {
      if (fGender !== "all" && r.gender !== fGender) return false;
      if (fYear !== "all" && String(r.birth_year ?? "") !== fYear) return false;
      if (fAge !== "all") {
        const range = ageRanges[fAge];
        if (!range || !r.birth_year) return false;
        const age = currentYear - Number(r.birth_year);
        if (age < range[0] || age > range[1]) return false;
      }
      if (fCity !== "all" && (r.city ?? "") !== fCity) return false;
      if (fClub !== "all" && (r.club ?? "") !== fClub) return false;
      if (isPaid && fPayment !== "all" && r.payment_status !== fPayment) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!String(r.full_name ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, fGender, fYear, fAge, fCity, fClub, fPayment, isPaid, search]);

  const resetFilters = () => {
    setFGender("all"); setFYear("all"); setFAge("all"); setFCity("all"); setFClub("all"); setFPayment("all"); setSearch("");
  };
  const hasActiveFilters =
    fGender !== "all" || fYear !== "all" || fAge !== "all" || fCity !== "all" || fClub !== "all" || fPayment !== "all" || search.trim() !== "";

  const deliveryRows = useMemo(() => rows.filter((r) => r.delivery_enabled), [rows]);

  const exportToExcel = (onlyDelivery: boolean) => {
    const source = onlyDelivery ? deliveryRows : filteredRows;
    if (source.length === 0) {
      toast.info(lang === "uk" ? "Немає даних для експорту" : "No data to export");
      return;
    }
    const data = source.map((r: any) => {
      const base: Record<string, any> = {
        [lang === "uk" ? "Номер" : "Bib"]: r.bib_number ?? "",
        [lang === "uk" ? "ПІБ" : "Full name"]: r.full_name ?? "",
        [lang === "uk" ? "Стать" : "Gender"]: r.gender ?? "",
        [lang === "uk" ? "Рік" : "Year"]: r.birth_year ?? "",
        [lang === "uk" ? "Місто" : "City"]: r.city ?? "",
        [lang === "uk" ? "Клуб" : "Club"]: r.club ?? "",
        [lang === "uk" ? "Дистанція (км)" : "Distance (km)"]: r.distance_km ?? "",
        [lang === "uk" ? "Назва дистанції" : "Distance name"]: r.distance_name ?? "",
        [lang === "uk" ? "Email" : "Email"]: r.email ?? "",
      };
      if (isPaid) base[lang === "uk" ? "Оплата" : "Payment"] = r.payment_status ?? "";
      base[lang === "uk" ? "Доставка НП" : "NP delivery"] = r.delivery_enabled
        ? (lang === "uk" ? "Так" : "Yes") : "";
      base[lang === "uk" ? "Отримувач" : "Recipient"] = r.delivery_recipient_name ?? "";
      base[lang === "uk" ? "Телефон" : "Phone"] = r.delivery_phone ?? "";
      base[lang === "uk" ? "Місто (НП)" : "NP city"] = r.delivery_city_name ?? "";
      base[lang === "uk" ? "Відділення / Поштомат" : "Branch / Postomat"] = r.delivery_warehouse_name ?? "";
      base[lang === "uk" ? "Тип" : "Type"] = r.delivery_warehouse_type === "postomat"
        ? (lang === "uk" ? "Поштомат" : "Postomat")
        : r.delivery_warehouse_type === "branch"
          ? (lang === "uk" ? "Відділення" : "Branch") : "";
      return base;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    // Auto width
    const colWidths = Object.keys(data[0] ?? {}).map((k) => ({
      wch: Math.min(40, Math.max(k.length + 2, ...data.map((d) => String(d[k] ?? "").length + 2))),
    }));
    (ws as any)["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, lang === "uk" ? "Учасники" : "Participants");
    const safeTitle = (eventTitle || "event").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
    const suffix = onlyDelivery ? (lang === "uk" ? "_доставка" : "_delivery") : "";
    XLSX.writeFile(wb, `${safeTitle}${suffix}.xlsx`);
  };

  if (authLoading) return null;
  if (!user) return <Navigate to={`/auth?redirect=/events/${id}/participants`} replace />;

  const fmtResult = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${m}:${String(sec).padStart(2, "0")}`;
  };
  const hasAnyResult = Object.keys(resultsMap).length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-5xl py-10">
        <Link to={`/events/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t.events.backToEvents}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">{t.events.participants}</h1>
            <p className="text-muted-foreground mt-1">
              {eventTitle} · {filteredRows.length}
              {filteredRows.length !== rows.length && <span className="text-muted-foreground/70"> / {rows.length}</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOrganizer && rows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToExcel(false)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {lang === "uk" ? "Excel" : "Excel"}
              </Button>
            )}
            {isOrganizer && deliveryRows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToExcel(true)}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                {lang === "uk" ? "Доставка" : "Delivery"}
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs h-5 min-w-5 px-1.5">
                  {deliveryRows.length}
                </span>
              </Button>
            )}
            {isOrganizer && isPaid && reminderTargets.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReminderOpen(true)}
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
                {lang === "uk" ? "Надіслати нагадування" : "Send reminders"}
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs h-5 min-w-5 px-1.5">
                  {reminderTargets.length}
                </span>
              </Button>
            )}
            {isOrganizer && (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to={`/organizer/events/${id}/campaign`}>
                  <Mail className="h-4 w-4" />
                  {lang === "uk" ? "Написати учасникам" : "Email participants"}
                </Link>
              </Button>
            )}
            {isOrganizer && distances.some((d: any) => d.is_virtual) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[#FC4C02] text-[#FC4C02] hover:bg-[#FC4C02] hover:text-white hover:border-[#FC4C02]"
                disabled={syncingAll}
                onClick={async () => {
                  if (!id) return;
                  setSyncingAll(true);
                  try {
                    const { data, error } = await supabase.functions.invoke("strava-sync-activities", {
                      body: { event_id: id, all_users: true },
                    });
                    if (error) throw error;
                    const m = (data as any)?.matched ?? 0;
                    toast.success(lang === "uk" ? `Синхронізовано: ${m}` : `Synced: ${m}`);
                    await load();
                  } catch (e: any) {
                    toast.error(e?.message ?? "Error");
                  } finally {
                    setSyncingAll(false);
                  }
                }}
              >
                {syncingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                {lang === "uk" ? "Синхронізувати Strava" : "Sync Strava"}
              </Button>
            )}
          </div>
        </div>

        {!loading && rows.length > 0 && (
          <div className="mt-6 bg-card rounded-2xl shadow-card p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-muted-foreground mb-1 block">{lang === "uk" ? "Пошук за іменем" : "Search by name"}</label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === "uk" ? "Ім'я..." : "Name..."} />
            </div>
            <div className="min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">{t.profile.gender}</label>
              <Select value={fGender} onValueChange={setFGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "uk" ? "Усі" : "All"}</SelectItem>
                  <SelectItem value="male">{t.profile.male}</SelectItem>
                  <SelectItem value="female">{t.profile.female}</SelectItem>
                  <SelectItem value="boy">{t.profile.boy}</SelectItem>
                  <SelectItem value="girl">{t.profile.girl}</SelectItem>
                  <SelectItem value="other">{t.profile.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[120px]">
              <label className="text-xs text-muted-foreground mb-1 block">{lang === "uk" ? "Рік" : "Year"}</label>
              <Select value={fYear} onValueChange={setFYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "uk" ? "Усі" : "All"}</SelectItem>
                  {years.map((y: any) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">{lang === "uk" ? "Вікова категорія" : "Age group"}</label>
              <Select value={fAge} onValueChange={setFAge}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "uk" ? "Усі" : "All"}</SelectItem>
                  <SelectItem value="1-17">1–17</SelectItem>
                  <SelectItem value="18-29">18–29</SelectItem>
                  <SelectItem value="30-39">30–39</SelectItem>
                  <SelectItem value="40-49">40–49</SelectItem>
                  <SelectItem value="50-59">50–59</SelectItem>
                  <SelectItem value="60-69">60–69</SelectItem>
                  <SelectItem value="70-79">70–79</SelectItem>
                  <SelectItem value="80-100">80–100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <label className="text-xs text-muted-foreground mb-1 block">{t.profile.city}</label>
              <Select value={fCity} onValueChange={setFCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "uk" ? "Усі" : "All"}</SelectItem>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <label className="text-xs text-muted-foreground mb-1 block">{t.profile.club}</label>
              <Select value={fClub} onValueChange={setFClub}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "uk" ? "Усі" : "All"}</SelectItem>
                  {clubs.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isPaid && isOrganizer && (
              <div className="min-w-[160px]">
                <label className="text-xs text-muted-foreground mb-1 block">{lang === "uk" ? "Оплата" : "Payment"}</label>
                <Select value={fPayment} onValueChange={setFPayment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{lang === "uk" ? "Усі" : "All"}</SelectItem>
                    <SelectItem value="paid">{lang === "uk" ? "Оплачено" : "Paid"}</SelectItem>
                    <SelectItem value="pending">{lang === "uk" ? "Не оплачено" : "Unpaid"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                <X className="h-4 w-4" /> {lang === "uk" ? "Скинути" : "Reset"}
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filteredRows.length === 0 ? (
          <div className="mt-6 bg-card rounded-2xl shadow-card p-8 text-center text-muted-foreground">—</div>
        ) : (
          <div className="mt-6 space-y-8">
            {Object.entries(
              filteredRows.reduce<Record<string, any[]>>((acc, r) => {
                const key = `${r.distance_km ?? "—"}|${r.distance_name ?? ""}`;
                (acc[key] ||= []).push(r);
                return acc;
              }, {})
            )
              .sort((a, b) => {
                const [kmA, nameA] = a[0].split("|");
                const [kmB, nameB] = b[0].split("|");
                const diff = Number(kmA) - Number(kmB);
                return diff !== 0 ? diff : nameA.localeCompare(nameB);
              })
              .map(([key, list]) => {
                const [km, name] = key.split("|");
                return (
                <div key={key} className="bg-card rounded-2xl shadow-card overflow-x-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="font-display text-xl font-bold">
                      {km} {lang === "uk" ? "км" : "km"}
                      {name && <span className="text-muted-foreground font-normal text-base ml-2">· {name}</span>}
                    </h2>
                    <span className="text-sm text-muted-foreground">{list.length}</span>
                  </div>
                  {(() => {
                    const isRelayGroup = list.some((r: any) => r.is_relay);
                    if (isRelayGroup) {
                      const teamCatLabel = (c: string) =>
                        c === "men" ? (lang === "uk" ? "Чоловіки" : "Men")
                        : c === "women" ? (lang === "uk" ? "Жінки" : "Women")
                        : c === "mix" ? (lang === "uk" ? "Мікс" : "Mix")
                        : "—";
                      return (
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-left">
                            <tr>
                              <th className="p-3 font-semibold">#</th>
                              <th className="p-3 font-semibold">{lang === "uk" ? "Назва команди" : "Team name"}</th>
                              <th className="p-3 font-semibold">{lang === "uk" ? "Категорія" : "Category"}</th>
                              <th className="p-3 font-semibold">{lang === "uk" ? "Учасники (етапи)" : "Members (legs)"}</th>
                              {isOrganizer && <th className="p-3 font-semibold">{lang === "uk" ? "Доданий" : "Added by"}</th>}
                              {isPaid && isOrganizer && <th className="p-3 font-semibold text-center">{lang === "uk" ? "Оплата" : "Payment"}</th>}
                              {isPaid && isOrganizer && <th className="p-3 font-semibold text-center">{lang === "uk" ? "Квитанція" : "Receipt"}</th>}
                              {isOrganizer && <th className="p-3 font-semibold text-center">{lang === "uk" ? "Дії" : "Actions"}</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((r: any) => {
                              const members: any[] = Array.isArray(r.relay_members) ? r.relay_members : [];
                              return (
                                <tr key={r.registration_id} className="border-t border-border align-top">
                                  <td className="p-3 font-bold text-primary">{r.bib_number ?? "—"}</td>
                                  <td className="p-3 font-semibold">{r.team_name ?? "—"}</td>
                                  <td className="p-3">{teamCatLabel(r.team_category)}</td>
                                  <td className="p-3">
                                    {members.length === 0 ? "—" : (
                                      <ol className="space-y-1 list-decimal list-inside">
                                        {members.map((m, i) => (
                                          <li key={i}>
                                            <span className="font-medium">{m.full_name ?? "—"}</span>
                                            <span className="text-muted-foreground"> · {m.leg_km ?? "—"} {lang === "uk" ? "км" : "km"}</span>
                                            {m.gender && (
                                              <span className="text-muted-foreground text-xs ml-1">
                                                ({m.gender === "male" ? t.profile.male : m.gender === "female" ? t.profile.female : m.gender})
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ol>
                                    )}
                                  </td>
                                  {isOrganizer && (
                                    <td className="p-3">
                                      {r.is_self_athlete ? (
                                        <span className="text-muted-foreground">{lang === "uk" ? "Сам зареєструвався" : "Self"}</span>
                                      ) : r.added_by_name || r.added_by_email ? (
                                        <div className="flex flex-col">
                                          <span>{r.added_by_name ?? "—"}</span>
                                          {r.added_by_email && (
                                            <a href={`mailto:${r.added_by_email}`} className="text-xs text-muted-foreground hover:text-foreground truncate">
                                              {r.added_by_email}
                                            </a>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  )}
                                  {isPaid && isOrganizer && (
                                    <td className="p-3 text-center">
                                      {r.payment_status === "paid" ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500 inline" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-destructive inline" />
                                      )}
                                    </td>
                                  )}
                                  {isPaid && isOrganizer && (
                                    <td className="p-3">
                                      <div className="flex items-center justify-center gap-1">
                                        {r.receipt_url ? (
                                          <Button size="sm" variant="ghost" onClick={() => openReceipt(r.receipt_url)} title={lang === "uk" ? "Переглянути" : "View"}>
                                            <FileText className="h-4 w-4" />
                                          </Button>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                        {r.payment_status === "paid" ? (
                                          <Button size="sm" variant="ghost" onClick={() => revoke(r.registration_id)} disabled={busyId === r.registration_id} title={lang === "uk" ? "Відхилити" : "Revoke"}>
                                            {busyId === r.registration_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-destructive" />}
                                          </Button>
                                        ) : r.receipt_url ? (
                                          <Button size="sm" variant="ghost" onClick={() => confirm(r.registration_id)} disabled={busyId === r.registration_id} title={lang === "uk" ? "Підтвердити" : "Confirm"}>
                                            {busyId === r.registration_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                          </Button>
                                        ) : null}
                                      </div>
                                    </td>
                                  )}
                                  {isOrganizer && (
                                    <td className="p-3">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeParticipant(r.registration_id, r.team_name)}
                                          disabled={busyId === r.registration_id}
                                          title={lang === "uk" ? "Видалити команду" : "Remove team"}
                                        >
                                          {busyId === r.registration_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                        </Button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    }
                    return (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-3 font-semibold">#</th>
                        <th className="p-3 font-semibold">{t.auth.fullName}</th>
                        <th className="p-3 font-semibold">{t.profile.gender}</th>
                        <th className="p-3 font-semibold">{lang === "uk" ? "Рік" : "Year"}</th>
                        <th className="p-3 font-semibold">{t.profile.city}</th>
                        <th className="p-3 font-semibold">{t.profile.club}</th>
                        {isOrganizer && <th className="p-3 font-semibold">{lang === "uk" ? "Доставка НП" : "NP delivery"}</th>}
                        {isOrganizer && <th className="p-3 font-semibold">{lang === "uk" ? "Доданий" : "Added by"}</th>}
                        {isPaid && isOrganizer && <th className="p-3 font-semibold text-center">{lang === "uk" ? "Оплата" : "Payment"}</th>}
                        {isPaid && isOrganizer && <th className="p-3 font-semibold text-center">{lang === "uk" ? "Квитанція" : "Receipt"}</th>}
                        {hasAnyResult && <th className="p-3 font-semibold">{lang === "uk" ? "Результат" : "Result"}</th>}
                        {isOrganizer && <th className="p-3 font-semibold text-center">{lang === "uk" ? "Дії" : "Actions"}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r.registration_id} className="border-t border-border">
                          <td className="p-3 font-bold text-primary">{r.bib_number ?? "—"}</td>
                          <td className="p-3">{r.full_name ?? "—"}</td>
                          <td className="p-3">
                            {r.gender === "male"
                              ? t.profile.male
                              : r.gender === "female"
                              ? t.profile.female
                              : r.gender === "boy"
                              ? t.profile.boy
                              : r.gender === "girl"
                              ? t.profile.girl
                              : r.gender === "other"
                              ? t.profile.other
                              : "—"}
                          </td>
                          <td className="p-3">{r.birth_year ?? "—"}</td>
                          <td className="p-3">{r.city ?? "—"}</td>
                          <td className="p-3">{r.club ?? "—"}</td>
                          {isOrganizer && (
                            <td className="p-3">
                              {r.delivery_enabled ? (
                                <div className="flex flex-col text-xs">
                                  <span className="font-medium text-primary inline-flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    {r.delivery_warehouse_type === "postomat"
                                      ? (lang === "uk" ? "Поштомат" : "Postomat")
                                      : (lang === "uk" ? "Відділення" : "Branch")}
                                  </span>
                                  <span>{r.delivery_recipient_name}</span>
                                  <span className="text-muted-foreground">{r.delivery_phone}</span>
                                  <span className="text-muted-foreground">{r.delivery_city_name}</span>
                                  <span className="text-muted-foreground">{r.delivery_warehouse_name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          )}
                          {isOrganizer && (
                            <td className="p-3">
                              {r.is_self_athlete ? (
                                <span className="text-muted-foreground">{lang === "uk" ? "Сам зареєструвався" : "Self"}</span>
                              ) : r.added_by_name || r.added_by_email ? (
                                <div className="flex flex-col">
                                  <span>{r.added_by_name ?? "—"}</span>
                                  {r.added_by_email && (
                                    <a href={`mailto:${r.added_by_email}`} className="text-xs text-muted-foreground hover:text-foreground truncate">
                                      {r.added_by_email}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          )}
                          {isPaid && isOrganizer && (
                            <td className="p-3 text-center">
                              {r.payment_status === "paid" ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 inline" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive inline" />
                              )}
                            </td>
                          )}
                          {isPaid && isOrganizer && (
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                {r.receipt_url ? (
                                  <Button size="sm" variant="ghost" onClick={() => openReceipt(r.receipt_url)} title={lang === "uk" ? "Переглянути" : "View"}>
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                                {r.payment_status === "paid" ? (
                                  <Button size="sm" variant="ghost" onClick={() => revoke(r.registration_id)} disabled={busyId === r.registration_id} title={lang === "uk" ? "Відхилити" : "Revoke"}>
                                    {busyId === r.registration_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-destructive" />}
                                  </Button>
                                ) : r.receipt_url ? (
                                  <Button size="sm" variant="ghost" onClick={() => confirm(r.registration_id)} disabled={busyId === r.registration_id} title={lang === "uk" ? "Підтвердити" : "Confirm"}>
                                    {busyId === r.registration_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          )}
                          {hasAnyResult && (
                            <td className="p-3">
                              {resultsMap[r.registration_id] ? (
                                <div className="flex flex-col">
                                  <span className="font-semibold inline-flex items-center gap-1">
                                    <Trophy className="h-3 w-3 text-[#FC4C02]" />
                                    {fmtResult(resultsMap[r.registration_id].time_seconds)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {resultsMap[r.registration_id].distance_meters
                                      ? `${(resultsMap[r.registration_id].distance_meters! / 1000).toFixed(2)} ${lang === "uk" ? "км" : "km"}`
                                      : ""}
                                    {resultsMap[r.registration_id].source === "strava" && " · Strava"}
                                  </span>
                                  {resultsMap[r.registration_id].strava_activity_id && (
                                    <a
                                      href={`https://www.strava.com/activities/${resultsMap[r.registration_id].strava_activity_id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-[#FC4C02] hover:underline"
                                    >
                                      {lang === "uk" ? "Активність" : "Activity"}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          )}
                          {isOrganizer && (
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                {distances.length > 1 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openMoveDialog(r)}
                                    disabled={busyId === r.registration_id}
                                    title={lang === "uk" ? "Перенести на іншу дистанцію" : "Move to another distance"}
                                  >
                                    <ArrowRightLeft className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeParticipant(r.registration_id, r.full_name)}
                                  disabled={busyId === r.registration_id}
                                  title={lang === "uk" ? "Видалити учасника" : "Remove participant"}
                                >
                                  {busyId === r.registration_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    );
                  })()}
                </div>
              );})}
          </div>
        )}
      </main>
      <AlertDialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === "uk" ? "Надіслати нагадування?" : "Send reminders?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  {lang === "uk"
                    ? `Лист отримають ${reminderTargets.length} учасник(ів) без підтвердженої оплати:`
                    : `${reminderTargets.length} participant(s) without confirmed payment will receive an email:`}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {pendingPaymentCount > 0 && (
                    <li>
                      <strong>{pendingPaymentCount}</strong>{" "}
                      {lang === "uk"
                        ? "— нагадування про оплату (ще не завантажили квитанцію)"
                        : "— payment reminder (no receipt uploaded)"}
                    </li>
                  )}
                  {pendingReceiptCount > 0 && (
                    <li>
                      <strong>{pendingReceiptCount}</strong>{" "}
                      {lang === "uk"
                        ? "— нагадування завантажити квитанцію (очікує підтвердження)"
                        : "— receipt reminder (awaiting confirmation)"}
                    </li>
                  )}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingReminders}>
              {lang === "uk" ? "Скасувати" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={sendReminders} disabled={sendingReminders}>
              {sendingReminders ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : lang === "uk" ? "Надіслати" : "Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={!!moveTarget} onOpenChange={(o) => !o && setMoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lang === "uk" ? "Перенести на іншу дистанцію" : "Move to another distance"}
            </DialogTitle>
            <DialogDescription>
              {moveTarget && (
                <>
                  {moveTarget.full_name} · #{moveTarget.bib_number ?? "—"} ·{" "}
                  {moveTarget.distance_km} {lang === "uk" ? "км" : "km"}
                  {moveTarget.distance_name ? ` · ${moveTarget.distance_name}` : ""}
                </>
              )}
              <div className="mt-2 text-xs">
                {lang === "uk"
                  ? "Учаснику буде призначено новий стартовий номер. Посилання на квиток залишиться тим самим."
                  : "Participant will get a new bib number. Ticket link stays the same."}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs text-muted-foreground mb-1 block">
              {lang === "uk" ? "Нова дистанція" : "New distance"}
            </label>
            <Select value={moveToId} onValueChange={setMoveToId}>
              <SelectTrigger>
                <SelectValue placeholder={lang === "uk" ? "Оберіть дистанцію" : "Select distance"} />
              </SelectTrigger>
              <SelectContent>
                {distances
                  .filter((d) => moveTarget && d.id !== moveTarget.distance_id && d.is_active !== false)
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.distance_km} {lang === "uk" ? "км" : "km"}
                      {d.name ? ` · ${d.name}` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveTarget(null)} disabled={moving}>
              {lang === "uk" ? "Скасувати" : "Cancel"}
            </Button>
            <Button onClick={confirmMove} disabled={moving || !moveToId}>
              {moving ? <Loader2 className="h-4 w-4 animate-spin" /> : (lang === "uk" ? "Перенести" : "Move")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!receiptDialog} onOpenChange={(o) => !o && setReceiptDialog(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 pr-8">
              <FileText className="h-5 w-5 text-primary" />
              {lang === "uk" ? "Квитанція" : "Receipt"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted flex items-center justify-center p-4">
            {receiptDialog?.isHeic ? (
              <div className="text-center text-sm text-muted-foreground space-y-3 max-w-md">
                <FileText className="h-10 w-10 mx-auto text-primary" />
                <p>
                  {lang === "uk"
                    ? "Формат HEIC/HEIF не підтримується для попереднього перегляду в браузері. Завантажте файл, щоб переглянути."
                    : "HEIC/HEIF preview is not supported in the browser. Download the file to view it."}
                </p>
                <Button asChild size="sm">
                  <a href={receiptDialog.url} target="_blank" rel="noopener noreferrer" download>
                    {lang === "uk" ? "Завантажити" : "Download"}
                  </a>
                </Button>
              </div>
            ) : receiptDialog?.isImage ? (
              <img src={receiptDialog.url} alt="receipt" className="max-w-full max-h-full object-contain bg-white" />
            ) : receiptDialog ? (
              <iframe src={receiptDialog.url} title="receipt" className="w-full h-full bg-white" />
            ) : null}
          </div>
          <div className="p-3 border-t border-border flex justify-end">
            <Button asChild variant="outline" size="sm">
              <a href={receiptDialog?.url} target="_blank" rel="noopener noreferrer">
                {lang === "uk" ? "Відкрити в новій вкладці" : "Open in new tab"}
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default Participants;

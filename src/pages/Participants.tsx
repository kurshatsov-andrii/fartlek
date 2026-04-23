import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, FileText, RotateCcw, Trash2, X, Bell } from "lucide-react";
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

  // Filters
  const [fGender, setFGender] = useState<string>("all");
  const [fYear, setFYear] = useState<string>("all");
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
    setIsOrganizer(ev?.organizer_id === user.id || isAdmin);
    const { data: dists } = await supabase
      .from("distances")
      .select("distance_km, price")
      .eq("event_id", id);
    const priceMap: Record<string, number> = {};
    (dists ?? []).forEach((d: any) => {
      priceMap[String(d.distance_km)] = Number(d.price ?? 0);
    });
    setDistancePriceMap(priceMap);
    const { data: participants } = await (supabase.rpc as any)("get_event_participants", { _event_id: id });
    setRows(participants ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user]);

  const openReceipt = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) { toast.error(error?.message ?? "Error"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
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
        amount: distancePriceMap[String(r.distance_km)] ?? 0,
      }));
  }, [rows, distancePriceMap]);

  const pendingPaymentCount = reminderTargets.filter((r) => r.kind === "payment").length;
  const pendingReceiptCount = reminderTargets.filter((r) => r.kind === "receipt").length;

  const sendReminders = async () => {
    if (!id || reminderTargets.length === 0) return;
    setSendingReminders(true);
    const ticketBase = `${window.location.origin}/ticket/`;
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
      toast.success(
        lang === "uk"
          ? `Надіслано ${ok} нагадувань${fail ? `, ${fail} не вдалося` : ""}`
          : `Sent ${ok} reminders${fail ? `, ${fail} failed` : ""}`
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

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (fGender !== "all" && r.gender !== fGender) return false;
      if (fYear !== "all" && String(r.birth_year ?? "") !== fYear) return false;
      if (fCity !== "all" && (r.city ?? "") !== fCity) return false;
      if (fClub !== "all" && (r.club ?? "") !== fClub) return false;
      if (isPaid && fPayment !== "all" && r.payment_status !== fPayment) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!String(r.full_name ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, fGender, fYear, fCity, fClub, fPayment, isPaid, search]);

  const resetFilters = () => {
    setFGender("all"); setFYear("all"); setFCity("all"); setFClub("all"); setFPayment("all"); setSearch("");
  };
  const hasActiveFilters =
    fGender !== "all" || fYear !== "all" || fCity !== "all" || fClub !== "all" || fPayment !== "all" || search.trim() !== "";

  if (authLoading) return null;
  if (!user) return <Navigate to={`/auth?redirect=/events/${id}/participants`} replace />;

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
            {isPaid && (
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
                const key = `${r.distance_km ?? "—"}`;
                (acc[key] ||= []).push(r);
                return acc;
              }, {})
            )
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([km, list]) => (
                <div key={km} className="bg-card rounded-2xl shadow-card overflow-x-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="font-display text-xl font-bold">
                      {km} {lang === "uk" ? "км" : "km"}
                    </h2>
                    <span className="text-sm text-muted-foreground">{list.length}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-3 font-semibold">#</th>
                        <th className="p-3 font-semibold">{t.auth.fullName}</th>
                        <th className="p-3 font-semibold">{t.profile.gender}</th>
                        <th className="p-3 font-semibold">{lang === "uk" ? "Рік" : "Year"}</th>
                        <th className="p-3 font-semibold">{t.profile.city}</th>
                        <th className="p-3 font-semibold">{t.profile.club}</th>
                        {isPaid && <th className="p-3 font-semibold text-center">{lang === "uk" ? "Оплата" : "Payment"}</th>}
                        {isPaid && isOrganizer && <th className="p-3 font-semibold text-center">{lang === "uk" ? "Квитанція" : "Receipt"}</th>}
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
                          {isPaid && (
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
                                    {busyId === r.registration_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 text-destructive" />}
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
                              <div className="flex items-center justify-center">
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
                </div>
              ))}
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
      <Footer />
    </div>
  );
};

export default Participants;

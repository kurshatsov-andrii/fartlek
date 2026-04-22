import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, FileText, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Participants = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!id || !user) return;
    const { data: ev } = await supabase
      .from("events")
      .select("title, is_paid, organizer_id")
      .eq("id", id)
      .maybeSingle();
    setEventTitle(ev?.title ?? "");
    setIsPaid(!!ev?.is_paid);
    setIsOrganizer(ev?.organizer_id === user.id);
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

  if (authLoading) return null;
  if (!user) return <Navigate to={`/auth?redirect=/events/${id}/participants`} replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-5xl py-10">
        <Link to={`/events/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t.events.backToEvents}
        </Link>
        <h1 className="font-display text-3xl font-bold">{t.events.participants}</h1>
        <p className="text-muted-foreground mt-1">{eventTitle} · {rows.length}</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="mt-6 bg-card rounded-2xl shadow-card p-8 text-center text-muted-foreground">—</div>
        ) : (
          <div className="mt-6 space-y-8">
            {Object.entries(
              rows.reduce<Record<string, any[]>>((acc, r) => {
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
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r.registration_id} className="border-t border-border">
                          <td className="p-3 font-bold text-primary">{r.bib_number ?? "—"}</td>
                          <td className="p-3">{r.full_name ?? "—"}</td>
                          <td className="p-3">
                            {r.gender === "male"
                              ? lang === "uk" ? "чоловік" : "male"
                              : r.gender === "female"
                              ? lang === "uk" ? "жінка" : "female"
                              : r.gender ?? "—"}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Participants;

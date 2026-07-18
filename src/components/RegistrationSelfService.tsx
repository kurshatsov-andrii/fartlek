import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Repeat, Send, XCircle, Copy } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

type Props = {
  registration: any;
  onChanged: () => void;
};

export function RegistrationSelfService({ registration, onChanged }: Props) {
  const { lang } = useApp();
  const ev = registration.events;
  const dist = registration.distances;

  const [allowed, setAllowed] = useState(false);
  const [transferAllowed, setTransferAllowed] = useState(false);
  const [distances, setDistances] = useState<any[]>([]);
  const [pendingCancel, setPendingCancel] = useState<any>(null);
  const [activeTransfer, setActiveTransfer] = useState<any>(null);

  const [openDist, setOpenDist] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [newDistId, setNewDistId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const T = lang === "uk"
    ? {
        title: "Керування реєстрацією",
        change: "Змінити дистанцію",
        transfer: "Передати реєстрацію",
        cancel: "Скасувати реєстрацію",
        notAllowed: "Самостійні зміни недоступні (до події менше дозволеного або реєстрацію закрито).",
        chooseDist: "Оберіть нову дистанцію",
        save: "Зберегти",
        close: "Закрити",
        priceDiff: "Доплата:",
        priceFree: "Без доплати",
        priceLost: "Різниця в ціні не повертається.",
        transferHint: "Згенеруйте код передачі. Передайте його іншому учаснику — він введе його у себе в кабінеті (Мої події → Прийняти передачу).",
        gen: "Створити код",
        codeReady: "Код передачі (діє 7 днів):",
        copy: "Копіювати",
        copied: "Скопійовано",
        cancelOpen: "Подати заявку на відміну",
        cancelHint: "Заявка піде організатору. Гроші автоматично не повертаються — рішення приймає організатор.",
        reason: "Причина (необов'язково)",
        send: "Надіслати заявку",
        pending: "Заявка на відміну на розгляді",
        activeTransfer: "Активний код передачі:",
        cancelTransfer: "Скасувати код",
      }
    : {
        title: "Manage registration",
        change: "Change distance",
        transfer: "Transfer registration",
        cancel: "Cancel registration",
        notAllowed: "Self-service changes are disabled (event is too soon or registration closed).",
        chooseDist: "Pick a new distance",
        save: "Save",
        close: "Close",
        priceDiff: "Price diff:",
        priceFree: "No extra payment",
        priceLost: "Price difference is not refunded.",
        transferHint: "Generate a transfer code. Share it with another participant — they enter it in their My events page (Accept transfer).",
        gen: "Generate code",
        codeReady: "Transfer code (valid 7 days):",
        copy: "Copy",
        copied: "Copied",
        cancelOpen: "Request cancellation",
        cancelHint: "Your request will be reviewed by the organizer. Money is not refunded automatically.",
        reason: "Reason (optional)",
        send: "Send request",
        pending: "Cancellation request pending",
        activeTransfer: "Active transfer code:",
        cancelTransfer: "Cancel code",
      };

  const refresh = async () => {
    const { data: a } = await supabase.rpc("are_changes_allowed", { _event_id: ev.id });
    setAllowed(!!a);
    const { data: ta } = await supabase.rpc("is_transfer_allowed", { _event_id: ev.id });
    setTransferAllowed(!!ta);
    const { data: ds } = await supabase
      .from("distances")
      .select("id, name, distance_km, price, max_participants, is_active")
      .eq("event_id", ev.id)
      .eq("is_active", true)
      .order("distance_km");
    setDistances(ds ?? []);
    const { data: pc } = await supabase
      .from("registration_cancellation_requests")
      .select("*")
      .eq("registration_id", registration.id)
      .eq("status", "pending")
      .maybeSingle();
    setPendingCancel(pc);
    const { data: tr } = await supabase
      .from("registration_transfers")
      .select("*")
      .eq("registration_id", registration.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .maybeSingle();
    setActiveTransfer(tr);
  };

  useEffect(() => { refresh(); }, [registration.id, ev.id]);

  const newDist = distances.find((d) => d.id === newDistId);
  const priceDiff = newDist ? Number(newDist.price ?? 0) - Number(dist?.price ?? 0) : 0;

  const handleChangeDistance = async () => {
    if (!newDistId || newDistId === dist?.id) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("participant_change_distance", {
        _registration_id: registration.id,
        _new_distance_id: newDistId,
      });
      if (error) throw error;
      toast.success(lang === "uk" ? "Дистанцію змінено" : "Distance changed");
      setOpenDist(false);
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTransfer = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("participant_create_transfer", {
        _registration_id: registration.id,
      });
      if (error) throw error;
      await refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelTransfer = async () => {
    if (!activeTransfer) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("registration_transfers")
        .update({ status: "cancelled" })
        .eq("id", activeTransfer.id);
      if (error) throw error;
      await refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRequestCancel = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("participant_request_cancellation", {
        _registration_id: registration.id,
        _reason: reason.trim() || null,
      });
      if (error) throw error;
      toast.success(lang === "uk" ? "Заявку надіслано" : "Request sent");
      setOpenCancel(false);
      setReason("");
      await refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 bg-card rounded-2xl shadow-card p-6 space-y-3">
      <h2 className="font-display text-lg font-bold">{T.title}</h2>

      {pendingCancel && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 text-sm p-3">
          {T.pending}
        </div>
      )}

      {activeTransfer && (
        <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm space-y-2">
          <div>{T.activeTransfer}</div>
          <div className="flex items-center gap-2">
            <code className="font-mono text-lg font-bold">{activeTransfer.code}</code>
            <Button
              size="sm" variant="outline"
              onClick={() => { navigator.clipboard.writeText(activeTransfer.code); toast.success(T.copied); }}
            >
              <Copy className="h-3 w-3" /> {T.copy}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelTransfer} disabled={busy}>
              {T.cancelTransfer}
            </Button>
          </div>
        </div>
      )}

      {!allowed ? (
        <p className="text-sm text-muted-foreground">{T.notAllowed}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpenDist(true)} disabled={!!pendingCancel}>
            <Repeat className="h-4 w-4" /> {T.change}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpenTransfer(true)}>
            <Send className="h-4 w-4" /> {T.transfer}
          </Button>
          {!pendingCancel && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setOpenCancel(true)}>
              <XCircle className="h-4 w-4" /> {T.cancel}
            </Button>
          )}
        </div>
      )}

      {/* Change distance dialog */}
      <Dialog open={openDist} onOpenChange={setOpenDist}>
        <DialogContent>
          <DialogHeader><DialogTitle>{T.change}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={newDistId} onValueChange={setNewDistId}>
              <SelectTrigger><SelectValue placeholder={T.chooseDist} /></SelectTrigger>
              <SelectContent>
                {distances.filter((d) => d.id !== dist?.id).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.distance_km} km {d.name ? `· ${d.name}` : ""} — {d.price} ₴
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {newDist && (
              <div className="text-sm rounded-md bg-muted p-3 space-y-1">
                {priceDiff > 0 ? (
                  <div className="font-semibold text-primary">{T.priceDiff} +{priceDiff} ₴</div>
                ) : (
                  <div className="text-muted-foreground">{T.priceFree}</div>
                )}
                {priceDiff < 0 && <div className="text-xs text-muted-foreground">{T.priceLost}</div>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDist(false)}>{T.close}</Button>
            <Button onClick={handleChangeDistance} disabled={busy || !newDistId || newDistId === dist?.id}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{T.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer dialog */}
      <Dialog open={openTransfer} onOpenChange={setOpenTransfer}>
        <DialogContent>
          <DialogHeader><DialogTitle>{T.transfer}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{T.transferHint}</p>
          {activeTransfer && (
            <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
              <div>{T.codeReady}</div>
              <div className="flex items-center gap-2 mt-1">
                <code className="font-mono text-lg font-bold">{activeTransfer.code}</code>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(activeTransfer.code); toast.success(T.copied); }}>
                  <Copy className="h-3 w-3" /> {T.copy}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTransfer(false)}>{T.close}</Button>
            <Button onClick={handleCreateTransfer} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{T.gen}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={openCancel} onOpenChange={setOpenCancel}>
        <DialogContent>
          <DialogHeader><DialogTitle>{T.cancelOpen}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{T.cancelHint}</p>
          <Input
            placeholder={T.reason}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCancel(false)}>{T.close}</Button>
            <Button variant="destructive" onClick={handleRequestCancel} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{T.send}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Loader2, Settings, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";

type Settings = {
  sender_ref: string;
  sender_contact_ref: string;
  sender_phone: string;
  sender_city_ref: string;
  sender_city_name: string;
  sender_address_ref: string;
  sender_address_name: string;
  cargo_description: string;
  weight: number;
  cost: number;
  seats_amount: number;
  payer_type: string;
  payment_method: string;
  cargo_type: string;
};

const DEFAULTS: Settings = {
  sender_ref: "", sender_contact_ref: "", sender_phone: "",
  sender_city_ref: "", sender_city_name: "",
  sender_address_ref: "", sender_address_name: "",
  cargo_description: "Стартовий пакет", weight: 0.5, cost: 300, seats_amount: 1,
  payer_type: "Recipient", payment_method: "Cash", cargo_type: "Parcel",
};

export function NovaPoshtaSettingsDialog({ eventId, trigger, onSaved }: { eventId: string; trigger: React.ReactNode; onSaved?: () => void }) {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState<Settings>(DEFAULTS);

  // Counterparty/contact lookup
  const [counterparties, setCounterparties] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingCps, setLoadingCps] = useState(false);

  // City/warehouse lookup for sender
  const [citySearch, setCitySearch] = useState("");
  const [cities, setCities] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("event_np_sender_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle();
      if (data) setS({ ...DEFAULTS, ...data });
      else setS(DEFAULTS);
      setLoading(false);
    })();
  }, [open, eventId]);

  const loadCounterparties = async () => {
    setLoadingCps(true);
    const { data, error } = await supabase.functions.invoke("nova-poshta", {
      body: { action: "getCounterparties", event_id: eventId },
    });
    setLoadingCps(false);
    if (error) { toast.error(error.message); return; }
    if ((data as any)?.error) { toast.error((data as any).error); return; }
    setCounterparties((data as any)?.data ?? []);
    if (((data as any)?.data ?? []).length === 0) {
      toast.info(lang === "uk" ? "Відправників не знайдено в кабінеті НП" : "No senders found in NP account");
    }
  };

  const loadContacts = async (ref: string) => {
    const { data, error } = await supabase.functions.invoke("nova-poshta", {
      body: { action: "getCounterpartyContactPersons", event_id: eventId, counterpartyRef: ref },
    });
    if (error) { toast.error(error.message); return; }
    if ((data as any)?.error) { toast.error((data as any).error); return; }
    setContacts((data as any)?.data ?? []);
  };

  const searchCities = async (q: string) => {
    setCitySearch(q);
    if (q.trim().length < 2) { setCities([]); return; }
    const { data } = await supabase.functions.invoke("nova-poshta", {
      body: { action: "searchCities", query: q },
    });
    setCities((data as any)?.data ?? []);
  };

  const loadWarehouses = async (cityRef: string) => {
    const { data } = await supabase.functions.invoke("nova-poshta", {
      body: { action: "getSenderAddresses", event_id: eventId, cityRef },
    });
    setWarehouses((data as any)?.data ?? []);
  };

  const onPickCounterparty = (ref: string) => {
    const cp = counterparties.find((c: any) => c.Ref === ref);
    setS((prev) => ({ ...prev, sender_ref: ref }));
    setContacts([]);
    if (cp) loadContacts(ref);
  };

  const save = async () => {
    if (!s.sender_ref || !s.sender_contact_ref || !s.sender_phone || !s.sender_city_ref || !s.sender_address_ref) {
      toast.error(lang === "uk" ? "Заповніть усі обов'язкові поля відправника" : "Fill all required sender fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("event_np_sender_settings")
      .upsert({ event_id: eventId, ...s }, { onConflict: "event_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "uk" ? "Збережено" : "Saved");
    onSaved?.();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang === "uk" ? "Налаштування Нової Пошти" : "Nova Poshta settings"}</DialogTitle>
          <DialogDescription>
            {lang === "uk"
              ? "Дані відправника для формування ТТН учасникам з доставкою."
              : "Sender info used to create TTN waybills for delivery participants."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{lang === "uk" ? "Відправник" : "Sender"}</h3>
                <Button size="sm" variant="outline" onClick={loadCounterparties} disabled={loadingCps}>
                  {loadingCps ? <Loader2 className="h-4 w-4 animate-spin" /> : (lang === "uk" ? "Завантажити з НП" : "Load from NP")}
                </Button>
              </div>
              {counterparties.length > 0 && (
                <div>
                  <Label className="text-xs">{lang === "uk" ? "Контрагент" : "Counterparty"}</Label>
                  <Select value={s.sender_ref} onValueChange={onPickCounterparty}>
                    <SelectTrigger><SelectValue placeholder={lang === "uk" ? "Оберіть" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      {counterparties.map((c: any) => (
                        <SelectItem key={c.Ref} value={c.Ref}>{c.Description ?? c.FirstName + " " + c.LastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {contacts.length > 0 && (
                <div>
                  <Label className="text-xs">{lang === "uk" ? "Контактна особа" : "Contact person"}</Label>
                  <Select value={s.sender_contact_ref} onValueChange={(v) => setS((p) => ({ ...p, sender_contact_ref: v, sender_phone: p.sender_phone || (contacts.find((c: any) => c.Ref === v)?.Phones ?? "") }))}>
                    <SelectTrigger><SelectValue placeholder={lang === "uk" ? "Оберіть" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      {contacts.map((c: any) => (
                        <SelectItem key={c.Ref} value={c.Ref}>
                          {c.LastName} {c.FirstName} {c.MiddleName ?? ""} · {c.Phones}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs">{lang === "uk" ? "Телефон відправника (380...)" : "Sender phone (380...)"}</Label>
                <Input value={s.sender_phone} onChange={(e) => setS({ ...s, sender_phone: e.target.value })} placeholder="380501234567" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{lang === "uk" ? "Місто відправника" : "Sender city"}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder={lang === "uk" ? "Почніть вводити місто..." : "Start typing city..."}
                    value={citySearch}
                    onChange={(e) => searchCities(e.target.value)}
                  />
                </div>
                {s.sender_city_name && !cities.length && (
                  <div className="text-xs text-muted-foreground">{lang === "uk" ? "Поточне:" : "Current:"} {s.sender_city_name}</div>
                )}
                {cities.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-border rounded-md">
                    {cities.map((c: any) => (
                      <button
                        key={c.ref}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => {
                          setS({ ...s, sender_city_ref: c.ref, sender_city_name: c.present || c.name, sender_address_ref: "", sender_address_name: "" });
                          setCities([]); setCitySearch(c.present || c.name);
                          loadWarehouses(c.ref);
                        }}
                      >
                        {c.present || c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {s.sender_city_ref && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{lang === "uk" ? "Відділення / Склад" : "Warehouse"}</Label>
                    {warehouses.length === 0 && (
                      <Button size="sm" variant="ghost" onClick={() => loadWarehouses(s.sender_city_ref)} className="h-6 text-xs">
                        {lang === "uk" ? "Завантажити" : "Load"}
                      </Button>
                    )}
                  </div>
                  {warehouses.length > 0 ? (
                    <Select value={s.sender_address_ref} onValueChange={(v) => {
                      const w = warehouses.find((x: any) => x.ref === v);
                      setS({ ...s, sender_address_ref: v, sender_address_name: w?.description ?? "" });
                    }}>
                      <SelectTrigger><SelectValue placeholder={s.sender_address_name || (lang === "uk" ? "Оберіть" : "Select")} /></SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w: any) => (
                          <SelectItem key={w.ref} value={w.ref}>№{w.number} · {w.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : s.sender_address_name ? (
                    <div className="text-xs text-muted-foreground">{lang === "uk" ? "Поточне:" : "Current:"} {s.sender_address_name}</div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3">
              <h3 className="font-semibold text-sm">{lang === "uk" ? "Параметри посилки (за замовчуванням)" : "Default parcel parameters"}</h3>
              <div>
                <Label className="text-xs">{lang === "uk" ? "Опис вантажу" : "Cargo description"}</Label>
                <Input value={s.cargo_description} onChange={(e) => setS({ ...s, cargo_description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{lang === "uk" ? "Вага (кг)" : "Weight (kg)"}</Label>
                  <Input type="number" step="0.1" value={s.weight} onChange={(e) => setS({ ...s, weight: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">{lang === "uk" ? "Оголош. вартість" : "Declared cost"}</Label>
                  <Input type="number" value={s.cost} onChange={(e) => setS({ ...s, cost: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">{lang === "uk" ? "К-ть місць" : "Seats"}</Label>
                  <Input type="number" value={s.seats_amount} onChange={(e) => setS({ ...s, seats_amount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{lang === "uk" ? "Платник доставки" : "Payer"}</Label>
                  <Select value={s.payer_type} onValueChange={(v) => setS({ ...s, payer_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recipient">{lang === "uk" ? "Отримувач" : "Recipient"}</SelectItem>
                      <SelectItem value="Sender">{lang === "uk" ? "Відправник" : "Sender"}</SelectItem>
                      <SelectItem value="ThirdPerson">{lang === "uk" ? "Третя особа" : "Third person"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{lang === "uk" ? "Спосіб оплати" : "Payment method"}</Label>
                  <Select value={s.payment_method} onValueChange={(v) => setS({ ...s, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">{lang === "uk" ? "Готівка" : "Cash"}</SelectItem>
                      <SelectItem value="NonCash">{lang === "uk" ? "Безготівка" : "Non-cash"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            {lang === "uk" ? "Скасувати" : "Cancel"}
          </Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (lang === "uk" ? "Зберегти" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef, useState } from "react";
import { Loader2, Package, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";

export interface DeliveryData {
  enabled: boolean;
  recipient_name: string;
  phone: string;
  city_ref: string;
  city_name: string;
  warehouse_ref: string;
  warehouse_name: string;
  warehouse_type: "branch" | "postomat";
}

export const emptyDelivery = (): DeliveryData => ({
  enabled: false,
  recipient_name: "",
  phone: "",
  city_ref: "",
  city_name: "",
  warehouse_ref: "",
  warehouse_name: "",
  warehouse_type: "branch",
});

const PHONE_RE = /^\+38 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

export const formatUaPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").replace(/^380/, "").slice(0, 10);
  let out = "+38 (";
  if (digits.length > 0) out += digits.slice(0, 3);
  if (digits.length >= 3) out += ") ";
  if (digits.length >= 4) out += digits.slice(3, 6);
  if (digits.length >= 7) out += "-" + digits.slice(6, 8);
  if (digits.length >= 9) out += "-" + digits.slice(8, 10);
  return out;
};

export const validateDelivery = (d: DeliveryData, lang: "uk" | "en"): string | null => {
  if (!d.enabled) return null;
  if (!d.recipient_name.trim() || d.recipient_name.trim().length < 3)
    return lang === "uk" ? "Вкажіть ПІБ отримувача" : "Recipient name required";
  if (!PHONE_RE.test(d.phone))
    return lang === "uk" ? "Телефон у форматі +38 (XXX) XXX-XX-XX" : "Phone format +38 (XXX) XXX-XX-XX";
  if (!d.city_ref || !d.city_name)
    return lang === "uk" ? "Оберіть місто" : "Select city";
  if (!d.warehouse_ref || !d.warehouse_name)
    return lang === "uk" ? "Оберіть відділення / поштомат" : "Select warehouse";
  return null;
};

interface Props {
  value: DeliveryData;
  onChange: (v: DeliveryData) => void;
}

export const NovaPoshtaDelivery = ({ value, onChange }: Props) => {
  const { lang } = useApp();
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);

  const [whQuery, setWhQuery] = useState("");
  const [whResults, setWhResults] = useState<any[]>([]);
  const [whLoading, setWhLoading] = useState(false);
  const [whOpen, setWhOpen] = useState(false);

  const cityTimer = useRef<number | null>(null);
  const whTimer = useRef<number | null>(null);

  // Search cities (debounced)
  useEffect(() => {
    if (!value.enabled) return;
    if (cityTimer.current) window.clearTimeout(cityTimer.current);
    if (cityQuery.trim().length < 2) {
      setCityResults([]);
      return;
    }
    cityTimer.current = window.setTimeout(async () => {
      setCityLoading(true);
      const { data } = await supabase.functions.invoke("nova-poshta", {
        body: { action: "searchCities", query: cityQuery.trim() },
      });
      setCityResults(data?.data ?? []);
      setCityLoading(false);
    }, 300);
  }, [cityQuery, value.enabled]);

  // Search warehouses when city or type or query changes
  useEffect(() => {
    if (!value.enabled || !value.city_ref) {
      setWhResults([]);
      return;
    }
    if (whTimer.current) window.clearTimeout(whTimer.current);
    whTimer.current = window.setTimeout(async () => {
      setWhLoading(true);
      const { data } = await supabase.functions.invoke("nova-poshta", {
        body: {
          action: "searchWarehouses",
          cityRef: value.city_ref,
          warehouseType: value.warehouse_type,
          query: whQuery.trim(),
        },
      });
      setWhResults(data?.data ?? []);
      setWhLoading(false);
    }, 300);
  }, [value.city_ref, value.warehouse_type, whQuery, value.enabled]);

  const toggle = (checked: boolean) => {
    onChange({ ...emptyDelivery(), enabled: checked });
    setCityQuery("");
    setWhQuery("");
  };

  const pickCity = (c: any) => {
    onChange({
      ...value,
      city_ref: c.ref,
      city_name: c.present || c.name,
      warehouse_ref: "",
      warehouse_name: "",
    });
    setCityQuery(c.present || c.name);
    setCityOpen(false);
  };

  const pickWarehouse = (w: any) => {
    onChange({
      ...value,
      warehouse_ref: w.ref,
      warehouse_name: w.description,
    });
    setWhQuery(w.description);
    setWhOpen(false);
  };

  const tr = (uk: string, en: string) => (lang === "uk" ? uk : en);

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id="np-delivery"
          checked={value.enabled}
          onCheckedChange={(c) => toggle(!!c)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <Label htmlFor="np-delivery" className="flex items-center gap-2 cursor-pointer">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold">
              {tr("Доставка медалі / стартового пакету Новою Поштою", "Ship medal / starter pack via Nova Poshta")}
            </span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            {tr(
              "Якщо не зможеш забрати на місці — організатор надішле тобі поштою.",
              "If you can't pick it up on site — the organizer will ship it to you.",
            )}
          </p>
        </div>
      </div>

      {value.enabled && (
        <div className="space-y-3 pl-7">
          <div className="space-y-1.5">
            <Label className="text-xs">{tr("ПІБ отримувача", "Recipient full name")} *</Label>
            <Input
              value={value.recipient_name}
              onChange={(e) => onChange({ ...value, recipient_name: e.target.value })}
              placeholder={tr("Іваненко Іван Іванович", "Doe John")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{tr("Телефон отримувача", "Recipient phone")} *</Label>
            <Input
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: formatUaPhone(e.target.value) })}
              placeholder="+38 (0XX) XXX-XX-XX"
              inputMode="tel"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{tr("Тип точки видачі", "Pickup type")} *</Label>
            <RadioGroup
              value={value.warehouse_type}
              onValueChange={(v: any) =>
                onChange({ ...value, warehouse_type: v, warehouse_ref: "", warehouse_name: "" })
              }
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="branch" id="np-branch" />
                <Label htmlFor="np-branch" className="cursor-pointer text-sm font-normal">
                  {tr("Відділення", "Branch")}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="postomat" id="np-postomat" />
                <Label htmlFor="np-postomat" className="cursor-pointer text-sm font-normal">
                  {tr("Поштомат", "Postomat")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1.5 relative">
            <Label className="text-xs">{tr("Місто", "City")} *</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setCityOpen(true);
                  if (value.city_ref) onChange({ ...value, city_ref: "", city_name: "", warehouse_ref: "", warehouse_name: "" });
                }}
                onFocus={() => setCityOpen(true)}
                placeholder={tr("Почніть вводити місто...", "Start typing a city...")}
                className="pl-9"
                required
              />
              {cityLoading && <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            {cityOpen && cityResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {cityResults.map((c) => (
                  <button
                    key={c.ref}
                    type="button"
                    onClick={() => pickCity(c)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{c.name}</div>
                    {c.area && <div className="text-xs text-muted-foreground">{c.area}{c.region ? `, ${c.region}` : ""}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5 relative">
            <Label className="text-xs">
              {value.warehouse_type === "postomat" ? tr("Поштомат", "Postomat") : tr("Відділення", "Branch")} *
            </Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={whQuery}
                onChange={(e) => {
                  setWhQuery(e.target.value);
                  setWhOpen(true);
                  if (value.warehouse_ref) onChange({ ...value, warehouse_ref: "", warehouse_name: "" });
                }}
                onFocus={() => setWhOpen(true)}
                placeholder={
                  !value.city_ref
                    ? tr("Спочатку оберіть місто", "Select a city first")
                    : tr("Номер або адреса...", "Number or address...")
                }
                className="pl-9"
                disabled={!value.city_ref}
                required
              />
              {whLoading && <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            {whOpen && whResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {whResults.slice(0, 50).map((w) => (
                  <button
                    key={w.ref}
                    type="button"
                    onClick={() => pickWarehouse(w)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{w.description}</div>
                    {w.shortAddress && <div className="text-xs text-muted-foreground">{w.shortAddress}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

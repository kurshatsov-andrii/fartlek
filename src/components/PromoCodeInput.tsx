import { useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";

export interface PromoPreview {
  code: string;
  promo_id: string;
  discount_amount: number;
  final_price: number;
}

interface Props {
  eventId: string;
  distanceId: string;
  basePrice: number;
  applied: PromoPreview | null;
  onApplied: (p: PromoPreview | null) => void;
}

export const PromoCodeInput = ({ eventId, distanceId, basePrice, applied, onApplied }: Props) => {
  const { t } = useApp();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorMsg = (c: string | null) => {
    switch (c) {
      case "PROMO_INVALID": return t.promo.invalid;
      case "PROMO_EXPIRED": return t.promo.expired;
      case "PROMO_LIMIT_REACHED": return t.promo.limitReached;
      case "PROMO_DISTANCE_NOT_ALLOWED": return t.promo.distanceNotAllowed;
      case "PROMO_ALREADY_USED": return t.promo.alreadyUsed;
      default: return c ?? t.promo.invalid;
    }
  };

  const apply = async () => {
    const c = code.trim();
    if (!c || !distanceId) return;
    setBusy(true); setError(null);
    const { data, error: err } = await supabase.rpc("validate_promo_code", {
      _code: c, _event_id: eventId, _distance_id: distanceId, _base_price: basePrice,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || row.error_code) { setError(errorMsg(row?.error_code ?? null)); return; }
    onApplied({ code: c, promo_id: row.promo_id, discount_amount: Number(row.discount_amount), final_price: Number(row.final_price) });
    setCode("");
  };

  if (applied) {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <div>
            <div className="font-semibold">{applied.code}</div>
            <div className="text-xs text-muted-foreground">
              {t.promo.discountApplied}: −{applied.discount_amount} ₴
            </div>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onApplied(null)} aria-label={t.promo.remove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{t.promo.promoCodeLabel}</Label>
      <div className="flex gap-2">
        <Input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          placeholder={t.promo.promoPlaceholder} maxLength={32} />
        <Button type="button" variant="outline" onClick={apply} disabled={busy || !code.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.promo.apply}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

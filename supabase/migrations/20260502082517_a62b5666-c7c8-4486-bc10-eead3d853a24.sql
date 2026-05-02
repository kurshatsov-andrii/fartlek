-- Видаляємо колонки з events (вони відкриті для публічного SELECT)
ALTER TABLE public.events
  DROP COLUMN IF EXISTS wayforpay_merchant_login,
  DROP COLUMN IF EXISTS wayforpay_secret_key,
  DROP COLUMN IF EXISTS wayforpay_merchant_domain;

-- Окрема приватна таблиця
CREATE TABLE IF NOT EXISTS public.event_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'wayforpay',
  wayforpay_merchant_login text,
  wayforpay_secret_key text,
  wayforpay_merchant_domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_payment_settings ENABLE ROW LEVEL SECURITY;

-- Тільки організатор/співорганізатор/адмін мають доступ
CREATE POLICY "Managers manage payment settings"
ON public.event_payment_settings
FOR ALL
TO authenticated
USING (public.can_manage_event(event_id, auth.uid()))
WITH CHECK (public.can_manage_event(event_id, auth.uid()));

-- Тригер на updated_at
CREATE TRIGGER trg_event_payment_settings_updated_at
BEFORE UPDATE ON public.event_payment_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_event_payment_settings_event_id
  ON public.event_payment_settings(event_id);
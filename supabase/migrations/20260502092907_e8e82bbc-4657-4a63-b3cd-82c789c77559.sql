ALTER TABLE public.event_payment_settings
  ADD COLUMN IF NOT EXISTS liqpay_public_key text,
  ADD COLUMN IF NOT EXISTS liqpay_private_key text;

CREATE TABLE IF NOT EXISTS public.liqpay_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference text NOT NULL UNIQUE,
  registration_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'UAH',
  status text NOT NULL DEFAULT 'created',
  raw_callback jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.liqpay_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own liqpay orders"
  ON public.liqpay_orders FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role));

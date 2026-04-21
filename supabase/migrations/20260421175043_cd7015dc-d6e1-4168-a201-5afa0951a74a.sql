CREATE TABLE public.wayforpay_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference text NOT NULL UNIQUE,
  registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'UAH',
  status text NOT NULL DEFAULT 'created',
  raw_callback jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wayforpay_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wfp orders"
  ON public.wayforpay_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_wfp_orders_registration ON public.wayforpay_orders(registration_id);
CREATE INDEX idx_wfp_orders_user ON public.wayforpay_orders(user_id);

CREATE TRIGGER trg_wfp_orders_updated
  BEFORE UPDATE ON public.wayforpay_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
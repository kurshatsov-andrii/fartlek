ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS wayforpay_merchant_login text,
  ADD COLUMN IF NOT EXISTS wayforpay_secret_key text,
  ADD COLUMN IF NOT EXISTS wayforpay_merchant_domain text;
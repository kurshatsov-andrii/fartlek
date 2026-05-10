ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS np_ttn_number text,
  ADD COLUMN IF NOT EXISTS np_ttn_ref text,
  ADD COLUMN IF NOT EXISTS np_ttn_cost numeric,
  ADD COLUMN IF NOT EXISTS np_ttn_estimated_delivery_date date,
  ADD COLUMN IF NOT EXISTS np_ttn_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS np_ttn_created_by uuid;

CREATE TABLE IF NOT EXISTS public.event_np_sender_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE,
  sender_ref text NOT NULL,
  sender_contact_ref text NOT NULL,
  sender_phone text NOT NULL,
  sender_city_ref text NOT NULL,
  sender_city_name text,
  sender_address_ref text NOT NULL,
  sender_address_name text,
  cargo_description text NOT NULL DEFAULT 'Стартовий пакет',
  weight numeric NOT NULL DEFAULT 0.5,
  cost numeric NOT NULL DEFAULT 300,
  seats_amount integer NOT NULL DEFAULT 1,
  payer_type text NOT NULL DEFAULT 'Recipient',
  payment_method text NOT NULL DEFAULT 'Cash',
  cargo_type text NOT NULL DEFAULT 'Parcel',
  service_type text NOT NULL DEFAULT 'WarehouseWarehouse',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_np_sender_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage NP sender settings"
ON public.event_np_sender_settings
FOR ALL
TO authenticated
USING (can_manage_event(event_id, auth.uid()))
WITH CHECK (can_manage_event(event_id, auth.uid()));

CREATE TRIGGER trg_event_np_sender_settings_updated_at
BEFORE UPDATE ON public.event_np_sender_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
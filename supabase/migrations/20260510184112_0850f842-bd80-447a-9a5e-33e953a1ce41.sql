ALTER TABLE public.event_np_sender_settings
  ADD COLUMN IF NOT EXISTS volume_width numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS volume_length numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS volume_height numeric NOT NULL DEFAULT 10;
ALTER TABLE public.events ADD COLUMN registration_opens_on date;
ALTER TABLE public.telegram_starts
  ADD COLUMN registration_status text CHECK (registration_status IN ('open','expected','closed','cancelled')),
  ADD COLUMN registration_opens_on date,
  ADD COLUMN info_source_url text,
  ADD COLUMN info_checked_on date;
ALTER TABLE public.calendar_events
  ADD COLUMN registration_status text CHECK (registration_status IN ('open','expected','closed','cancelled')),
  ADD COLUMN registration_opens_on date,
  ADD COLUMN info_source_url text,
  ADD COLUMN info_checked_on date;
ALTER TABLE public.saved_start_items
  ADD COLUMN notify_registration boolean NOT NULL DEFAULT false,
  ADD COLUMN notify_date_change boolean NOT NULL DEFAULT false,
  ADD COLUMN known_date date,
  ADD COLUMN known_registration text;
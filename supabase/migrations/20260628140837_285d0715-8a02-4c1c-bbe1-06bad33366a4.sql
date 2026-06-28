
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.telegram_start_status AS ENUM ('draft', 'published', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.telegram_starts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_message_id bigint,
  telegram_chat_id bigint,
  telegram_media_group_id text,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text,
  register_url text,
  event_date date,
  slug text UNIQUE,
  seo_title text,
  seo_description text,
  status public.telegram_start_status NOT NULL DEFAULT 'draft',
  raw_payload jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS telegram_starts_chat_msg_unique
  ON public.telegram_starts (telegram_chat_id, telegram_message_id)
  WHERE telegram_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS telegram_starts_status_date_idx
  ON public.telegram_starts (status, event_date);

-- Grants
GRANT SELECT ON public.telegram_starts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_starts TO authenticated;
GRANT ALL ON public.telegram_starts TO service_role;

-- RLS
ALTER TABLE public.telegram_starts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published future starts"
  ON public.telegram_starts FOR SELECT
  USING (
    status = 'published'
    AND event_date IS NOT NULL
    AND event_date >= DATE '2026-07-01'
  );

CREATE POLICY "Admins can view all starts"
  ON public.telegram_starts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert starts"
  ON public.telegram_starts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update starts"
  ON public.telegram_starts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete starts"
  ON public.telegram_starts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- updated_at trigger
CREATE TRIGGER telegram_starts_set_updated_at
  BEFORE UPDATE ON public.telegram_starts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Slug generator
CREATE OR REPLACE FUNCTION public.generate_telegram_start_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base := public.slugify(COALESCE(NULLIF(NEW.title, ''), 'start'));
  IF NEW.event_date IS NOT NULL THEN
    base := base || '-' || to_char(NEW.event_date, 'YYYY-MM-DD');
  END IF;
  IF base IS NULL OR base = '' THEN base := 'start'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.telegram_starts WHERE slug = candidate AND id <> NEW.id) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER telegram_starts_gen_slug
  BEFORE INSERT OR UPDATE ON public.telegram_starts
  FOR EACH ROW EXECUTE FUNCTION public.generate_telegram_start_slug();

-- Ensure pg_cron + pg_net
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Daily cron at 13:00 Kyiv (10:00 UTC during EEST)
DO $$
BEGIN
  PERFORM cron.unschedule('sync-telegram-starts-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'sync-telegram-starts-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mjkjygzxwysbhgjtvobm.supabase.co/functions/v1/sync-telegram-starts',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('source','cron')
  );
  $$
);

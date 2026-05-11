-- Auto-move past events to completed status
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.mark_past_events_completed()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.events
  SET status = 'completed', updated_at = now()
  WHERE status = 'published'
    AND event_date < (now() AT TIME ZONE 'Europe/Kyiv')::date;
$$;

-- Run once now to backfill
SELECT public.mark_past_events_completed();

-- Schedule daily at 00:05 Kyiv (~22:05 UTC); using 05 03 * * * UTC = 05:05 Kyiv summer / 06:05 winter is fine for daily check
DO $$
BEGIN
  PERFORM cron.unschedule('mark-past-events-completed');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'mark-past-events-completed',
  '5 * * * *',
  $$ SELECT public.mark_past_events_completed(); $$
);
-- Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function to notify Telegram on new registration
CREATE OR REPLACE FUNCTION public.notify_telegram_new_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://mjkjygzxwysbhgjtvobm.supabase.co/functions/v1/telegram-notify-registration',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('registration_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block registration if notification fails
  RAISE WARNING 'Telegram notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_telegram_new_registration ON public.registrations;

CREATE TRIGGER trg_notify_telegram_new_registration
AFTER INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.notify_telegram_new_registration();
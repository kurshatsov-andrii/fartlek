CREATE OR REPLACE FUNCTION public.notify_telegram_new_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net', 'extensions'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://mjkjygzxwysbhgjtvobm.supabase.co/functions/v1/telegram-notify-registration',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('registration_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Telegram notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;
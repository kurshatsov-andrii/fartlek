CREATE OR REPLACE FUNCTION public.notify_telegram_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net', 'extensions'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://mjkjygzxwysbhgjtvobm.supabase.co/functions/v1/telegram-notify-signup',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('user_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Telegram signup notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_telegram_new_signup ON public.profiles;

CREATE TRIGGER trg_notify_telegram_new_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_telegram_new_signup();
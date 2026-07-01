
CREATE OR REPLACE FUNCTION public.notify_telegram_cancellation_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net', 'extensions'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://mjkjygzxwysbhgjtvobm.supabase.co/functions/v1/telegram-notify-cancellation',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('request_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Telegram cancellation notification failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_telegram_cancellation ON public.registration_cancellation_requests;
CREATE TRIGGER trg_notify_telegram_cancellation
AFTER INSERT ON public.registration_cancellation_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_telegram_cancellation_request();

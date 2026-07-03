CREATE OR REPLACE FUNCTION public.auto_close_event_on_full()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ev_cap integer;
  ev_cnt integer;
BEGIN
  SELECT max_total_participants INTO ev_cap FROM public.events WHERE id = NEW.event_id;
  IF ev_cap IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO ev_cnt FROM public.registrations WHERE event_id = NEW.event_id;
  IF ev_cnt >= ev_cap THEN
    UPDATE public.events
      SET registration_closed = true, updated_at = now()
      WHERE id = NEW.event_id AND registration_closed = false;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_auto_close_event_on_full ON public.registrations;
CREATE TRIGGER trg_auto_close_event_on_full
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.auto_close_event_on_full();

CREATE OR REPLACE FUNCTION public.is_transfer_allowed(_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = _event_id
      AND e.status NOT IN ('completed','cancelled')
      AND e.event_date - COALESCE(e.changes_deadline_days, 1) >= CURRENT_DATE
  );
$$;

CREATE OR REPLACE FUNCTION public.participant_create_transfer(_registration_id uuid)
RETURNS TABLE(transfer_id uuid, code text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reg public.registrations%ROWTYPE;
  new_code text;
  rec record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO reg FROM public.registrations WHERE id = _registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'REGISTRATION_NOT_FOUND'; END IF;
  IF reg.user_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF NOT public.is_transfer_allowed(reg.event_id) THEN RAISE EXCEPTION 'CHANGES_NOT_ALLOWED'; END IF;

  UPDATE public.registration_transfers
     SET status = 'cancelled'
   WHERE registration_id = reg.id AND status = 'pending';

  new_code := upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 8));

  INSERT INTO public.registration_transfers(registration_id, event_id, from_user_id, code)
  VALUES (reg.id, reg.event_id, auth.uid(), new_code)
  RETURNING id, registration_transfers.code, registration_transfers.expires_at INTO rec;

  INSERT INTO public.registration_history(registration_id, event_id, action, actor_id, payload)
  VALUES (reg.id, reg.event_id, 'transfer_created', auth.uid(), jsonb_build_object('code', new_code));

  RETURN QUERY SELECT rec.id, rec.code, rec.expires_at;
END;
$function$;

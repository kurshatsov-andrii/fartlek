
-- 1. Add changes deadline to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS changes_deadline_days integer NOT NULL DEFAULT 1;

-- 2. History table
CREATE TABLE IF NOT EXISTS public.registration_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid,
  event_id uuid NOT NULL,
  action text NOT NULL, -- 'distance_changed' | 'transferred' | 'cancellation_requested' | 'cancellation_approved' | 'cancellation_rejected' | 'cancelled'
  actor_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_history_event ON public.registration_history(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reg_history_reg ON public.registration_history(registration_id);

ALTER TABLE public.registration_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view event history"
  ON public.registration_history FOR SELECT TO authenticated
  USING (public.can_manage_event(event_id, auth.uid()));

CREATE POLICY "Actor views own history"
  ON public.registration_history FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

-- 3. Transfers
CREATE TABLE IF NOT EXISTS public.registration_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL,
  event_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  to_user_id uuid,
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending|accepted|cancelled|expired
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_transfers_reg ON public.registration_transfers(registration_id);
CREATE INDEX IF NOT EXISTS idx_transfers_event ON public.registration_transfers(event_id);

ALTER TABLE public.registration_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "From user views own transfers"
  ON public.registration_transfers FOR SELECT TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR public.can_manage_event(event_id, auth.uid()));

CREATE POLICY "From user cancels own transfers"
  ON public.registration_transfers FOR UPDATE TO authenticated
  USING (from_user_id = auth.uid() AND status = 'pending')
  WITH CHECK (from_user_id = auth.uid());

-- 4. Cancellation requests
CREATE TABLE IF NOT EXISTS public.registration_cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cancel_req_event ON public.registration_cancellation_requests(event_id, status);

ALTER TABLE public.registration_cancellation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User views own cancellation requests"
  ON public.registration_cancellation_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_event(event_id, auth.uid()));

CREATE POLICY "User creates own cancellation request"
  ON public.registration_cancellation_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Manager updates cancellation request"
  ON public.registration_cancellation_requests FOR UPDATE TO authenticated
  USING (public.can_manage_event(event_id, auth.uid()))
  WITH CHECK (public.can_manage_event(event_id, auth.uid()));

-- 5. Helper: check if changes are still allowed for an event
CREATE OR REPLACE FUNCTION public.are_changes_allowed(_event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = _event_id
      AND e.registration_closed = false
      AND e.event_date - COALESCE(e.changes_deadline_days, 1) >= CURRENT_DATE
  );
$$;

-- 6. Participant changes own distance
CREATE OR REPLACE FUNCTION public.participant_change_distance(_registration_id uuid, _new_distance_id uuid)
RETURNS TABLE(new_bib_number integer, new_distance_id uuid, requires_payment boolean, price_diff numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  reg public.registrations%ROWTYPE;
  old_dist public.distances%ROWTYPE;
  new_dist public.distances%ROWTYPE;
  next_bib integer;
  start_bib integer;
  max_in_distance integer;
  current_count integer;
  diff numeric := 0;
  needs_pay boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT * INTO reg FROM public.registrations WHERE id = _registration_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REGISTRATION_NOT_FOUND'; END IF;
  IF reg.user_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;

  IF NOT public.are_changes_allowed(reg.event_id) THEN
    RAISE EXCEPTION 'CHANGES_NOT_ALLOWED';
  END IF;

  SELECT * INTO old_dist FROM public.distances WHERE id = reg.distance_id;
  SELECT * INTO new_dist FROM public.distances WHERE id = _new_distance_id;
  IF NOT FOUND OR new_dist.event_id <> reg.event_id THEN RAISE EXCEPTION 'INVALID_DISTANCE'; END IF;
  IF NOT new_dist.is_active THEN RAISE EXCEPTION 'DISTANCE_INACTIVE'; END IF;
  IF new_dist.id = reg.distance_id THEN
    RETURN QUERY SELECT reg.bib_number, reg.distance_id, false, 0::numeric; RETURN;
  END IF;

  IF new_dist.max_participants IS NOT NULL THEN
    SELECT COUNT(*) INTO current_count FROM public.registrations
      WHERE event_id = reg.event_id AND distance_id = new_dist.id;
    IF current_count >= new_dist.max_participants THEN RAISE EXCEPTION 'DISTANCE_FULL'; END IF;
  END IF;

  diff := COALESCE(new_dist.price,0) - COALESCE(old_dist.price,0);
  needs_pay := diff > 0 AND reg.payment_status = 'paid';

  start_bib := new_dist.bib_start;
  IF start_bib IS NOT NULL THEN
    SELECT MAX(bib_number) INTO max_in_distance FROM public.registrations
      WHERE event_id = reg.event_id AND distance_id = new_dist.id;
    next_bib := CASE WHEN max_in_distance IS NULL OR max_in_distance < start_bib THEN start_bib ELSE max_in_distance + 1 END;
  ELSE
    SELECT COALESCE(MAX(bib_number), 999) + 1 INTO next_bib FROM public.registrations WHERE event_id = reg.event_id;
  END IF;

  UPDATE public.registrations
     SET distance_id = new_dist.id,
         bib_number = next_bib,
         payment_status = CASE WHEN needs_pay THEN 'pending'::public.payment_status_type ELSE payment_status END,
         updated_at = now()
   WHERE id = reg.id;

  INSERT INTO public.registration_history(registration_id, event_id, action, actor_id, payload)
  VALUES (reg.id, reg.event_id, 'distance_changed', auth.uid(),
    jsonb_build_object(
      'from_distance_id', old_dist.id, 'from_distance_name', old_dist.name, 'from_distance_km', old_dist.distance_km, 'from_price', old_dist.price,
      'to_distance_id', new_dist.id, 'to_distance_name', new_dist.name, 'to_distance_km', new_dist.distance_km, 'to_price', new_dist.price,
      'price_diff', diff, 'requires_payment', needs_pay,
      'old_bib', reg.bib_number, 'new_bib', next_bib
    ));

  RETURN QUERY SELECT next_bib, new_dist.id, needs_pay, diff;
END;
$$;

-- 7. Create transfer
CREATE OR REPLACE FUNCTION public.participant_create_transfer(_registration_id uuid)
RETURNS TABLE(transfer_id uuid, code text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  reg public.registrations%ROWTYPE;
  new_code text;
  rec record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO reg FROM public.registrations WHERE id = _registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'REGISTRATION_NOT_FOUND'; END IF;
  IF reg.user_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF NOT public.are_changes_allowed(reg.event_id) THEN RAISE EXCEPTION 'CHANGES_NOT_ALLOWED'; END IF;

  -- cancel previous pending transfers
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
$$;

-- 8. Accept transfer
CREATE OR REPLACE FUNCTION public.participant_accept_transfer(_code text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  tr public.registration_transfers%ROWTYPE;
  reg public.registrations%ROWTYPE;
  prev_user uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT * INTO tr FROM public.registration_transfers
   WHERE upper(code) = upper(_code) AND status = 'pending'
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSFER_INVALID'; END IF;
  IF tr.expires_at < now() THEN
    UPDATE public.registration_transfers SET status='expired' WHERE id = tr.id;
    RAISE EXCEPTION 'TRANSFER_EXPIRED';
  END IF;
  IF tr.from_user_id = auth.uid() THEN RAISE EXCEPTION 'TRANSFER_SELF'; END IF;

  SELECT * INTO reg FROM public.registrations WHERE id = tr.registration_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REGISTRATION_NOT_FOUND'; END IF;
  prev_user := reg.user_id;

  -- Prevent duplicate registration on same event
  IF EXISTS (SELECT 1 FROM public.registrations WHERE event_id = reg.event_id AND user_id = auth.uid() AND id <> reg.id) THEN
    RAISE EXCEPTION 'ALREADY_REGISTERED';
  END IF;

  UPDATE public.registrations
     SET user_id = auth.uid(),
         athlete_id = NULL,
         updated_at = now()
   WHERE id = reg.id;

  UPDATE public.registration_transfers
     SET status = 'accepted', to_user_id = auth.uid(), accepted_at = now()
   WHERE id = tr.id;

  INSERT INTO public.registration_history(registration_id, event_id, action, actor_id, payload)
  VALUES (reg.id, reg.event_id, 'transferred', auth.uid(),
    jsonb_build_object('from_user_id', prev_user, 'to_user_id', auth.uid(), 'code', tr.code));

  RETURN reg.id;
END;
$$;

-- 9. Request cancellation
CREATE OR REPLACE FUNCTION public.participant_request_cancellation(_registration_id uuid, _reason text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  reg public.registrations%ROWTYPE;
  req_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO reg FROM public.registrations WHERE id = _registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'REGISTRATION_NOT_FOUND'; END IF;
  IF reg.user_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;

  IF EXISTS (SELECT 1 FROM public.registration_cancellation_requests
              WHERE registration_id = reg.id AND status = 'pending') THEN
    RAISE EXCEPTION 'CANCELLATION_ALREADY_REQUESTED';
  END IF;

  INSERT INTO public.registration_cancellation_requests(registration_id, event_id, user_id, reason)
  VALUES (reg.id, reg.event_id, auth.uid(), _reason)
  RETURNING id INTO req_id;

  INSERT INTO public.registration_history(registration_id, event_id, action, actor_id, payload)
  VALUES (reg.id, reg.event_id, 'cancellation_requested', auth.uid(), jsonb_build_object('reason', _reason, 'request_id', req_id));

  RETURN req_id;
END;
$$;

-- 10. Resolve cancellation (organizer)
CREATE OR REPLACE FUNCTION public.organizer_resolve_cancellation(_request_id uuid, _approve boolean, _note text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  req public.registration_cancellation_requests%ROWTYPE;
  reg_snapshot jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO req FROM public.registration_cancellation_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;
  IF NOT public.can_manage_event(req.event_id, auth.uid()) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF req.status <> 'pending' THEN RAISE EXCEPTION 'REQUEST_ALREADY_RESOLVED'; END IF;

  UPDATE public.registration_cancellation_requests
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
         resolution_note = _note,
         resolved_by = auth.uid(),
         resolved_at = now()
   WHERE id = req.id;

  IF _approve THEN
    SELECT to_jsonb(r) INTO reg_snapshot FROM public.registrations r WHERE r.id = req.registration_id;
    INSERT INTO public.registration_history(registration_id, event_id, action, actor_id, payload)
    VALUES (req.registration_id, req.event_id, 'cancelled', auth.uid(),
      jsonb_build_object('request_id', req.id, 'note', _note, 'snapshot', reg_snapshot));
    DELETE FROM public.registrations WHERE id = req.registration_id;
  ELSE
    INSERT INTO public.registration_history(registration_id, event_id, action, actor_id, payload)
    VALUES (req.registration_id, req.event_id, 'cancellation_rejected', auth.uid(),
      jsonb_build_object('request_id', req.id, 'note', _note));
  END IF;
END;
$$;

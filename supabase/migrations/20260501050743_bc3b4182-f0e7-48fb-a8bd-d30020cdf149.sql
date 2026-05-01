-- Co-organizers table
CREATE TABLE public.event_co_organizers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  added_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_co_organizers_event ON public.event_co_organizers(event_id);
CREATE INDEX idx_event_co_organizers_user ON public.event_co_organizers(user_id);

ALTER TABLE public.event_co_organizers ENABLE ROW LEVEL SECURITY;

-- Helper security definer function (avoid recursion in policies)
CREATE OR REPLACE FUNCTION public.is_event_co_organizer(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_co_organizers
    WHERE event_id = _event_id AND user_id = _user_id
  )
$$;

-- Combined helper: head organizer OR co-organizer OR admin
CREATE OR REPLACE FUNCTION public.can_manage_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.events WHERE id = _event_id AND organizer_id = _user_id)
    OR public.is_event_co_organizer(_event_id, _user_id)
$$;

-- RLS for event_co_organizers
CREATE POLICY "Admin manages co-organizers"
  ON public.event_co_organizers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Head organizer views own event co-organizers"
  ON public.event_co_organizers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );

CREATE POLICY "Co-organizer views own assignment"
  ON public.event_co_organizers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Update events policies to allow co-organizers to update
DROP POLICY IF EXISTS "Organizers update own events" ON public.events;
CREATE POLICY "Organizers update own events"
  ON public.events FOR UPDATE TO authenticated
  USING (
    auth.uid() = organizer_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_event_co_organizer(id, auth.uid())
  );

DROP POLICY IF EXISTS "Anyone views published or completed events" ON public.events;
CREATE POLICY "Anyone views published or completed events"
  ON public.events FOR SELECT TO public
  USING (
    status = ANY (ARRAY['published'::event_status, 'completed'::event_status])
    OR auth.uid() = organizer_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_event_co_organizer(id, auth.uid())
  );

-- distances
DROP POLICY IF EXISTS "Organizers manage own distances" ON public.distances;
CREATE POLICY "Organizers manage own distances"
  ON public.distances FOR ALL TO authenticated
  USING (public.can_manage_event(event_id, auth.uid()))
  WITH CHECK (public.can_manage_event(event_id, auth.uid()));

DROP POLICY IF EXISTS "Anyone views distances of visible events" ON public.distances;
CREATE POLICY "Anyone views distances of visible events"
  ON public.distances FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = distances.event_id
        AND (
          e.status = 'published'::event_status
          OR e.organizer_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin'::public.app_role)
          OR public.is_event_co_organizer(e.id, auth.uid())
        )
    )
  );

-- registrations
DROP POLICY IF EXISTS "Organizers update event registrations" ON public.registrations;
CREATE POLICY "Organizers update event registrations"
  ON public.registrations FOR UPDATE TO authenticated
  USING (public.can_manage_event(event_id, auth.uid()));

DROP POLICY IF EXISTS "Organizers delete event registrations" ON public.registrations;
CREATE POLICY "Organizers delete event registrations"
  ON public.registrations FOR DELETE TO authenticated
  USING (public.can_manage_event(event_id, auth.uid()));

-- promo_codes
DROP POLICY IF EXISTS "Organizers manage own event promo codes" ON public.promo_codes;
CREATE POLICY "Organizers manage own event promo codes"
  ON public.promo_codes FOR ALL TO authenticated
  USING (public.can_manage_event(event_id, auth.uid()))
  WITH CHECK (public.can_manage_event(event_id, auth.uid()));

DROP POLICY IF EXISTS "Anyone authenticated views active promo codes" ON public.promo_codes;
CREATE POLICY "Anyone authenticated views active promo codes"
  ON public.promo_codes FOR SELECT TO authenticated
  USING (
    is_active = true
    OR public.can_manage_event(event_id, auth.uid())
  );

-- promo_code_redemptions
DROP POLICY IF EXISTS "Users view own redemptions" ON public.promo_code_redemptions;
CREATE POLICY "Users view own redemptions"
  ON public.promo_code_redemptions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.can_manage_event(event_id, auth.uid())
  );

-- profiles: co-organizers see their event participants' profiles
DROP POLICY IF EXISTS "Organizers view profiles of their event participants" ON public.profiles;
CREATE POLICY "Organizers view profiles of their event participants"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      JOIN public.events e ON e.id = r.event_id
      WHERE r.user_id = profiles.id
        AND (e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()))
    )
  );

-- athletes: co-organizers see athletes of their events
DROP POLICY IF EXISTS "Organizers view athletes of own events" ON public.athletes;
CREATE POLICY "Organizers view athletes of own events"
  ON public.athletes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      JOIN public.events e ON e.id = r.event_id
      WHERE r.athlete_id = athletes.id
        AND (e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()))
    )
  );

-- Update get_event_participants to include co-organizers
CREATE OR REPLACE FUNCTION public.get_event_participants(_event_id uuid)
 RETURNS TABLE(registration_id uuid, user_id uuid, bib_number integer, full_name text, email text, phone text, gender gender_type, birth_year integer, city text, club text, distance_km numeric, distance_name text, payment_status payment_status_type, receipt_url text, receipt_uploaded_at timestamp with time zone, receipt_confirmed_at timestamp with time zone, added_by_name text, added_by_email text, is_self_athlete boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    r.id, r.user_id, r.bib_number,
    COALESCE(a.full_name, p.full_name),
    CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) OR e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()) THEN p.email ELSE NULL END,
    CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.phone ELSE NULL END,
    COALESCE(a.gender, p.gender),
    EXTRACT(YEAR FROM COALESCE(a.birth_date, p.birth_date))::integer,
    COALESCE(a.city, p.city),
    COALESCE(a.club, p.club),
    d.distance_km, d.name,
    r.payment_status, r.receipt_url, r.receipt_uploaded_at, r.receipt_confirmed_at,
    CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) OR e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()) THEN owner_p.full_name ELSE NULL END,
    CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) OR e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()) THEN owner_p.email ELSE NULL END,
    COALESCE(a.is_self, true)
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  LEFT JOIN public.athletes a ON a.id = r.athlete_id
  LEFT JOIN public.profiles p ON p.id = r.user_id
  LEFT JOIN public.profiles owner_p ON owner_p.id = a.owner_id
  LEFT JOIN public.distances d ON d.id = r.distance_id
  WHERE r.event_id = _event_id
    AND auth.uid() IS NOT NULL
    AND (
      e.status = 'published'::public.event_status
      OR e.organizer_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_event_co_organizer(e.id, auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.registrations vr
        WHERE vr.event_id = _event_id AND vr.user_id = auth.uid()
      )
    )
  ORDER BY r.bib_number ASC NULLS LAST, r.created_at ASC;
$function$;

-- move_registration_to_distance: allow co-organizers
CREATE OR REPLACE FUNCTION public.move_registration_to_distance(_registration_id uuid, _new_distance_id uuid)
 RETURNS TABLE(new_bib_number integer, new_distance_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  reg public.registrations%ROWTYPE;
  ev_organizer uuid;
  new_dist public.distances%ROWTYPE;
  next_bib integer;
  start_bib integer;
  max_in_distance integer;
  current_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO reg FROM public.registrations WHERE id = _registration_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_FOUND';
  END IF;

  SELECT organizer_id INTO ev_organizer FROM public.events WHERE id = reg.event_id;
  IF ev_organizer <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role)
     AND NOT public.is_event_co_organizer(reg.event_id, auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  SELECT * INTO new_dist FROM public.distances WHERE id = _new_distance_id;
  IF NOT FOUND OR new_dist.event_id <> reg.event_id THEN
    RAISE EXCEPTION 'INVALID_DISTANCE';
  END IF;

  IF new_dist.id = reg.distance_id THEN
    RETURN QUERY SELECT reg.bib_number, reg.distance_id;
    RETURN;
  END IF;

  IF new_dist.max_participants IS NOT NULL THEN
    SELECT COUNT(*) INTO current_count
      FROM public.registrations
     WHERE event_id = reg.event_id AND distance_id = new_dist.id;
    IF current_count >= new_dist.max_participants THEN
      RAISE EXCEPTION 'DISTANCE_FULL';
    END IF;
  END IF;

  start_bib := new_dist.bib_start;
  IF start_bib IS NOT NULL THEN
    SELECT MAX(bib_number) INTO max_in_distance
      FROM public.registrations
     WHERE event_id = reg.event_id AND distance_id = new_dist.id;
    IF max_in_distance IS NULL OR max_in_distance < start_bib THEN
      next_bib := start_bib;
    ELSE
      next_bib := max_in_distance + 1;
    END IF;
  ELSE
    SELECT COALESCE(MAX(bib_number), 999) + 1 INTO next_bib
      FROM public.registrations
     WHERE event_id = reg.event_id;
  END IF;

  UPDATE public.registrations
     SET distance_id = new_dist.id,
         bib_number = next_bib,
         updated_at = now()
   WHERE id = reg.id;

  RETURN QUERY SELECT next_bib, new_dist.id;
END;
$function$;
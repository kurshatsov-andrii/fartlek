ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS delivery_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_recipient_name text,
  ADD COLUMN IF NOT EXISTS delivery_phone text,
  ADD COLUMN IF NOT EXISTS delivery_city_ref text,
  ADD COLUMN IF NOT EXISTS delivery_city_name text,
  ADD COLUMN IF NOT EXISTS delivery_warehouse_ref text,
  ADD COLUMN IF NOT EXISTS delivery_warehouse_name text,
  ADD COLUMN IF NOT EXISTS delivery_warehouse_type text;

CREATE OR REPLACE FUNCTION public.validate_registration_delivery()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.delivery_enabled THEN
    IF NEW.delivery_recipient_name IS NULL OR length(trim(NEW.delivery_recipient_name)) < 3 THEN
      RAISE EXCEPTION 'DELIVERY_RECIPIENT_REQUIRED';
    END IF;
    IF NEW.delivery_phone IS NULL OR NEW.delivery_phone !~ '^\+38 \(\d{3}\) \d{3}-\d{2}-\d{2}$' THEN
      RAISE EXCEPTION 'DELIVERY_PHONE_INVALID';
    END IF;
    IF NEW.delivery_city_ref IS NULL OR NEW.delivery_city_name IS NULL THEN
      RAISE EXCEPTION 'DELIVERY_CITY_REQUIRED';
    END IF;
    IF NEW.delivery_warehouse_ref IS NULL OR NEW.delivery_warehouse_name IS NULL THEN
      RAISE EXCEPTION 'DELIVERY_WAREHOUSE_REQUIRED';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_registration_delivery_trg ON public.registrations;
CREATE TRIGGER validate_registration_delivery_trg
BEFORE INSERT OR UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_registration_delivery();

-- Update participants function to include delivery info for managers
DROP FUNCTION IF EXISTS public.get_event_participants(uuid);

CREATE OR REPLACE FUNCTION public.get_event_participants(_event_id uuid)
 RETURNS TABLE(registration_id uuid, user_id uuid, bib_number integer, full_name text, email text, phone text, gender gender_type, birth_year integer, city text, club text, distance_km numeric, distance_name text, payment_status payment_status_type, receipt_url text, receipt_uploaded_at timestamp with time zone, receipt_confirmed_at timestamp with time zone, added_by_name text, added_by_email text, is_self_athlete boolean, is_relay boolean, team_name text, team_category text, relay_members jsonb, delivery_enabled boolean, delivery_recipient_name text, delivery_phone text, delivery_city_name text, delivery_warehouse_name text, delivery_warehouse_type text)
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
    COALESCE(a.is_self, true),
    COALESCE(d.is_relay, false),
    r.team_name,
    r.team_category,
    r.relay_members,
    r.delivery_enabled,
    CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) OR e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()) THEN r.delivery_recipient_name ELSE NULL END,
    CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) OR e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()) THEN r.delivery_phone ELSE NULL END,
    CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) OR e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()) THEN r.delivery_city_name ELSE NULL END,
    CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) OR e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()) THEN r.delivery_warehouse_name ELSE NULL END,
    CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) OR e.organizer_id = auth.uid() OR public.is_event_co_organizer(e.id, auth.uid()) THEN r.delivery_warehouse_type ELSE NULL END
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
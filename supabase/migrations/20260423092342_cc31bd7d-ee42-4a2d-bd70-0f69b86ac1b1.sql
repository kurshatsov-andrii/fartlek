-- 1. athletes table
CREATE TABLE public.athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  gender public.gender_type NOT NULL,
  city text NOT NULL,
  club text,
  is_self boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX athletes_one_self_per_owner ON public.athletes(owner_id) WHERE is_self = true;
CREATE INDEX athletes_owner_idx ON public.athletes(owner_id);

ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER athletes_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. add athlete_id to registrations FIRST (so policies can reference it)
ALTER TABLE public.registrations ADD COLUMN athlete_id uuid REFERENCES public.athletes(id) ON DELETE CASCADE;

-- 3. Policies on athletes (now safe to reference r.athlete_id)
CREATE POLICY "Owner manages own athletes"
  ON public.athletes FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admin manages all athletes"
  ON public.athletes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Organizers view athletes of own events"
  ON public.athletes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.registrations r
    JOIN public.events e ON e.id = r.event_id
    WHERE r.athlete_id = athletes.id AND e.organizer_id = auth.uid()
  ));

-- 4. Backfill self-athletes
INSERT INTO public.athletes (owner_id, full_name, birth_date, gender, city, club, is_self)
SELECT p.id, p.full_name, p.birth_date, p.gender, p.city, p.club, true
FROM public.profiles p
WHERE p.full_name IS NOT NULL AND p.birth_date IS NOT NULL AND p.gender IS NOT NULL AND p.city IS NOT NULL;

-- 5. Backfill registrations -> self-athlete
UPDATE public.registrations r
SET athlete_id = a.id
FROM public.athletes a
WHERE a.owner_id = r.user_id AND a.is_self = true AND r.athlete_id IS NULL;

-- 6. Unique: athlete can't register twice on same distance
CREATE UNIQUE INDEX registrations_unique_athlete_distance
  ON public.registrations(event_id, athlete_id, distance_id)
  WHERE athlete_id IS NOT NULL;

-- 7. Updated participants function
CREATE OR REPLACE FUNCTION public.get_event_participants(_event_id uuid)
 RETURNS TABLE(registration_id uuid, user_id uuid, bib_number integer, full_name text, gender gender_type, birth_year integer, city text, club text, distance_km numeric, distance_name text, payment_status payment_status_type, receipt_url text, receipt_uploaded_at timestamp with time zone, receipt_confirmed_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    r.id, r.user_id, r.bib_number,
    COALESCE(a.full_name, p.full_name),
    COALESCE(a.gender, p.gender),
    EXTRACT(YEAR FROM COALESCE(a.birth_date, p.birth_date))::integer,
    COALESCE(a.city, p.city),
    COALESCE(a.club, p.club),
    d.distance_km, d.name,
    r.payment_status, r.receipt_url, r.receipt_uploaded_at, r.receipt_confirmed_at
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  LEFT JOIN public.athletes a ON a.id = r.athlete_id
  LEFT JOIN public.profiles p ON p.id = r.user_id
  LEFT JOIN public.distances d ON d.id = r.distance_id
  WHERE r.event_id = _event_id
    AND auth.uid() IS NOT NULL
    AND (
      e.status = 'published'::public.event_status
      OR e.organizer_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.registrations vr
        WHERE vr.event_id = _event_id AND vr.user_id = auth.uid()
      )
    )
  ORDER BY r.bib_number ASC NULLS LAST, r.created_at ASC;
$function$;

-- 8. Sync self-athlete on profile change
CREATE OR REPLACE FUNCTION public.sync_self_athlete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  existing_id uuid;
BEGIN
  IF NEW.full_name IS NULL OR NEW.birth_date IS NULL
     OR NEW.gender IS NULL OR NEW.city IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO existing_id FROM public.athletes
   WHERE owner_id = NEW.id AND is_self = true LIMIT 1;

  IF existing_id IS NULL THEN
    INSERT INTO public.athletes (owner_id, full_name, birth_date, gender, city, club, is_self)
    VALUES (NEW.id, NEW.full_name, NEW.birth_date, NEW.gender, NEW.city, NEW.club, true);
  ELSE
    UPDATE public.athletes SET
      full_name = NEW.full_name,
      birth_date = NEW.birth_date,
      gender = NEW.gender,
      city = NEW.city,
      club = NEW.club,
      updated_at = now()
    WHERE id = existing_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_sync_self_athlete
  AFTER INSERT OR UPDATE OF full_name, birth_date, gender, city, club ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_self_athlete();

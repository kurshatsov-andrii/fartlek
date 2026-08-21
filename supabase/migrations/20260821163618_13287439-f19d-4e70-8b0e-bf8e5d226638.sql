ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS dnf boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_event_dnf_flags(_event_id uuid)
RETURNS TABLE(registration_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.id
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE r.event_id = _event_id
    AND r.dnf = true
    AND auth.uid() IS NOT NULL
    AND (
      e.status IN ('published'::public.event_status, 'completed'::public.event_status)
      OR e.organizer_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_event_co_organizer(e.id, auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.registrations vr
        WHERE vr.event_id = _event_id AND vr.user_id = auth.uid()
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_event_dnf_flags(uuid) TO authenticated;
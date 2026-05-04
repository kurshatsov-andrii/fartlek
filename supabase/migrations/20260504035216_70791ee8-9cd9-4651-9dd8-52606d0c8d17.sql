
DROP POLICY IF EXISTS "Admins insert calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins update calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins delete calendar events" ON public.calendar_events;

CREATE POLICY "Organizers and admins insert calendar events"
ON public.calendar_events FOR INSERT TO authenticated
WITH CHECK (
  (created_by = auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'organizer'::public.app_role)
  )
);

CREATE POLICY "Admins update any, organizers update own calendar events"
ON public.calendar_events FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (created_by = auth.uid() AND public.has_role(auth.uid(), 'organizer'::public.app_role))
);

CREATE POLICY "Admins delete any, organizers delete own calendar events"
ON public.calendar_events FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (created_by = auth.uid() AND public.has_role(auth.uid(), 'organizer'::public.app_role))
);

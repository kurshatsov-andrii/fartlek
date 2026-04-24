DROP POLICY IF EXISTS "Anyone views published events" ON public.events;

CREATE POLICY "Anyone views published or completed events"
ON public.events
FOR SELECT
USING (
  status IN ('published'::event_status, 'completed'::event_status)
  OR auth.uid() = organizer_id
  OR has_role(auth.uid(), 'admin'::app_role)
);
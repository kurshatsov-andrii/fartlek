DROP POLICY "Anyone views distances of visible events" ON public.distances;
CREATE POLICY "Anyone views distances of visible events" ON public.distances FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = distances.event_id AND (
    e.status IN ('published','completed','cancelled')
    OR e.organizer_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.is_event_co_organizer(e.id, auth.uid())
  ))
);
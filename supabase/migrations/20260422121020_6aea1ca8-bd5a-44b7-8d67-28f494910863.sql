CREATE POLICY "Organizers delete event registrations"
ON public.registrations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = registrations.event_id
      AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);
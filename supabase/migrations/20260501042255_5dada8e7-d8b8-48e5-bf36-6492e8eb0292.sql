-- Allow event organizers to create and view their own marketing campaigns
-- (admins keep full access via existing policy)

CREATE POLICY "Organizers create own event campaigns"
ON public.marketing_campaigns
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    has_role(auth.uid(), 'organizer'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Organizers view own campaigns"
ON public.marketing_campaigns
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Organizers update own campaigns"
ON public.marketing_campaigns
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

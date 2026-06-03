
-- 1) event_payment_settings: restrict to head organizer + admin only
DROP POLICY IF EXISTS "Managers manage payment settings" ON public.event_payment_settings;

CREATE POLICY "Head organizer or admin manage payment settings"
ON public.event_payment_settings
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_payment_settings.event_id AND e.organizer_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_payment_settings.event_id AND e.organizer_id = auth.uid())
);

-- 2) event_np_sender_settings: restrict to head organizer + admin only
DROP POLICY IF EXISTS "Managers manage NP sender settings" ON public.event_np_sender_settings;

CREATE POLICY "Head organizer or admin manage NP sender settings"
ON public.event_np_sender_settings
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_np_sender_settings.event_id AND e.organizer_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_np_sender_settings.event_id AND e.organizer_id = auth.uid())
);

-- 3) event_results_api_keys: explicit deny-all for client roles (only SECURITY DEFINER RPCs and service_role can access)
CREATE POLICY "Deny direct client access to api keys"
ON public.event_results_api_keys
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);


-- 1) REGISTRATIONS: remove permissive policy, add manager-scoped policy
DROP POLICY IF EXISTS "Authenticated users view event participants" ON public.registrations;

CREATE POLICY "Managers view event registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (public.can_manage_event(event_id, auth.uid()));

-- RPC for per-distance counts (no personal data exposed)
CREATE OR REPLACE FUNCTION public.get_event_distance_counts(_event_id uuid)
RETURNS TABLE(distance_id uuid, cnt bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.distance_id, COUNT(*)::bigint
  FROM public.registrations r
  WHERE r.event_id = _event_id
  GROUP BY r.distance_id;
$$;

REVOKE ALL ON FUNCTION public.get_event_distance_counts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_distance_counts(uuid) TO anon, authenticated;

-- RPC to check if an event has active promo codes (no code values exposed)
CREATE OR REPLACE FUNCTION public.event_has_active_promo_codes(_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.promo_codes
    WHERE event_id = _event_id AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.event_has_active_promo_codes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_has_active_promo_codes(uuid) TO anon, authenticated;

-- 2) EVENTS: hide results_api_key from public column reads
REVOKE SELECT (results_api_key) ON public.events FROM anon, authenticated;

-- 3) PROMO CODES: restrict read to managers + users who already redeemed
DROP POLICY IF EXISTS "Anyone authenticated views active promo codes" ON public.promo_codes;

CREATE POLICY "Managers view event promo codes (read)"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (public.can_manage_event(event_id, auth.uid()));

CREATE POLICY "Redeemers view their used promo code"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.promo_code_redemptions pr
    JOIN public.registrations reg ON reg.id = pr.registration_id
    WHERE pr.promo_code_id = promo_codes.id
      AND reg.user_id = auth.uid()
  )
);

-- 4) REALTIME: remove user_roles from publication so role assignments are not broadcast
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;

-- Admin-accessible function returning unsubscribe data
CREATE OR REPLACE FUNCTION public.get_unsubscribe_stats()
RETURNS TABLE(
  email text,
  reason text,
  unsubscribed_at timestamptz,
  full_name text,
  city text,
  has_profile boolean,
  marketing_consent boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    se.email,
    se.reason,
    se.created_at AS unsubscribed_at,
    p.full_name,
    p.city,
    (p.id IS NOT NULL) AS has_profile,
    COALESCE(p.marketing_consent, false) AS marketing_consent
  FROM public.suppressed_emails se
  LEFT JOIN public.profiles p ON lower(p.email) = lower(se.email)
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role)

  UNION

  -- Profiles who toggled off consent without going through the suppress flow
  SELECT
    p.email,
    'profile_opt_out'::text AS reason,
    p.updated_at AS unsubscribed_at,
    p.full_name,
    p.city,
    true AS has_profile,
    false AS marketing_consent
  FROM public.profiles p
  WHERE p.marketing_consent = false
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
    AND NOT EXISTS (
      SELECT 1 FROM public.suppressed_emails se2
      WHERE lower(se2.email) = lower(p.email)
    )
  ORDER BY unsubscribed_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_unsubscribe_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_unsubscribe_summary()
RETURNS TABLE(
  total_subscribed integer,
  total_unsubscribed integer,
  total_suppressed integer,
  unsubscribed_last_7d integer,
  unsubscribed_last_30d integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::int FROM public.profiles WHERE marketing_consent = true),
    (SELECT COUNT(*)::int FROM public.profiles WHERE marketing_consent = false),
    (SELECT COUNT(*)::int FROM public.suppressed_emails),
    (SELECT COUNT(*)::int FROM public.suppressed_emails WHERE created_at >= now() - interval '7 days'),
    (SELECT COUNT(*)::int FROM public.suppressed_emails WHERE created_at >= now() - interval '30 days')
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

GRANT EXECUTE ON FUNCTION public.get_unsubscribe_summary() TO authenticated;
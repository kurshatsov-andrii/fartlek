
-- User session tracking for admin audit
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_login_at ON public.user_sessions(login_at DESC);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own session record
CREATE POLICY "Users insert own session"
ON public.user_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own session (to set logout/last_seen)
CREATE POLICY "Users update own session"
ON public.user_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins view all sessions"
ON public.user_sessions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Users can view own sessions
CREATE POLICY "Users view own sessions"
ON public.user_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin function to get sessions joined with profile data
CREATE OR REPLACE FUNCTION public.get_user_sessions_admin(_limit INTEGER DEFAULT 200)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  login_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  logout_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  user_agent TEXT,
  ip_address TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.user_id, p.full_name, p.email, p.phone,
         s.login_at, s.last_seen_at, s.logout_at, s.duration_seconds,
         s.user_agent, s.ip_address
  FROM public.user_sessions s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY s.login_at DESC
  LIMIT _limit;
$$;

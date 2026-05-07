
CREATE TABLE public.strava_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_athlete_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  athlete_firstname TEXT,
  athlete_lastname TEXT,
  athlete_profile TEXT,
  athlete_city TEXT,
  athlete_country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own strava connection"
  ON public.strava_connections FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users insert own strava connection"
  ON public.strava_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own strava connection"
  ON public.strava_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own strava connection"
  ON public.strava_connections FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_strava_connections_updated_at
  BEFORE UPDATE ON public.strava_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

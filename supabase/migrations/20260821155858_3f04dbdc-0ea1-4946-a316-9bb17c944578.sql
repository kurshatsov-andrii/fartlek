CREATE TABLE public.event_external_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  distance_km numeric NOT NULL,
  bib integer,
  full_name text NOT NULL,
  gender text,
  age integer,
  age_group text,
  city text,
  gun_time_seconds integer,
  chip_time_seconds integer,
  overall_rank integer,
  gender_rank integer,
  age_group_rank integer,
  source_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.event_external_results TO anon, authenticated;
GRANT ALL ON public.event_external_results TO service_role;

ALTER TABLE public.event_external_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Results are publicly readable"
ON public.event_external_results
FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX event_external_results_event_idx ON public.event_external_results (event_id, distance_km, overall_rank);
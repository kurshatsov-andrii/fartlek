ALTER TABLE public.survey_responses
  ADD COLUMN IF NOT EXISTS discovery_source text,
  ADD COLUMN IF NOT EXISTS participation_frequency text,
  ADD COLUMN IF NOT EXISTS event_choice_factors text[] NOT NULL DEFAULT '{}'::text[];
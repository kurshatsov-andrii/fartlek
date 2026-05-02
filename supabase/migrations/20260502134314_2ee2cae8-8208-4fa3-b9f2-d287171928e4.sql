
-- Survey responses table
CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  user_role text NULL, -- 'participant' | 'organizer' | 'guest'
  ease_of_use smallint NULL,        -- 1..10
  design_rating smallint NULL,      -- 1..5
  nps_score smallint NULL,          -- 0..10
  easy_to_find_event text NULL,     -- yes/partly/no
  registration_clarity smallint NULL, -- 1..5
  registration_difficulty text NULL,
  missing_features text[] NOT NULL DEFAULT '{}',
  organizer_event_creation smallint NULL, -- 1..5
  organizer_payments_clear text NULL,     -- yes/no/not_used
  organizer_missing_tools text NULL,
  liked_most text NULL,
  would_change text NULL,
  suggestions text NULL,
  contact_email text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can submit a response
CREATE POLICY "Anyone can submit survey response"
  ON public.survey_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read responses
CREATE POLICY "Admins read survey responses"
  ON public.survey_responses
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Only admins can delete
CREATE POLICY "Admins delete survey responses"
  ON public.survey_responses
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_survey_responses_created_at ON public.survey_responses (created_at DESC);

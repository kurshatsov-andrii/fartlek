
CREATE TABLE public.participant_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE,
  city TEXT,
  email TEXT,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  event_title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_location TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_ip TEXT,
  signed_user_agent TEXT,
  consent_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.participant_consents TO authenticated;
GRANT ALL ON public.participant_consents TO service_role;

ALTER TABLE public.participant_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User views own consent"
ON public.participant_consents FOR SELECT TO authenticated
USING (user_id = auth.uid() OR can_manage_event(event_id, auth.uid()));

CREATE POLICY "User creates own consent"
ON public.participant_consents FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "User updates own consent"
ON public.participant_consents FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.tg_participant_consents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_participant_consents_updated_at
BEFORE UPDATE ON public.participant_consents
FOR EACH ROW EXECUTE FUNCTION public.tg_participant_consents_updated_at();

CREATE INDEX idx_participant_consents_event ON public.participant_consents(event_id);
CREATE INDEX idx_participant_consents_user ON public.participant_consents(user_id);

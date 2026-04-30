-- 1. Add marketing consent fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;

-- 2. Backfill existing users
UPDATE public.profiles
SET marketing_consent_at = now()
WHERE marketing_consent_at IS NULL;

-- 3. Update handle_new_user to read marketing_consent from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  consent boolean;
BEGIN
  consent := COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, true);

  INSERT INTO public.profiles (id, email, full_name, marketing_consent, marketing_consent_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    consent,
    CASE WHEN consent THEN now() ELSE NULL END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'participant'));

  RETURN NEW;
END;
$function$;

-- 4. Marketing campaigns table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL,
  intro_text text,
  event_ids uuid[] NOT NULL DEFAULT '{}',
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage marketing campaigns"
ON public.marketing_campaigns
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_marketing_campaigns_updated_at
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent ON public.profiles(marketing_consent) WHERE marketing_consent = true;
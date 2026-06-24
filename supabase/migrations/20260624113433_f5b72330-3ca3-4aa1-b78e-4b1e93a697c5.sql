
-- Disposable email domains blocklist
CREATE TABLE IF NOT EXISTS public.disposable_email_domains (
  domain text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.disposable_email_domains TO authenticated, anon;
GRANT ALL ON public.disposable_email_domains TO service_role;

ALTER TABLE public.disposable_email_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read disposable domains"
  ON public.disposable_email_domains FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify disposable domains"
  ON public.disposable_email_domains FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed with common disposable / temp-mail domains (including luxudata.com that was abused)
INSERT INTO public.disposable_email_domains (domain) VALUES
  ('luxudata.com'),
  ('mailinator.com'),
  ('guerrillamail.com'),
  ('guerrillamail.net'),
  ('guerrillamail.org'),
  ('sharklasers.com'),
  ('grr.la'),
  ('10minutemail.com'),
  ('10minutemail.net'),
  ('tempmail.com'),
  ('temp-mail.org'),
  ('temp-mail.io'),
  ('tempmailo.com'),
  ('tmpmail.org'),
  ('tmpmail.net'),
  ('throwawaymail.com'),
  ('yopmail.com'),
  ('yopmail.fr'),
  ('yopmail.net'),
  ('getnada.com'),
  ('nada.email'),
  ('maildrop.cc'),
  ('mailnesia.com'),
  ('dispostable.com'),
  ('trashmail.com'),
  ('trashmail.net'),
  ('mintemail.com'),
  ('mohmal.com'),
  ('spambox.us'),
  ('spam4.me'),
  ('mytemp.email'),
  ('emailondeck.com'),
  ('fakeinbox.com'),
  ('fakemailgenerator.com'),
  ('mailcatch.com'),
  ('mailtemp.info'),
  ('mailpoof.com'),
  ('mail-temp.com'),
  ('moakt.com'),
  ('mail7.io'),
  ('mailbox.in.ua'),
  ('inboxbear.com'),
  ('inboxkitten.com'),
  ('disposablemail.com'),
  ('mailtothis.com'),
  ('emltmp.com'),
  ('snapmail.cc'),
  ('byom.de'),
  ('jetable.org'),
  ('mvrht.net'),
  ('33mail.com'),
  ('anonbox.net'),
  ('mailforspam.com'),
  ('mailnull.com'),
  ('spamgourmet.com'),
  ('tempinbox.com'),
  ('mailtemp.net'),
  ('emailtemporanea.net'),
  ('mailcuk.com'),
  ('cock.li'),
  ('hi2.in'),
  ('mailbox.org.tmp'),
  ('mail.tm'),
  ('linshiyou.com'),
  ('1secmail.com'),
  ('1secmail.net'),
  ('1secmail.org'),
  ('emkei.cz'),
  ('burnermail.io')
ON CONFLICT (domain) DO NOTHING;

-- Update handle_new_user to block disposable email signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  consent boolean;
  email_domain text;
BEGIN
  -- Block disposable / temporary email providers
  IF NEW.email IS NOT NULL THEN
    email_domain := lower(split_part(NEW.email, '@', 2));
    IF email_domain IS NOT NULL AND email_domain <> '' THEN
      IF EXISTS (SELECT 1 FROM public.disposable_email_domains WHERE domain = email_domain) THEN
        RAISE EXCEPTION 'DISPOSABLE_EMAIL_NOT_ALLOWED' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;

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

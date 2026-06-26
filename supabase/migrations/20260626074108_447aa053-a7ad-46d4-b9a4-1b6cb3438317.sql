
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  consent boolean;
  email_domain text;
  provider text;
  captcha_ok boolean;
BEGIN
  IF NEW.email IS NOT NULL THEN
    email_domain := lower(split_part(NEW.email, '@', 2));
    IF email_domain IS NOT NULL AND email_domain <> '' THEN
      IF EXISTS (SELECT 1 FROM public.disposable_email_domains WHERE domain = email_domain) THEN
        RAISE EXCEPTION 'DISPOSABLE_EMAIL_NOT_ALLOWED' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;

  -- Determine provider; OAuth users (google/apple/etc) skip captcha requirement
  provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  captcha_ok := COALESCE((NEW.raw_app_meta_data->>'captcha_verified')::boolean, false);

  IF provider = 'email' AND NOT captcha_ok THEN
    RAISE EXCEPTION 'CAPTCHA_REQUIRED' USING ERRCODE = 'check_violation';
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  consent boolean; email_domain text; provider text; captcha_ok boolean; req_role text; final_role app_role;
BEGIN
  IF NEW.email IS NOT NULL THEN
    email_domain := lower(split_part(NEW.email, '@', 2));
    IF email_domain IS NOT NULL AND email_domain <> '' THEN
      IF EXISTS (SELECT 1 FROM public.disposable_email_domains WHERE domain = email_domain) THEN
        RAISE EXCEPTION 'DISPOSABLE_EMAIL_NOT_ALLOWED' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  captcha_ok := COALESCE((NEW.raw_app_meta_data->>'captcha_verified')::boolean, false)
             OR COALESCE((NEW.raw_user_meta_data->>'captcha_verified')::boolean, false);
  IF provider = 'email' AND NOT captcha_ok THEN
    RAISE EXCEPTION 'CAPTCHA_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;
  consent := COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, true);
  INSERT INTO public.profiles (id, email, full_name, marketing_consent, marketing_consent_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), consent,
          CASE WHEN consent THEN now() ELSE NULL END);
  req_role := NEW.raw_user_meta_data->>'role';
  final_role := CASE WHEN req_role = 'organizer' THEN 'organizer'::app_role ELSE 'participant'::app_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, final_role);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_chat_authors(_user_ids uuid[])
 RETURNS TABLE(id uuid, full_name text, email text, avatar_url text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT p.id, p.full_name,
    CASE WHEN p.id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.email ELSE NULL END,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(_user_ids);
$function$;
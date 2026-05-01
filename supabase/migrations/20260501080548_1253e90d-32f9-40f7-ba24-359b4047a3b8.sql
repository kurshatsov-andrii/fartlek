
DROP POLICY IF EXISTS "Public reads avatar from profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_chat_authors(_user_ids uuid[])
RETURNS TABLE(id uuid, full_name text, email text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(_user_ids);
$$;

REVOKE ALL ON FUNCTION public.get_chat_authors(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_authors(uuid[]) TO anon, authenticated;

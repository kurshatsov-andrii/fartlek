CREATE TABLE public.start_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL CHECK (source IN ('event','start','calendar')),
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, target_id)
);
GRANT SELECT, INSERT, DELETE ON public.start_likes TO authenticated;
GRANT ALL ON public.start_likes TO service_role;
ALTER TABLE public.start_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own likes" ON public.start_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own likes" ON public.start_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own likes" ON public.start_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER validate_start_like_target BEFORE INSERT ON public.start_likes FOR EACH ROW EXECUTE FUNCTION public.validate_saved_start_target();
CREATE FUNCTION public.get_start_like_counts(_source text, _ids uuid[])
RETURNS TABLE(target_id uuid, likes bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.target_id, count(*) FROM public.start_likes l
  WHERE l.source = _source AND l.target_id = ANY(_ids) GROUP BY l.target_id
$$;
GRANT EXECUTE ON FUNCTION public.get_start_like_counts(text, uuid[]) TO anon, authenticated;
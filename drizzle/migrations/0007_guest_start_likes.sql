CREATE TABLE public.guest_start_likes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 visitor_token uuid NOT NULL,
 source text NOT NULL CHECK (source IN ('event','start','calendar')),
 target_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(visitor_token, source, target_id)
);
GRANT ALL ON public.guest_start_likes TO service_role;
ALTER TABLE public.guest_start_likes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER validate_guest_like_target BEFORE INSERT ON public.guest_start_likes FOR EACH ROW EXECUTE FUNCTION public.validate_saved_start_target();
CREATE FUNCTION public.get_guest_start_like(_token uuid, _source text, _id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS(SELECT 1 FROM public.guest_start_likes WHERE visitor_token=_token AND source=_source AND target_id=_id)
$$;
REVOKE ALL ON FUNCTION public.get_guest_start_like(uuid,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_start_like(uuid,text,uuid) TO anon,authenticated;
CREATE FUNCTION public.set_guest_start_like(_token uuid, _source text, _id uuid, _liked boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF _token IS NULL OR _id IS NULL OR _source IS NULL OR _source NOT IN ('event','start','calendar') OR _liked IS NULL THEN RAISE EXCEPTION 'Invalid like'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_token::text,0));
 IF _liked THEN
   IF (SELECT count(*) FROM public.guest_start_likes WHERE visitor_token=_token) >= 300 AND NOT EXISTS(SELECT 1 FROM public.guest_start_likes WHERE visitor_token=_token AND source=_source AND target_id=_id) THEN RAISE EXCEPTION 'Like limit reached'; END IF;
   INSERT INTO public.guest_start_likes(visitor_token,source,target_id) VALUES(_token,_source,_id) ON CONFLICT(visitor_token,source,target_id) DO NOTHING;
 ELSE
   DELETE FROM public.guest_start_likes WHERE visitor_token=_token AND source=_source AND target_id=_id;
 END IF;
 RETURN _liked;
END;
$$;
REVOKE ALL ON FUNCTION public.set_guest_start_like(uuid,text,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_guest_start_like(uuid,text,uuid,boolean) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.get_start_like_counts(_source text, _ids uuid[])
RETURNS TABLE(target_id uuid, likes bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT l.target_id,count(*) FROM (
 SELECT target_id FROM public.start_likes WHERE source=_source AND target_id=ANY(_ids)
 UNION ALL
 SELECT target_id FROM public.guest_start_likes WHERE source=_source AND target_id=ANY(_ids)
 ) l GROUP BY l.target_id
$$;
GRANT EXECUTE ON FUNCTION public.get_start_like_counts(text,uuid[]) TO anon,authenticated;
CREATE TABLE public.saved_start_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL CHECK (source IN ('event','start','calendar')),
  target_id uuid NOT NULL,
  reminder_days integer CHECK (reminder_days IN (1,3,7)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source, target_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_start_items TO authenticated;
GRANT ALL ON public.saved_start_items TO service_role;
ALTER TABLE public.saved_start_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own saved starts" ON public.saved_start_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users save own starts" ON public.saved_start_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own reminders" ON public.saved_start_items FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove own saved starts" ON public.saved_start_items FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX saved_start_items_user_idx ON public.saved_start_items(user_id);
CREATE FUNCTION public.validate_saved_start_target() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.source = 'event' AND NOT EXISTS(SELECT 1 FROM public.events WHERE id=NEW.target_id AND status IN ('published','completed')) THEN RAISE EXCEPTION 'Start unavailable'; END IF;
 IF NEW.source = 'start' AND NOT EXISTS(SELECT 1 FROM public.telegram_starts WHERE id=NEW.target_id AND status='published') THEN RAISE EXCEPTION 'Start unavailable'; END IF;
 IF NEW.source = 'calendar' AND NOT EXISTS(SELECT 1 FROM public.calendar_events WHERE id=NEW.target_id) THEN RAISE EXCEPTION 'Start unavailable'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_saved_start_target BEFORE INSERT OR UPDATE OF source,target_id ON public.saved_start_items FOR EACH ROW EXECUTE FUNCTION public.validate_saved_start_target();
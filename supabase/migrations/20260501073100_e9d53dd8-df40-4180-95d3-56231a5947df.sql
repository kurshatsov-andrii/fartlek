-- Track last-read timestamp per (user, event) for chat
CREATE TABLE public.event_chat_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

CREATE INDEX idx_event_chat_reads_user ON public.event_chat_reads(user_id);
CREATE INDEX idx_event_chat_reads_event ON public.event_chat_reads(event_id);

ALTER TABLE public.event_chat_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat reads"
ON public.event_chat_reads FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_event_chat_reads_updated_at
BEFORE UPDATE ON public.event_chat_reads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to get unread counts for events the user manages (organizer/co-organizer/admin)
CREATE OR REPLACE FUNCTION public.get_managed_events_unread_chat()
RETURNS TABLE(event_id uuid, unread_count integer, last_message_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH managed AS (
    SELECT e.id
    FROM public.events e
    WHERE auth.uid() IS NOT NULL
      AND (
        e.organizer_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_event_co_organizer(e.id, auth.uid())
      )
  )
  SELECT
    m.id AS event_id,
    COUNT(c.id) FILTER (
      WHERE c.deleted_at IS NULL
        AND c.user_id <> auth.uid()
        AND c.created_at > COALESCE(r.last_read_at, 'epoch'::timestamptz)
    )::int AS unread_count,
    MAX(c.created_at) FILTER (WHERE c.deleted_at IS NULL) AS last_message_at
  FROM managed m
  LEFT JOIN public.event_chat_messages c ON c.event_id = m.id
  LEFT JOIN public.event_chat_reads r ON r.event_id = m.id AND r.user_id = auth.uid()
  GROUP BY m.id, r.last_read_at;
$$;
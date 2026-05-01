-- Event chat messages
CREATE TABLE public.event_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_pinned boolean NOT NULL DEFAULT false,
  pinned_at timestamptz,
  pinned_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_chat_messages_event ON public.event_chat_messages(event_id, created_at DESC);
CREATE INDEX idx_event_chat_messages_pinned ON public.event_chat_messages(event_id) WHERE is_pinned = true AND deleted_at IS NULL;

ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;

-- Public read (anyone, including guests)
CREATE POLICY "Anyone reads chat of visible events"
ON public.event_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_chat_messages.event_id
      AND (e.status IN ('published'::event_status, 'completed'::event_status)
           OR e.organizer_id = auth.uid()
           OR public.has_role(auth.uid(), 'admin'::app_role)
           OR public.is_event_co_organizer(e.id, auth.uid()))
  )
);

-- Authenticated users can post
CREATE POLICY "Authenticated users post chat messages"
ON public.event_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_chat_messages.event_id
      AND e.status IN ('published'::event_status, 'completed'::event_status)
  )
);

-- Author can edit own message (within 15 min) OR organizer/admin can update (pin/unpin/delete)
CREATE POLICY "Author or manager updates chat messages"
ON public.event_chat_messages FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_manage_event(event_id, auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  OR public.can_manage_event(event_id, auth.uid())
);

-- Author or manager deletes
CREATE POLICY "Author or manager deletes chat messages"
ON public.event_chat_messages FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_manage_event(event_id, auth.uid())
);

-- Auto update updated_at
CREATE TRIGGER trg_event_chat_messages_updated_at
BEFORE UPDATE ON public.event_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Realtime
ALTER TABLE public.event_chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_chat_messages;
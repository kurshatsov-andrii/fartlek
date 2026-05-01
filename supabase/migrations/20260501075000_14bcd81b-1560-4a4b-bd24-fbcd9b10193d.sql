-- Add reply support to chat messages
ALTER TABLE public.event_chat_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.event_chat_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_chat_messages_reply_to ON public.event_chat_messages(reply_to_id);

-- Reactions table
CREATE TABLE IF NOT EXISTS public.event_chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.event_chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_event_chat_reactions_message ON public.event_chat_reactions(message_id);

ALTER TABLE public.event_chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads chat reactions of visible events"
ON public.event_chat_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_chat_messages m
    JOIN public.events e ON e.id = m.event_id
    WHERE m.id = event_chat_reactions.message_id
      AND (
        e.status = ANY (ARRAY['published'::public.event_status, 'completed'::public.event_status])
        OR e.organizer_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_event_co_organizer(e.id, auth.uid())
      )
  )
);

CREATE POLICY "Authenticated users add own reactions"
ON public.event_chat_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.event_chat_messages m
    JOIN public.events e ON e.id = m.event_id
    WHERE m.id = event_chat_reactions.message_id
      AND e.status = ANY (ARRAY['published'::public.event_status, 'completed'::public.event_status])
  )
);

CREATE POLICY "Users remove own reactions"
ON public.event_chat_reactions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_chat_reactions;
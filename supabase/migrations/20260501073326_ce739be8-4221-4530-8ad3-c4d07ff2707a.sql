ALTER TABLE public.event_chat_messages
ADD COLUMN IF NOT EXISTS edited_at timestamptz;
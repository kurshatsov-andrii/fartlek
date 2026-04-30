-- Create event_format enum
CREATE TYPE public.event_format AS ENUM ('offline', 'online', 'hybrid');

-- Add format column to events with default 'offline'
ALTER TABLE public.events
ADD COLUMN format public.event_format NOT NULL DEFAULT 'offline';
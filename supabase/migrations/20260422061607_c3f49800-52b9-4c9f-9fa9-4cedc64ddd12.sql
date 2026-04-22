
CREATE TYPE public.event_category AS ENUM ('run', 'half_marathon', 'marathon', 'ultra', 'trail', 'ocr', 'online');

ALTER TABLE public.events
ADD COLUMN category public.event_category NOT NULL DEFAULT 'run';

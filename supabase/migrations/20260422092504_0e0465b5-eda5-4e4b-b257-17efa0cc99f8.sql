-- Add results PDF URL to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS results_pdf_url text;

-- Public bucket for results PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-results', 'event-results', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event-results bucket
CREATE POLICY "Anyone can view event results"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-results');

CREATE POLICY "Organizers upload own event results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-results'
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = (storage.foldername(name))[1]
      AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);

CREATE POLICY "Organizers update own event results"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-results'
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = (storage.foldername(name))[1]
      AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);

CREATE POLICY "Organizers delete own event results"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-results'
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = (storage.foldername(name))[1]
      AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);
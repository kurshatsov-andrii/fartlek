
CREATE TABLE public.event_gpx_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  distance_id uuid REFERENCES public.distances(id) ON DELETE SET NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  storage_path text NOT NULL,
  file_size integer,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_gpx_tracks_event ON public.event_gpx_tracks(event_id);

ALTER TABLE public.event_gpx_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "GPX tracks are viewable by everyone for published events"
ON public.event_gpx_tracks FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.status IN ('published'::public.event_status, 'completed'::public.event_status))
  OR public.can_manage_event(event_id, auth.uid())
);

CREATE POLICY "Managers can insert GPX tracks"
ON public.event_gpx_tracks FOR INSERT
WITH CHECK (public.can_manage_event(event_id, auth.uid()));

CREATE POLICY "Managers can update GPX tracks"
ON public.event_gpx_tracks FOR UPDATE
USING (public.can_manage_event(event_id, auth.uid()));

CREATE POLICY "Managers can delete GPX tracks"
ON public.event_gpx_tracks FOR DELETE
USING (public.can_manage_event(event_id, auth.uid()));

CREATE TRIGGER set_event_gpx_tracks_updated_at
BEFORE UPDATE ON public.event_gpx_tracks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gpx', 'event-gpx', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "GPX files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-gpx');

CREATE POLICY "Event managers can upload GPX files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-gpx'
  AND auth.uid() IS NOT NULL
  AND public.can_manage_event(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Event managers can update GPX files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-gpx'
  AND auth.uid() IS NOT NULL
  AND public.can_manage_event(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Event managers can delete GPX files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-gpx'
  AND auth.uid() IS NOT NULL
  AND public.can_manage_event(((storage.foldername(name))[1])::uuid, auth.uid())
);

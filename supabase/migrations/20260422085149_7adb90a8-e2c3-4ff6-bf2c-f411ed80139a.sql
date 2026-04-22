ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS receipt_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_revoked_reason text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own receipts" ON storage.objects;
CREATE POLICY "Users upload own receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users view own receipts" ON storage.objects;
CREATE POLICY "Users view own receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own receipts" ON storage.objects;
CREATE POLICY "Users update own receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own receipts" ON storage.objects;
CREATE POLICY "Users delete own receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Organizers view event receipts" ON storage.objects;
CREATE POLICY "Organizers view event receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND EXISTS (
    SELECT 1 FROM public.registrations r
    JOIN public.events e ON e.id = r.event_id
    WHERE r.user_id::text = (storage.foldername(name))[1]
      AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
      AND position(r.id::text in name) > 0
  )
);

CREATE OR REPLACE FUNCTION public.handle_receipt_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.receipt_url IS NOT NULL
     AND (OLD.receipt_url IS NULL OR OLD.receipt_url <> NEW.receipt_url) THEN
    NEW.receipt_uploaded_at := now();
    NEW.receipt_confirmed_at := NULL;
    NEW.receipt_revoked_reason := NULL;
    IF NEW.payment_status = 'pending' THEN
      NEW.payment_status := 'paid';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_receipt_upload ON public.registrations;
CREATE TRIGGER trg_handle_receipt_upload
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.handle_receipt_upload();

DROP FUNCTION IF EXISTS public.get_event_participants(uuid);

CREATE OR REPLACE FUNCTION public.get_event_participants(_event_id uuid)
 RETURNS TABLE(
   registration_id uuid,
   user_id uuid,
   bib_number integer,
   full_name text,
   gender gender_type,
   birth_year integer,
   city text,
   club text,
   distance_km numeric,
   distance_name text,
   payment_status payment_status_type,
   receipt_url text,
   receipt_uploaded_at timestamptz,
   receipt_confirmed_at timestamptz
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    r.id, r.user_id, r.bib_number,
    p.full_name, p.gender,
    EXTRACT(YEAR FROM p.birth_date)::integer,
    p.city, p.club,
    d.distance_km, d.name,
    r.payment_status, r.receipt_url, r.receipt_uploaded_at, r.receipt_confirmed_at
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  LEFT JOIN public.profiles p ON p.id = r.user_id
  LEFT JOIN public.distances d ON d.id = r.distance_id
  WHERE r.event_id = _event_id
    AND auth.uid() IS NOT NULL
    AND (
      e.status = 'published'::public.event_status
      OR e.organizer_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.registrations vr
        WHERE vr.event_id = _event_id AND vr.user_id = auth.uid()
      )
    )
  ORDER BY r.bib_number ASC NULLS LAST, r.created_at ASC;
$$;
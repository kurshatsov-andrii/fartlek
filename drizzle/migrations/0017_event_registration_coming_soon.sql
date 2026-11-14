ALTER TABLE public.events ADD COLUMN registration_status text;
ALTER TABLE public.events ADD CONSTRAINT events_registration_status_check CHECK (registration_status IS NULL OR registration_status = 'expected');
COMMENT ON COLUMN public.events.registration_status IS 'Optional expected registration announcement; a reached registration_opens_on date opens registration automatically.';
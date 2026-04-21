
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('participant', 'organizer', 'admin');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE public.payment_status_type AS ENUM ('pending', 'paid', 'failed', 'refunded', 'free');
CREATE TYPE public.payment_provider_type AS ENUM ('liqpay', 'stripe', 'free');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  birth_date DATE,
  gender gender_type,
  city TEXT,
  club TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES (separate table — critical for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER FUNCTION
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  organizer_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location TEXT,
  image_url TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  status event_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_date ON public.events(event_date);

-- DISTANCES
CREATE TABLE public.distances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  distance_km NUMERIC(6,2) NOT NULL,
  name TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_participants INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.distances ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_distances_event ON public.distances(event_id);

-- REGISTRATIONS
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  distance_id UUID NOT NULL REFERENCES public.distances(id) ON DELETE RESTRICT,
  bib_number INTEGER,
  payment_status payment_status_type NOT NULL DEFAULT 'pending',
  qr_code_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_registrations_event ON public.registrations(event_id);
CREATE INDEX idx_registrations_user ON public.registrations(user_id);

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UAH',
  status payment_status_type NOT NULL DEFAULT 'pending',
  provider payment_provider_type NOT NULL DEFAULT 'liqpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payments_registration ON public.payments(registration_id);

-- TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_registrations_updated BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- AUTO-CREATE PROFILE & DEFAULT ROLE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'participant'));
  
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================== RLS POLICIES ======================

-- PROFILES
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Organizers view profiles of their event participants" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.registrations r JOIN public.events e ON e.id = r.event_id WHERE r.user_id = profiles.id AND e.organizer_id = auth.uid())
);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- USER_ROLES
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- EVENTS
CREATE POLICY "Anyone views published events" ON public.events FOR SELECT USING (status = 'published' OR auth.uid() = organizer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Organizers create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id AND (public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Organizers update own events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = organizer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Organizers delete own events" ON public.events FOR DELETE TO authenticated USING (auth.uid() = organizer_id OR public.has_role(auth.uid(), 'admin'));

-- DISTANCES
CREATE POLICY "Anyone views distances of visible events" ON public.distances FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = distances.event_id AND (e.status = 'published' OR e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Organizers manage own distances" ON public.distances FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = distances.event_id AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = distances.event_id AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- REGISTRATIONS
CREATE POLICY "Users view own registrations" ON public.registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users view event participants" ON public.registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own registrations" ON public.registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own registrations" ON public.registrations FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Organizers update event registrations" ON public.registrations FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = registrations.event_id AND e.organizer_id = auth.uid())
);
CREATE POLICY "Users delete own registrations" ON public.registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PAYMENTS
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System updates payments" ON public.payments FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- STORAGE BUCKET FOR EVENT IMAGES
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

CREATE POLICY "Anyone views event images" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Authenticated users upload event images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-images');
CREATE POLICY "Users update own event images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own event images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

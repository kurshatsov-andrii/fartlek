-- Promo codes feature
CREATE TYPE public.promo_discount_type AS ENUM ('percent', 'fixed');

CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  code text NOT NULL,
  discount_type public.promo_discount_type NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  distance_ids uuid[] NOT NULL DEFAULT '{}'::uuid[], -- empty = all distances
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX promo_codes_event_code_uniq ON public.promo_codes (event_id, lower(code));
CREATE INDEX promo_codes_event_idx ON public.promo_codes(event_id);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active codes (needed to validate at registration time)
CREATE POLICY "Anyone authenticated views active promo codes"
ON public.promo_codes FOR SELECT
TO authenticated
USING (
  is_active = true
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Organizers manage own event promo codes"
ON public.promo_codes FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role)))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role)))
);

CREATE TRIGGER promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Track redemptions to enforce one-per-user
CREATE TABLE public.promo_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  discount_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promo_code_id, user_id),
  UNIQUE (registration_id)
);

CREATE INDEX promo_redemptions_event_idx ON public.promo_code_redemptions(event_id);

ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own redemptions"
ON public.promo_code_redemptions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Users create own redemptions"
ON public.promo_code_redemptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Validation + apply function (runs as security definer to safely increment uses_count)
CREATE OR REPLACE FUNCTION public.apply_promo_code(
  _code text,
  _event_id uuid,
  _distance_id uuid,
  _registration_id uuid,
  _base_price numeric
) RETURNS TABLE(
  promo_id uuid,
  discount_amount numeric,
  final_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pc public.promo_codes%ROWTYPE;
  d numeric := 0;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO pc FROM public.promo_codes
   WHERE event_id = _event_id AND lower(code) = lower(_code) AND is_active = true
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROMO_INVALID';
  END IF;

  IF pc.valid_until IS NOT NULL AND pc.valid_until < now() THEN
    RAISE EXCEPTION 'PROMO_EXPIRED';
  END IF;

  IF pc.max_uses IS NOT NULL AND pc.uses_count >= pc.max_uses THEN
    RAISE EXCEPTION 'PROMO_LIMIT_REACHED';
  END IF;

  IF array_length(pc.distance_ids, 1) IS NOT NULL AND NOT (_distance_id = ANY(pc.distance_ids)) THEN
    RAISE EXCEPTION 'PROMO_DISTANCE_NOT_ALLOWED';
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_code_redemptions WHERE promo_code_id = pc.id AND user_id = uid) THEN
    RAISE EXCEPTION 'PROMO_ALREADY_USED';
  END IF;

  IF pc.discount_type = 'percent' THEN
    d := round(_base_price * (pc.discount_value / 100.0), 2);
  ELSE
    d := pc.discount_value;
  END IF;
  IF d > _base_price THEN d := _base_price; END IF;

  INSERT INTO public.promo_code_redemptions (promo_code_id, registration_id, user_id, event_id, discount_amount)
  VALUES (pc.id, _registration_id, uid, _event_id, d);

  UPDATE public.promo_codes SET uses_count = uses_count + 1 WHERE id = pc.id;

  RETURN QUERY SELECT pc.id, d, GREATEST(_base_price - d, 0);
END;
$$;

-- Read-only validation (no side effects) for live preview during checkout
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  _code text,
  _event_id uuid,
  _distance_id uuid,
  _base_price numeric
) RETURNS TABLE(
  promo_id uuid,
  discount_amount numeric,
  final_price numeric,
  error_code text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pc public.promo_codes%ROWTYPE;
  d numeric := 0;
  uid uuid := auth.uid();
BEGIN
  SELECT * INTO pc FROM public.promo_codes
   WHERE event_id = _event_id AND lower(code) = lower(_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, _base_price, 'PROMO_INVALID'::text; RETURN;
  END IF;
  IF pc.valid_until IS NOT NULL AND pc.valid_until < now() THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, _base_price, 'PROMO_EXPIRED'::text; RETURN;
  END IF;
  IF pc.max_uses IS NOT NULL AND pc.uses_count >= pc.max_uses THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, _base_price, 'PROMO_LIMIT_REACHED'::text; RETURN;
  END IF;
  IF array_length(pc.distance_ids, 1) IS NOT NULL AND NOT (_distance_id = ANY(pc.distance_ids)) THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, _base_price, 'PROMO_DISTANCE_NOT_ALLOWED'::text; RETURN;
  END IF;
  IF uid IS NOT NULL AND EXISTS (SELECT 1 FROM public.promo_code_redemptions WHERE promo_code_id = pc.id AND user_id = uid) THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, _base_price, 'PROMO_ALREADY_USED'::text; RETURN;
  END IF;

  IF pc.discount_type = 'percent' THEN
    d := round(_base_price * (pc.discount_value / 100.0), 2);
  ELSE
    d := pc.discount_value;
  END IF;
  IF d > _base_price THEN d := _base_price; END IF;

  RETURN QUERY SELECT pc.id, d, GREATEST(_base_price - d, 0), NULL::text;
END;
$$;
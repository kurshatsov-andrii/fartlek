CREATE TABLE public.testimonial_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimonial_id uuid NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (testimonial_id, user_id, emoji)
);

CREATE INDEX idx_testimonial_reactions_testimonial ON public.testimonial_reactions(testimonial_id);

ALTER TABLE public.testimonial_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view testimonial reactions"
ON public.testimonial_reactions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users add own reactions"
ON public.testimonial_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own reactions"
ON public.testimonial_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
-- Allow admins to delete profiles (cascade-like cleanup will be handled in edge function for auth.users)
CREATE POLICY "Admins delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
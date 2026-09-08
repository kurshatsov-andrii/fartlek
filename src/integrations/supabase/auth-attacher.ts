/**
 * Function middleware that forwards the current Supabase session's access
 * token to TanStack server functions as an Authorization header — the same
 * behaviour supabase.functions.invoke() had on the old stack.
 */
import { createMiddleware } from "@tanstack/react-start";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    if (typeof window !== "undefined") {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token;
      } catch {
        token = undefined;
      }
    }
    if (token) {
      return next({ headers: { Authorization: `Bearer ${token}` } });
    }
    return next();
  },
);

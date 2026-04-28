import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Routes the user is allowed to visit even with an incomplete profile.
const ALLOWED_PATHS = [
  "/auth",
  "/reset-password",
  "/profile",
  "/unsubscribe",
  "/payment/success",
  "/payment/fail",
];

const PHONE_RE = /^\+38 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

const isAllowedPath = (pathname: string) =>
  ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

export const ProfileCompletionGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (isAllowedPath(location.pathname)) return;
    if (checking) return;

    setChecking(true);
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name,birth_date,gender,city,phone")
        .eq("id", user.id)
        .maybeSingle();

      const complete =
        !!data &&
        !!data.full_name?.trim() &&
        !!data.birth_date &&
        !!data.gender &&
        !!data.city?.trim() &&
        !!data.phone &&
        PHONE_RE.test(data.phone);

      if (!complete) {
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/profile?redirect=${redirect}`, { replace: true });
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, location.pathname]);

  return null;
};

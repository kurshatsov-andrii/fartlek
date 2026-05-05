import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const STORAGE_KEY = "fe.session_id";

export const useSessionTracker = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const lastSeenIntervalRef = useRef<number | null>(null);
  const startedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      // user signed out — close session if we have one
      const sid = sessionIdRef.current || localStorage.getItem(STORAGE_KEY);
      if (sid && startedAtRef.current) {
        const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
        supabase
          .from("user_sessions")
          .update({
            logout_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            duration_seconds: duration,
          })
          .eq("id", sid)
          .then(() => {});
        localStorage.removeItem(STORAGE_KEY);
      }
      sessionIdRef.current = null;
      startedAtRef.current = null;
      startedForUserRef.current = null;
      if (lastSeenIntervalRef.current) {
        window.clearInterval(lastSeenIntervalRef.current);
        lastSeenIntervalRef.current = null;
      }
      return;
    }

    // Avoid double-creating per user
    if (startedForUserRef.current === user.id) return;
    startedForUserRef.current = user.id;

    const startedAt = Date.now();
    startedAtRef.current = startedAt;

    (async () => {
      const { data, error } = await supabase
        .from("user_sessions")
        .insert({
          user_id: user.id,
          user_agent: navigator.userAgent,
        })
        .select("id")
        .single();
      if (!error && data) {
        sessionIdRef.current = data.id;
        localStorage.setItem(STORAGE_KEY, data.id);
      }
    })();

    // Update last_seen_at every 30s
    lastSeenIntervalRef.current = window.setInterval(() => {
      const sid = sessionIdRef.current;
      if (!sid || !startedAtRef.current) return;
      const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
      supabase
        .from("user_sessions")
        .update({
          last_seen_at: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq("id", sid)
        .then(() => {});
    }, 30000);

    const handleUnload = () => {
      const sid = sessionIdRef.current;
      if (!sid || !startedAtRef.current) return;
      const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
      // Best-effort: fire-and-forget
      supabase
        .from("user_sessions")
        .update({
          logout_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq("id", sid)
        .then(() => {});
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (lastSeenIntervalRef.current) {
        window.clearInterval(lastSeenIntervalRef.current);
        lastSeenIntervalRef.current = null;
      }
    };
  }, [user]);
};

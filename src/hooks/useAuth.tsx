import { useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type AppRole } from "./auth-context";

export type { AppRole } from "./auth-context";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const activeUserId = useRef<string | null | undefined>(undefined);
  const roleRequest = useRef(0);

  const fetchRoles = async (userId: string) => {
    const request = ++roleRequest.current;
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (activeUserId.current !== userId || request !== roleRequest.current) return;
    // A temporary background failure must not unmount an open editor.
    if (!error) setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  useEffect(() => {
    let disposed = false;
    let receivedAuthEvent = false;
    const applySession = (newSession: Session | null) => {
      if (disposed) return;
      const nextUser = newSession?.user ?? null;
      const nextId = nextUser?.id ?? null;
      const identityChanged = activeUserId.current !== nextId;
      activeUserId.current = nextId;
      setSession(newSession);
      // Auth emits SIGNED_IN on returning to a tab, even for the same account.
      // Keep equivalent user objects stable so existing form effects do not reload.
      setUser((current) => JSON.stringify(current) === JSON.stringify(nextUser) ? current : nextUser);
      if (nextUser) {
        if (identityChanged) {
          setRoles([]);
          setLoading(true);
        }
        // Defer queries to avoid an auth callback deadlock; background refresh
        // never re-enters initial loading or unmounts dialogs/forms.
        setTimeout(() => {
          if (disposed || activeUserId.current !== nextId) return;
          fetchRoles(nextUser.id).finally(() => {
            if (!disposed && activeUserId.current === nextId) setLoading(false);
          });
        }, 0);
      } else {
        ++roleRequest.current;
        setRoles([]);
        setLoading(false);
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      receivedAuthEvent = true;
      applySession(newSession);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!receivedAuthEvent) applySession(s);
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, []);

  // Realtime: refresh roles when admin grants/revokes them while user is online
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user-roles-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${user.id}` },
        () => { fetchRoles(user.id); }
      )
      .subscribe();
    // Also refetch when tab regains focus (covers missed events)
    const onFocus = () => fetchRoles(user.id);
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        roles,
        loading,
        signOut,
        isOrganizer: roles.includes("organizer") || roles.includes("admin"),
        isAdmin: roles.includes("admin"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

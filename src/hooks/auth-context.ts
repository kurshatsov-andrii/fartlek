import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "participant" | "organizer" | "admin";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  isOrganizer: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

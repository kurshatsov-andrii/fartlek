import { createContext } from "react";
import type { StartPlannerValue } from "./StartPlannerContext";

// Separate from the provider component so React Refresh preserves its identity.
export const StartPlannerContext = createContext<StartPlannerValue | null>(null);
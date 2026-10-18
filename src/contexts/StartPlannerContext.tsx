import {
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startKey, toggleComparison, type StartRef } from "@/lib/start-planner";
import { toast } from "sonner";
import { StartPlannerContext } from "./start-planner-context";
function usePlannerState() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comparison, setComparison] = useState<StartRef[]>([]);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  useEffect(() => {
    try {
      const value = JSON.parse(
        sessionStorage.getItem("fartlek.compare") ?? "[]",
      );
      if (Array.isArray(value))
        setComparison(
          value
            .filter(
              (r) =>
                ["event", "start", "calendar"].includes(r.source) &&
                typeof r.id === "string",
            )
            .slice(0, 3),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      sessionStorage.setItem("fartlek.compare", JSON.stringify(comparison));
  }, [comparison, ready]);
  const saved = useQuery({
    queryKey: ["saved-starts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_start_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const records = user ? (saved.data ?? []) : [];
  async function toggleSave(ref: StartRef) {
    if (!user) {
      toast.info("Увійдіть, щоб зберегти старт");
      return;
    }
    const key = startKey(ref);
    if (pending.includes(key)) return;
    setPending((p) => [...p, key]);
    try {
      const existing = records.find(
        (r) => r.source === ref.source && r.target_id === ref.id,
      );
      const { error } = existing
        ? await supabase
            .from("saved_start_items")
            .delete()
            .eq("id", existing.id)
        : await supabase
            .from("saved_start_items")
            .insert({
              user_id: user.id,
              source: ref.source,
              target_id: ref.id,
            });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["saved-starts", user.id] });
      toast.success(
        existing ? "Старт видалено зі збережених" : "Старт збережено",
      );
    } catch {
      toast.error("Не вдалося зберегти зміни. Спробуйте ще раз");
    } finally {
      setPending((p) => p.filter((k) => k !== key));
    }
  }
  async function setReminder(id: string, days: number | null) {
    if (!user) return;
    const { error } = await supabase
      .from("saved_start_items")
      .update({ reminder_days: days })
      .eq("id", id);
    if (error) {
      toast.error("Не вдалося змінити нагадування");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["saved-starts", user.id] });
    toast.success(
      days === null ? "Нагадування вимкнено" : "Нагадування увімкнено",
    );
  }
  async function updatePrefs(
    id: string,
    patch: {
      notify_registration?: boolean;
      notify_date_change?: boolean;
      known_date?: string | null;
      known_registration?: string | null;
    },
    message?: string,
  ) {
    if (!user) return;
    const { error } = await supabase
      .from("saved_start_items")
      .update(patch)
      .eq("id", id);
    if (error) {
      toast.error("Не вдалося змінити нагадування");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["saved-starts", user.id] });
    if (message) toast.success(message);
  }
  function compare(ref: StartRef) {
    setComparison((prev) => {
      const next = toggleComparison(prev, ref);
      if (next === prev) toast.info("Можна порівняти до 3 стартів");
      return next;
    });
  }
  return {
    records,
    comparison,
    pending,
    toggleSave,
    setReminder,
    updatePrefs,
    compare,
    clearComparison: () => setComparison([]),
    loading: !!user && saved.isLoading,
    error: saved.error,
    retry: saved.refetch,
  };
}
export type StartPlannerValue = ReturnType<typeof usePlannerState>;
export function StartPlannerProvider({ children }: { children: ReactNode }) {
  const value = usePlannerState();
  return <StartPlannerContext.Provider value={value}>{children}</StartPlannerContext.Provider>;
}
export function useOptionalStartPlanner() {
  return useContext(StartPlannerContext);
}
export function useStartPlanner() {
  const value = useOptionalStartPlanner();
  if (!value) throw new Error("Missing StartPlannerProvider");
  return value;
}

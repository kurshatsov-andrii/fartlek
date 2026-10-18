import {
  createContext,
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
    compare,
    clearComparison: () => setComparison([]),
    loading: saved.isLoading,
    error: saved.error,
    retry: saved.refetch,
  };
}
const Context = createContext<ReturnType<typeof usePlannerState> | null>(null);
export function StartPlannerProvider({ children }: { children: ReactNode }) {
  const value = usePlannerState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStartPlanner() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing StartPlannerProvider");
  return value;
}

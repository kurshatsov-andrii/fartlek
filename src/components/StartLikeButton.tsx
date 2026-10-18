import { Heart } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/contexts/AppContext";
import type { StartRef } from "@/lib/start-planner";

export function StartLikeButton({ source, id }: StartRef) {
  const { user } = useAuth();
  const { lang } = useApp();
  const qc = useQueryClient();
  const key = ["start-like", source, id, user?.id ?? null];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [counts, mine] = await Promise.all([
        supabase.rpc("get_start_like_counts", { _source: source, _ids: [id] }),
        user
          ? supabase.from("start_likes").select("id").eq("source", source).eq("target_id", id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      return { count: Number(counts.data?.[0]?.likes ?? 0), mine: mine.data?.id ?? null };
    },
    staleTime: 60_000,
  });
  const liked = !!q.data?.mine;
  const count = q.data?.count ?? 0;
  async function toggle() {
    if (!user) {
      toast.info(lang === "uk" ? "Увійдіть, щоб поставити вподобайку" : "Sign in to like");
      return;
    }
    const prev = q.data;
    qc.setQueryData(key, { count: count + (liked ? -1 : 1), mine: liked ? null : "pending" });
    const { error } = liked
      ? await supabase.from("start_likes").delete().eq("id", prev!.mine!)
      : await supabase.from("start_likes").insert({ user_id: user.id, source, target_id: id });
    if (error) {
      qc.setQueryData(key, prev);
      toast.error(lang === "uk" ? "Не вдалося. Спробуйте ще раз" : "Something went wrong");
    }
    qc.invalidateQueries({ queryKey: key });
  }
  const label = lang === "uk" ? (liked ? "Прибрати вподобайку" : "Подобається") : liked ? "Unlike" : "Like";
  return (
    <Button variant="ghost" size="sm" className="gap-1 px-2" aria-label={label} aria-pressed={liked} title={label} onClick={toggle}>
      <Heart className={liked ? "h-4 w-4 fill-current text-primary" : "h-4 w-4"} />
      {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
    </Button>
  );
}

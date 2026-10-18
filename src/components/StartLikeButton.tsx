import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/contexts/AppContext";
import type { StartRef } from "@/lib/start-planner";
import { guestLikeToken } from "@/lib/guest-likes";

export function StartLikeButton({ source, id }: StartRef) {
  const { user } = useAuth();
  const { lang } = useApp();
  const qc = useQueryClient();
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      setGuestToken(guestLikeToken(window.localStorage, () => crypto.randomUUID()));
    } catch {
      setGuestToken(crypto.randomUUID());
    }
  }, []);
  const key = ["start-like", source, id, user?.id ?? guestToken];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [counts, mine] = await Promise.all([
        supabase.rpc("get_start_like_counts", { _source: source, _ids: [id] }),
        user
          ? supabase.from("start_likes").select("id").eq("source", source).eq("target_id", id).maybeSingle()
          : guestToken
            ? supabase.rpc("get_guest_start_like", { _token: guestToken, _source: source, _id: id }).then(({ data, error }) => ({ data: data ? { id: "guest" } : null, error }))
            : Promise.resolve({ data: null, error: null }),
      ]);
      if (counts.error) throw counts.error;
      if (mine.error) throw mine.error;
      return { count: Number(counts.data?.[0]?.likes ?? 0), mine: mine.data?.id ?? null };
    },
    staleTime: 60_000,
  });
  const liked = !!q.data?.mine;
  const count = q.data?.count ?? 0;
  async function toggle() {
    if (busy || !q.data || (!user && !guestToken)) return;
    setBusy(true);
    const prev = q.data;
    qc.setQueryData(key, { count: count + (liked ? -1 : 1), mine: liked ? null : "pending" });
    try {
      const { error } = user
        ? liked && prev?.mine
          ? await supabase.from("start_likes").delete().eq("id", prev.mine)
          : await supabase.from("start_likes").insert({ user_id: user.id, source, target_id: id })
        : await supabase.rpc("set_guest_start_like", { _token: guestToken ?? "", _source: source, _id: id, _liked: !liked });
      if (error) throw error;
    } catch {
      qc.setQueryData(key, prev);
      toast.error(lang === "uk" ? "Не вдалося. Спробуйте ще раз" : "Something went wrong");
    } finally {
      await qc.invalidateQueries({ queryKey: ["start-like", source, id] });
      setBusy(false);
    }
  }
  const label = lang === "uk" ? (liked ? "Прибрати вподобайку" : "Подобається") : liked ? "Unlike" : "Like";
  return (
    <Button variant="ghost" size="sm" className="gap-1 px-2" aria-label={label} aria-pressed={liked} title={label} onClick={toggle} disabled={busy || !q.data || (!user && !guestToken)}>
      <Heart className={liked ? "h-4 w-4 fill-current text-primary" : "h-4 w-4"} />
      {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
    </Button>
  );
}

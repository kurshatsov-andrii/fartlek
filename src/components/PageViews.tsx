import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PageViewsProps {
  pageKey: string;
  className?: string;
}

/** Eye icon with a view counter. Counts one view per browser session per page key. */
export const PageViews = ({ pageKey, className }: PageViewsProps) => {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    if (!pageKey) return;
    let cancelled = false;

    (async () => {
      const storageKey = `pv:${pageKey}`;
      let alreadySeen = false;
      try {
        alreadySeen = sessionStorage.getItem(storageKey) === "1";
      } catch {
        alreadySeen = false;
      }

      if (!alreadySeen) {
        try {
          sessionStorage.setItem(storageKey, "1");
        } catch {
          /* ignore */
        }
        const { data, error } = await (supabase as any).rpc("increment_page_view", { _page_key: pageKey });
        if (!cancelled && !error && typeof data === "number") {
          setViews(data);
          return;
        }
      }

      const { data } = await (supabase as any)
        .from("page_view_counts")
        .select("views")
        .eq("page_key", pageKey)
        .maybeSingle();
      if (!cancelled) setViews(Number(data?.views ?? 0));
    })();

    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  if (views === null) return null;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}
      title="Перегляди сторінки"
    >
      <Eye className="h-4 w-4" aria-hidden="true" />
      <span className="font-semibold tabular-nums">{views.toLocaleString("uk-UA")}</span>
      <span className="sr-only">переглядів</span>
    </span>
  );
};

import { Bookmark, GitCompareArrows } from "lucide-react";
import { StartLikeButton } from "@/components/StartLikeButton";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStartPlanner } from "@/contexts/StartPlannerContext";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/contexts/AppContext";
import { startKey, type StartRef } from "@/lib/start-planner";
export function StartActions({
  source,
  id,
}: {
  source: StartRef["source"];
  id: string;
}) {
  const planner = useStartPlanner();
  const { user } = useAuth();
  const { lang } = useApp();
  const ref = { source, id };
  const saved = planner.records.some(
    (r) => r.source === source && r.target_id === id,
  );
  const compared = planner.comparison.some(
    (r) => startKey(r) === startKey(ref),
  );
  const saveLabel =
    lang === "uk"
      ? saved
        ? "Видалити зі збережених"
        : "Зберегти старт"
      : saved
        ? "Remove saved start"
        : "Save start";
  const compareLabel =
    lang === "uk"
      ? compared
        ? "Прибрати з порівняння"
        : "Порівняти старт"
      : compared
        ? "Remove comparison"
        : "Compare start";
  return (
    <div className="flex items-center gap-1 py-2">
      <StartLikeButton source={source} id={id} />
      <Tooltip>
        <TooltipTrigger asChild>
          {user ? (
            <Button
              size="icon"
              variant={saved ? "secondary" : "ghost"}
              aria-label={saveLabel}
              aria-pressed={saved}
              disabled={
                planner.pending.includes(startKey(ref)) ||
                planner.loading ||
                !!planner.error
              }
              onClick={() => planner.toggleSave(ref)}
            >
              <Bookmark
                className={
                  saved ? "h-4 w-4 fill-current text-primary" : "h-4 w-4"
                }
              />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              asChild
              aria-label={
                lang === "uk" ? "Увійти, щоб зберегти старт" : "Sign in to save"
              }
            >
              <Link to="/auth">
                <Bookmark className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>
          {user
            ? saveLabel
            : lang === "uk"
              ? "Увійти, щоб зберегти старт"
              : "Sign in to save"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant={compared ? "secondary" : "ghost"}
            aria-label={compareLabel}
            aria-pressed={compared}
            onClick={() => planner.compare(ref)}
          >
            <GitCompareArrows className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{compareLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
}

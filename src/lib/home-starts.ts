import { EVENT_CATEGORIES, type EventCategory } from "./i18n";
import { categorySport } from "./start-filters";

export const availableStartCategories = (
  events: { category: EventCategory }[],
  starts: readonly string[],
): EventCategory[] => EVENT_CATEGORIES.filter((category) =>
  events.some((event) => event.category === category) ||
  starts.includes(categorySport(category) ?? ""),
);

export const matchesStartCategory = (
  sports: readonly string[] | null,
  category: EventCategory | "all",
) => category === "all" || (sports ?? []).includes(categorySport(category) ?? "");

export const showEventResults = (count: number, loading: boolean) => loading || count > 0;
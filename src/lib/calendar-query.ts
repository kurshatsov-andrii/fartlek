import { queryOptions } from "@tanstack/react-query";
import { getPublicCalendar } from "@/lib/calendar-discovery.functions";
export const calendarQueryOptions = queryOptions({ queryKey: ["public-calendar"], queryFn: () => getPublicCalendar(), staleTime: 60_000 });
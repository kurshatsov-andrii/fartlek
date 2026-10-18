import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/pages/Calendar";
import { calendarQueryOptions } from "@/lib/calendar-query";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { discoverySeo } from "@/lib/discovery-seo";
import { CalendarLoadError } from "@/components/CalendarLoadError";

export const Route = createFileRoute("/calendar/kharkiv")({
  validateSearch: (search: Record<string, unknown>) => ({ year: /^(all|\d{4})$/.test(String(search.year)) ? String(search.year) : "2027" }),
  loader: async ({ context }) => {
    const [override] = await Promise.all([getSeoOverride({ data: { path: "/calendar/kharkiv" } }), context.queryClient.ensureQueryData(calendarQueryOptions)]);
    return override;
  },
  head: ({ loaderData }) => pageHead({ ...discoverySeo("/calendar/kharkiv"), path: "/calendar/kharkiv", override: loaderData }),
  component: () => <CalendarPage scope="kharkiv" />,
  errorComponent: CalendarLoadError,
  notFoundComponent: () => <div className="container py-12">Календар не знайдено.</div>,
});
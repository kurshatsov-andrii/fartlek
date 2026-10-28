import { discoverySeo } from "@/lib/discovery-seo";
import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/pages/Calendar";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { calendarQueryOptions } from "@/lib/calendar-query";
import { CalendarLoadError } from "@/components/CalendarLoadError";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

const PATH = "/calendar";

export const Route = createFileRoute("/calendar/")({
  validateSearch: (search: Record<string, unknown>) => ({ year: /^(all|\d{4})$/.test(String(search.year)) ? String(search.year) : "2027" }),
  loader: async ({ context }) => {
    const [override] = await Promise.all([getSeoOverride({ data: { path: PATH } }), context.queryClient.ensureQueryData(calendarQueryOptions)]);
    return override;
  },
  head: ({ loaderData }) => ({
    ...pageHead({
      ...discoverySeo("/calendar"),
      path: PATH,
      override: loaderData ?? null,
    }),
    scripts: [
      jsonLdScript(
        breadcrumbJsonLd([
          { name: "Головна", path: "/" },
          { name: "Календар забігів", path: PATH },
        ]),
      ),
    ],
  }),
  component: CalendarPage,
  errorComponent: CalendarLoadError,
  notFoundComponent: () => <div className="container py-12">Календар не знайдено.</div>,
});

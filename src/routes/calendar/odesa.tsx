import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/pages/Calendar";
import { calendarQueryOptions } from "@/lib/calendar-query";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { discoverySeo } from "@/lib/discovery-seo";
import { CalendarLoadError } from "@/components/CalendarLoadError";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

export const Route = createFileRoute("/calendar/odesa")({
  validateSearch: (search: Record<string, unknown>) => ({ year: /^(all|\d{4})$/.test(String(search.year)) ? String(search.year) : undefined }),
  loader: async ({ context }) => {
    const [override] = await Promise.all([getSeoOverride({ data: { path: "/calendar/odesa" } }), context.queryClient.ensureQueryData(calendarQueryOptions)]);
    return override;
  },
  head: ({ loaderData }) => ({
    ...pageHead({ ...discoverySeo("/calendar/odesa"), path: "/calendar/odesa", override: loaderData }),
    scripts: [
      jsonLdScript(
        breadcrumbJsonLd([
          { name: "Головна", path: "/" },
          { name: "Календар забігів", path: "/calendar" },
          { name: "Одеса", path: "/calendar/odesa" },
        ]),
      ),
    ],
  }),
  component: () => <CalendarPage scope="odesa" />,
  errorComponent: CalendarLoadError,
  notFoundComponent: () => <div className="container py-12">Календар не знайдено.</div>,
});

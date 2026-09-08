import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/pages/Calendar";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/calendar";

export const Route = createFileRoute("/calendar")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Календар забігів в Україні 2026 | Fartlek Events',
      description: 'Повний календар спортивних подій України: забіги, трейли, марафони, вело та триатлон. Фільтри за містом, датою і видом спорту.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: CalendarPage,
});

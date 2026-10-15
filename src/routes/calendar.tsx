import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/pages/Calendar";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/calendar";

export const Route = createFileRoute("/calendar")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Календар забігів України 2027 і 2026 | Пробіги — Фартлек',
      description: 'Календар забігів і пробігів України 2027: марафони, півмарафони, трейли, триатлон. Дати, міста, дистанції та реєстрація на старт.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: CalendarPage,
});

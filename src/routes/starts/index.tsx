import { createFileRoute } from "@tanstack/react-router";
import Starts from "@/pages/Starts";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/starts";

export const Route = createFileRoute("/starts/")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Старти в Україні — анонси змагань | Fartlek Events',
      description: 'Анонси стартів з усієї України: дати, міста, дистанції, організатори та посилання на реєстрацію. Оновлюється щодня.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: Starts,
});

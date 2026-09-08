import { createFileRoute } from "@tanstack/react-router";
import Features from "@/pages/Features";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/features";

export const Route = createFileRoute("/features")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Можливості платформи для організаторів | Fartlek Events',
      description: 'Онлайн-реєстрація, QR-стартові пакети, промокоди, хронометраж, розсилки та аналітика для організаторів спортивних подій.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: Features,
});

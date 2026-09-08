import { createFileRoute } from "@tanstack/react-router";
import PublicOffer from "@/pages/PublicOffer";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/public-offer";

export const Route = createFileRoute("/public-offer")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Публічна оферта | Fartlek Events',
      description: 'Умови публічного договору про надання послуг з онлайн-реєстрації на спортивні події Fartlek Events.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: PublicOffer,
});

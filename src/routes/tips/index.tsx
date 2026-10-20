import { createFileRoute } from "@tanstack/react-router";
import Tips from "@/pages/Tips";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/tips";

export const Route = createFileRoute("/tips/")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: "Поради бігунам: тренування, екіпірування, марафон | Фартлек",
      description: "Поради бігунам від Фартлек: як підготуватися до марафону та інших забігів, обрати біговий годинник і кросівки, покращити техніку бігу та уникнути типових помилок.",
      path: PATH,
      override: loaderData ?? null,
    }),
  component: () => <Tips />,
});

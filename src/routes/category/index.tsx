import { createFileRoute } from "@tanstack/react-router";
import CategoriesIndex from "@/pages/CategoriesIndex";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/category";

export const Route = createFileRoute("/category/")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Види спортивних подій — категорії | Fartlek Events',
      description: 'Забіги, напівмарафони, марафони, ультра, трейли, OCR, вело, триатлон і запливи в Україні. Обери категорію та зареєструйся.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: CategoriesIndex,
});

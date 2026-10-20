import { createFileRoute } from "@tanstack/react-router";
import TipArticle from "@/pages/TipArticle";
import { pageHead } from "@/lib/route-head";
import { getSeoOverride, getTipSeo } from "@/lib/page-seo.functions";

export const Route = createFileRoute("/tips/$category/$slug")({
  loader: async ({ params }) => {
    const path = `/tips/${params.category}/${params.slug}`;
    const [tip, override] = await Promise.all([getTipSeo({ data: { slug: params.slug } }), getSeoOverride({ data: { path } })]);
    return { tip, override };
  },
  head: ({ params, loaderData }) =>
    pageHead({
      title: loaderData?.tip?.title ?? "Поради бігунам | Фартлек",
      description: loaderData?.tip?.description ?? "Практичні поради бігунам від спільноти Фартлек.",
      image: loaderData?.tip?.image,
      path: `/tips/${params.category}/${params.slug}`,
      type: "article",
      override: loaderData?.override ?? null,
    }),
  component: TipArticle,
});

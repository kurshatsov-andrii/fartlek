import { createFileRoute } from "@tanstack/react-router";
import StartDetails from "@/pages/StartDetails";
import { getStartSeo, getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

export const Route = createFileRoute("/starts/$slug")({
  loader: async ({ params }) => {
    const path = `/starts/${params.slug}`;
    const [seo, override] = await Promise.all([
      getStartSeo({ data: { slug: params.slug } }),
      getSeoOverride({ data: { path } }),
    ]);
    return { seo, override, path };
  },
  head: ({ loaderData }) =>
    pageHead({
      title: loaderData?.seo?.title ?? "Старт | Fartlek Events",
      description: loaderData?.seo?.description ?? "Деталі старту, дистанції та реєстрація на Fartlek Events.",
      path: loaderData?.seo?.path ?? loaderData?.path ?? "/starts",
      image: loaderData?.seo?.image ?? null,
      type: "article",
      override: loaderData?.override ?? null,
    }),
  component: StartDetails,
});

import { createFileRoute } from "@tanstack/react-router";
import TipArticle from "@/pages/TipArticle";
import { pageHead } from "@/lib/route-head";
import { getSeoOverride, getTipSeo, getTipArticle } from "@/lib/page-seo.functions";
import { articleJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";
import type { RunningTip } from "@/lib/tips";

export const Route = createFileRoute("/tips/$category/$slug")({
  loader: async ({ params }) => {
    const path = `/tips/${params.category}/${params.slug}`;
    const [tip, override, article] = await Promise.all([
      getTipSeo({ data: { slug: params.slug } }),
      getSeoOverride({ data: { path } }),
      getTipArticle({ data: { slug: params.slug } }).catch(() => undefined),
    ]);
    return { tip, override, article: article as RunningTip | null | undefined };
  },
  head: ({ params, loaderData }) => {
    const h = pageHead({
      title: loaderData?.tip?.title ?? "Поради бігунам | Фартлек",
      description: loaderData?.tip?.description ?? "Практичні поради бігунам від спільноти Фартлек.",
      image: loaderData?.tip?.image,
      path: `/tips/${params.category}/${params.slug}`,
      type: "article",
      override: loaderData?.override ?? null,
    });
    const tip = loaderData?.tip;
    if (!tip) return h;
    return {
      ...h,
      scripts: [
        jsonLdScript([
          articleJsonLd({ title: tip.title, description: tip.description, image: tip.image, path: tip.path }),
          breadcrumbJsonLd([
            { name: "Головна", path: "/" },
            { name: "Поради", path: "/tips" },
            { name: tip.title, path: tip.path },
          ]),
        ]),
      ],
    };
  },
  component: TipRoute,
});

function TipRoute() {
  const { article } = Route.useLoaderData();
  return <TipArticle initial={article} />;
}

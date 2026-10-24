import { createFileRoute } from "@tanstack/react-router";
import StartDetails from "@/pages/StartDetails";
import { getStartSeo, getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript, sportsEventJsonLd } from "@/lib/jsonld";

export const Route = createFileRoute("/starts/$slug")({
  loader: async ({ params }) => {
    const path = `/starts/${params.slug}`;
    const [seo, override] = await Promise.all([
      getStartSeo({ data: { slug: params.slug } }),
      getSeoOverride({ data: { path } }),
    ]);
    return { seo, override, path };
  },
  head: ({ loaderData }) => {
    const h = pageHead({
      title: loaderData?.seo?.title ?? "Старт | Fartlek Events",
      description: loaderData?.seo?.description ?? "Деталі старту, дистанції та реєстрація на Fartlek Events.",
      path: loaderData?.seo?.path ?? loaderData?.path ?? "/starts",
      image: loaderData?.seo?.image ?? null,
      type: "article",
      override: loaderData?.override ?? null,
    });
    const seo = loaderData?.seo;
    if (!seo) return h;
    return {
      ...h,
      scripts: [
        jsonLdScript([
          sportsEventJsonLd({
            name: seo.name ?? seo.title,
            description: seo.description,
            image: seo.image,
            path: seo.path,
            startDate: seo.startDate,
            city: seo.city,
            organizer: seo.organizerName,
            cancelled: seo.cancelled,
          }),
          breadcrumbJsonLd([
            { name: "Головна", path: "/" },
            { name: "Старти", path: "/starts" },
            { name: seo.name ?? seo.title, path: seo.path },
          ]),
        ]),
      ],
    };
  },
  component: StartDetails,
});

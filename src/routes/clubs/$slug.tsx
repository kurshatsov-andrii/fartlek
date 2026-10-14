import { createFileRoute } from "@tanstack/react-router";
import ClubDetails from "@/pages/ClubDetails";
import { getClubSeo, getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

export const Route = createFileRoute("/clubs/$slug")({
  loader: async ({ params }) => {
    const path = `/clubs/${params.slug}`;
    const [seo, override] = await Promise.all([
      getClubSeo({ data: { slug: params.slug } }),
      getSeoOverride({ data: { path } }),
    ]);
    return { seo, override, path };
  },
  head: ({ loaderData }) =>
    pageHead({
      title: loaderData?.seo?.title ?? "Біговий клуб | Fartlek Events",
      description: loaderData?.seo?.description ?? "Біговий клуб: тренування, розклад та контакти на Fartlek Events.",
      path: loaderData?.seo?.path ?? loaderData?.path ?? "/clubs",
      image: loaderData?.seo?.image ?? null,
      type: "profile",
      override: loaderData?.override ?? null,
    }),
  component: ClubDetails,
});

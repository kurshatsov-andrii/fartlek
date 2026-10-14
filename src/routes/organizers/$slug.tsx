import { createFileRoute } from "@tanstack/react-router";
import OrganizerProfileDetails from "@/pages/OrganizerProfileDetails";
import { getOrganizerSeo, getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

export const Route = createFileRoute("/organizers/$slug")({
  loader: async ({ params }) => {
    const path = `/organizers/${params.slug}`;
    const [seo, override] = await Promise.all([
      getOrganizerSeo({ data: { slug: params.slug } }),
      getSeoOverride({ data: { path } }),
    ]);
    return { seo, override, path };
  },
  head: ({ loaderData }) =>
    pageHead({
      title: loaderData?.seo?.title ?? "Організатор подій | Fartlek Events",
      description: loaderData?.seo?.description ?? "Організатор спортивних подій: старти, контакти та реєстрація на Fartlek Events.",
      path: loaderData?.seo?.path ?? loaderData?.path ?? "/organizers",
      image: loaderData?.seo?.image ?? null,
      type: "profile",
      override: loaderData?.override ?? null,
    }),
  component: OrganizerProfileDetails,
});

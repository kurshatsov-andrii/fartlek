import { createFileRoute } from "@tanstack/react-router";
import EventDetails from "@/pages/EventDetails";
import { getEventSeo, getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

export const Route = createFileRoute("/events/$id/")({
  loader: async ({ params }) => {
    const path = `/events/${params.id}`;
    const [event, override] = await Promise.all([
      getEventSeo({ data: { id: params.id } }),
      getSeoOverride({ data: { path } }),
    ]);
    return { event, override, path };
  },
  head: ({ loaderData }) =>
    pageHead({
      title: loaderData?.event?.title ?? "Спортивна подія | Fartlek Events",
      description:
        loaderData?.event?.description ??
        "Деталі події, дистанції та онлайн-реєстрація на платформі Fartlek Events.",
      path: loaderData?.path ?? "/",
      image: loaderData?.event?.image ?? null,
      type: "article",
      override: loaderData?.override ?? null,
    }),
  component: EventDetails,
});

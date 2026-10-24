import { createFileRoute } from "@tanstack/react-router";
import EventDetails from "@/pages/EventDetails";
import { getEventSeo, getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript, sportsEventJsonLd } from "@/lib/jsonld";

export const Route = createFileRoute("/events/$id/")({
  loader: async ({ params }) => {
    const path = `/events/${params.id}`;
    const [event, override] = await Promise.all([
      getEventSeo({ data: { id: params.id } }),
      getSeoOverride({ data: { path } }),
    ]);
    return { event, override, path };
  },
  head: ({ loaderData }) => {
    const h = pageHead({
      title: loaderData?.event?.title ?? "Спортивна подія | Fartlek Events",
      description:
        loaderData?.event?.description ??
        "Деталі події, дистанції та онлайн-реєстрація на платформі Fartlek Events.",
      path: loaderData?.path ?? "/",
      image: loaderData?.event?.image ?? null,
      type: "article",
      override: loaderData?.override ?? null,
    });
    const event = loaderData?.event;
    if (!event) return h;
    return {
      ...h,
      scripts: [
        jsonLdScript([
          sportsEventJsonLd({
            name: event.name ?? event.title,
            description: event.description,
            image: event.image,
            path: event.path,
            startDate: event.startDate,
            city: event.location,
            organizer: event.organizerName,
            cancelled: event.cancelled,
          }),
          breadcrumbJsonLd([
            { name: "Головна", path: "/" },
            { name: "Календар", path: "/calendar" },
            { name: event.name ?? event.title, path: event.path },
          ]),
        ]),
      ],
    };
  },
  component: EventDetails,
});

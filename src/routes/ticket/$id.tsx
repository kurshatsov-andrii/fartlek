import { createFileRoute } from "@tanstack/react-router";
import Ticket from "@/pages/Ticket";
import { pageHead } from "@/lib/route-head";

export const Route = createFileRoute("/ticket/$id")({
  head: ({ params }) => pageHead({
    title: "Стартовий квиток | Фартлек",
    description: "Ваш стартовий квиток, номер учасника або команди та статус оплати на Фартлек.",
    path: `/ticket/${params.id}`,
    noindex: true,
  }),
  component: Ticket,
});

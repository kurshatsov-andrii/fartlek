import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/route-head";
import MyEvents from "@/pages/MyEvents";

export const Route = createFileRoute("/my-events")({
  head: () => pageHead({ title: 'Мої події | Fartlek Events', description: 'Ваші реєстрації, статус оплати та стартові квитки.', path: '/my-events', noindex: true }),
  component: MyEvents,
});

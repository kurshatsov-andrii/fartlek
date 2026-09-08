import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/route-head";
import Auth from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  head: () => pageHead({ title: 'Вхід та реєстрація | Fartlek Events', description: 'Увійдіть або створіть акаунт учасника Fartlek Events.', path: '/auth', noindex: true }),
  component: Auth,
});

import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/route-head";
import Auth from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  head: () => pageHead({ title: 'Вхід та реєстрація | Фартлек', description: 'Увійдіть або створіть акаунт учасника Фартлек.', path: '/auth', noindex: true }),
  component: Auth,
});

import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/route-head";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead({ title: 'Відновлення пароля | Fartlek Events', description: 'Скидання пароля акаунта Fartlek Events.', path: '/reset-password', noindex: true }),
  component: ResetPassword,
});

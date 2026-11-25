import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/route-head";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead({ title: 'Відновлення пароля | Фартлек', description: 'Скидання пароля акаунта Фартлек.', path: '/reset-password', noindex: true }),
  component: ResetPassword,
});

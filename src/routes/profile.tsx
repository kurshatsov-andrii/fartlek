import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/route-head";
import Profile from "@/pages/Profile";

export const Route = createFileRoute("/profile")({
  head: () => pageHead({ title: 'Профіль учасника | Fartlek Events', description: 'Особисті дані, розмір футболки та налаштування акаунта.', path: '/profile', noindex: true }),
  component: Profile,
});

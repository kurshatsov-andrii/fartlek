import { createFileRoute } from "@tanstack/react-router";
import AdminUnsubscribes from "@/pages/AdminUnsubscribes";

export const Route = createFileRoute("/admin/unsubscribes")({
  component: AdminUnsubscribes,
});

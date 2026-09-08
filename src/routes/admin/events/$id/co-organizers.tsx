import { createFileRoute } from "@tanstack/react-router";
import AdminEventCoOrganizers from "@/pages/AdminEventCoOrganizers";

export const Route = createFileRoute("/admin/events/$id/co-organizers")({
  component: AdminEventCoOrganizers,
});

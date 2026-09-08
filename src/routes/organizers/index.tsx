import { createFileRoute } from "@tanstack/react-router";
import OrganizersCatalog from "@/pages/OrganizersCatalog";

export const Route = createFileRoute("/organizers/")({
  component: OrganizersCatalog,
});

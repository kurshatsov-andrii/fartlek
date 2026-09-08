import { createFileRoute } from "@tanstack/react-router";
import OrganizerDashboard from "@/pages/OrganizerDashboard";

export const Route = createFileRoute("/organizer/")({
  component: OrganizerDashboard,
});

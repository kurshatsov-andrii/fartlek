import { createFileRoute } from "@tanstack/react-router";
import OrganizerProfileDetails from "@/pages/OrganizerProfileDetails";

export const Route = createFileRoute("/organizers/$slug")({
  component: OrganizerProfileDetails,
});

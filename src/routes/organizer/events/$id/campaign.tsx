import { createFileRoute } from "@tanstack/react-router";
import OrganizerEventCampaign from "@/pages/OrganizerEventCampaign";

export const Route = createFileRoute("/organizer/events/$id/campaign")({
  component: OrganizerEventCampaign,
});

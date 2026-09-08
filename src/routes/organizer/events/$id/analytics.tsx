import { createFileRoute } from "@tanstack/react-router";
import EventAnalytics from "@/pages/EventAnalytics";

export const Route = createFileRoute("/organizer/events/$id/analytics")({
  component: EventAnalytics,
});

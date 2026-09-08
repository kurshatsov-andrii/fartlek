import { createFileRoute } from "@tanstack/react-router";
import EventChangesAdmin from "@/pages/EventChangesAdmin";

export const Route = createFileRoute("/organizer/events/$id/changes")({
  component: EventChangesAdmin,
});

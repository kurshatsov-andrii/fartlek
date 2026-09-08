import { createFileRoute } from "@tanstack/react-router";
import EventEditor from "@/pages/EventEditor";

export const Route = createFileRoute("/organizer/events/$id/")({
  component: EventEditor,
});

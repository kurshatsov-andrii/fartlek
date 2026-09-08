import { createFileRoute } from "@tanstack/react-router";
import EventEditorNew from "@/pages/EventEditor";

export const Route = createFileRoute("/organizer/events/new")({
  component: EventEditorNew,
});

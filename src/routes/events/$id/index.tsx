import { createFileRoute } from "@tanstack/react-router";
import EventDetails from "@/pages/EventDetails";

export const Route = createFileRoute("/events/$id/")({
  component: EventDetails,
});

import { createFileRoute } from "@tanstack/react-router";
import EventsMap from "@/pages/EventsMap";

export const Route = createFileRoute("/map")({
  component: EventsMap,
});

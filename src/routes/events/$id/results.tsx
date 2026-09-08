import { createFileRoute } from "@tanstack/react-router";
import EventResults from "@/pages/EventResults";

export const Route = createFileRoute("/events/$id/results")({
  component: EventResults,
});

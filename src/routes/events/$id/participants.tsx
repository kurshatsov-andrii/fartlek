import { createFileRoute } from "@tanstack/react-router";
import Participants from "@/pages/Participants";

export const Route = createFileRoute("/events/$id/participants")({
  component: Participants,
});

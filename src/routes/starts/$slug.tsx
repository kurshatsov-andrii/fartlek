import { createFileRoute } from "@tanstack/react-router";
import StartDetails from "@/pages/StartDetails";

export const Route = createFileRoute("/starts/$slug")({
  component: StartDetails,
});

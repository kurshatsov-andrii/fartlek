import { createFileRoute } from "@tanstack/react-router";
import StravaCallback from "@/pages/StravaCallback";

export const Route = createFileRoute("/strava/callback")({
  component: StravaCallback,
});

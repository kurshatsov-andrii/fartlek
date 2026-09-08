import { createFileRoute } from "@tanstack/react-router";
import MyEvents from "@/pages/MyEvents";

export const Route = createFileRoute("/my-events")({
  component: MyEvents,
});

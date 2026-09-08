import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/pages/Calendar";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

import { createFileRoute } from "@tanstack/react-router";
import Ticket from "@/pages/Ticket";

export const Route = createFileRoute("/ticket/$id")({
  component: Ticket,
});

import { createFileRoute } from "@tanstack/react-router";
import ClubDetails from "@/pages/ClubDetails";

export const Route = createFileRoute("/clubs/$slug")({
  component: ClubDetails,
});

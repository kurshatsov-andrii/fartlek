import { createFileRoute } from "@tanstack/react-router";
import ClubsCatalog from "@/pages/ClubsCatalog";

export const Route = createFileRoute("/clubs/")({
  component: ClubsCatalog,
});

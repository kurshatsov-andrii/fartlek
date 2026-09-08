import { createFileRoute } from "@tanstack/react-router";
import ClubEditor from "@/pages/ClubEditor";

export const Route = createFileRoute("/clubs/edit")({
  component: ClubEditor,
});

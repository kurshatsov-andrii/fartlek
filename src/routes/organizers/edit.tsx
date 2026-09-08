import { createFileRoute } from "@tanstack/react-router";
import OrganizerProfileEditor from "@/pages/OrganizerProfileEditor";

export const Route = createFileRoute("/organizers/edit")({
  component: OrganizerProfileEditor,
});

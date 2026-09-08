import { createFileRoute } from "@tanstack/react-router";
import AdminSessions from "@/pages/AdminSessions";

export const Route = createFileRoute("/admin/sessions")({
  component: AdminSessions,
});

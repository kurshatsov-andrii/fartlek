import { createFileRoute } from "@tanstack/react-router";
import AdminSurvey from "@/pages/AdminSurvey";

export const Route = createFileRoute("/admin/survey")({
  component: AdminSurvey,
});

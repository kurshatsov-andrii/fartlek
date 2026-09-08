import { createFileRoute } from "@tanstack/react-router";
import AdminStarts from "@/pages/AdminStarts";

export const Route = createFileRoute("/admin/starts")({
  component: AdminStarts,
});

import { createFileRoute } from "@tanstack/react-router";
import AdminCarousel from "@/pages/AdminCarousel";

export const Route = createFileRoute("/admin/carousel")({
  component: AdminCarousel,
});

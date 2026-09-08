import { createFileRoute } from "@tanstack/react-router";
import AdminCampaigns from "@/pages/AdminCampaigns";

export const Route = createFileRoute("/admin/campaigns")({
  component: AdminCampaigns,
});

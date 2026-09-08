import { createFileRoute } from "@tanstack/react-router";
import PromoCodes from "@/pages/PromoCodes";

export const Route = createFileRoute("/organizer/events/$id/promo-codes")({
  component: PromoCodes,
});

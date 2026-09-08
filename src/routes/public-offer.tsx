import { createFileRoute } from "@tanstack/react-router";
import PublicOffer from "@/pages/PublicOffer";

export const Route = createFileRoute("/public-offer")({
  component: PublicOffer,
});

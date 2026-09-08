import { createFileRoute } from "@tanstack/react-router";
import Testimonials from "@/pages/Testimonials";

export const Route = createFileRoute("/testimonials")({
  component: Testimonials,
});

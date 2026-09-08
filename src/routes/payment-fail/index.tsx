import { createFileRoute } from "@tanstack/react-router";
import PaymentFailAlias from "@/pages/PaymentFail";

export const Route = createFileRoute("/payment-fail/")({
  component: PaymentFailAlias,
});

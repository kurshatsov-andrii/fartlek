import { createFileRoute } from "@tanstack/react-router";
import PaymentSuccessAlias from "@/pages/PaymentSuccess";

export const Route = createFileRoute("/payment-success/")({
  component: PaymentSuccessAlias,
});

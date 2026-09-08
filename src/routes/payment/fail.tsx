import { createFileRoute } from "@tanstack/react-router";
import PaymentFail from "@/pages/PaymentFail";

export const Route = createFileRoute("/payment/fail")({
  component: PaymentFail,
});

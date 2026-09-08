import { createFileRoute } from "@tanstack/react-router";
import UserAgreement from "@/pages/UserAgreement";

export const Route = createFileRoute("/user-agreement")({
  component: UserAgreement,
});

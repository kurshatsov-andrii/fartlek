import { createFileRoute } from "@tanstack/react-router";
import Starts from "@/pages/Starts";

export const Route = createFileRoute("/starts/")({
  component: Starts,
});

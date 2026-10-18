import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/route-head";
import StartPlanner from "@/pages/StartPlanner";
export const Route = createFileRoute("/saved")({
  head: () =>
    pageHead({
      title: "Збережені старти та нагадування | Фартлек",
      description:
        "Ваші збережені забіги, особисті нагадування та календар стартів.",
      path: "/saved",
      noindex: true,
    }),
  component: () => <StartPlanner mode="saved" />,
});

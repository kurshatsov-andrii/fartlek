import { createFileRoute } from "@tanstack/react-router";
import AdminTips from "@/pages/AdminTips";

export const Route = createFileRoute("/admin/tips")({
  head: () => ({ meta: [{ title: "Поради — адмін | Fartlek Events" }, { name: "robots", content: "noindex" }] }),
  component: AdminTips,
});

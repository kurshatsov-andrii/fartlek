import { createFileRoute } from "@tanstack/react-router";
import AdminTips from "@/pages/AdminTips";

export const Route = createFileRoute("/admin/tips")({
  head: () => ({ meta: [{ title: "Поради — адмін | Фартлек" }, { name: "robots", content: "noindex" }] }),
  component: AdminTips,
});

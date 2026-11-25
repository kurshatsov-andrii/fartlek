import { createFileRoute } from "@tanstack/react-router";
import AdminBlog from "@/pages/AdminBlog";

export const Route = createFileRoute("/admin/blog")({
  head: () => ({ meta: [{ title: "Блог — адмін | Фартлек" }, { name: "robots", content: "noindex" }] }),
  component: AdminBlog,
});

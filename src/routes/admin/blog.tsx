import { createFileRoute } from "@tanstack/react-router";
import AdminBlog from "@/pages/AdminBlog";

export const Route = createFileRoute("/admin/blog")({
  head: () => ({ meta: [{ title: "Блог — адмін | Fartlek Events" }, { name: "robots", content: "noindex" }] }),
  component: AdminBlog,
});

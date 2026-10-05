import { createFileRoute } from "@tanstack/react-router";
import Blog from "@/pages/Blog";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/blog";

export const Route = createFileRoute("/blog/")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: "Блог Фартлек — бігова спільнота Харкова",
      description: "Фото, відео та історії з забігів бігової команди та спільноти Фартлек у Харкові: Kharkiv Run, Стрілка Run, недільні Fartlek Run.",
      path: PATH,
      override: loaderData ?? null,
    }),
  component: Blog,
});

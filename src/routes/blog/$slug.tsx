import { createFileRoute } from "@tanstack/react-router";
import BlogPostPage from "@/pages/BlogPostPage";
import { pageHead } from "@/lib/route-head";
import { getSeoOverride } from "@/lib/page-seo.functions";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => getSeoOverride({ data: { path: `/blog/${params.slug}` } }),
  head: ({ params, loaderData }) =>
    pageHead({
      title: "Блог Фартлек — фото та відео забігу",
      description: "Фото, відео та історія забігу бігової спільноти Фартлек у Харкові.",
      path: `/blog/${params.slug}`,
      type: "article",
      override: loaderData ?? null,
    }),
  component: BlogPostPage,
});

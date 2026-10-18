import { createFileRoute } from "@tanstack/react-router";
import BlogPostPage from "@/pages/BlogPostPage";
import { pageHead } from "@/lib/route-head";
import { getBlogSeo, getSeoOverride } from "@/lib/page-seo.functions";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [post, override] = await Promise.all([getBlogSeo({ data: { slug: params.slug } }), getSeoOverride({ data: { path: `/blog/${params.slug}` } })]);
    return { post, override };
  },
  head: ({ params, loaderData }) =>
    pageHead({
      title: loaderData?.post?.title ?? "Блог Фартлек — фото та відео забігу",
      description: loaderData?.post?.description ?? "Фото, відео та історія забігу бігової спільноти Фартлек у Харкові.",
      image: loaderData?.post?.image,
      path: `/blog/${params.slug}`,
      type: "article",
      override: loaderData?.override ?? null,
    }),
  component: BlogPostPage,
});

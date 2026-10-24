import { createFileRoute } from "@tanstack/react-router";
import BlogPostPage from "@/pages/BlogPostPage";
import { pageHead } from "@/lib/route-head";
import { getBlogSeo, getSeoOverride } from "@/lib/page-seo.functions";
import { articleJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [post, override] = await Promise.all([getBlogSeo({ data: { slug: params.slug } }), getSeoOverride({ data: { path: `/blog/${params.slug}` } })]);
    return { post, override };
  },
  head: ({ params, loaderData }) => {
    const h = pageHead({
      title: loaderData?.post?.title ?? "Блог Фартлек — фото та відео забігу",
      description: loaderData?.post?.description ?? "Фото, відео та історія забігу бігової спільноти Фартлек у Харкові.",
      image: loaderData?.post?.image,
      path: `/blog/${params.slug}`,
      type: "article",
      override: loaderData?.override ?? null,
    });
    const post = loaderData?.post;
    if (!post) return h;
    return {
      ...h,
      scripts: [
        jsonLdScript([
          articleJsonLd({ title: post.name ?? post.title, datePublished: post.datePublished, dateModified: post.dateModified, type: "BlogPosting", description: post.description, image: post.image, path: post.path }),
          breadcrumbJsonLd([
            { name: "Головна", path: "/" },
            { name: "Блог", path: "/blog" },
            { name: post.title, path: post.path },
          ]),
        ]),
      ],
    };
  },
  component: BlogPostPage,
});

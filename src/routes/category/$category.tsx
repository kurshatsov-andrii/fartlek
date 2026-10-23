import { createFileRoute } from "@tanstack/react-router";
import CategoryPage from "@/pages/CategoryPage";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { categorySeo } from "@/lib/seo";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";
import type { EventCategory } from "@/lib/i18n";

export const Route = createFileRoute("/category/$category")({
  loader: async ({ params }) => {
    const path = `/category/${params.category}`;
    const override = await getSeoOverride({ data: { path } });
    return { override, path, category: params.category };
  },
  head: ({ loaderData }) => {
    const fallback = {
      title: "Спортивні події в Україні | Fartlek Events",
      description: "Каталог спортивних подій України з онлайн-реєстрацією на платформі Fartlek Events.",
    };
    let seo = fallback;
    try {
      seo = categorySeo(loaderData?.category as EventCategory, "uk") ?? fallback;
    } catch {
      seo = fallback;
    }
    const path = loaderData?.path ?? "/category";
    return {
      ...pageHead({
        title: seo?.title ?? fallback.title,
        description: seo?.description ?? fallback.description,
        path,
        override: loaderData?.override ?? null,
      }),
      scripts: [
        jsonLdScript(
          breadcrumbJsonLd([
            { name: "Головна", path: "/" },
            { name: "Категорії", path: "/category" },
            { name: seo?.title ?? fallback.title, path },
          ]),
        ),
      ],
    };
  },
  component: CategoryPage,
});

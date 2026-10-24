import { createFileRoute, notFound } from "@tanstack/react-router";
import Tips from "@/pages/Tips";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";
import { tipCategory } from "@/lib/tips";

export const Route = createFileRoute("/tips/$category/")({
  loader: ({ params }) => {
    const cat = tipCategory(params.category);
    if (!cat) throw notFound();
    return cat;
  },
  head: ({ params, loaderData }) =>
    ({ ...pageHead({
      title: loaderData?.title ?? "Поради бігунам | Фартлек",
      description: loaderData?.description ?? "Поради бігунам від Фартлек.",
      path: `/tips/${params.category}`,
    }), scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Поради", path: "/tips" }, { name: loaderData?.name ?? params.category, path: `/tips/${params.category}` }]))] }),
  component: function TipCategoryPage() {
    const { category } = Route.useParams();
    return <Tips category={category} />;
  },
});

import { createFileRoute } from "@tanstack/react-router";
import Features from "@/pages/Features";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

const PATH = "/features";

export const Route = createFileRoute("/features")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    ({ ...pageHead({
      title: 'Можливості Фартлек — для учасників та організаторів',
      description: 'Збереження та порівняння стартів, нагадування, лайки, календарі забігів 2027, реєстрація, QR-квитки, поради, блог, відгуки, англійська версія та інструменти організаторів Фартлек.',
      path: PATH,
      override: loaderData ?? null,
    }), scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Можливості", path: PATH }]))] }),
  component: Features,
});

import { createFileRoute } from "@tanstack/react-router";
import Testimonials from "@/pages/Testimonials";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

const PATH = "/testimonials";

export const Route = createFileRoute("/testimonials")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    ({ ...pageHead({
      title: 'Відгуки учасників і організаторів | Fartlek Events',
      description: 'Що кажуть учасники забігів і організатори про реєстрацію, стартові пакети та результати на платформі Fartlek Events.',
      path: PATH,
      override: loaderData ?? null,
    }), scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Відгуки", path: PATH }]))] }),
  component: Testimonials,
});

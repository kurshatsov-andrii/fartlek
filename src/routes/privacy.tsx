import { createFileRoute } from "@tanstack/react-router";
import Privacy from "@/pages/Privacy";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

const PATH = "/privacy";

export const Route = createFileRoute("/privacy")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    ({ ...pageHead({
      title: 'Політика конфіденційності | Fartlek Events',
      description: 'Як Fartlek Events збирає, зберігає та захищає персональні дані учасників спортивних подій.',
      path: PATH,
      override: loaderData ?? null,
    }), scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Політика конфіденційності", path: PATH }]))] }),
  component: Privacy,
});

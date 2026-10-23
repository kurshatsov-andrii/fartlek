import { discoverySeo } from "@/lib/discovery-seo";
import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { jsonLdScript, organizationJsonLd } from "@/lib/jsonld";

const PATH = "/";

export const Route = createFileRoute("/")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) => ({
    ...pageHead({
      ...discoverySeo("/"),
      path: PATH,
      override: loaderData ?? null,
    }),
    scripts: [jsonLdScript(organizationJsonLd())],
  }),
  component: Index,
});

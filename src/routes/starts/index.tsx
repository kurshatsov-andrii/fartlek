import { discoverySeo } from "@/lib/discovery-seo";
import { createFileRoute } from "@tanstack/react-router";
import Starts from "@/pages/Starts";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/starts";

export const Route = createFileRoute("/starts/")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      ...discoverySeo("/starts"),
      path: PATH,
      override: loaderData ?? null,
    }),
  component: Starts,
});

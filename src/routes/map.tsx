import { discoverySeo } from "@/lib/discovery-seo";
import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

// Leaflet touches `window` at module evaluation, so the map page must only
// load in the browser — never during SSR.
const EventsMap = lazy(() => import("@/pages/EventsMap"));

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export const Route = createFileRoute("/map")({
  loader: () => getSeoOverride({ data: { path: "/map" } }),
  head: ({ loaderData }) =>
    ({ ...pageHead({
      ...discoverySeo("/map"),
      path: "/map",
      override: loaderData ?? null,
    }), scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Мапа", path: "/map" }]))] }),
  component: () => (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <EventsMap />
      </Suspense>
    </ClientOnly>
  ),
});

import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

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
    pageHead({
      title: "Мапа спортивних подій України | Fartlek Events",
      description:
        "Інтерактивна мапа забігів, трейлів і стартів по містах України. Обери місто — дивись найближчі події та реєструйся онлайн.",
      path: "/map",
      override: loaderData ?? null,
    }),
  component: () => (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <EventsMap />
      </Suspense>
    </ClientOnly>
  ),
});

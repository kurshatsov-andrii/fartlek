import { createFileRoute } from "@tanstack/react-router";
import OrganizersCatalog from "@/pages/OrganizersCatalog";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/organizers";

export const Route = createFileRoute("/organizers/")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Організатори спортивних подій України | Fartlek Events',
      description: 'Каталог організаторів забігів, трейлів і триатлонів в Україні: профілі, події та контакти для співпраці.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: OrganizersCatalog,
});

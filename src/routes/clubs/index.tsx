import { createFileRoute } from "@tanstack/react-router";
import ClubsCatalog from "@/pages/ClubsCatalog";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

const PATH = "/clubs";

export const Route = createFileRoute("/clubs/")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    ({ ...pageHead({
      title: 'Бігові клуби України — каталог | Fartlek Events',
      description: 'Каталог бігових і спортивних клубів України: міста, тренування, контакти та події клубів. Знайди свій клуб.',
      path: PATH,
      override: loaderData ?? null,
    }), scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Клуби", path: PATH }]))] }),
  component: ClubsCatalog,
});

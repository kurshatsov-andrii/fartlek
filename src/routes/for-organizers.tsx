import { createFileRoute } from "@tanstack/react-router";
import ForOrganizers from "@/pages/ForOrganizers";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/for-organizers";

export const Route = createFileRoute("/for-organizers")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Організаторам забігів — реєстрація, оплати та просування | Fartlek Events',
      description:
        'Створюйте події та приймайте реєстрації учасників безкоштовно: онлайн-оплати, стартові номери, результати, розсилки й аналітика — в одній панелі Fartlek Events.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: ForOrganizers,
});

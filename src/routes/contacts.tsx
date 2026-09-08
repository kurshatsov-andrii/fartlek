import { createFileRoute } from "@tanstack/react-router";
import Contacts from "@/pages/Contacts";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/contacts";

export const Route = createFileRoute("/contacts")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Контакти Fartlek Events',
      description: "Зв'яжіться з командою Fartlek Events: підтримка учасників, співпраця з організаторами та питання щодо реєстрації.",
      path: PATH,
      override: loaderData ?? null,
    }),
  component: Contacts,
});

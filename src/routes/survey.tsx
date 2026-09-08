import { createFileRoute } from "@tanstack/react-router";
import Survey from "@/pages/Survey";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/survey";

export const Route = createFileRoute("/survey")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Опитування бігунів України | Fartlek Events',
      description: 'Пройдіть коротке опитування — допоможіть зробити старти та реєстрацію зручнішими для бігунів України.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: Survey,
});

import { createFileRoute } from "@tanstack/react-router";
import UserAgreement from "@/pages/UserAgreement";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

const PATH = "/user-agreement";

export const Route = createFileRoute("/user-agreement")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    ({ ...pageHead({
      title: 'Угода користувача | Fartlek Events',
      description: 'Правила користування платформою Fartlek Events для учасників та організаторів спортивних подій.',
      path: PATH,
      override: loaderData ?? null,
    }), scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Угода користувача", path: PATH }]))] }),
  component: UserAgreement,
});

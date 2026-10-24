import { createFileRoute } from "@tanstack/react-router";
import Guide from "@/pages/Guide";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";

const PATH = "/guide";

export const Route = createFileRoute("/guide")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    ({ ...pageHead({
      title: "Гайд — Як користуватися платформою Фартлек",
      description:
        "Відео-гайд Фартлек: як знайти забіг, зареєструватися (себе або дитину), оплатити участь та отримати QR-квиток.",
      path: PATH,
      override: loaderData ?? null,
    }), scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Гайд", path: PATH }]))] }),
  component: Guide,
});

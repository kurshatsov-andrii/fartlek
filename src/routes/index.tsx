import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/";

export const Route = createFileRoute("/")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: 'Fartlek Events — реєстрація на забіги в Україні',
      description: 'Забіги, напівмарафони, марафони, ультра, трейли, OCR та онлайн-старти по всій Україні. Онлайн-реєстрація, QR-квитки, миттєві результати.',
      path: PATH,
      override: loaderData ?? null,
    }),
  component: Index,
});

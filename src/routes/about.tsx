import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";

const PATH = "/about";

export const Route = createFileRoute("/about")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) =>
    pageHead({
      title: "Про нас — Фартлек за об'єднання всіх бігунів",
      description:
        "Бігова спільнота Фартлек: ми за свободу вибору бігуна, єдність бігунів Харкова та інших міст і бігову культуру без поділу на «наших» і «чужих».",
      path: PATH,
      override: loaderData ?? null,
    }),
  component: About,
});

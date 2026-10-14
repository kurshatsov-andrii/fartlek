import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";
import { getSeoOverride } from "@/lib/page-seo.functions";
import { pageHead } from "@/lib/route-head";
import { aboutFaqJsonLd } from "@/lib/about-faq";

const PATH = "/about";

export const Route = createFileRoute("/about")({
  loader: () => getSeoOverride({ data: { path: PATH } }),
  head: ({ loaderData }) => {
    const h = pageHead({
      title: "Фартлек — бігова спільнота Харкова | Про нас",
      description:
        "Фартлек — бігова спільнота Харкова: спільні пробіжки щонеділі, тренування й забіги. Приєднуйтеся до Telegram-чату, Instagram та читайте блог.",
      path: PATH,
      override: loaderData ?? null,
    });
    return {
      ...h,
      meta: [...h.meta, { name: "twitter:card", content: "summary_large_image" }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(aboutFaqJsonLd()) }],
    };
  },
  component: About,
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const sourceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(30000),
  city: z.string().max(300),
  region: z.string().max(300),
  seo_title: z.string().max(300),
  seo_description: z.string().max(500),
});

const translationSchema = z.object({
  title_en: z.string().trim().min(1).max(300),
  description_en: z.string(),
  city_en: z.string().max(300),
  region_en: z.string().max(300),
  seo_title_en: z.string().trim().min(1).max(60),
  seo_description_en: z.string().trim().min(1).max(160),
});

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title_en", "description_en", "city_en", "region_en", "seo_title_en", "seo_description_en"],
  properties: {
    title_en: { type: "string", maxLength: 300 },
    description_en: { type: "string" },
    city_en: { type: "string", maxLength: 300 },
    region_en: { type: "string", maxLength: 300 },
    seo_title_en: { type: "string", maxLength: 60 },
    seo_description_en: { type: "string", maxLength: 160 },
  },
} as const;

export const translateStartToEnglish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => sourceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Перекладати старти може лише адміністратор.");

    const gateway = await import("@lovable.dev/ai-gateway");
    try {
      const response = await gateway.generateResponse({
        model: "openai/gpt-6-astra",
        instructions: [
          "Translate Ukrainian race listings into natural British English.",
          "Preserve every URL, number, date, time, distance, emoji and paragraph break exactly.",
          "Do not invent or remove facts. Preserve brand, personal and team names; use established English spellings for places.",
          "Return an empty translation for an empty source field, except SEO fields: when either SEO source is empty, create it only from the supplied start facts.",
          "The SEO title must be at most 60 characters and the SEO description at most 160 characters.",
        ].join(" "),
        input: [{ role: "user", content: JSON.stringify(data) }],
        text: {
          format: {
            type: "json_schema",
            name: "english_start_translation",
            schema: jsonSchema,
            strict: true,
          },
        },
      });

      const outputText = response.output.flatMap((item) =>
        item.type === "message"
          ? item.content.map((part) => part.type === "output_text" ? part.text : "")
          : [],
      ).join("");
      if (!outputText) throw new Error("Empty translation response");
      return translationSchema.parse(JSON.parse(outputText));
    } catch (error) {
      if (error instanceof gateway.GatewayError) {
        console.error("Start translation gateway error", { code: error.code, ids: error.ids });
      } else {
        console.error("Start translation response error", error);
      }
      throw new Error("Не вдалося автоматично перекласти старт. Введений текст збережено у формі; спробуйте ще раз пізніше.");
    }
  });

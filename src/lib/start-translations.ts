export type StartContentLanguage = "uk" | "en";

export interface StartTranslatableFields {
  title: string;
  description: string | null;
  city?: string | null;
  region?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  title_en?: string | null;
  description_en?: string | null;
  city_en?: string | null;
  region_en?: string | null;
  seo_title_en?: string | null;
  seo_description_en?: string | null;
}

function translatedText(
  original: string | null | undefined,
  translation: string | null | undefined,
  language: StartContentLanguage,
) {
  return language === "en" && translation?.trim() ? translation.trim() : original;
}

/** Use edited English content when present; never hide the Ukrainian original otherwise. */
export function localizeStart<T extends StartTranslatableFields>(
  start: T,
  language: StartContentLanguage,
): T {
  return {
    ...start,
    title: translatedText(start.title, start.title_en, language) ?? start.title,
    description: translatedText(start.description, start.description_en, language) ?? start.description,
    city: translatedText(start.city, start.city_en, language),
    region: translatedText(start.region, start.region_en, language),
    seo_title: translatedText(start.seo_title, start.seo_title_en, language),
    seo_description: translatedText(start.seo_description, start.seo_description_en, language),
  };
}

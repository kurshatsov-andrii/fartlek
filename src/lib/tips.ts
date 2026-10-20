export type TipCategory = { slug: string; name: string; title: string; description: string };

export const TIP_CATEGORIES: TipCategory[] = [
  { slug: "ekipiruvannia", name: "Екіпірування", title: "Бігове екіпірування: кросівки, одяг, шнурування | Фартлек", description: "Поради бігунам щодо екіпірування: як обрати бігові кросівки, правильно шнурувати, підібрати одяг для бігу в будь-яку погоду." },
  { slug: "hodynnyky", name: "Годинники", title: "Бігові годинники та GPS: як обрати | Фартлек", description: "Як обрати біговий годинник, налаштувати GPS і контроль пульсу, які функції справді потрібні бігуну — поради від Фартлек." },
  { slug: "trenuvannia", name: "Тренування", title: "Тренування з бігу: техніка, план, пульс | Фартлек", description: "Поради з тренувань: техніка бігу, пульсові зони, інтервали та фартлек, плани для 5 км, 10 км, напівмарафону та марафону." },
  { slug: "starty", name: "Старти", title: "Підготовка до забігу та марафону | Фартлек", description: "Як підготуватися до першого забігу, напівмарафону чи марафону: тактика, розминка, день старту та типові помилки бігунів." },
  { slug: "kharchuvannia", name: "Харчування", title: "Харчування бігуна: до, під час і після | Фартлек", description: "Спортивне харчування для бігунів: що їсти перед тренуванням і стартом, гелі та вода на дистанції, відновлення після бігу." },
  { slug: "vidnovlennia", name: "Відновлення", title: "Відновлення після бігу та тренувань | Фартлек", description: "Як відновлюватися після тренувань і марафону: сон, розтяжка, масаж, профілактика травм і план повернення до бігу." },
];

export const tipCategory = (slug: string) => TIP_CATEGORIES.find((c) => c.slug === slug);

export type RunningTip = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  youtube_url?: string | null;
  published_on: string;
  is_published: boolean;
};

export const tipPath = (t: Pick<RunningTip, "category" | "slug">) => `/tips/${t.category}/${t.slug}`;

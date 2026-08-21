// Shared parser for Telegram start posts.
// Extracts: sport types, distances (km), city, region, organizer, is_paid.
// Pure TS — no Deno/Node-only APIs. Mirror logic if changed in
// supabase/functions/_shared/parse-start.ts.

export type SportType =
  | "run"
  | "half_marathon"
  | "marathon"
  | "ultra"
  | "trail"
  | "ocr"
  | "swim"
  | "cycling"
  | "triathlon"
  | "aquathlon"
  | "duathlon"
  | "cross"
  | "online";

export const SPORT_LABELS: Record<SportType, string> = {
  run: "Біг",
  half_marathon: "Напівмарафон",
  marathon: "Марафон",
  ultra: "Ультрамарафон",
  trail: "Трейл",
  ocr: "Забіги з перешкодами",
  swim: "Плавання",
  cycling: "Велостарти",
  triathlon: "Триатлон",
  aquathlon: "Акватлон",
  duathlon: "Дуатлон",
  cross: "Крос",
  online: "Онлайн",
};

export const SPORT_TYPES: SportType[] = [
  "run", "half_marathon", "marathon", "ultra", "trail", "ocr", "cross",
  "swim", "cycling", "triathlon", "aquathlon", "duathlon", "online",
];


// City → region (oblast). Add more over time.
const CITY_REGION: Record<string, string> = {
  "київ": "Київська",
  "kyiv": "Київська",
  "kiev": "Київська",
  "львів": "Львівська",
  "lviv": "Львівська",
  "одеса": "Одеська",
  "одесса": "Одеська",
  "odesa": "Одеська",
  "харків": "Харківська",
  "kharkiv": "Харківська",
  "дніпро": "Дніпропетровська",
  "dnipro": "Дніпропетровська",
  "запоріжжя": "Запорізька",
  "вінниця": "Вінницька",
  "хмельницький": "Хмельницька",
  "черкаси": "Черкаська",
  "чернігів": "Чернігівська",
  "чернівці": "Чернівецька",
  "івано-франківськ": "Івано-Франківська",
  "ужгород": "Закарпатська",
  "мукачево": "Закарпатська",
  "луцьк": "Волинська",
  "рівне": "Рівненська",
  "тернопіль": "Тернопільська",
  "житомир": "Житомирська",
  "полтава": "Полтавська",
  "суми": "Сумська",
  "кропивницький": "Кіровоградська",
  "миколаїв": "Миколаївська",
  "херсон": "Херсонська",
  "яремче": "Івано-Франківська",
  "витачів": "Київська",
  "буковель": "Івано-Франківська",
  "трускавець": "Львівська",
  "славське": "Львівська",
  "кам'янець-подільський": "Хмельницька",
  "кам`янець-подільський": "Хмельницька",
  "камянець-подільський": "Хмельницька",
  "біла церква": "Київська",
  "бровари": "Київська",
  "ірпінь": "Київська",
  "буча": "Київська",
};

const CITY_KEYS = Object.keys(CITY_REGION).sort((a, b) => b.length - a.length);

export interface ParsedStart {
  sport_types: SportType[];
  distances_km: number[];
  city: string | null;
  region: string | null;
  organizer_name: string | null;
  is_paid: boolean | null;
}

function detectSports(text: string): SportType[] {
  const t = " " + text.toLowerCase() + " ";
  const out = new Set<SportType>();
  if (/(ultra|ультра|100\s?км|160\s?км|50\s?км|ultratrail)/i.test(t)) out.add("ultra");
  if (/(half\s?marathon|напівмарафон|полумарафон|21[.,]?0?9?7?\s?км)/i.test(t)) out.add("half_marathon");
  if (/(marathon|марафон)/i.test(t) && !/(напівмарафон|полумарафон|half)/i.test(t)) out.add("marathon");
  if (/(trail|трейл|гірський забіг)/i.test(t)) out.add("trail");
  if (/(ocr|перешкод|spartan|spart|hyrox|тяжкий\s?біг|дика\s?гонка|з\s?перешкодами|обстаклс|штурм)/i.test(t)) out.add("ocr");
  if (/(swim|плаванн|заплив|swimrun|open\s?water)/i.test(t)) out.add("swim");
  if (/(cycling|bicycle|велозаїзд|велогонка|велостарт|велоперегон|вело\s|gran\s?fondo|granfondo|вело-?марафон)/i.test(t)) out.add("cycling");
  if (/(aquathlon|акватлон)/i.test(t)) out.add("aquathlon");
  if (/(duathlon|дуатлон)/i.test(t)) out.add("duathlon");
  if (/(triathlon|триатлон|ironman|iron\s?man|70\.3)/i.test(t)) out.add("triathlon");

  if (/(кросс|\sкрос\s|cross-?country|кросовий)/i.test(t)) out.add("cross");
  if (/(online|онлайн|virtual)/i.test(t)) out.add("online");
  // Generic running fallback
  if (out.size === 0 || /(\brun\b|забіг|пробіг|біговий|fun\s?run|charity\s?run)/i.test(t)) out.add("run");
  return Array.from(out);
}

function detectDistances(text: string): number[] {
  const set = new Set<number>();
  const re = /(\d{1,3}(?:[.,]\d{1,2})?)\s?\+?\s?(?:км|km)(?![а-яА-Яa-zA-Z])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(",", "."));
    if (!isNaN(n) && n > 0 && n <= 250) set.add(Math.round(n * 10) / 10);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function detectCity(text: string): { city: string | null; region: string | null } {
  const lower = text.toLowerCase();
  // Explicit "Місто: Київ" label has highest priority.
  const labeled = text.match(/місто\s*[:\-—]\s*([^\n]{2,80})/i);
  if (labeled) {
    const c = cleanCity(labeled[1]);
    if (c) return { city: capitalize(c), region: CITY_REGION[c] ?? null };
  }
  // "м. Київ" or "м.Київ" — but skip initials like "М.М." (single-letter token).
  const mDot = lower.match(/(?:^|[^а-яa-zіїєґ])м\.\s*([а-яіїєґa-z'’\-]{2,}(?:\s[а-яіїєґa-z'’\-]+)?)/i);
  if (mDot) {
    const c = mDot[1].trim();
    return { city: capitalize(c), region: CITY_REGION[c] ?? null };
  }
  for (const key of CITY_KEYS) {
    const re = new RegExp(`(^|[^а-яa-z])${escapeRe(key)}([^а-яa-z]|$)`, "i");
    if (re.test(lower)) {
      return { city: capitalize(key), region: CITY_REGION[key] };
    }
  }
  return { city: null, region: null };
}

function detectPaid(_text: string): boolean | null {
  // За замовчуванням всі старти платні; організатор може вручну позначити безкоштовний.
  if (/безкоштовн|free\s?entry|free\s?race|вільний\s?вхід/i.test(_text)) return false;
  return true;
}


function detectOrganizer(text: string): string | null {
  const m = text.match(/організатор[и]?\s*[:\-—]\s*([^\n]{2,80})/i);
  if (m) return m[1].replace(/\*+/g, "").trim().replace(/[.,;]+$/, "");
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseStartContent(text: string): ParsedStart {
  return {
    sport_types: detectSports(text),
    distances_km: detectDistances(text),
    ...detectCity(text),
    organizer_name: detectOrganizer(text),
    is_paid: detectPaid(text),
  };
}

const UA_MONTHS_GEN = ["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"];

function cleanTitle(t: string): string {
  // strip emoji & extra whitespace
  return (t || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F910}-\u{1F9FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trim() + "…";
}

/** Generate SEO title (≤60) and description (≤160) from start data. */
export function generateStartSeo(input: {
  title: string;
  description?: string | null;
  event_date?: string | null; // YYYY-MM-DD
  city?: string | null;
  distances_km?: number[] | null;
  sport_types?: string[] | null;
  organizer_name?: string | null;
}): { seo_title: string; seo_description: string } {
  const title = cleanTitle(input.title) || "Старт";
  let datePart = "";
  let dotDate = "";
  let year = "";
  if (input.event_date) {
    const d = new Date(input.event_date + "T00:00:00");
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const m = d.getMonth();
      year = String(d.getFullYear());
      datePart = `${day} ${UA_MONTHS_GEN[m]}`;
      dotDate = `${String(day).padStart(2,"0")}.${String(m+1).padStart(2,"0")}.${year}`;
    }
  }
  const city = input.city?.trim() || "";

  const titleParts = [title];
  if (year) titleParts[0] = `${title} ${year}`;
  const locDate = [city, datePart].filter(Boolean).join(", ");
  const seo_title = truncate(
    [titleParts[0], locDate].filter(Boolean).join(" — ") + (locDate ? " | Реєстрація" : ""),
    60
  );

  const dists = (input.distances_km || []).filter((n) => n > 0).slice(0, 6);
  const distStr = dists.length ? `дистанції ${dists.join(", ")} км` : "";
  const where = city ? `у ${city}` : "";
  const org = input.organizer_name ? `Організатор ${input.organizer_name}.` : "";
  const parts = [
    `${title}${dotDate ? " " + dotDate : ""}${where ? " " + where : ""}.`,
    distStr ? capitalize(distStr) + "." : "",
    org,
    "Реєстрація на старт онлайн.",
  ].filter(Boolean);
  const seo_description = truncate(parts.join(" ").replace(/\s+/g, " ").trim(), 160);

  return { seo_title, seo_description };
}

export const MONTH_NAMES_UK = [
  "Січень","Лютий","Березень","Квітень","Травень","Червень",
  "Липень","Серпень","Вересень","Жовтень","Листопад","Грудень",
];

function cleanCity(raw: string): string | null {
  let s = raw.split("\n")[0].replace(/\*+/g, "").trim();
  // Відрізаємо хвости на кшталт "Київ або онлайн", "Дніпро, Дистанції: ..."
  s = s.split(/\s*[,;(|/]|\s+(?:або|чи|онлайн|online|дистанц|час|дата|де|організатор)/i)[0].trim();
  s = s.replace(/^(?:м\.|с\.|смт\.?|місто|село)\s*/i, "").trim();
  s = s.replace(/[.,:;]+$/, "").trim();
  if (s.length < 2) return null;
  return s.toLowerCase();
}

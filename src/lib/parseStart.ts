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
  cross: "Крос",
  online: "Онлайн",
};

export const SPORT_TYPES: SportType[] = [
  "run", "half_marathon", "marathon", "ultra", "trail", "ocr", "cross",
  "swim", "cycling", "triathlon", "online",
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
  if (/(triathlon|триатлон|ironman|iron\s?man|70\.3|aquathlon|акватлон|duathlon|дуатлон)/i.test(t)) out.add("triathlon");
  if (/(кросс|\sкрос\s|cross-?country|кросовий)/i.test(t)) out.add("cross");
  if (/(online|онлайн|virtual)/i.test(t)) out.add("online");
  // Generic running fallback
  if (out.size === 0 || /(\brun\b|забіг|пробіг|біговий|fun\s?run|charity\s?run)/i.test(t)) out.add("run");
  return Array.from(out);
}

function detectDistances(text: string): number[] {
  const set = new Set<number>();
  const re = /(\d{1,3}(?:[.,]\d{1,2})?)\s?(?:км|km)(?![а-яА-Яa-zA-Z])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(",", "."));
    if (!isNaN(n) && n > 0 && n <= 250) set.add(Math.round(n * 10) / 10);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function detectCity(text: string): { city: string | null; region: string | null } {
  const lower = text.toLowerCase();
  // explicit "м. Київ" or "м.Київ"
  const mDot = lower.match(/м\.\s*([а-яіїєґa-z'-]+(?:\s[а-яіїєґa-z'-]+)?)/i);
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

function detectPaid(text: string): boolean | null {
  if (/безкоштовн|безкоштовно|free\s?entry|free\s?race|вільний\s?вхід/i.test(text)) return false;
  if (/(\d[\d\s]*)\s?(грн|₴|uah)|вартість|внесок|стартовий\s?пакет|реєстраційний\s?внесок/i.test(text)) return true;
  return null;
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

export const MONTH_NAMES_UK = [
  "Січень","Лютий","Березень","Квітень","Травень","Червень",
  "Липень","Серпень","Вересень","Жовтень","Листопад","Грудень",
];

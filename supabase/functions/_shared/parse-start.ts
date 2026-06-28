// Mirror of src/lib/parseStart.ts for Deno edge functions.
// Keep in sync.

export type SportType =
  | "run" | "half_marathon" | "marathon" | "ultra" | "trail" | "ocr"
  | "swim" | "cycling" | "triathlon" | "aquathlon" | "duathlon" | "cross" | "online";


const CITY_REGION: Record<string, string> = {
  "київ":"Київська","kyiv":"Київська","kiev":"Київська","львів":"Львівська","lviv":"Львівська",
  "одеса":"Одеська","одесса":"Одеська","odesa":"Одеська","харків":"Харківська","kharkiv":"Харківська",
  "дніпро":"Дніпропетровська","dnipro":"Дніпропетровська","запоріжжя":"Запорізька","вінниця":"Вінницька",
  "хмельницький":"Хмельницька","черкаси":"Черкаська","чернігів":"Чернігівська","чернівці":"Чернівецька",
  "івано-франківськ":"Івано-Франківська","ужгород":"Закарпатська","мукачево":"Закарпатська",
  "луцьк":"Волинська","рівне":"Рівненська","тернопіль":"Тернопільська","житомир":"Житомирська",
  "полтава":"Полтавська","суми":"Сумська","кропивницький":"Кіровоградська","миколаїв":"Миколаївська",
  "херсон":"Херсонська","яремче":"Івано-Франківська","витачів":"Київська","буковель":"Івано-Франківська",
  "трускавець":"Львівська","славське":"Львівська","кам'янець-подільський":"Хмельницька",
  "кам`янець-подільський":"Хмельницька","камянець-подільський":"Хмельницька","біла церква":"Київська",
  "бровари":"Київська","ірпінь":"Київська","буча":"Київська",
};
const CITY_KEYS = Object.keys(CITY_REGION).sort((a,b)=>b.length-a.length);

const cap = (s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
const escRe = (s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

export function parseStartContent(text: string) {
  const t = " " + text.toLowerCase() + " ";
  const out = new Set<SportType>();
  if (/(ultra|ультра|100\s?км|160\s?км|50\s?км|ultratrail)/i.test(t)) out.add("ultra");
  if (/(half\s?marathon|напівмарафон|полумарафон|21[.,]?0?9?7?\s?км)/i.test(t)) out.add("half_marathon");
  if (/(marathon|марафон)/i.test(t) && !/(напівмарафон|полумарафон|half)/i.test(t)) out.add("marathon");
  if (/(trail|трейл|гірський забіг)/i.test(t)) out.add("trail");
  if (/(ocr|перешкод|spartan|spart|hyrox|дика\s?гонка|з\s?перешкодами|обстаклс|штурм)/i.test(t)) out.add("ocr");
  if (/(swim|плаванн|заплив|swimrun|open\s?water)/i.test(t)) out.add("swim");
  if (/(cycling|bicycle|велозаїзд|велогонка|велостарт|велоперегон|вело\s|gran\s?fondo|granfondo|вело-?марафон)/i.test(t)) out.add("cycling");
  if (/(aquathlon|акватлон)/i.test(t)) out.add("aquathlon");
  if (/(duathlon|дуатлон)/i.test(t)) out.add("duathlon");
  if (/(triathlon|триатлон|ironman|iron\s?man|70\.3)/i.test(t)) out.add("triathlon");
  if (/(кросс|\sкрос\s|cross-?country|кросовий)/i.test(t)) out.add("cross");
  if (/(online|онлайн|virtual)/i.test(t)) out.add("online");
  if (out.size === 0 || /(\brun\b|забіг|пробіг|біговий|fun\s?run|charity\s?run)/i.test(t)) out.add("run");

  const distSet = new Set<number>();
  const re = /(\d{1,3}(?:[.,]\d{1,2})?)\s?(?:км|km)(?![а-яА-Яa-zA-Z])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(",","."));
    if (!isNaN(n) && n > 0 && n <= 250) distSet.add(Math.round(n*10)/10);
  }

  const lower = text.toLowerCase();
  let city: string | null = null;
  let region: string | null = null;
  const mDot = lower.match(/м\.\s*([а-яіїєґa-z'-]+(?:\s[а-яіїєґa-z'-]+)?)/i);
  if (mDot) {
    const c = mDot[1].trim();
    city = cap(c); region = CITY_REGION[c] ?? null;
  } else {
    for (const key of CITY_KEYS) {
      const r = new RegExp(`(^|[^а-яa-z])${escRe(key)}([^а-яa-z]|$)`, "i");
      if (r.test(lower)) { city = cap(key); region = CITY_REGION[key]; break; }
    }
  }

  // За замовчуванням всі старти платні; явно позначаємо безкоштовний лише за ключовими словами.
  let is_paid: boolean | null = true;
  if (/безкоштовн|free\s?entry|free\s?race|вільний\s?вхід/i.test(text)) is_paid = false;


  let organizer_name: string | null = null;
  const om = text.match(/організатор[и]?\s*[:\-—]\s*([^\n]{2,80})/i);
  if (om) organizer_name = om[1].replace(/\*+/g,"").trim().replace(/[.,;]+$/,"");

  return {
    sport_types: Array.from(out),
    distances_km: Array.from(distSet).sort((a,b)=>a-b),
    city, region, organizer_name, is_paid,
  };
}

const UA_MONTHS_GEN = ["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"];
function cleanTitle(t: string): string {
  return (t || "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F910}-\u{1F9FF}]/gu, "").replace(/\s+/g, " ").trim();
}
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1); const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trim() + "…";
}
export function generateStartSeo(input: {
  title: string; event_date?: string | null; city?: string | null;
  distances_km?: number[] | null; organizer_name?: string | null;
}): { seo_title: string; seo_description: string } {
  const title = cleanTitle(input.title) || "Старт";
  let datePart = "", dotDate = "", year = "";
  if (input.event_date) {
    const d = new Date(input.event_date + "T00:00:00");
    if (!isNaN(d.getTime())) {
      const day = d.getDate(), m = d.getMonth();
      year = String(d.getFullYear());
      datePart = `${day} ${UA_MONTHS_GEN[m]}`;
      dotDate = `${String(day).padStart(2,"0")}.${String(m+1).padStart(2,"0")}.${year}`;
    }
  }
  const city = input.city?.trim() || "";
  const t1 = year ? `${title} ${year}` : title;
  const locDate = [city, datePart].filter(Boolean).join(", ");
  const seo_title = truncate([t1, locDate].filter(Boolean).join(" — ") + (locDate ? " | Реєстрація" : ""), 60);
  const dists = (input.distances_km || []).filter((n) => n > 0).slice(0, 6);
  const distStr = dists.length ? `Дистанції ${dists.join(", ")} км.` : "";
  const where = city ? `у ${city}` : "";
  const org = input.organizer_name ? `Організатор ${input.organizer_name}.` : "";
  const seo_description = truncate(
    [`${title}${dotDate ? " " + dotDate : ""}${where ? " " + where : ""}.`, distStr, org, "Реєстрація на старт онлайн."].filter(Boolean).join(" ").replace(/\s+/g, " ").trim(),
    160
  );
  return { seo_title, seo_description };
}

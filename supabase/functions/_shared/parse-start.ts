// Mirror of src/lib/parseStart.ts for Deno edge functions.
// Keep in sync.

export type SportType =
  | "run" | "half_marathon" | "marathon" | "ultra" | "trail" | "ocr"
  | "swim" | "cycling" | "triathlon" | "cross" | "online";

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
  if (/(triathlon|триатлон|ironman|iron\s?man|70\.3|aquathlon|акватлон|duathlon|дуатлон)/i.test(t)) out.add("triathlon");
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

  let is_paid: boolean | null = null;
  if (/безкоштовн|безкоштовно|free\s?entry|free\s?race|вільний\s?вхід/i.test(text)) is_paid = false;
  else if (/(\d[\d\s]*)\s?(грн|₴|uah)|вартість|внесок|стартовий\s?пакет|реєстраційний\s?внесок/i.test(text)) is_paid = true;

  let organizer_name: string | null = null;
  const om = text.match(/організатор[и]?\s*[:\-—]\s*([^\n]{2,80})/i);
  if (om) organizer_name = om[1].replace(/\*+/g,"").trim().replace(/[.,;]+$/,"");

  return {
    sport_types: Array.from(out),
    distances_km: Array.from(distSet).sort((a,b)=>a-b),
    city, region, organizer_name, is_paid,
  };
}

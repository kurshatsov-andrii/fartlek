import type { EventCategory, Lang } from "@/lib/i18n";

const truncate = (s: string, max: number) =>
  s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";

export const formatEventDate = (iso: string, lang: Lang) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const shortDate = (iso: string, lang: Lang) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const buildEventSeo = (params: {
  title: string;
  city: string | null;
  isoDate: string;
  description?: string | null;
  organizer: string;
  distancesKm: number[];
  lang: Lang;
}) => {
  const { title, city, isoDate, organizer, distancesKm, lang } = params;
  const date = shortDate(isoDate, lang);
  const cityPart = city ? `, ${city}` : "";

  // Title до 60 символів
  let seoTitle = `${title}${cityPart}, ${date}`;
  seoTitle = truncate(seoTitle, 60);

  // Description до 140 символів: подія, місто, дата, дистанції, організатор
  const distLabel = distancesKm.length
    ? (lang === "uk"
        ? `Дистанції: ${distancesKm.join(", ")} км. `
        : `Distances: ${distancesKm.join(", ")} km. `)
    : "";
  const orgLabel = lang === "uk" ? `Організатор: ${organizer}.` : `Organizer: ${organizer}.`;
  const desc = `${title}${cityPart}, ${date}. ${distLabel}${orgLabel}`;

  return { title: seoTitle, description: truncate(desc, 140) };
};

const CAT_TITLES: Record<Lang, Record<EventCategory, string>> = {
  uk: {
    run: "Забіги в Україні — реєстрація онлайн | Фартлек",
    half_marathon: "Напівмарафони в Україні — реєстрація | Фартлек",
    marathon: "Марафони в Україні — реєстрація онлайн | Фартлек",
    ultra: "Ультрамарафони в Україні — реєстрація | Фартлек",
    trail: "Трейли в Україні — реєстрація онлайн | Фартлек",
    ocr: "OCR-забіги з перешкодами в Україні | Фартлек",
    online: "Онлайн-забіги в Україні — реєстрація | Фартлек",
    swim: "Запливи в Україні — реєстрація онлайн | Фартлек",
    aquathlon: "Акватлон в Україні — реєстрація | Фартлек",
    duathlon: "Дуатлон в Україні — реєстрація | Фартлек",
    cycling: "Велогонки в Україні — реєстрація онлайн | Фартлек",
    triathlon: "Триатлон в Україні — реєстрація онлайн | Фартлек",
    jumps: "Стрибки в Україні — реєстрація онлайн | Фартлек",
    cross: "Крос в Україні — реєстрація онлайн | Фартлек",
  },
  en: {
    run: "Road runs in Ukraine — online registration | Фартлек",
    half_marathon: "Half marathons in Ukraine — registration | Фартлек",
    marathon: "Marathons in Ukraine — online registration | Фартлек",
    ultra: "Ultra marathons in Ukraine — registration | Фартлек",
    trail: "Trail runs in Ukraine — online registration | Фартлек",
    ocr: "OCR obstacle races in Ukraine | Фартлек",
    online: "Online races in Ukraine — registration | Фартлек",
    swim: "Open water swims in Ukraine — registration | Фартлек",
    aquathlon: "Aquathlon races in Ukraine — registration | Фартлек",
    duathlon: "Duathlon races in Ukraine — registration | Фартлек",
    cycling: "Cycling races in Ukraine — online registration | Фартлек",
    triathlon: "Triathlon races in Ukraine — online registration | Фартлек",
    jumps: "Jump events in Ukraine — online registration | Фартлек",
    cross: "Cross country races in Ukraine — registration | Фартлек",
  },
};

const CAT_DESCS: Record<Lang, Record<EventCategory, string>> = {
  uk: {
    run: "Каталог забігів в Україні. Дистанції 5, 10, 15 км. Онлайн-реєстрація, QR-стартові пакети, миттєві результати.",
    half_marathon: "Напівмарафони (21.1 км) в Україні. Розклад стартів, онлайн-реєстрація, миттєві протоколи та QR-квитки.",
    marathon: "Марафони (42.2 км) в Україні. Календар стартів, онлайн-реєстрація, QR-стартові пакети, протоколи.",
    ultra: "Ультрамарафони в Україні від 50 км. Гірські та шосейні старти, онлайн-реєстрація, миттєві результати.",
    trail: "Трейлові забіги в горах і лісах України. Онлайн-реєстрація, QR-квитки, миттєві результати.",
    ocr: "OCR-забіги з перешкодами в Україні. Hyrox, Spartan-формат, командні старти. Онлайн-реєстрація.",
    online: "Онлайн-забіги в Україні: біжи будь-де, завантажуй результат і отримуй медаль. Зручна реєстрація.",
    swim: "Запливи на відкритій воді в Україні. Онлайн-реєстрація, QR-квитки, миттєві результати.",
    aquathlon: "Старти з акватлону в Україні: плавання + біг. Онлайн-реєстрація, QR-квитки, протоколи.",
    duathlon: "Дуатлон в Україні: біг + вело + біг. Календар стартів, онлайн-реєстрація, миттєві результати.",
    cycling: "Велогонки в Україні — шосе, гравій, МТБ. Онлайн-реєстрація, QR-квитки, миттєві результати.",
    triathlon: "Триатлон в Україні: плавання + вело + біг. Спринт, олімпійка, повна дистанція. Онлайн-реєстрація.",
    jumps: "Стрибки в Україні: змагання зі стрибків у висоту, довжину та інші дисципліни. Онлайн-реєстрація, QR-квитки.",
    cross: "Кросові забіги в Україні — стадіон, парк, пересічена місцевість. Онлайн-реєстрація, QR-квитки, миттєві результати.",
  },
  en: {
    run: "Catalog of road runs in Ukraine. 5K, 10K, 15K. Online registration, QR start packs, instant results.",
    half_marathon: "Half marathons (21.1K) in Ukraine. Race calendar, online registration, instant protocols, QR tickets.",
    marathon: "Marathons (42.2K) in Ukraine. Race calendar, online registration, QR start packs, protocols.",
    ultra: "Ultra marathons in Ukraine from 50K+. Mountain and road starts, online registration, instant results.",
    trail: "Trail runs across Ukrainian mountains and forests. Online registration, QR tickets, instant results.",
    ocr: "OCR obstacle races in Ukraine. Hyrox, Spartan-style, team starts. Online registration.",
    online: "Online races in Ukraine: run anywhere, upload your result, get a medal. Easy registration.",
    swim: "Open water swim races in Ukraine. Online registration, QR tickets, instant results.",
    aquathlon: "Aquathlon races in Ukraine: swim + run. Online registration, QR tickets, protocols.",
    duathlon: "Duathlon races in Ukraine: run + bike + run. Race calendar, online registration, instant results.",
    cycling: "Cycling races in Ukraine — road, gravel, MTB. Online registration, QR tickets, instant results.",
    triathlon: "Triathlon races in Ukraine: swim + bike + run. Sprint, Olympic, full distance. Online registration.",
    jumps: "Jump events in Ukraine: high jump, long jump and other jumping disciplines. Online registration, QR tickets.",
    cross: "Cross country races in Ukraine — stadium, park, off-road. Online registration, QR tickets, instant results.",
  },
};

export const categorySeo = (cat: EventCategory, lang: Lang) => ({
  title: truncate(CAT_TITLES[lang][cat].replace("в Україні", "України 2027").replace("in Ukraine", "in Ukraine 2027"), 60),
  description: truncate(CAT_DESCS[lang][cat].replace("в Україні", "в Україні 2027 року").replace("України.", "України 2027 року.").replace("in Ukraine", "in Ukraine in 2027"), 160),
});

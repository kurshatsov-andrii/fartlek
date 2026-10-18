import type { Lang } from "@/lib/i18n";

export const SITE_URL = "https://fartlek.com.ua";
export const SEO_SEASON = "2027";
export const clampSeo = (value: string, limit: number) => value.length <= limit ? value : value.slice(0, limit - 1).trimEnd() + "…";

const discovery = {
  "/": {
    uk: { title: "Забіги України 2027 — реєстрація на старти | Фартлек", description: "Знайдіть забіги України 2027: марафони, півмарафони, трейли та онлайн-старти. Календар, мапа, дистанції й реєстрація на Фартлек." },
    en: { title: "Ukraine races 2027 — race registration | Fartlek", description: "Explore Ukraine races in 2027: marathons, half marathons, trails and virtual races. Calendar, map, distances and registration." },
  },
  "/calendar": {
    uk: { title: "Календар забігів України 2027 — пробіги | Фартлек", description: "Календар забігів і пробігів України 2027: дати, міста, дистанції та організатори. Знайдіть марафон, півмарафон або трейл і перейдіть до реєстрації." },
    en: { title: "Ukraine running calendar 2027 | Fartlek", description: "Ukraine race calendar 2027: dates, cities, distances and organizers. Find a marathon, half marathon or trail race and registration details." },
  },
  "/calendar/kharkiv": {
    uk: { title: "Календар забігів Харкова 2027 — старти | Фартлек", description: "Забіги Харкова 2027: календар стартів, дати, місця проведення та дистанції. Афіша сезону й опубліковані події на Фартлек." },
    en: { title: "Kharkiv running calendar 2027 | Fartlek", description: "Kharkiv races 2027: dates, venues and distances. View the season poster and published events on Fartlek." },
  },
  "/calendar/vinnytsia": {
    uk: { title: "Календар забігів Вінниці 2027 — VINNYTSIA RUN | Фартлек", description: "Забіги Вінниці 2027: VINNYTSIA RUN 23 травня та 5 вересня. Календар стартів, дати, місця проведення й опубліковані дистанції на Фартлек." },
    en: { title: "Vinnytsia running calendar 2027 — VINNYTSIA RUN | Fartlek", description: "Vinnytsia races 2027: VINNYTSIA RUN on May 23 and September 5. Race calendar, dates, venues and published distances on Fartlek." },
  },
  "/starts": {
    uk: { title: "Забіги та спортивні старти України 2027 | Фартлек", description: "Анонси забігів і спортивних стартів України 2027. Дати, міста, дистанції, організатори та посилання на реєстрацію. Знайдіть свій наступний старт." },
    en: { title: "Ukraine races and sports events 2027 | Fartlek", description: "Ukraine race announcements for 2027: dates, cities, distances, organizers and registration links. Find your next race." },
  },
  "/map": {
    uk: { title: "Забіги України 2027 на мапі — міста й дати | Фартлек", description: "Мапа забігів України 2027: марафони, півмарафони та трейли за містами. Знайдіть місце проведення, дату й посилання на реєстрацію." },
    en: { title: "Ukraine race map 2027 — cities and dates | Fartlek", description: "Explore Ukraine races in 2027 on a map: marathons, half marathons and trails by city, with dates and registration details." },
  },
};
export type DiscoveryPath = keyof typeof discovery;
export const discoverySeo = (path: DiscoveryPath, lang: Lang = "uk") => discovery[path][lang];
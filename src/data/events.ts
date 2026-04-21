import trail from "@/assets/event-trail.jpg";
import marathon from "@/assets/event-marathon.jpg";
import track from "@/assets/event-track.jpg";

export interface SportEvent {
  id: string;
  title: { uk: string; en: string };
  organizer: string;
  date: string; // ISO
  location: { uk: string; en: string };
  image: string;
  distances: number[]; // km
  isPaid: boolean;
  price?: number;
  description: { uk: string; en: string };
}

export const SAMPLE_EVENTS: SportEvent[] = [
  {
    id: "carpathian-trail-2026",
    title: { uk: "Carpathian Trail 2026", en: "Carpathian Trail 2026" },
    organizer: "Fartlek Mountain Club",
    date: "2026-06-14T07:00:00",
    location: { uk: "Яремче, Карпати", en: "Yaremche, Carpathians" },
    image: trail,
    distances: [10, 21, 42],
    isPaid: true,
    price: 850,
    description: {
      uk: "Гірський трейл серед смерекових лісів з технічними підйомами та краєвидами Чорногори.",
      en: "Mountain trail through spruce forests with technical climbs and Chornohora views.",
    },
  },
  {
    id: "kyiv-city-run",
    title: { uk: "Kyiv City Run", en: "Kyiv City Run" },
    organizer: "Run Ukraine",
    date: "2026-05-10T08:00:00",
    location: { uk: "Київ, Хрещатик", en: "Kyiv, Khreshchatyk" },
    image: marathon,
    distances: [5, 10, 21],
    isPaid: true,
    price: 600,
    description: {
      uk: "Класичний міський забіг центром столиці. Закриті дороги, музика, гарячий старт.",
      en: "Classic city run through the capital's center. Closed roads, music, hot start.",
    },
  },
  {
    id: "track-night-lviv",
    title: { uk: "Track Night Lviv", en: "Track Night Lviv" },
    organizer: "Lviv Athletics",
    date: "2026-04-28T19:30:00",
    location: { uk: "Львів, СКА", en: "Lviv, SKA Stadium" },
    image: track,
    distances: [1, 3, 5],
    isPaid: false,
    description: {
      uk: "Вечірні забіги на доріжці стадіону. Безкоштовна участь, офіційний хронометраж.",
      en: "Evening track races at the stadium. Free entry, official chip timing.",
    },
  },
];

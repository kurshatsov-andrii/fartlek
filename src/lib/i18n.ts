export type Lang = "uk" | "en";

export const translations = {
  uk: {
    nav: { events: "Події", organizer: "Організаторам", login: "Увійти", signup: "Реєстрація" },
    hero: {
      kicker: "Спортивні події нового покоління",
      title: "Біжи. Реєструйся. Перемагай.",
      subtitle: "Fartlek Events — платформа реєстрації на забіги, трейли та змагання по всій Україні. QR-стартові пакети, миттєві результати, зручні протоколи.",
      ctaParticipant: "Вхід для учасників",
      ctaOrganizer: "Вхід для організаторів",
      stats: { events: "Подій", runners: "Бігунів", cities: "Міст" },
    },
    events: {
      heading: "Найближчі події",
      sub: "Обери свій старт. Реєструйся за хвилину.",
      details: "Деталі",
      register: "Реєстрація",
      free: "Безкоштовно",
      paid: "Платна участь",
      distances: "Дистанції",
      organizer: "Організатор",
      empty: "Поки що немає подій",
    },
    footer: {
      tagline: "Створено для бігунів і організаторів.",
      rights: "Усі права захищено.",
    },
    common: {
      backHome: "На головну",
      loading: "Завантаження...",
    },
  },
  en: {
    nav: { events: "Events", organizer: "For organizers", login: "Sign in", signup: "Sign up" },
    hero: {
      kicker: "Next-generation sports events",
      title: "Run. Register. Conquer.",
      subtitle: "Fartlek Events — the registration platform for races, trails and competitions across Ukraine. QR start packs, instant results, clean protocols.",
      ctaParticipant: "Participant sign in",
      ctaOrganizer: "Organizer sign in",
      stats: { events: "Events", runners: "Runners", cities: "Cities" },
    },
    events: {
      heading: "Upcoming events",
      sub: "Pick your start. Register in a minute.",
      details: "Details",
      register: "Register",
      free: "Free",
      paid: "Paid entry",
      distances: "Distances",
      organizer: "Organizer",
      empty: "No events yet",
    },
    footer: {
      tagline: "Built for runners and organizers.",
      rights: "All rights reserved.",
    },
    common: {
      backHome: "Back home",
      loading: "Loading...",
    },
  },
} as const;

type DeepWritable<T> = { -readonly [K in keyof T]: T[K] extends object ? DeepWritable<T[K]> : T[K] };
export type Dict = DeepWritable<typeof translations.uk>;

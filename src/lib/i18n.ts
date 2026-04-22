export type Lang = "uk" | "en";

export interface Dict {
  nav: { events: string; organizer: string; login: string; signup: string; dashboard: string; profile: string; logout: string; myEvents: string; contacts: string };
  hero: {
    kicker: string; title: string; subtitle: string;
    ctaParticipant: string; ctaOrganizer: string;
    stats: { events: string; runners: string; cities: string; clubs: string };
  };
  events: {
    heading: string; sub: string; details: string; register: string;
    free: string; paid: string; distances: string; organizer: string;
    empty: string; participants: string; date: string; time: string;
    description: string; location: string; selectDistance: string;
    confirmRegister: string; alreadyRegistered: string; viewTicket: string;
    backToEvents: string;
  };
  auth: {
    signIn: string; signUp: string; email: string; password: string; fullName: string;
    role: string; participant: string; organizer: string;
    forgotPassword: string; resetPassword: string; sendResetLink: string;
    newPassword: string; updatePassword: string; haveAccount: string; noAccount: string;
    signInTitle: string; signUpTitle: string; signInSub: string; signUpSub: string;
    successSignUp: string; successReset: string; successUpdate: string;
    backToSignIn: string;
  };
  profile: {
    title: string; sub: string; birthDate: string; gender: string; city: string; club: string;
    male: string; female: string; other: string; save: string; saved: string;
    requiredBanner: string; requiredToRegister: string; fillRequired: string; clubOptional: string;
  };
  ticket: {
    title: string; bib: string; download: string; qrHint: string; status: string;
    paid: string; pending: string; free: string;
  };
  organizer: {
    dashboard: string; createEvent: string; myEvents: string; participants: string;
    title: string; description: string; date: string; time: string; location: string;
    distances: string; addDistance: string; distanceKm: string; distanceName: string;
    distancePrice: string; image: string; isPaid: string; status: string;
    draft: string; published: string; cancelled: string; completed: string;
    save: string; cancel: string; edit: string; delete: string; export: string;
    exportCsv: string; exportXlsx: string; backToDashboard: string;
    noEvents: string; createFirst: string; bibNumber: string; assignBibs: string;
    confirmDelete: string;
  };
  footer: { tagline: string; rights: string };
  common: { backHome: string; loading: string; required: string; error: string };
  categories: {
    label: string; all: string;
    run: string; half_marathon: string; marathon: string; ultra: string; trail: string; ocr: string; online: string;
  };
}

export const EVENT_CATEGORIES = ["run", "half_marathon", "marathon", "ultra", "trail", "ocr", "online"] as const;
export type EventCategory = typeof EVENT_CATEGORIES[number];

export const translations: Record<Lang, Dict> = {
  uk: {
    nav: { events: "Події", organizer: "Організаторам", login: "Увійти", signup: "Реєстрація", dashboard: "Панель", profile: "Профіль", logout: "Вийти", myEvents: "Мої події" },
    hero: {
      kicker: "Спортивні події нового покоління",
      title: "Біжи. Реєструйся. Перемагай.",
      subtitle: "Fartlek Events — платформа реєстрації на забіги, трейли та змагання по всій Україні. QR-стартові пакети, миттєві результати, зручні протоколи.",
      ctaParticipant: "Вхід для учасників",
      ctaOrganizer: "Вхід для організаторів",
      stats: { events: "Подій", runners: "Бігунів", cities: "Міст", clubs: "Клубів" },
    },
    events: {
      heading: "Найближчі події", sub: "Обери свій старт. Реєструйся за хвилину.",
      details: "Деталі", register: "Реєстрація", free: "Безкоштовно", paid: "Платна участь",
      distances: "Дистанції", organizer: "Організатор", empty: "Поки що немає подій",
      participants: "Учасники", date: "Дата", time: "Час", description: "Опис", location: "Місце",
      selectDistance: "Обери дистанцію", confirmRegister: "Підтвердити реєстрацію",
      alreadyRegistered: "Ти вже зареєстрований", viewTicket: "Переглянути квиток",
      backToEvents: "До списку подій",
    },
    auth: {
      signIn: "Вхід", signUp: "Реєстрація", email: "Email", password: "Пароль", fullName: "Повне ім'я",
      role: "Я — ", participant: "Учасник", organizer: "Організатор",
      forgotPassword: "Забули пароль?", resetPassword: "Відновлення пароля", sendResetLink: "Надіслати посилання",
      newPassword: "Новий пароль", updatePassword: "Оновити пароль",
      haveAccount: "Вже є акаунт?", noAccount: "Ще не маєш акаунту?",
      signInTitle: "Вхід", signUpTitle: "Створи акаунт",
      signInSub: "Увійди, щоб реєструватись на події", signUpSub: "Хвилина — і ти в системі",
      successSignUp: "Акаунт створено! Можеш увійти.",
      successReset: "Перевір email — посилання надіслано.",
      successUpdate: "Пароль оновлено.",
      backToSignIn: "← Назад до входу",
    },
    profile: {
      title: "Мій профіль", sub: "Дані автоматично підставляються при реєстрації на події",
      birthDate: "Дата народження", gender: "Стать", city: "Місто", club: "Клуб",
      male: "Чоловік", female: "Жінка", other: "Інше", save: "Зберегти", saved: "Збережено",
      requiredBanner: "Заповни профіль, щоб реєструватись на події. Усі поля обов'язкові, окрім клубу.",
      requiredToRegister: "Спочатку заповни профіль — це обов'язково для реєстрації на події.",
      fillRequired: "Заповни всі обов'язкові поля",
      clubOptional: "необов'язково",
    },
    ticket: {
      title: "Стартовий квиток", bib: "Номер", download: "Завантажити QR",
      qrHint: "Покажи цей QR-код на старті", status: "Статус оплати",
      paid: "Оплачено", pending: "Очікує оплати", free: "Безкоштовна участь",
    },
    organizer: {
      dashboard: "Панель організатора", createEvent: "Створити подію", myEvents: "Мої події",
      participants: "Учасники", title: "Назва", description: "Опис", date: "Дата", time: "Час",
      location: "Місце", distances: "Дистанції", addDistance: "+ Додати дистанцію",
      distanceKm: "Кілометри", distanceName: "Назва (необов'язково)", distancePrice: "Ціна (₴)",
      image: "Фото обкладинки", isPaid: "Платна подія", status: "Статус",
      draft: "Чернетка", published: "Опубліковано", cancelled: "Скасовано", completed: "Завершено",
      save: "Зберегти", cancel: "Скасувати", edit: "Редагувати", delete: "Видалити",
      export: "Експорт", exportCsv: "Експорт CSV", exportXlsx: "Експорт Excel",
      backToDashboard: "← До панелі", noEvents: "У тебе ще немає подій",
      createFirst: "Створити першу", bibNumber: "Стартовий №", assignBibs: "Розставити номери",
      confirmDelete: "Видалити подію? Цю дію неможливо скасувати.",
    },
    footer: { tagline: "Створено для бігунів і організаторів.", rights: "Усі права захищено." },
    common: { backHome: "На головну", loading: "Завантаження...", required: "Обов'язкове поле", error: "Сталася помилка" },
    categories: {
      label: "Категорія", all: "Всі",
      run: "Забіги", half_marathon: "Напівмарафони", marathon: "Марафони",
      ultra: "Ультра", trail: "Трейл", ocr: "OCR", online: "Онлайн",
    },
  },
  en: {
    nav: { events: "Events", organizer: "For organizers", login: "Sign in", signup: "Sign up", dashboard: "Dashboard", profile: "Profile", logout: "Sign out", myEvents: "My events" },
    hero: {
      kicker: "Next-generation sports events",
      title: "Run. Register. Conquer.",
      subtitle: "Fartlek Events — the registration platform for races, trails and competitions across Ukraine. QR start packs, instant results, clean protocols.",
      ctaParticipant: "Participant sign in", ctaOrganizer: "Organizer sign in",
      stats: { events: "Events", runners: "Runners", cities: "Cities", clubs: "Clubs" },
    },
    events: {
      heading: "Upcoming events", sub: "Pick your start. Register in a minute.",
      details: "Details", register: "Register", free: "Free", paid: "Paid entry",
      distances: "Distances", organizer: "Organizer", empty: "No events yet",
      participants: "Participants", date: "Date", time: "Time", description: "Description", location: "Location",
      selectDistance: "Select a distance", confirmRegister: "Confirm registration",
      alreadyRegistered: "You're already registered", viewTicket: "View ticket",
      backToEvents: "Back to events",
    },
    auth: {
      signIn: "Sign in", signUp: "Sign up", email: "Email", password: "Password", fullName: "Full name",
      role: "I am a ", participant: "Participant", organizer: "Organizer",
      forgotPassword: "Forgot password?", resetPassword: "Reset password", sendResetLink: "Send reset link",
      newPassword: "New password", updatePassword: "Update password",
      haveAccount: "Already have an account?", noAccount: "Don't have an account?",
      signInTitle: "Welcome back", signUpTitle: "Create your account",
      signInSub: "Sign in to register for events", signUpSub: "One minute and you're in",
      successSignUp: "Account created! You can sign in.",
      successReset: "Check your email — reset link sent.",
      successUpdate: "Password updated.",
      backToSignIn: "← Back to sign in",
    },
    profile: {
      title: "My profile", sub: "Data is auto-filled when you register for events",
      birthDate: "Birth date", gender: "Gender", city: "City", club: "Club",
      male: "Male", female: "Female", other: "Other", save: "Save", saved: "Saved",
      requiredBanner: "Complete your profile to register for events. All fields are required except club.",
      requiredToRegister: "Please complete your profile first — it's required to register for events.",
      fillRequired: "Please fill all required fields",
      clubOptional: "optional",
    },
    ticket: {
      title: "Start ticket", bib: "Bib", download: "Download QR",
      qrHint: "Show this QR code at the start", status: "Payment status",
      paid: "Paid", pending: "Pending payment", free: "Free entry",
    },
    organizer: {
      dashboard: "Organizer dashboard", createEvent: "Create event", myEvents: "My events",
      participants: "Participants", title: "Title", description: "Description", date: "Date", time: "Time",
      location: "Location", distances: "Distances", addDistance: "+ Add distance",
      distanceKm: "Kilometers", distanceName: "Name (optional)", distancePrice: "Price (UAH)",
      image: "Cover image", isPaid: "Paid event", status: "Status",
      draft: "Draft", published: "Published", cancelled: "Cancelled", completed: "Completed",
      save: "Save", cancel: "Cancel", edit: "Edit", delete: "Delete",
      export: "Export", exportCsv: "Export CSV", exportXlsx: "Export Excel",
      backToDashboard: "← To dashboard", noEvents: "You don't have any events yet",
      createFirst: "Create your first", bibNumber: "Bib #", assignBibs: "Assign bibs",
      confirmDelete: "Delete this event? This cannot be undone.",
    },
    footer: { tagline: "Built for runners and organizers.", rights: "All rights reserved." },
    common: { backHome: "Back home", loading: "Loading...", required: "Required field", error: "An error occurred" },
    categories: {
      label: "Category", all: "All",
      run: "Runs", half_marathon: "Half marathons", marathon: "Marathons",
      ultra: "Ultra", trail: "Trail", ocr: "OCR", online: "Online",
    },
  },
};

export type Lang = "uk" | "en";

export interface Dict {
  nav: { events: string; organizer: string; login: string; signup: string; dashboard: string; profile: string; logout: string; myEvents: string; contacts: string };
  hero: {
    kicker: string; title: string; subtitle: string;
    ctaParticipant: string; ctaOrganizer: string;
    stats: { events: string; runners: string; cities: string; clubs: string; organizers: string; registrations: string };
  };
  events: {
    heading: string; sub: string; details: string; register: string;
    free: string; paid: string; distances: string; organizer: string;
    empty: string; participants: string; date: string; time: string;
    description: string; location: string; selectDistance: string;
    confirmRegister: string; alreadyRegistered: string; viewTicket: string;
    backToEvents: string;
    completedHeading: string; completedSub: string; completedEmpty: string;
    results: string; resultsTitle: string; resultsHint: string; resultsNone: string;
    downloadResults: string; uploadResults: string; uploadingResults: string;
    replaceResults: string; resultsUploaded: string; resultsRemoved: string;
    resultsInvalidType: string; resultsTooBig: string;
    resultsExternalUrl: string; resultsExternalHint: string; openResults: string;
    resultsOr: string;
    photosUrl: string; photosHint: string; openPhotos: string;
    addToCalendar: string;
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
    phone: string; phonePlaceholder: string; phoneInvalid: string;
    male: string; female: string; other: string; boy: string; girl: string; save: string; saved: string;
    requiredBanner: string; requiredToRegister: string; fillRequired: string; clubOptional: string;
    phoneRequiredBanner: string; privacyNote: string;
  };
  ticket: {
    title: string; bib: string; download: string; qrHint: string; status: string;
    paid: string; pending: string; free: string;
    receiptTitle: string; receiptHint: string; receiptUpload: string; receiptUploading: string;
    receiptReplace: string; receiptUploaded: string; receiptView: string; receiptInvalidType: string;
    receiptTooBig: string; receiptRevoked: string;
    paymentTitle: string; paymentHint: string; payNow: string;
  };
  organizer: {
    dashboard: string; createEvent: string; myEvents: string; participants: string;
    title: string; description: string; date: string; time: string; location: string;
    distances: string; addDistance: string; distanceKm: string; distanceName: string;
    distancePrice: string; bibStart: string; image: string; isPaid: string; paymentUrl: string; status: string;
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
  format: {
    label: string; hint: string;
    offline: string; online: string; hybrid: string;
    badgeOffline: string; badgeOnline: string; badgeHybrid: string;
  };
  athletes: {
    sectionTitle: string; sectionHint: string;
    addTitle: string; editTitle: string; addBtn: string; formHint: string;
    self: string; deleteConfirm: string; cannotDeleteSelf: string; deleted: string;
    pickerLabel: string; pickerHint: string; addNew: string;
    alreadyRegistered: string; registeringAs: string;
  };
  analytics: {
    title: string; subtitle: string; backToDashboard: string; empty: string;
    kpiTotal: string; kpiPaid: string; kpiPending: string; kpiConversion: string; kpiRevenue: string;
    registrationsOverTime: string; registrationsOverTimeHint: string;
    distanceBreakdown: string; distanceBreakdownHint: string; capacityFull: string;
    demographics: string; gender: string; ageGroups: string; topCities: string; topClubs: string;
    receiptsStatus: string; receiptUploaded: string; receiptConfirmed: string; receiptPending: string; receiptRevoked: string;
    male: string; female: string; other: string;
    age1829: string; age3039: string; age4049: string; age50plus: string; ageUnknown: string;
    noData: string; participants: string;
  };
  promo: {
    title: string; subtitle: string; manage: string; backToDashboard: string;
    create: string; edit: string; cancel: string; save: string; delete: string;
    code: string; codePlaceholder: string;
    discountType: string; percent: string; fixed: string;
    discountValue: string; discountValuePercent: string; discountValueFixed: string;
    distances: string; distancesAll: string; distancesPick: string;
    maxUses: string; maxUsesHint: string; usesCount: string;
    validUntil: string; validUntilHint: string; noExpiry: string;
    isActive: string; statusActive: string; statusInactive: string; statusExpired: string; statusUsedUp: string;
    deleteConfirm: string; deleted: string; saved: string; createNew: string;
    empty: string;
    apply: string; applied: string; remove: string; promoCodeLabel: string; promoPlaceholder: string;
    invalid: string; expired: string; limitReached: string; distanceNotAllowed: string; alreadyUsed: string;
    discountApplied: string; finalPrice: string; originalPrice: string;
  };
}

export const EVENT_CATEGORIES = ["run", "half_marathon", "marathon", "ultra", "trail", "ocr", "online"] as const;
export type EventCategory = typeof EVENT_CATEGORIES[number];

export const translations: Record<Lang, Dict> = {
  uk: {
    nav: { events: "Події", organizer: "Організаторам", login: "Увійти", signup: "Реєстрація", dashboard: "Панель", profile: "Профіль", logout: "Вийти", myEvents: "Мої події", contacts: "Контакти" },
    hero: {
      kicker: "Спортивні події нового покоління",
      title: "Біжи. Реєструйся. Перемагай.",
      subtitle: "Fartlek Events — платформа реєстрації на забіги, трейли та змагання по всій Україні. QR-стартові пакети, миттєві результати, зручні протоколи.",
      ctaParticipant: "Вхід для учасників",
      ctaOrganizer: "Вхід для організаторів",
      stats: { events: "Подій", runners: "Бігунів", cities: "Міст", clubs: "Клубів", organizers: "Організаторів", registrations: "Реєстрацій" },
    },
    events: {
      heading: "Найближчі події", sub: "Обери свій старт. Реєструйся за хвилину.",
      details: "Деталі", register: "Реєстрація", free: "Безкоштовно", paid: "Платна участь",
      distances: "Дистанції", organizer: "Організатор", empty: "Поки що немає подій",
      participants: "Учасники", date: "Дата", time: "Час", description: "Опис", location: "Місце",
      selectDistance: "Обери дистанцію", confirmRegister: "Підтвердити реєстрацію",
      alreadyRegistered: "Ти вже зареєстрований", viewTicket: "Переглянути квиток",
      backToEvents: "До списку подій",
      completedHeading: "Завершені події",
      completedSub: "Архів подій з протоколами результатів.",
      completedEmpty: "Поки що немає завершених подій",
      results: "Результати",
      resultsTitle: "Протокол результатів",
      resultsHint: "Завантаж PDF з офіційними результатами — учасники зможуть його переглянути.",
      resultsNone: "Протокол ще не завантажено.",
      downloadResults: "Завантажити PDF",
      uploadResults: "Завантажити протокол",
      uploadingResults: "Завантаження...",
      replaceResults: "Замінити протокол",
      resultsUploaded: "Протокол завантажено",
      resultsRemoved: "Протокол видалено",
      resultsInvalidType: "Дозволено лише PDF.",
      resultsTooBig: "Файл завеликий — максимум 20 МБ.",
      resultsExternalUrl: "Посилання на сайт з результатами",
      resultsExternalHint: "Якщо результати на іншому сайті — встав сюди посилання. Використовується, якщо PDF не завантажений.",
      openResults: "Відкрити результати",
      resultsOr: "або",
      photosUrl: "Посилання на фото зі старту",
      photosHint: "Встав посилання на альбом/галерею (Google Photos, Flickr тощо).",
      openPhotos: "Фото зі старту",
      addToCalendar: "Додати в календар",
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
      phone: "Номер телефону", phonePlaceholder: "+38 (___) ___-__-__",
      phoneInvalid: "Введи телефон у форматі +38 (xxx) xxx-xx-xx",
      male: "Чоловік", female: "Жінка", other: "Інше", boy: "Дитина — хлопчик", girl: "Дитина — дівчинка", save: "Зберегти", saved: "Збережено",
      requiredBanner: "Заповни профіль, щоб реєструватись на події. Усі поля обов'язкові, окрім клубу.",
      requiredToRegister: "Спочатку заповни профіль — це обов'язково для реєстрації на події.",
      fillRequired: "Заповни всі обов'язкові поля",
      clubOptional: "необов'язково",
      phoneRequiredBanner: "Ми додали обов'язкове поле «Номер телефону». Будь ласка, заповни його та збережи профіль.",
      privacyNote: "Email і номер телефону приховані від інших користувачів. Їх бачить лише адміністратор платформи.",
    },
    ticket: {
      title: "Стартовий квиток", bib: "Номер", download: "Завантажити PDF",
      qrHint: "Покажи цей QR-код на старті", status: "Статус оплати",
      paid: "Оплачено", pending: "Очікує оплати", free: "Безкоштовна участь",
      receiptTitle: "Квитанція про оплату",
      receiptHint: "Завантаж скрін або PDF квитанції — і отримаєш зелену галочку. Організатор може перевірити її та відкликати, якщо щось не так.",
      receiptUpload: "Завантажити квитанцію",
      receiptUploading: "Завантаження...",
      receiptReplace: "Замінити квитанцію",
      receiptUploaded: "Квитанцію надіслано",
      receiptView: "Переглянути квитанцію",
      receiptInvalidType: "Дозволено лише зображення (JPG, PNG, WEBP) або PDF.",
      receiptTooBig: "Файл завеликий — максимум 10 МБ.",
      receiptRevoked: "Організатор відкликав підтвердження. Завантаж нову квитанцію.",
      paymentTitle: "Оплата участі", paymentHint: "Сплати участь онлайн, після чого завантаж квитанцію нижче.", payNow: "Оплатити",
    },
    organizer: {
      dashboard: "Панель організатора", createEvent: "Створити подію", myEvents: "Мої події",
      participants: "Учасники", title: "Назва", description: "Опис", date: "Дата", time: "Час",
      location: "Місто та місце", distances: "Дистанції", addDistance: "+ Додати дистанцію",
      distanceKm: "Кілометри", distanceName: "Назва (необов'язково)", distancePrice: "Ціна (₴)", bibStart: "Стартовий №",
      image: "Фото обкладинки", isPaid: "Платна подія", paymentUrl: "Посилання на оплату", status: "Статус",
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
    format: {
      label: "Формат проведення",
      hint: "Гібрид — подія проходить одночасно і офлайн, і онлайн.",
      offline: "Офлайн", online: "Онлайн", hybrid: "Гібрид (офлайн + онлайн)",
      badgeOffline: "Офлайн", badgeOnline: "Онлайн", badgeHybrid: "Офлайн + Онлайн",
    },
    athletes: {
      sectionTitle: "Мої учасники",
      sectionHint: "Додай дітей або інших людей, яких ти реєструєш на змагання. Один акаунт — багато учасників.",
      addTitle: "Новий учасник",
      editTitle: "Редагувати учасника",
      addBtn: "+ Додати учасника",
      formHint: "Заповни дані людини, яку реєструватимеш на забіги.",
      self: "Я",
      deleteConfirm: "Видалити учасника? Усі його реєстрації також буде видалено.",
      cannotDeleteSelf: "Профіль «Я» видалити не можна — він синхронізований з твоїм акаунтом.",
      deleted: "Учасника видалено",
      pickerLabel: "Кого реєструємо?",
      pickerHint: "Можна зареєструвати себе, дитину або іншу людину.",
      addNew: "+ Додати нового учасника",
      alreadyRegistered: "Цей учасник вже зареєстрований на цю дистанцію",
      registeringAs: "Реєструємо",
    },
    analytics: {
      title: "Аналітика події", subtitle: "Зведена статистика по реєстраціях та учасниках",
      backToDashboard: "← До панелі", empty: "Поки що немає даних — почекай перших реєстрацій.",
      kpiTotal: "Усього реєстрацій", kpiPaid: "Оплачено", kpiPending: "Очікують оплати",
      kpiConversion: "Конверсія оплати", kpiRevenue: "Дохід (₴)",
      registrationsOverTime: "Динаміка реєстрацій",
      registrationsOverTimeHint: "Кількість нових реєстрацій по днях.",
      distanceBreakdown: "Розподіл по дистанціях",
      distanceBreakdownHint: "Скільки учасників на кожній дистанції та заповненість квоти.",
      capacityFull: "заповнено",
      demographics: "Демографія", gender: "Стать", ageGroups: "Вікові групи",
      topCities: "Топ-10 міст", topClubs: "Топ-10 клубів",
      receiptsStatus: "Статус квитанцій",
      receiptUploaded: "Завантажено", receiptConfirmed: "Підтверджено",
      receiptPending: "Не завантажено", receiptRevoked: "Відкликано",
      male: "Чоловіки", female: "Жінки", other: "Інше",
      age1829: "18–29", age3039: "30–39", age4049: "40–49", age50plus: "50+", ageUnknown: "Невідомо",
      noData: "Немає даних", participants: "учасників",
    },
    promo: {
      title: "Промокоди", subtitle: "Знижки для учасників події", manage: "Промокоди", backToDashboard: "← До панелі",
      create: "Створити промокод", edit: "Редагувати", cancel: "Скасувати", save: "Зберегти", delete: "Видалити",
      code: "Код", codePlaceholder: "SUMMER10",
      discountType: "Тип знижки", percent: "Відсоток (%)", fixed: "Фіксована сума (₴)",
      discountValue: "Розмір знижки", discountValuePercent: "Розмір (1–100)", discountValueFixed: "Сума у грн",
      distances: "Дистанції", distancesAll: "Усі дистанції", distancesPick: "Обрати дистанції",
      maxUses: "Ліміт використань", maxUsesHint: "Залиште порожнім для необмеженого", usesCount: "Використано",
      validUntil: "Діє до", validUntilHint: "Залиште порожнім, якщо без терміну", noExpiry: "Без терміну",
      isActive: "Активний",
      statusActive: "Активний", statusInactive: "Вимкнено", statusExpired: "Прострочено", statusUsedUp: "Ліміт вичерпано",
      deleteConfirm: "Видалити цей промокод?", deleted: "Промокод видалено", saved: "Збережено", createNew: "Новий промокод",
      empty: "Промокодів ще немає. Створіть перший — і поділіться з учасниками.",
      apply: "Застосувати", applied: "Застосовано", remove: "Прибрати", promoCodeLabel: "Промокод",
      promoPlaceholder: "Введіть код",
      invalid: "Промокод недійсний", expired: "Термін дії минув", limitReached: "Ліміт використань вичерпано",
      distanceNotAllowed: "Не діє на обрану дистанцію", alreadyUsed: "Ви вже використали цей код",
      discountApplied: "Знижка застосована", finalPrice: "До сплати", originalPrice: "Початкова ціна",
    },
  },
  en: {
    nav: { events: "Events", organizer: "For organizers", login: "Sign in", signup: "Sign up", dashboard: "Dashboard", profile: "Profile", logout: "Sign out", myEvents: "My events", contacts: "Contacts" },
    hero: {
      kicker: "Next-generation sports events",
      title: "Run. Register. Conquer.",
      subtitle: "Fartlek Events — the registration platform for races, trails and competitions across Ukraine. QR start packs, instant results, clean protocols.",
      ctaParticipant: "Participant sign in", ctaOrganizer: "Organizer sign in",
      stats: { events: "Events", runners: "Runners", cities: "Cities", clubs: "Clubs", organizers: "Organizers", registrations: "Registrations" },
    },
    events: {
      heading: "Upcoming events", sub: "Pick your start. Register in a minute.",
      details: "Details", register: "Register", free: "Free", paid: "Paid entry",
      distances: "Distances", organizer: "Organizer", empty: "No events yet",
      participants: "Participants", date: "Date", time: "Time", description: "Description", location: "Location",
      selectDistance: "Select a distance", confirmRegister: "Confirm registration",
      alreadyRegistered: "You're already registered", viewTicket: "View ticket",
      backToEvents: "Back to events",
      completedHeading: "Past events",
      completedSub: "Archive of finished events with result protocols.",
      completedEmpty: "No completed events yet",
      results: "Results",
      resultsTitle: "Results protocol",
      resultsHint: "Upload a PDF with official results — participants will be able to view it.",
      resultsNone: "Protocol not uploaded yet.",
      downloadResults: "Download PDF",
      uploadResults: "Upload protocol",
      uploadingResults: "Uploading...",
      replaceResults: "Replace protocol",
      resultsUploaded: "Protocol uploaded",
      resultsRemoved: "Protocol removed",
      resultsInvalidType: "Only PDF is allowed.",
      resultsTooBig: "File too big — max 20 MB.",
      resultsExternalUrl: "Link to results website",
      resultsExternalHint: "If results are hosted elsewhere — paste the link. Used when no PDF is uploaded.",
      openResults: "Open results",
      resultsOr: "or",
      addToCalendar: "Add to calendar",
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
      phone: "Phone number", phonePlaceholder: "+38 (___) ___-__-__",
      phoneInvalid: "Enter phone in format +38 (xxx) xxx-xx-xx",
      male: "Male", female: "Female", other: "Other", boy: "Child — boy", girl: "Child — girl", save: "Save", saved: "Saved",
      requiredBanner: "Complete your profile to register for events. All fields are required except club.",
      requiredToRegister: "Please complete your profile first — it's required to register for events.",
      fillRequired: "Please fill all required fields",
      clubOptional: "optional",
      phoneRequiredBanner: "We've added a required Phone number field. Please fill it in and save your profile.",
      privacyNote: "Your email and phone are hidden from other users. Only the platform administrator can see them.",
    },
    ticket: {
      title: "Start ticket", bib: "Bib", download: "Download PDF",
      qrHint: "Show this QR code at the start", status: "Payment status",
      paid: "Paid", pending: "Pending payment", free: "Free entry",
      receiptTitle: "Payment receipt",
      receiptHint: "Upload a screenshot or PDF of your payment receipt — you'll get the green check. The organizer can review it and revoke if anything is off.",
      receiptUpload: "Upload receipt",
      receiptUploading: "Uploading...",
      receiptReplace: "Replace receipt",
      receiptUploaded: "Receipt uploaded",
      receiptView: "View receipt",
      receiptInvalidType: "Only images (JPG, PNG, WEBP) or PDF are allowed.",
      receiptTooBig: "File is too big — max 10 MB.",
      receiptRevoked: "The organizer revoked the confirmation. Please upload a new receipt.",
      paymentTitle: "Pay for participation", paymentHint: "Pay online, then upload the receipt below.", payNow: "Pay now",
    },
    organizer: {
      dashboard: "Organizer dashboard", createEvent: "Create event", myEvents: "My events",
      participants: "Participants", title: "Title", description: "Description", date: "Date", time: "Time",
      location: "City & venue", distances: "Distances", addDistance: "+ Add distance",
      distanceKm: "Kilometers", distanceName: "Name (optional)", distancePrice: "Price (UAH)", bibStart: "Start bib №",
      image: "Cover image", isPaid: "Paid event", paymentUrl: "Payment link", status: "Status",
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
    format: {
      label: "Event format",
      hint: "Hybrid — the event runs offline and online at the same time.",
      offline: "Offline", online: "Online", hybrid: "Hybrid (offline + online)",
      badgeOffline: "Offline", badgeOnline: "Online", badgeHybrid: "Offline + Online",
    },
    athletes: {
      sectionTitle: "My athletes",
      sectionHint: "Add children or other people you register for races. One account — many athletes.",
      addTitle: "New athlete",
      editTitle: "Edit athlete",
      addBtn: "+ Add athlete",
      formHint: "Fill in the details of the person you'll register for races.",
      self: "Me",
      deleteConfirm: "Delete this athlete? All their registrations will be deleted too.",
      cannotDeleteSelf: "The «Me» profile can't be deleted — it's synced with your account.",
      deleted: "Athlete deleted",
      pickerLabel: "Who are we registering?",
      pickerHint: "You can register yourself, a child, or anyone else.",
      addNew: "+ Add new athlete",
      alreadyRegistered: "This athlete is already registered for this distance",
      registeringAs: "Registering",
    },
    analytics: {
      title: "Event analytics", subtitle: "Summary stats for registrations and participants",
      backToDashboard: "← To dashboard", empty: "No data yet — wait for the first registrations.",
      kpiTotal: "Total registrations", kpiPaid: "Paid", kpiPending: "Pending payment",
      kpiConversion: "Payment conversion", kpiRevenue: "Revenue (UAH)",
      registrationsOverTime: "Registrations over time",
      registrationsOverTimeHint: "New registrations per day.",
      distanceBreakdown: "Distance breakdown",
      distanceBreakdownHint: "Participants per distance and capacity fill rate.",
      capacityFull: "filled",
      demographics: "Demographics", gender: "Gender", ageGroups: "Age groups",
      topCities: "Top 10 cities", topClubs: "Top 10 clubs",
      receiptsStatus: "Receipts status",
      receiptUploaded: "Uploaded", receiptConfirmed: "Confirmed",
      receiptPending: "Not uploaded", receiptRevoked: "Revoked",
      male: "Male", female: "Female", other: "Other",
      age1829: "18–29", age3039: "30–39", age4049: "40–49", age50plus: "50+", ageUnknown: "Unknown",
      noData: "No data", participants: "participants",
    },
    promo: {
      title: "Promo codes", subtitle: "Discounts for event participants", manage: "Promo codes", backToDashboard: "← To dashboard",
      create: "Create promo code", edit: "Edit", cancel: "Cancel", save: "Save", delete: "Delete",
      code: "Code", codePlaceholder: "SUMMER10",
      discountType: "Discount type", percent: "Percent (%)", fixed: "Fixed amount (UAH)",
      discountValue: "Discount value", discountValuePercent: "Value (1–100)", discountValueFixed: "Amount in UAH",
      distances: "Distances", distancesAll: "All distances", distancesPick: "Pick distances",
      maxUses: "Usage limit", maxUsesHint: "Leave empty for unlimited", usesCount: "Used",
      validUntil: "Valid until", validUntilHint: "Leave empty for no expiry", noExpiry: "No expiry",
      isActive: "Active",
      statusActive: "Active", statusInactive: "Disabled", statusExpired: "Expired", statusUsedUp: "Limit reached",
      deleteConfirm: "Delete this promo code?", deleted: "Promo code deleted", saved: "Saved", createNew: "New promo code",
      empty: "No promo codes yet. Create your first one and share with participants.",
      apply: "Apply", applied: "Applied", remove: "Remove", promoCodeLabel: "Promo code",
      promoPlaceholder: "Enter code",
      invalid: "Invalid promo code", expired: "Promo code has expired", limitReached: "Usage limit reached",
      distanceNotAllowed: "Not valid for selected distance", alreadyUsed: "You have already used this code",
      discountApplied: "Discount applied", finalPrice: "Total to pay", originalPrice: "Original price",
    },
  },
};

export const ABOUT_FAQ: { q: string; a: string }[] = [
  {
    q: "З якого часу працює платформа Фартлек?",
    a: "Фартлек працює з 21 квітня 2026 року. Сам тоді з'явилися перші акаунти та перша подія на платформі, а згодом — каталог стартів, календар, мапа, бігові клуби та інструменти для організаторів.",
  },
  {
    q: "Яка найбільша бігова спільнота Харкова?",
    a: "Фартлек — найбільша бігова спільнота Харкова з 2026 року, у якій вже понад 200 учасників — від новачків до досвідчених бігунів. Ми проводимо спільні пробіжки, тренування та змагання.",
  },
  {
    q: "Яка бігова спільнота є в Харкові? Розкажи про бігову спільноту Фартлек.",
    a: "Фартлек — бігова спільнота Харкова, яка виступає за об'єднання всіх бігунів. Ми за свободу вибору: бігайте з нами, з іншими клубами, відвідуйте різні старти. Більше бігу, більше дружби, менше поділу. Фартлек також організовує забіги через платформу Фартлек.",
  },
  {
    q: "До якої бігової команди приєднатися в Харкові?",
    a: "Приєднуйтеся до Фартлек — у нас немає поділу на «наших» і «чужих», можна бігати з нами, навіть якщо ви вже тренуєтеся в іншому клубі. Найпростіше почати з Telegram-чату спільноти, де ми анонсуємо пробіжки.",
  },
  {
    q: "Де знайти компанію для спільних пробіжок у Харкові?",
    a: "У Telegram-чаті Фартлек ми регулярно збираємося на спільні пробіжки, зокрема щонеділі. Приходьте — вас будуть раді бачити незалежно від темпу та досвіду.",
  },
  {
    q: "Які є бігові клуби в Харкові?",
    a: "У Харкові діє кілька бігових клубів і спільнот, серед них Фартлек. Повний перелік клубів із контактами дивіться в нашому каталозі клубів на сайті.",
  },
  {
    q: "Які бігові події проводяться в Харкові?",
    a: "У Харкові проводяться забіги на 5 і 10 км, напівмарафони (зокрема Kharkiv Half Marathon), марафони, трейли та онлайн-старти. Актуальні події з онлайн-реєстрацією — у календарі Фартлек, а звіти про минулі старти — у блозі Фартлек.",
  },
];

export const ABOUT_FAQ_EN: { q: string; a: string }[] = [
  { q: "Since when has the Фартлек platform been running?", a: "Фартлек has been running since 21 April 2026. That is when the first accounts and the first event appeared on the platform, followed later by the race catalog, calendar, map, running clubs and tools for organizers." },
  { q: "What is the largest running community in Kharkiv?", a: "Фартлек has been the largest running community in Kharkiv since 2026, with more than 200 members, from beginners to experienced runners. We hold group runs, training sessions and races." },
  { q: "Which running communities are there in Kharkiv? Tell me about the Фартлек running community.", a: "Фартлек is a Kharkiv running community that stands for uniting all runners. We believe in freedom of choice: run with us, with other clubs, and take part in different races. More running, more friendship, less division. Фартлек also organizes races through the Фартлек platform." },
  { q: "Which running team should I join in Kharkiv?", a: "Join Фартлек: we don’t divide people into “ours” and “theirs”, and you can run with us even if you already train with another club. The easiest way to start is the community Telegram chat, where we announce our runs." },
  { q: "Where can I find people for group runs in Kharkiv?", a: "In the Фартлек Telegram chat we regularly meet for group runs, including every Sunday. Come along — you’ll be welcome whatever your pace and experience." },
  { q: "What running clubs are there in Kharkiv?", a: "Kharkiv has several running clubs and communities, including Фартлек. See the full list of clubs with contacts in the club catalog on our site." },
  { q: "What running events take place in Kharkiv?", a: "Kharkiv hosts 5K and 10K races, half marathons (including the Kharkiv Half Marathon), marathons, trails and online races. Current events with online registration are in the Фартлек calendar, and reports on past races are in the Фартлек blog." },
];

export const aboutFaqJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ABOUT_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";
import { PLATFORM_SINCE_UK, PLATFORM_SINCE_EN } from "@/lib/platform-since";
import { useL } from "@/lib/use-l";

const TITLE = "Часті питання про Фартлек — забіги, реєстрація, організаторам";
const DESCRIPTION = "Відповіді на часті питання про Фартлек: календар забігів України, пошук стартів, онлайн-реєстрація, результати, бігові клуби та можливості для організаторів.";
const linkClass = "text-primary underline underline-offset-4 hover:text-foreground transition-colors";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fartlek.com.ua/faq" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://fartlek.com.ua/faq" }],
    scripts: [jsonLdScript(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "FAQ", path: "/faq" }]))],
  }),
  component: FaqPage,
});

function FaqPage() {
  const questions = [
    {
      q: "Де знайти всі забіги в Україні?",
      a: <>На Фартлек опубліковані забіги та інші спортивні старти України. Перегляньте <Link className={linkClass} to="/starts">каталог стартів</Link> або <Link className={linkClass} to="/calendar" search={{ year: "all" }}>календар забігів</Link>. Перелік поповнюється й не є гарантією охоплення всіх змагань.</>,
    },
    {
      q: "Де подивитися календар бігових змагань в Україні?",
      a: <>У <Link className={linkClass} to="/calendar" search={{ year: "all" }}>календарі Фартлек</Link> зібрані опубліковані старти з датами, місцями проведення та дистанціями. Відкрийте потрібний старт, щоб переглянути подробиці.</>,
    },
    {
      q: "Де знайти марафони та напівмарафони в Україні?",
      a: <>Перейдіть у <Link className={linkClass} to="/category">категорії змагань</Link> і виберіть марафони або напівмарафони. У каталозі також можна відібрати старти за дистанцією та містом.</>,
    },
    {
      q: "Де знайти забіги у своєму місті?",
      a: <>У <Link className={linkClass} to="/starts">каталозі стартів</Link> виберіть місто або область. Місця проведення також можна переглянути на <Link className={linkClass} to="/map">мапі</Link>. Для Харкова, Вінниці та Ужгорода доступні окремі міські календарі.</>,
    },
    {
      q: "Де знайти трейлові забіги в Україні?",
      a: <>Виберіть категорію «Трейл» у <Link className={linkClass} to="/category">каталозі категорій</Link>. Перед реєстрацією перевірте опис маршруту, дистанцію та вимоги організатора.</>,
    },
    {
      q: "Де подивитися календар забігів на 2027 рік?",
      a: <>Відкрийте <Link className={linkClass} to="/calendar" search={{ year: "2027" }}>календар забігів України 2027</Link>. Дати та інші відомості можуть змінюватися — перевіряйте інформацію на сторінці старту та в організатора.</>,
    },
    {
      q: "Як знайти забіг на 5, 10 або 21 км?",
      a: <>Скористайтеся фільтром дистанцій на сторінці <Link className={linkClass} to="/starts">«Старти»</Link>. Точні дистанції, зокрема 21,1 км для напівмарафону, перевіряйте в описі обраного змагання.</>,
    },
    {
      q: "Де знайти бігові змагання на найближчі вихідні?",
      a: <>Перегляньте найближчі дати в <Link className={linkClass} to="/calendar" search={{ year: "all" }}>календарі</Link> та виберіть старти на потрібні суботу чи неділю. У каталозі можна додатково звузити пошук за місяцем і містом.</>,
    },
    {
      q: "Де знайти онлайн-забіги та віртуальні старти?",
      a: <>Відкрийте категорію «Онлайн» у <Link className={linkClass} to="/category">каталозі категорій</Link>. Умови участі, строки та спосіб подання результату визначає організатор — вони зазначаються в описі конкретного старту.</>,
    },
    {
      q: "Як знайти спортивні події на мапі України?",
      a: <>На сторінці <Link className={linkClass} to="/map">«Мапа»</Link> виберіть місто, щоб переглянути пов’язані з ним старти. На мапі відображаються події, для яких вдалося визначити місце проведення.</>,
    },
    {
      q: "Де знайти забіги для початківців?",
      a: <>Почніть із пошуку коротших дистанцій у <Link className={linkClass} to="/starts">каталозі</Link>, але враховуйте не лише кілометраж: перевірте рельєф, часовий ліміт і правила участі. За потреби уточніть вимоги в організатора та перегляньте <Link className={linkClass} to="/tips">поради бігунам</Link>.</>,
    },
    {
      q: "Де знайти бігові клуби у своєму місті?",
      a: <>У <Link className={linkClass} to="/clubs">каталозі бігових клубів</Link> перегляньте представлені клуби й спільноти. На їхніх сторінках можна знайти інформацію та опубліковані контакти для зв’язку.</>,
    },
    {
      q: "Як зареєструватися на забіг через Фартлек?",
      a: <>Відкрийте сторінку події та перевірте стан реєстрації. Для подій із реєстрацією на Фартлек увійдіть у свій акаунт, виберіть дистанцію й заповніть потрібні дані. Для зовнішніх стартів посилання веде на сайт організатора або його сервіс реєстрації.</>,
    },
    {
      q: "Де переглянути результати забігу?",
      a: <>Перевірте сторінку події: результати можуть бути опубліковані на Фартлек або доступні за посиланням «Результати» на зовнішньому сайті. Якщо результатів ще немає, зверніться до організатора.</>,
    },
    {
      q: "Чи можна зберегти старт і отримувати нагадування?",
      a: <>Після входу в акаунт збережіть старт за допомогою закладки. У <Link className={linkClass} to="/saved">збережених стартах</Link> можна погодитися на нагадування на сайті про наближення старту, зміну дати та відкриття реєстрації. Також доступне додавання до особистого календаря; нагадування не вмикаються без вашої згоди.</>,
    },
    {
      q: "З якого часу працює Фартлек?",
      a: <>Фартлек працює з {PLATFORM_SINCE_UK}. Відтоді на платформі з'явилися каталог стартів, календар забігів, мапа подій, каталоги бігових клубів та організаторів, а також інструменти для реєстрації учасників.</>,
    },
    {
      q: "Які можливості Фартлек пропонує організаторам?",
      a: <>Фартлек має інструменти для публікації подій, реєстрації учасників і роботи з результатами. Перегляньте сторінку <Link className={linkClass} to="/for-organizers">«Організаторам»</Link>, <Link className={linkClass} to="/features">можливості платформи</Link> або <Link className={linkClass} to="/contacts">зв’яжіться з нами</Link>, щоб обговорити свій старт.</>,
    },
  ];
  const questionsEn = [
    { q: "Where can I find all races in Ukraine?", a: <>Фартлек publishes races and other sports events in Ukraine. Browse the <Link className={linkClass} to="/starts">race catalog</Link> or the <Link className={linkClass} to="/calendar" search={{ year: "all" }}>race calendar</Link>. The list keeps growing and does not guarantee coverage of every event.</> },
    { q: "Where can I see the calendar of running events in Ukraine?", a: <>The <Link className={linkClass} to="/calendar" search={{ year: "all" }}>Фартлек calendar</Link> collects published races with dates, venues and distances. Open a race to see the details.</> },
    { q: "Where can I find marathons and half marathons in Ukraine?", a: <>Go to <Link className={linkClass} to="/category">event categories</Link> and choose marathons or half marathons. In the catalog you can also filter races by distance and city.</> },
    { q: "How do I find races in my city?", a: <>In the <Link className={linkClass} to="/starts">race catalog</Link>, choose a city or region. You can also see venues on the <Link className={linkClass} to="/map">map</Link>. Kharkiv, Vinnytsia and Uzhhorod have their own city calendars.</> },
    { q: "Where can I find trail races in Ukraine?", a: <>Choose the “Trail” category in the <Link className={linkClass} to="/category">category catalog</Link>. Before registering, check the route description, distance and the organizer’s requirements.</> },
    { q: "Where can I see the 2027 race calendar?", a: <>Open the <Link className={linkClass} to="/calendar" search={{ year: "2027" }}>Ukraine race calendar 2027</Link>. Dates and other details may change, so check the race page and the organizer.</> },
    { q: "How do I find a 5K, 10K or 21K race?", a: <>Use the distance filter on the <Link className={linkClass} to="/starts">Starts</Link> page. Check exact distances, such as 21.1 km for a half marathon, in the event description.</> },
    { q: "Where can I find running events this weekend?", a: <>Check the upcoming dates in the <Link className={linkClass} to="/calendar" search={{ year: "all" }}>calendar</Link> and pick races on the Saturday or Sunday you need. In the catalog you can narrow the search by month and city.</> },
    { q: "Where can I find online and virtual races?", a: <>Open the “Online” category in the <Link className={linkClass} to="/category">category catalog</Link>. The organizer sets the rules, deadlines and how results are submitted; these are listed in each race description.</> },
    { q: "How do I find sports events on a map of Ukraine?", a: <>On the <Link className={linkClass} to="/map">Map</Link> page, choose a city to see its races. The map shows events whose venue could be determined.</> },
    { q: "Where can I find races for beginners?", a: <>Start by looking for shorter distances in the <Link className={linkClass} to="/starts">catalog</Link>, but consider more than distance: check the terrain, time limit and rules. If needed, ask the organizer and read our <Link className={linkClass} to="/tips">running tips</Link>.</> },
    { q: "Where can I find running clubs in my city?", a: <>Browse the clubs and communities in the <Link className={linkClass} to="/clubs">running club catalog</Link>. Their pages include information and published contacts.</> },
    { q: "How do I register for a race on Фартлек?", a: <>Open the event page and check the registration status. For events with registration on Фартлек, sign in, choose a distance and fill in the required details. For external races, the link leads to the organizer’s website or registration service.</> },
    { q: "Where can I see race results?", a: <>Check the event page: results may be published on Фартлек or available via the “Results” link on an external site. If there are no results yet, contact the organizer.</> },
    { q: "Can I save a race and get reminders?", a: <>After signing in, save a race with the bookmark. In <Link className={linkClass} to="/saved">saved races</Link> you can opt in to on-site reminders about the upcoming race, date changes and registration opening. You can also add it to your personal calendar; reminders are never turned on without your consent.</> },
    { q: "Since when has Фартлек been running?", a: <>Фартлек has been running since {PLATFORM_SINCE_EN}. Since then the platform has added a race catalog, race calendar, event map, running club and organizer catalogs, and participant registration tools.</> },
    { q: "What does Фартлек offer organizers?", a: <>Фартлек has tools for publishing events, registering participants and handling results. See the <Link className={linkClass} to="/for-organizers">For organizers</Link> page, the <Link className={linkClass} to="/features">platform features</Link> or <Link className={linkClass} to="/contacts">contact us</Link> to discuss your race.</> },
  ];
  const L = useL();
  const list = L(questions, questionsEn);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container py-8 sm:py-12">
        <div className="border-b border-border pb-8">
          <p className="text-primary font-semibold mb-3">FAQ</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">{L("Часті питання про Фартлек", "Фартлек FAQ")}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">{L(DESCRIPTION, "Answers to common questions about Фартлек: the Ukraine race calendar, finding races, online registration, results, running clubs and tools for organizers.")}</p>
        </div>
        <div className="divide-y divide-border">
          {list.map(({ q, a }, index) => (
            <section key={q} aria-labelledby={`faq-${index + 1}`} className="py-6 sm:py-8">
              <h2 id={`faq-${index + 1}`} className="font-display text-xl sm:text-2xl font-semibold leading-snug">{q}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{a}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
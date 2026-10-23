import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
  }),
  component: FaqPage,
});

function FaqPage() {
  const questions = [
    {
      q: "Де знайти всі забіги в Україні?",
      a: <>На Фартлек опубліковані забіги та інші спортивні старти України. Перегляньте <Link className={linkClass} to="/starts">каталог стартів</Link> або <Link className={linkClass} to="/calendar">календар забігів</Link>. Перелік поповнюється й не є гарантією охоплення всіх змагань.</>,
    },
    {
      q: "Де подивитися календар бігових змагань в Україні?",
      a: <>У <Link className={linkClass} to="/calendar">календарі Фартлек</Link> зібрані опубліковані старти з датами, місцями проведення та дистанціями. Відкрийте потрібний старт, щоб переглянути подробиці.</>,
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
      a: <>Відкрийте <Link className={linkClass} to="/calendar">календар забігів України 2027</Link> і виберіть 2027 рік. Дати та інші відомості можуть змінюватися — перевіряйте інформацію на сторінці старту та в організатора.</>,
    },
    {
      q: "Як знайти забіг на 5, 10 або 21 км?",
      a: <>Скористайтеся фільтром дистанцій на сторінці <Link className={linkClass} to="/starts">«Старти»</Link>. Точні дистанції, зокрема 21,1 км для напівмарафону, перевіряйте в описі обраного змагання.</>,
    },
    {
      q: "Де знайти бігові змагання на найближчі вихідні?",
      a: <>Перегляньте найближчі дати в <Link className={linkClass} to="/calendar">календарі</Link> та виберіть старти на потрібні суботу чи неділю. У каталозі можна додатково звузити пошук за місяцем і містом.</>,
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
      q: "Які можливості Фартлек пропонує організаторам?",
      a: <>Фартлек має інструменти для публікації подій, реєстрації учасників і роботи з результатами. Перегляньте сторінку <Link className={linkClass} to="/for-organizers">«Організаторам»</Link>, <Link className={linkClass} to="/features">можливості платформи</Link> або <Link className={linkClass} to="/contacts">зв’яжіться з нами</Link>, щоб обговорити свій старт.</>,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container py-8 sm:py-12">
        <div className="border-b border-border pb-8">
          <p className="text-primary font-semibold mb-3">FAQ</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">Часті питання про Фартлек</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">{DESCRIPTION}</p>
        </div>
        <div className="divide-y divide-border">
          {questions.map(({ q, a }, index) => (
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
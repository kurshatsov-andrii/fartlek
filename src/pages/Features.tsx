import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Users, Calendar, Ticket, MessageSquare, BarChart3, Tag, Mail, Shield, QrCode,
  Trophy, Bell, UserCircle, Edit3, Smile, Reply, AtSign, Image as ImageIcon,
  CalendarPlus, FileSpreadsheet, CreditCard, Globe, Clock, MapPin, Sparkles,
  Megaphone, Building2, CheckCircle2, ArrowDown, Truck, Repeat, Send, XCircle,
  History, Lock, Activity, Settings
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/contexts/AppContext";

type Feature = { icon: React.ComponentType<{ className?: string }>; title: string; desc: string };
type Group = { title: string; items: Feature[] };

const Features = () => {
  const { lang } = useApp();
  const isUk = lang === "uk";
  const location = useLocation();
  const [tab, setTab] = useState<string>(() =>
    location.hash === "#payments" ? "organizer" : "participant"
  );

  useEffect(() => {
    if (location.hash === "#payments") {
      setTab("organizer");
      // wait for tab content to mount
      setTimeout(() => {
        document.getElementById("payments")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [location.hash]);

  const scrollToPayments = () => {
    setTab("organizer");
    setTimeout(() => {
      document.getElementById("payments")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const seo = isUk
    ? {
        title: "Можливості Fartlek Events — для учасників та організаторів",
        description: "Детальний опис можливостей платформи Fartlek Events: реєстрація на забіги, QR-квитки, чат події, аналітика, промокоди, email-розсилки.",
      }
    : {
        title: "Fartlek Events Features — for participants and organizers",
        description: "Full feature list of Fartlek Events: race registration, QR tickets, event chat, analytics, promo codes, email campaigns.",
      };

  const participantGroups: Group[] = isUk ? [
    {
      title: "Пошук та реєстрація",
      items: [
        { icon: Calendar, title: "Каталог забігів", desc: "Усі майбутні старти України в одному місці: біг, напівмарафон, марафон, ультра, трейл, OCR, онлайн." },
        { icon: MapPin, title: "Фільтри за категоріями", desc: "Швидкий пошук за типом події, форматом (offline / online / гібрид) та локацією." },
        { icon: CheckCircle2, title: "Реєстрація себе або дитини", desc: "Один акаунт — кілька профілів спортсменів. Реєструйте себе, дітей чи родичів." },
        { icon: CreditCard, title: "Оплата онлайн", desc: "Безпечна оплата через WayForPay картками Visa/Mastercard, Apple Pay, Google Pay." },
        { icon: Calendar, title: "Календар майбутніх подій", desc: "Окрема сторінка з усіма майбутніми стартами України — і платформними, і доданими адміном чи організаторами. Фільтри за категорією, місяцем, пошук та сортування." },
      ],
    },
    {
      title: "Квитки та день старту",
      items: [
        { icon: QrCode, title: "QR-квиток", desc: "Електронний квиток з унікальним QR-кодом — показуєте на стартовому містечку." },
        { icon: Ticket, title: "Стартовий номер (BIB)", desc: "Номер призначається організатором і відображається у вашому квитку." },
        { icon: CalendarPlus, title: "Додати в календар", desc: "Один клік — і подія в Google Calendar, Outlook або Apple Calendar з правильним часом." },
        { icon: Trophy, title: "Результати забігу", desc: "Після фінішу організатор завантажує результати — ви бачите свій час і місце." },
        { icon: Activity, title: "Автозалік результату через Strava 🆕", desc: "Для віртуальних гонок: підключіть Strava у профілі — ми самі знайдемо вашу активність у вікні дат із потрібною дистанцією, зарахуємо час і поставимо позначку «підтверджено». У квитку буде пряме посилання на активність." },
        { icon: ImageIcon, title: "Світлини з події", desc: "Організатор додає посилання на фотоальбом — переглядайте світлини прямо з картки завершеної події." },
      ],
    },
    {
      title: "Чат події",
      items: [
        { icon: MessageSquare, title: "Спілкування з учасниками", desc: "Окремий чат для кожної події — питання, обговорення, знайомства." },
        { icon: Reply, title: "Відповіді на повідомлення", desc: "Відповідайте на конкретні повідомлення з цитатою — як у месенджерах." },
        { icon: Smile, title: "Реакції-емодзі", desc: "Ставте 👍 ❤️ 🔥 на повідомлення інших учасників." },
        { icon: AtSign, title: "@Згадки", desc: "Згадайте конкретну людину — вона отримає підсвітку повідомлення." },
        { icon: Edit3, title: "Редагування і видалення", desc: "Можна виправити або видалити власне повідомлення в будь-який момент." },
      ],
    },
    {
      title: "Керування власною реєстрацією 🆕",
      items: [
        { icon: Repeat, title: "Зміна дистанції", desc: "Самостійно перейдіть на іншу дистанцію до дедлайну події. Якщо нова дорожча — доплачуєте різницю, якщо дешевша — без повернення." },
        { icon: Send, title: "Передача реєстрації", desc: "Не можете бігти? Згенеруйте 8-символьний код передачі — інший учасник вводить його у «Мої події» і отримує ваш слот." },
        { icon: XCircle, title: "Заявка на скасування", desc: "Подайте запит на скасування реєстрації — організатор розглядає вручну та вирішує щодо повернення коштів." },
        { icon: Truck, title: "Доставка стартового пакету Новою Поштою", desc: "Якщо подія підтримує доставку — оберіть місто та відділення/поштомат прямо при реєстрації. Можна замовити пізніше зі сторінки квитка." },
      ],
    },
    {
      title: "Профіль",
      items: [
        { icon: UserCircle, title: "Особистий профіль", desc: "Ім'я, дата народження, стать, місто, клуб і телефон — заповнюється один раз." },
        { icon: ImageIcon, title: "Фото профілю", desc: "Завантажте аватар — він з'являтиметься у чатах та списках учасників." },
        { icon: Building2, title: "Прив'язка до клубу", desc: "Оберіть свій біговий клуб — він відображатиметься в результатах та списках." },
        { icon: Activity, title: "Підключення Strava 🆕", desc: "Прив'яжіть акаунт Strava у профілі одним кліком (OAuth). Це потрібно для автоматичного зарахування результатів віртуальних гонок. Можна відключити будь-коли." },
      ],
    },
  ] : [
    {
      title: "Discover & register",
      items: [
        { icon: Calendar, title: "Race catalog", desc: "All upcoming runs in Ukraine in one place: running, half marathon, marathon, ultra, trail, OCR, online." },
        { icon: MapPin, title: "Filters by category", desc: "Quickly find races by type, format (offline / online / hybrid) and location." },
        { icon: CheckCircle2, title: "Register yourself or a child", desc: "One account — multiple athlete profiles. Register yourself, children or family." },
        { icon: CreditCard, title: "Online payments", desc: "Secure WayForPay payments via Visa/Mastercard, Apple Pay, Google Pay." },
        { icon: Calendar, title: "Upcoming events calendar", desc: "Dedicated page with every upcoming race in Ukraine — both from the platform and added by admins or organizers. Filters by category, month, search and sorting." },
      ],
    },
    {
      title: "Tickets & race day",
      items: [
        { icon: QrCode, title: "QR ticket", desc: "Electronic ticket with a unique QR code — show it at the start." },
        { icon: Ticket, title: "Bib number", desc: "Assigned by the organizer and shown on your ticket." },
        { icon: CalendarPlus, title: "Add to calendar", desc: "One click to add the event to Google Calendar, Outlook or Apple Calendar." },
        { icon: Trophy, title: "Race results", desc: "After the finish, organizers upload results — see your time and position." },
        { icon: Activity, title: "Auto-verify results via Strava 🆕", desc: "For virtual races: connect Strava in your profile — we automatically pick the matching activity within the date window and distance tolerance, count your time and mark it as «verified». Your ticket gets a direct link to the activity." },
        { icon: ImageIcon, title: "Event photos", desc: "Organizers attach a photo album link — open it right from the completed event card." },
      ],
    },
    {
      title: "Event chat",
      items: [
        { icon: MessageSquare, title: "Chat with participants", desc: "A dedicated chat for every event — questions, discussion, networking." },
        { icon: Reply, title: "Reply to messages", desc: "Reply to specific messages with a quote, like in modern messengers." },
        { icon: Smile, title: "Emoji reactions", desc: "Drop 👍 ❤️ 🔥 on other participants' messages." },
        { icon: AtSign, title: "@mentions", desc: "Mention a person — their message gets highlighted." },
        { icon: Edit3, title: "Edit & delete", desc: "Fix or delete your own messages anytime." },
      ],
    },
    {
      title: "Manage your registration 🆕",
      items: [
        { icon: Repeat, title: "Change distance", desc: "Switch to another distance yourself before the event deadline. If the new one costs more — pay the difference, if less — no refund." },
        { icon: Send, title: "Transfer registration", desc: "Can't run? Generate an 8-character transfer code — another participant enters it in «My events» and gets your slot." },
        { icon: XCircle, title: "Cancellation request", desc: "Submit a cancellation request — the organizer reviews it manually and decides on refund." },
        { icon: Truck, title: "Nova Poshta race kit delivery", desc: "If the event supports delivery — pick a city and branch/parcel locker right at registration. You can also order it later from the ticket page." },
      ],
    },
    {
      title: "Profile",
      items: [
        { icon: UserCircle, title: "Personal profile", desc: "Name, date of birth, gender, city, club and phone — filled once." },
        { icon: ImageIcon, title: "Profile photo", desc: "Upload an avatar — it shows up in chats and participant lists." },
        { icon: Building2, title: "Club membership", desc: "Pick your running club — it appears in results and lists." },
        { icon: Activity, title: "Connect Strava 🆕", desc: "Link your Strava account from the profile in one click (OAuth). Required to auto-credit virtual race results. Disconnect anytime." },
      ],
    },
  ];

  const organizerGroups: Group[] = isUk ? [
    {
      title: "Створення та керування подією",
      items: [
        { icon: Sparkles, title: "Конструктор події", desc: "Назва, опис, дата, час, локація, обкладинка, кілька дистанцій з різними цінами." },
        { icon: Tag, title: "Платні та безкоштовні старти", desc: "Гнучке налаштування цін на кожну дистанцію або повністю безкоштовна реєстрація." },
        { icon: Clock, title: "Статуси події", desc: "Чернетка → Опубліковано → Завершено. Контролюйте видимість на сайті." },
        { icon: Users, title: "Співорганізатори", desc: "Додавайте кілька організаторів до однієї події — кожен має повний доступ." },
        { icon: CalendarPlus, title: "Додавання у Календар подій", desc: "Розміщуйте власні майбутні старти у спільному Календарі подій — навіть якщо реєстрація йде поза платформою. Редагуєте та видаляєте лише свої записи." },
        { icon: Lock, title: "Реєстрація закрита 🆕", desc: "Коли слоти вичерпано — позначте подію як «Реєстрація закрита». Учасники бачать спеціальний бейдж, але подія залишається на сайті до дати старту." },
        { icon: Clock, title: "Дедлайн самообслуговування 🆕", desc: "Налаштуйте за скільки днів до події учасники можуть самостійно змінювати дистанцію, передавати слот або просити скасування." },
        { icon: Activity, title: "Віртуальна гонка зі Strava 🆕", desc: "Позначте дистанцію як віртуальну: задайте вікно дат (з / по) і допуск дистанції у % (через похибку GPS). Активності учасників зі Strava, що потрапляють у вікно й відповідають дистанції, зараховуються автоматично." },
      ],
    },
    {
      title: "Учасники та квитки",
      items: [
        { icon: Users, title: "Список учасників", desc: "Повний список з контактами, дистанцією, статусом оплати, клубом, віком." },
        { icon: FileSpreadsheet, title: "Експорт у CSV / Excel", desc: "Вивантаження учасників одним кліком для стартової реєстрації офлайн." },
        { icon: Ticket, title: "Призначення BIB-номерів", desc: "Автоматичне призначення номерів від заданого старту або вручну." },
        { icon: Trophy, title: "Завантаження результатів", desc: "Завантажте файл або вкажіть посилання — учасники одразу побачать свій час." },
        { icon: Truck, title: "Доставка стартового пакету Новою Поштою 🆕", desc: "Увімкніть доставку — учасники під час реєстрації обирають місто та відділення/поштомат. Ви бачите адреси у списку учасників та експорті." },
        { icon: Send, title: "Формування ТТН Нової Пошти 🆕", desc: "Підключіть свій API-ключ НП у налаштуваннях події, оберіть відправника, контактну особу й місто-відділення. Створюйте ТТН учасникам прямо зі списку учасників — номер, орієнтовна вартість і дата доставки збережуться у реєстрації, з посиланням на трекінг та можливістю видалити ТТН." },
        { icon: Settings, title: "Габарити та оплата стартового пакета 🆕", desc: "Задавайте власні параметри посилки: вага, ширина/довжина/висота (см), оголошена вартість, к-ть місць, опис вантажу. Обирайте платника (Відправник / Отримувач / Третя особа) і спосіб оплати — учасник може платити готівкою або карткою при отриманні." },
        { icon: History, title: "Історія змін реєстрацій 🆕", desc: "Окрема вкладка з повним аудитом: зміни дистанцій, передачі слотів, заявки на скасування — хто, коли і що зробив." },
        { icon: Activity, title: "Синхронізація результатів зі Strava 🆕", desc: "Кнопка «Синхронізувати Strava» у списку учасників: одним кліком тягнемо активності всіх підключених учасників і ставимо результат із позначкою «підтверджено». У таблиці видно джерело (Strava) та посилання на активність." },
      ],
    },
    {
      title: "Маркетинг та оплати",
      items: [
        { icon: Tag, title: "Промокоди", desc: "Створюйте знижкові коди (фіксована сума або відсоток) з лімітом використання." },
        { icon: Mail, title: "Email-розсилки", desc: "Маркетингові кампанії учасникам події з готових шаблонів." },
        { icon: CreditCard, title: "Прийом оплат WayForPay та LiqPay (автопідтвердження)", desc: "Підключіть свій акаунт WayForPay або LiqPay — гроші йдуть напряму вам, а статус оплати ✅ ставиться автоматично. Деталі — у блоці «Оплата» нижче." },
        { icon: Megaphone, title: "Профіль клубу/організатора", desc: "Окрема сторінка з усіма вашими подіями та інформацією про клуб." },
      ],
    },
    {
      title: "Аналітика та комунікація",
      items: [
        { icon: BarChart3, title: "Аналітика події", desc: "Графіки реєстрацій, оплат, розподіл за дистанціями, статтю, віком, містами." },
        { icon: MessageSquare, title: "Чат із учасниками", desc: "Бейдж «Організатор» біля імені, можливість закріплювати повідомлення." },
        { icon: Bell, title: "Лічильник непрочитаних", desc: "На дашборді видно скільки нових повідомлень у чаті кожної події." },
        { icon: Shield, title: "Модерація чату", desc: "Видалення будь-яких повідомлень, редагування своїх анонсів." },
        { icon: Activity, title: "Онлайн-користувачі (адмін) 🆕", desc: "Адміністратор платформи в реальному часі бачить кількість авторизованих користувачів на сайті — плаваючий індикатор у куті екрана." },
      ],
    },
  ] : [
    {
      title: "Create & manage events",
      items: [
        { icon: Sparkles, title: "Event builder", desc: "Title, description, date, time, location, cover image, multiple distances with different prices." },
        { icon: Tag, title: "Paid & free races", desc: "Flexible pricing per distance or fully free registration." },
        { icon: Clock, title: "Event status", desc: "Draft → Published → Completed. Control visibility on the site." },
        { icon: Users, title: "Co-organizers", desc: "Add multiple organizers to one event — each gets full access." },
        { icon: CalendarPlus, title: "Add to events calendar", desc: "Publish your upcoming races in the shared Events Calendar — even if registration runs outside the platform. You can only edit and delete your own entries." },
        { icon: Lock, title: "Registration closed 🆕", desc: "When slots are sold out — mark the event as «Registration closed». Participants see a dedicated badge but the event stays on the site until race day." },
        { icon: Clock, title: "Self-service deadline 🆕", desc: "Configure how many days before the event participants can change distance, transfer slots or request cancellation by themselves." },
        { icon: Activity, title: "Virtual race via Strava 🆕", desc: "Mark a distance as virtual: set a date window (from / to) and a distance tolerance in % (to account for GPS drift). Participants' Strava activities that fall in the window and match the distance are credited automatically." },
      ],
    },
    {
      title: "Participants & tickets",
      items: [
        { icon: Users, title: "Participants list", desc: "Full list with contacts, distance, payment status, club, age." },
        { icon: FileSpreadsheet, title: "CSV / Excel export", desc: "One-click export for offline race-day check-in." },
        { icon: Ticket, title: "Assign BIB numbers", desc: "Auto-assign from a starting number or set manually." },
        { icon: Trophy, title: "Upload results", desc: "Upload a file or paste a link — participants instantly see their time." },
        { icon: Truck, title: "Nova Poshta race kit delivery 🆕", desc: "Enable delivery — participants pick a city and branch/parcel locker at registration. You see the addresses in the participants list and exports." },
        { icon: Send, title: "Generate Nova Poshta waybills (TTN) 🆕", desc: "Plug in your NP API key in the event settings, choose the sender, contact person and origin warehouse. Create TTNs straight from the participants list — number, estimated cost and delivery date are saved on the registration with a tracking link and a delete button." },
        { icon: Settings, title: "Custom parcel dimensions & payment 🆕", desc: "Set your own parcel parameters: weight, width/length/height (cm), declared cost, seats, cargo description. Pick the payer (Sender / Recipient / Third person) and payment method — recipients can pay cash or by card on pickup." },
        { icon: History, title: "Registration changes history 🆕", desc: "A dedicated tab with full audit: distance changes, slot transfers, cancellation requests — who, when and what changed." },
        { icon: Activity, title: "Sync results from Strava 🆕", desc: "«Sync Strava» button on the participants list: one click pulls activities from all connected participants and saves their result with a «verified» mark. The table shows the source (Strava) and a link to the activity." },
      ],
    },
    {
      title: "Marketing & payments",
      items: [
        { icon: Tag, title: "Promo codes", desc: "Discount codes (fixed amount or percentage) with usage limits." },
        { icon: Mail, title: "Email campaigns", desc: "Send marketing emails to participants from ready-made templates." },
        { icon: CreditCard, title: "WayForPay & LiqPay payments (auto-confirm)", desc: "Connect your WayForPay or LiqPay account — money goes directly to you, payment status ✅ is set automatically. See the «Payments» block below." },
        { icon: Megaphone, title: "Club / organizer page", desc: "A dedicated page with all your events and club information." },
      ],
    },
    {
      title: "Analytics & communication",
      items: [
        { icon: BarChart3, title: "Event analytics", desc: "Charts of registrations, payments, breakdown by distance, gender, age, city." },
        { icon: MessageSquare, title: "Chat with participants", desc: "«Organizer» badge next to your name, ability to pin messages." },
        { icon: Bell, title: "Unread counter", desc: "Dashboard shows how many new chat messages each event has." },
        { icon: Shield, title: "Chat moderation", desc: "Delete any message, edit your own announcements." },
        { icon: Activity, title: "Online users (admin) 🆕", desc: "The platform admin sees the number of authenticated users on the site in real time — a floating indicator in the corner." },
      ],
    },
  ];

  const t = isUk ? {
    eyebrow: "Можливості",
    title: "Усе, що вміє Fartlek Events",
    subtitle: "Платформа для організації забігів та реєстрації учасників. Зібрали всі можливості в одному місці — і регулярно оновлюємо.",
    forParticipants: "Для учасників",
    forOrganizers: "Для організаторів",
    ctaTitle: "Готові спробувати?",
    ctaSub: "Знайдіть найближчий старт або створіть власну подію за кілька хвилин.",
    ctaFind: "Знайти забіг",
    ctaCreate: "Стати організатором",
    updated: "Сторінка оновлюється — нові можливості додаються щотижня.",
  } : {
    eyebrow: "Features",
    title: "Everything Fartlek Events can do",
    subtitle: "A platform to organize races and register participants. All features in one place — updated regularly.",
    forParticipants: "For participants",
    forOrganizers: "For organizers",
    ctaTitle: "Ready to try?",
    ctaSub: "Find an upcoming race or create your own event in minutes.",
    ctaFind: "Find a race",
    ctaCreate: "Become an organizer",
    updated: "This page is regularly updated — new features ship every week.",
  };

  const renderGroups = (groups: Group[]) => (
    <div className="space-y-12 mt-10">
      {groups.map((g) => (
        <section key={g.title}>
          <h3 className="text-xl md:text-2xl font-bold mb-5 flex items-center gap-3">
            <span className="h-1 w-8 bg-primary rounded-full" />
            {g.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {g.items.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold mb-1.5">{f.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seo.title} description={seo.description} canonical="/features" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4 py-14 md:py-20 text-center max-w-3xl">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">
              {t.eyebrow}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5">
              {t.title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {t.subtitle}
            </p>
          </div>
        </section>

        {/* Tabs */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-auto">
              <TabsTrigger value="participant" className="py-3 text-sm md:text-base">
                <UserCircle className="h-4 w-4 mr-2" />
                {t.forParticipants}
              </TabsTrigger>
              <TabsTrigger value="organizer" className="py-3 text-sm md:text-base">
                <Sparkles className="h-4 w-4 mr-2" />
                {t.forOrganizers}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participant">{renderGroups(participantGroups)}</TabsContent>
            <TabsContent value="organizer">
              {/* Швидкий перехід до блоку Оплата */}
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={scrollToPayments}
                  variant="outline"
                  size="lg"
                  className="border-primary/40 bg-primary/10 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
                >
                  <CreditCard className="h-4 w-4" />
                  {isUk ? "Перейти до блоку «Оплата»" : "Jump to «Payments» section"}
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              {renderGroups(organizerGroups)}

              {/* Розгорнутий блок про оплату */}
              <section id="payments" className="scroll-mt-24 mt-14 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">
                    {isUk ? "Оплата участі — як це працює" : "Payments — how it works"}
                  </h3>
                </div>
                <p className="text-muted-foreground mb-8 max-w-3xl">
                  {isUk
                    ? "Fartlek Events не бере комісію з оплат — гроші учасників надходять напряму на ваш рахунок. Підтримуємо три сценарії: автоматичне підтвердження через WayForPay, автоматичне через LiqPay, або ручну перевірку квитанції за будь-яким посиланням."
                    : "Fartlek Events takes no payment commission — participants pay you directly. Three flows are supported: WayForPay auto-confirmation, LiqPay auto-confirmation, or manual receipt approval for any other payment link."}
                </p>

                {/* Сценарій 1 — WayForPay */}
                <div className="rounded-xl border border-primary/40 bg-background p-5 md:p-6 mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                    <div>
                      <h4 className="text-lg md:text-xl font-bold">
                        {isUk ? "WayForPay — автоматичне підтвердження ✅" : "WayForPay — automatic confirmation ✅"}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isUk
                          ? "Учасник платить на вашому WayForPay, а зелена галочка «Сплачено» з'являється сама — без вашої участі."
                          : "Participant pays via your WayForPay, the green «Paid» check appears automatically — no manual work."}
                      </p>
                    </div>
                  </div>

                  <ol className="space-y-3 text-sm md:text-base ml-10">
                    <li>
                      <strong>{isUk ? "1. У вас має бути акаунт WayForPay." : "1. You need a WayForPay account."}</strong>{" "}
                      {isUk ? "Якщо немає — зареєструйтесь на " : "If you don't have one — register at "}
                      <a href="https://wayforpay.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">wayforpay.com</a>.
                    </li>
                    <li>
                      <strong>{isUk ? "2. Створіть/відредагуйте подію" : "2. Create or edit your event"}</strong>{" "}
                      {isUk ? "у кабінеті організатора, увімкніть «Платна подія» і вставте посилання WayForPay у поле «Посилання на оплату»." : "in the organizer dashboard, enable «Paid event» and paste your WayForPay link into the «Payment URL» field."}
                    </li>
                    <li>
                      <strong>{isUk ? "3. З'являться 3 додаткові поля" : "3. Three extra fields will appear"}</strong>{" "}
                      {isUk ? "(із вашого кабінету WayForPay → Налаштування → Реквізити мерчанта):" : "(from your WayForPay account → Settings → Merchant credentials):"}
                      <ul className="list-disc ml-5 mt-1 text-muted-foreground space-y-0.5">
                        <li><code className="text-foreground">Merchant Login</code></li>
                        <li><code className="text-foreground">Merchant Secret Key</code></li>
                        <li><code className="text-foreground">Merchant Domain</code></li>
                      </ul>
                    </li>
                    <li>
                      <strong>{isUk ? "4. У кабінеті WayForPay" : "4. In your WayForPay dashboard"}</strong>{" "}
                      {isUk ? "вкажіть два URL (ми покажемо їх готові для копіювання просто на сторінці події):" : "set two URLs (we show them ready-to-copy right on the event page):"}
                      <ul className="list-disc ml-5 mt-1 text-muted-foreground space-y-1">
                        <li><strong className="text-foreground">Service URL</strong> — {isUk ? "куди WayForPay надішле підтвердження оплати" : "where WayForPay will send payment confirmation"}</li>
                        <li><strong className="text-foreground">Return URL</strong> — {isUk ? "куди повернути учасника після оплати" : "where to redirect the participant after payment"}</li>
                      </ul>
                    </li>
                    <li>
                      <strong>{isUk ? "5. Готово!" : "5. Done!"}</strong>{" "}
                      {isUk ? "Учасник реєструється → натискає «Сплатити» → платить на WayForPay → автоматично повертається на сайт із зеленою галочкою «Сплачено»." : "Participant registers → clicks «Pay» → pays on WayForPay → automatically returns with a green «Paid» check."}
                    </li>
                  </ol>

                  <div className="mt-5 ml-10 rounded-md bg-primary/10 border border-primary/30 p-3 text-sm">
                    🔒 {isUk
                      ? "Ваш Secret Key зберігається приватно — його бачите тільки ви, ваші співорганізатори та адміністратор платформи."
                      : "Your Secret Key is stored privately — only you, your co-organizers, and the platform admin can see it."}
                  </div>
                </div>

                {/* Сценарій 2 — LiqPay */}
                <div className="rounded-xl border border-primary/40 bg-background p-5 md:p-6 mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                    <div>
                      <h4 className="text-lg md:text-xl font-bold">
                        {isUk ? "LiqPay — автоматичне підтвердження ✅" : "LiqPay — automatic confirmation ✅"}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isUk
                          ? "Те саме, що й WayForPay, але через LiqPay від ПриватБанку. Зелена галочка «Сплачено» виставляється автоматично після успішної оплати."
                          : "Same as WayForPay, but via LiqPay from PrivatBank. The «Paid» check is set automatically after a successful payment."}
                      </p>
                    </div>
                  </div>

                  <ol className="space-y-3 text-sm md:text-base ml-10">
                    <li>
                      <strong>{isUk ? "1. Заведіть магазин у LiqPay." : "1. Set up a shop in LiqPay."}</strong>{" "}
                      {isUk ? "Зареєструйтесь або увійдіть на " : "Sign up or log in at "}
                      <a href="https://www.liqpay.ua" target="_blank" rel="noopener noreferrer" className="text-primary underline">liqpay.ua</a>{" "}
                      {isUk ? "і створіть магазин (Merchant)." : "and create a shop (merchant)."}
                    </li>
                    <li>
                      <strong>{isUk ? "2. Створіть/відредагуйте подію" : "2. Create or edit your event"}</strong>{" "}
                      {isUk ? "у кабінеті організатора, увімкніть «Платна подія» і вставте будь-яке посилання LiqPay (наприклад " : "in the organizer dashboard, enable «Paid event» and paste any LiqPay link (e.g. "}
                      <code className="text-foreground">https://www.liqpay.ua/...</code>{isUk ? ") у поле «Посилання на оплату» — система розпізнає LiqPay автоматично." : ") in the «Payment URL» field — the system detects LiqPay automatically."}
                    </li>
                    <li>
                      <strong>{isUk ? "3. З'являться 2 додаткові поля" : "3. Two extra fields will appear"}</strong>{" "}
                      {isUk ? "(із вашого кабінету LiqPay → Налаштування → API):" : "(from your LiqPay account → Settings → API):"}
                      <ul className="list-disc ml-5 mt-1 text-muted-foreground space-y-0.5">
                        <li><code className="text-foreground">Public Key</code></li>
                        <li><code className="text-foreground">Private Key</code></li>
                      </ul>
                    </li>
                    <li>
                      <strong>{isUk ? "4. У налаштуваннях магазину LiqPay" : "4. In your LiqPay shop settings"}</strong>{" "}
                      {isUk ? "вкажіть два URL (ми покажемо їх готові для копіювання просто на сторінці події):" : "set two URLs (we show them ready-to-copy right on the event page):"}
                      <ul className="list-disc ml-5 mt-1 text-muted-foreground space-y-1">
                        <li><strong className="text-foreground">Server URL</strong> — {isUk ? "куди LiqPay надішле callback з результатом оплати" : "where LiqPay will send the payment callback"}</li>
                        <li><strong className="text-foreground">Result URL</strong> — {isUk ? "куди повернути учасника після оплати" : "where to redirect the participant after payment"}</li>
                      </ul>
                    </li>
                    <li>
                      <strong>{isUk ? "5. Готово!" : "5. Done!"}</strong>{" "}
                      {isUk ? "Учасник реєструється → натискає «Сплатити» → переходить на LiqPay → після оплати галочка «Сплачено» виставляється автоматично." : "Participant registers → clicks «Pay» → goes to LiqPay → the «Paid» check is set automatically after payment."}
                    </li>
                  </ol>

                  <div className="mt-5 ml-10 rounded-md bg-primary/10 border border-primary/30 p-3 text-sm">
                    🔒 {isUk
                      ? "Ваш Private Key зберігається приватно — його бачите тільки ви, ваші співорганізатори та адміністратор платформи."
                      : "Your Private Key is stored privately — only you, your co-organizers, and the platform admin can see it."}
                  </div>
                </div>

                {/* Сценарій 3 — інші посилання */}
                <div className="rounded-xl border border-border bg-background p-5 md:p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground text-sm font-bold">3</span>
                    <div>
                      <h4 className="text-lg md:text-xl font-bold">
                        {isUk ? "Будь-яке інше посилання — ручне підтвердження" : "Any other payment link — manual confirmation"}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isUk
                          ? "Monobank банка, Privat24, IBAN — учасник платить, завантажує квитанцію, ви підтверджуєте одним кліком."
                          : "Monobank jar, Privat24, IBAN — participant pays, uploads a receipt, you confirm with one click."}
                      </p>
                    </div>
                  </div>

                  <ol className="space-y-2 text-sm md:text-base ml-10 list-decimal list-inside">
                    <li>{isUk ? "Вставте будь-яке посилання на оплату у поле «Посилання на оплату»." : "Paste any payment link in the «Payment URL» field."}</li>
                    <li>{isUk ? "Учасник переходить за ним, оплачує, повертається на сайт і завантажує скрін/PDF квитанції." : "Participant follows it, pays, returns to the site and uploads a screenshot or PDF receipt."}</li>
                    <li>{isUk ? "У списку учасників ви бачите квитанцію → натискаєте «Підтвердити» → з'являється зелена галочка." : "You see the receipt in the participants list → click «Confirm» → green check appears."}</li>
                  </ol>
                </div>

                {/* Часті питання */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/40 p-4">
                    <h5 className="font-semibold mb-1 text-sm">
                      {isUk ? "💰 Чи бере Fartlek комісію?" : "💰 Does Fartlek take a commission?"}
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      {isUk
                        ? "Ні. Гроші йдуть напряму на ваш рахунок. Ви платите тільки комісію платіжної системи (WayForPay ≈ 2.7%, LiqPay ≈ 2.75%) за вашою угодою з ними."
                        : "No. Money goes directly to your account. You only pay the payment provider's fee (WayForPay ~2.7%, LiqPay ~2.75%) per your contract with them."}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-4">
                    <h5 className="font-semibold mb-1 text-sm">
                      {isUk ? "🔄 Що з поверненнями?" : "🔄 What about refunds?"}
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      {isUk
                        ? "Повернення робите ви через свій кабінет WayForPay/LiqPay або вручну для інших методів. На сайті можна змінити статус оплати назад."
                        : "You handle refunds via your WayForPay/LiqPay dashboard or manually for other methods. Payment status can be reverted on the site."}
                    </p>
                  </div>
                </div>
              </section>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground mt-12 italic">
            {t.updated}
          </p>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-14 md:py-20 text-center max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{t.ctaTitle}</h2>
            <p className="text-muted-foreground mb-6">{t.ctaSub}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/#events">{t.ctaFind}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth?role=organizer">{t.ctaCreate}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Features;

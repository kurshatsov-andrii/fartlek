import { Link } from "react-router-dom";
import {
  Users, Calendar, Ticket, MessageSquare, BarChart3, Tag, Mail, Shield, QrCode,
  Trophy, Bell, UserCircle, Edit3, Smile, Reply, AtSign, Image as ImageIcon,
  CalendarPlus, FileSpreadsheet, CreditCard, Globe, Clock, MapPin, Sparkles,
  Megaphone, Building2, CheckCircle2
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
      ],
    },
    {
      title: "Квитки та день старту",
      items: [
        { icon: QrCode, title: "QR-квиток", desc: "Електронний квиток з унікальним QR-кодом — показуєте на стартовому містечку." },
        { icon: Ticket, title: "Стартовий номер (BIB)", desc: "Номер призначається організатором і відображається у вашому квитку." },
        { icon: CalendarPlus, title: "Додати в календар", desc: "Один клік — і подія в Google Calendar, Outlook або Apple Calendar з правильним часом." },
        { icon: Trophy, title: "Результати забігу", desc: "Після фінішу організатор завантажує результати — ви бачите свій час і місце." },
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
      title: "Профіль",
      items: [
        { icon: UserCircle, title: "Особистий профіль", desc: "Ім'я, дата народження, стать, місто, клуб і телефон — заповнюється один раз." },
        { icon: ImageIcon, title: "Фото профілю", desc: "Завантажте аватар — він з'являтиметься у чатах та списках учасників." },
        { icon: Building2, title: "Прив'язка до клубу", desc: "Оберіть свій біговий клуб — він відображатиметься в результатах та списках." },
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
      ],
    },
    {
      title: "Tickets & race day",
      items: [
        { icon: QrCode, title: "QR ticket", desc: "Electronic ticket with a unique QR code — show it at the start." },
        { icon: Ticket, title: "Bib number", desc: "Assigned by the organizer and shown on your ticket." },
        { icon: CalendarPlus, title: "Add to calendar", desc: "One click to add the event to Google Calendar, Outlook or Apple Calendar." },
        { icon: Trophy, title: "Race results", desc: "After the finish, organizers upload results — see your time and position." },
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
      title: "Profile",
      items: [
        { icon: UserCircle, title: "Personal profile", desc: "Name, date of birth, gender, city, club and phone — filled once." },
        { icon: ImageIcon, title: "Profile photo", desc: "Upload an avatar — it shows up in chats and participant lists." },
        { icon: Building2, title: "Club membership", desc: "Pick your running club — it appears in results and lists." },
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
      ],
    },
    {
      title: "Учасники та квитки",
      items: [
        { icon: Users, title: "Список учасників", desc: "Повний список з контактами, дистанцією, статусом оплати, клубом, віком." },
        { icon: FileSpreadsheet, title: "Експорт у CSV / Excel", desc: "Вивантаження учасників одним кліком для стартової реєстрації офлайн." },
        { icon: Ticket, title: "Призначення BIB-номерів", desc: "Автоматичне призначення номерів від заданого старту або вручну." },
        { icon: Trophy, title: "Завантаження результатів", desc: "Завантажте файл або вкажіть посилання — учасники одразу побачать свій час." },
      ],
    },
    {
      title: "Маркетинг та оплати",
      items: [
        { icon: Tag, title: "Промокоди", desc: "Створюйте знижкові коди (фіксована сума або відсоток) з лімітом використання." },
        { icon: Mail, title: "Email-розсилки", desc: "Маркетингові кампанії учасникам події з готових шаблонів." },
        { icon: CreditCard, title: "Прийом оплат WayForPay", desc: "Гроші надходять напряму на ваш рахунок — платформа лише фасилітує реєстрацію." },
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
      ],
    },
    {
      title: "Participants & tickets",
      items: [
        { icon: Users, title: "Participants list", desc: "Full list with contacts, distance, payment status, club, age." },
        { icon: FileSpreadsheet, title: "CSV / Excel export", desc: "One-click export for offline race-day check-in." },
        { icon: Ticket, title: "Assign BIB numbers", desc: "Auto-assign from a starting number or set manually." },
        { icon: Trophy, title: "Upload results", desc: "Upload a file or paste a link — participants instantly see their time." },
      ],
    },
    {
      title: "Marketing & payments",
      items: [
        { icon: Tag, title: "Promo codes", desc: "Discount codes (fixed amount or percentage) with usage limits." },
        { icon: Mail, title: "Email campaigns", desc: "Send marketing emails to participants from ready-made templates." },
        { icon: CreditCard, title: "WayForPay payments", desc: "Money goes directly to your account — the platform only facilitates registration." },
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
          <Tabs defaultValue="participant" className="w-full">
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
            <TabsContent value="organizer">{renderGroups(organizerGroups)}</TabsContent>
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

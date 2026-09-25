import { Link } from "@/lib/router-compat";
import {
  ArrowRight, ArrowLeft, Check, CreditCard, Users, Trophy, MessageSquare, BarChart3, Megaphone,
  ClipboardList, MapPin, CalendarDays, QrCode, Sparkles, ShieldCheck, HelpCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";

const ForOrganizers = () => {
  const { lang } = useApp();
  const { isOrganizer } = useAuth();
  const uk = lang === "uk";

  const t = uk ? {
    back: "На головну",
    badge: "Для організаторів забігів",
    h1a: "Проводьте забіги,",
    h1b: "ми подбаємо про решту",
    sub: "Fartlek Events — українська платформа для реєстрації учасників на забіги, трейли та мультиспорт. Реєстрація, оплати, стартові номери, результати та спілкування з учасниками — в одній панелі.",
    ctaPrimary: isOrganizer ? "Панель організатора" : "Створити перший забіг",
    ctaSecondary: "Подивитись можливості",
    statsFree: "0 ₴",
    statsFreeLabel: "за розміщення події",
    statsSteps: "5 хв",
    statsStepsLabel: " щоб створити подію",
    statsUa: "UA",
    statsUaLabel: "платежі та підтримка",
    benefitsTitle: "Що ви отримуєте",
    benefitsSub: "Все, що потрібно організатору — без Excel-таблиць і ручних списків",
    howTitle: "Як це працює",
    howSub: "Від реєстрації до протоколу результатів — за 5 кроків",
    promoTitle: "Ваші події стають помітними",
    promoSub: "Платформа працює на вас: учасники знаходять ваші старти самі",
    promoList: [
      "Календар подій з фільтрами по містах, місяцях і видах спорту",
      "Мапа спортивних подій України",
      "Каталог організаторів з профілем вашого клубу",
      "Старти з телеграм-каналу Фартлек — ми допомагаємо з публікацією",
      "Сторінки подій з SEO та посиланням для соцмереж",
    ],
    steps: [
      { icon: ClipboardList, title: "Зареєструйтесь як організатор", text: "Створіть акаунт і профіль організатора або клубу — це безкоштовно." },
      { icon: CalendarDays, title: "Створіть подію та дистанції", text: "Назва, дата, місто, дистанції, ціни, ліміт учасників і фото траси." },
      { icon: QrCode, title: "Поділіться посиланням", text: "Посилання та сторінка події готові для соцмереж, чатів і афіш." },
      { icon: CreditCard, title: "Приймайте реєстрації й оплати", text: "Учасники реєструються й оплачують карткою. Бачите статуси в реальному часі." },
      { icon: Trophy, title: "Публікуйте результати", text: "Імпорт хронометражу, категорії, DNS/DNF, сертифікати фінішера й стартові номери." },
    ],
    benefits: [
      { icon: CreditCard, title: "Реєстрація та оплати", text: "Онлайн-оплата карткою (LiqPay, WayForPay), промокоди, лиміти слотів, автоматичні статуси оплат." },
      { icon: Users, title: "Учасники під контролем", text: "Списки учасників, експорт у XLSX, стартові номери, згоди учасників, групи та категорії." },
      { icon: Trophy, title: "Результати та нагороди", text: "Протокол результатів, місця в категоріях, DNS/DNF, сертифікати фінішера, цифрові стартові номери." },
      { icon: MessageSquare, title: "Спілкування з учасниками", text: "Чат події, email-розсилки, нагадування про оплату, зміни та відміни — все з панелі." },
      { icon: BarChart3, title: "Аналітика події", text: "Перегляди сторінок, реєстрації, хто з учасників онлайн — бачите, як йде підготовка." },
      { icon: ShieldCheck, title: "Захист від ботів", text: "Cloudflare Turnstile, валідація даних і контроль тимчасових email — чистий список учасників." },
    ],
    promoBadge: "Просування",
    faqTitle: "Часті питання",
    faq: [
      { q: "Скільки це коштує?", a: "Розміщення події та панель організатора — безкоштовно. Ви платите лише стандартну комісію платіжної системи з оплачених реєстрацій." },
      { q: "Чи можна проводити подію без хронометражу?", a: "Так. Реєстрація, оплати, список учасників і стартові номери працюють і без офіційного хронометражу — результати можна додати пізніше або не додавати." },
      { q: "Чи можна редагувати подію після публікації?", a: "Так, у будь-який момент. Зміни та відміни показуються учасникам, а про важливі оновлення можна надіслати розсилку." },
      { q: "Як учасники платять?", a: "Карткою через LiqPay або WayForPay. Статус оплати оновлюється автоматично, а ви бачите його в списку учасників і можете експортувати в XLSX." },
      { q: "Чи можна організувати подію разом з іншими?", a: "Так, ви можете додати співорганізаторів до будь-якої події — вони матимуть доступ до учасників і налаштувань." },
    ],
    finalTitle: "Готові провести свій перший забіг?",
    finalSub: "Створіть подію за 5 хвилин — а якщо є питання, ми на зв'язку в Telegram та по телефону.",
    contactBtn: "Зв'язатись з нами",
  } : {
    back: "Back home",
    badge: "For race organizers",
    h1a: "Run your race,",
    h1b: "we handle the rest",
    sub: "Fartlek Events is a Ukrainian platform for participant registration in running, trail and multisport events. Registration, payments, bib numbers, results and participant communication — all in one dashboard.",
    ctaPrimary: isOrganizer ? "Organizer dashboard" : "Create your first race",
    ctaSecondary: "Explore features",
    statsFree: "0 ₴",
    statsFreeLabel: "to list your event",
    statsSteps: "5 min",
    statsStepsLabel: " to create an event",
    statsUa: "UA",
    statsUaLabel: "payments & support",
    benefitsTitle: "What you get",
    benefitsSub: "Everything an organizer needs — no more spreadsheets and manual lists",
    howTitle: "How it works",
    howSub: "From sign-up to the results protocol — in 5 steps",
    promoTitle: "Your events get discovered",
    promoSub: "The platform works for you: participants find your races on their own",
    promoList: [
      "Event calendar with city, month and sport filters",
      "Map of sports events across Ukraine",
      "Organizer catalog with your club profile",
      "Races from the Fartlek Telegram channel — we help with publishing",
      "Event pages with SEO and shareable links",
    ],
    steps: [
      { icon: ClipboardList, title: "Sign up as an organizer", text: "Create an account and your organizer or club profile — it's free." },
      { icon: CalendarDays, title: "Create the event and distances", text: "Name, date, city, distances, pricing, participant limit and course photos." },
      { icon: QrCode, title: "Share the link", text: "The link and event page are ready for social media, chats and posters." },
      { icon: CreditCard, title: "Collect registrations and payments", text: "Participants register and pay by card. You see statuses in real time." },
      { icon: Trophy, title: "Publish results", text: "Timing import, category rankings, DNS/DNF, finisher certificates and bib numbers." },
    ],
    benefits: [
      { icon: CreditCard, title: "Registration & payments", text: "Online card payments (LiqPay, WayForPay), promo codes, slot limits, automatic payment statuses." },
      { icon: Users, title: "Participants under control", text: "Participant lists, XLSX export, bib numbers, participant consents, groups and categories." },
      { icon: Trophy, title: "Results & awards", text: "Results protocol, category rankings, DNS/DNF, finisher certificates, digital bib numbers." },
      { icon: MessageSquare, title: "Talk to participants", text: "Event chat, email campaigns, payment reminders, changes and cancellations — all from the dashboard." },
      { icon: BarChart3, title: "Event analytics", text: "Page views, registrations, who is online — see how preparations are going." },
      { icon: ShieldCheck, title: "Bot protection", text: "Cloudflare Turnstile, data validation and disposable-email blocking — a clean participant list." },
    ],
    promoBadge: "Promotion",
    faqTitle: "Frequently asked questions",
    faq: [
      { q: "How much does it cost?", a: "Listing an event and the organizer dashboard are free. You only pay the standard payment processor fee on paid registrations." },
      { q: "Can I run an event without official timing?", a: "Yes. Registration, payments, participant lists and bib numbers work without official timing — results can be added later or not at all." },
      { q: "Can I edit an event after publishing?", a: "Anytime. Changes and cancellations are shown to participants, and you can send an email campaign about important updates." },
      { q: "How do participants pay?", a: "By card via LiqPay or WayForPay. Payment status updates automatically and is visible in the participant list, exportable to XLSX." },
      { q: "Can I co-organize with others?", a: "Yes, you can add co-organizers to any event — they get access to participants and settings." },
    ],
    finalTitle: "Ready to run your first race?",
    finalSub: "Create an event in 5 minutes — and if you have questions, we're on Telegram or by phone.",
    contactBtn: "Contact us",
  };

  const ctaTo = isOrganizer ? "/organizer" : "/auth?role=organizer";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-hero-soft">
          <div className="container relative py-16 sm:py-24">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> {t.back}
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t.badge}
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
              {t.h1a}<br className="hidden sm:block" /> <span className="text-gradient">{t.h1b}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{t.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-base">
                <Link to={ctaTo}>
                  {t.ctaPrimary} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base border-border bg-secondary/40 text-foreground hover:bg-secondary hover:text-secondary-foreground">
                <Link to="/features">{t.ctaSecondary}</Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-6">
              {[
                { v: t.statsFree, l: t.statsFreeLabel },
                { v: t.statsSteps, l: t.statsStepsLabel },
                { v: t.statsUa, l: t.statsUaLabel },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-3xl sm:text-4xl font-bold text-gradient">{s.v}</div>
                  <div className="mt-1 text-xs sm:text-sm text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="container py-16 sm:py-20">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t.benefitsTitle}</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">{t.benefitsSub}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-border bg-card p-6 transition-bounce hover:-translate-y-1 hover:shadow-elevated">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-secondary/50 border-y border-border/60 py-16 sm:py-20">
          <div className="container">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t.howTitle}</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl">{t.howSub}</p>
            <ol className="mt-10 grid gap-4 md:grid-cols-5">
              {t.steps.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl border border-border bg-card p-5">
                  <span className="font-display text-4xl font-bold text-primary/25">{i + 1}</span>
                  <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold leading-snug">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Promotion */}
        <section className="container py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                <Megaphone className="h-3.5 w-3.5" /> {t.promoBadge}
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight">{t.promoTitle}</h2>
              <p className="mt-2 text-muted-foreground">{t.promoSub}</p>
              <ul className="mt-6 space-y-3">
                {t.promoList.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <Button asChild variant="outline" size="sm"><Link to="/calendar"><CalendarDays className="h-4 w-4" /> Календар</Link></Button>
                <Button asChild variant="outline" size="sm"><Link to="/map"><MapPin className="h-4 w-4" /> Мапа</Link></Button>
                <Button asChild variant="outline" size="sm"><Link to="/organizers"><Users className="h-4 w-4" /> Організатори</Link></Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-6">
                <div className="font-display text-lg font-bold">{uk ? "Живі приклади на платформі" : "Live examples on the platform"}</div>
                <p className="mt-1 text-sm text-muted-foreground">{uk ? "Побачте, як виглядають події, створені тут" : "See how events created here look"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm"><Link to="/">Події</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to="/starts">Старти</Link></Button>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div className="mt-2 text-sm font-semibold">{uk ? "Аналітика події" : "Event analytics"}</div>
                <div className="mt-1 text-xs text-muted-foreground">{uk ? "Реєстрації, перегляди, учасники онлайн" : "Registrations, views, participants online"}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div className="mt-2 text-sm font-semibold">{uk ? "Чат події" : "Event chat"}</div>
                <div className="mt-1 text-xs text-muted-foreground">{uk ? "Учасники та організатор в одному місці" : "Participants and organizer in one place"}</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container pb-16 sm:pb-20">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t.faqTitle}</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {t.faq.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5">
                <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold">
                  <span className="flex items-start gap-2.5">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f.q}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-base group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="container pb-20">
          <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-8 sm:p-12 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t.finalTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">{t.finalSub}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="text-base">
                <Link to={ctaTo}>{t.ctaPrimary} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground text-base">
                <Link to="/contacts">{t.contactBtn}</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/70">
              info@fartlek.com.ua · +38 097 252 05 51
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ForOrganizers;

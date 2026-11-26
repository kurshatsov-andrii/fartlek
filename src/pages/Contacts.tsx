import { Link } from "@/lib/router-compat";
import { Mail, Phone, Send, MapPin, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useApp } from "@/contexts/AppContext";
import andriiAsset from "@/assets/andres-founder-fartlek.jpg.asset.json";

const COPY = {
  uk: {
    title: "Контакти",
    subtitle: "Контакти Фартлек — завжди на зв'язку!",
    intro:
      "Маєте запитання щодо спортивних подій, хочете додати свій забіг до календаря, розмістити інформацію про змагання або запропонувати співпрацю? Зв'яжіться з командою Фартлек — ми відкриті до спілкування та нових спортивних проєктів!",
    back: "До списку подій",
    phone: "Телефон",
    address: "Адреса",
    addressValue: "Харків, вул. Власенка 24",
    project: "Проєкт Фартлек",
    projectText: [
      "Фартлек (Fartlek) — український спортивний проєкт, створений для розвитку бігової культури та об'єднання спортивної спільноти.",
      "Ми розвиваємо спортивну афішу, цифрову платформу спортивних подій та бігову спільноту в Харкові.",
      "Наша мета — зробити спорт доступнішим, допомогти спортсменам знаходити цікаві старти, а організаторам — залучати учасників та розвивати свої заходи.",
    ],
    directions: "Напрямки співпраці",
    directionList: [
      {
        title: "Організаторам забігів",
        text: "додавання спортивних подій до календаря Фартлек, розміщення анонсів та інформаційна підтримка.",
      },
      {
        title: "Бігунам та спортсменам",
        text: "допомога з пошуком стартів, реєстрацією та використанням платформи.",
      },
      {
        title: "Партнерам і спонсорам",
        text: "рекламна співпраця, інформаційна підтримка та спільні спортивні проєкти.",
      },
      {
        title: "Спортивним клубам і спільнотам",
        text: "розвиток партнерства та популяризація бігового руху.",
      },
      {
        title: "Користувачам платформи",
        text: "консультації, технічна підтримка та пропозиції щодо розвитку Фартлек.",
      },
    ],
    founder: "Засновник Фартлек",
    founderName: "Андрій Куршацов",
    founderRole: "Засновник Фартлек",
    founderImageAlt: "Куршацов Андрій — засновник Фартлек",
    founderText: [
      "Андрій Куршацов — засновник і розробник проєкту Фартлек, організатор бігових подій у Харкові.",
      "Займається бігом із 2016 року, марафонець, ультрамарафонець і трейлраннер. Організатор Kharkiv Half Marathon 2026.",
      "Понад 5 років розвиває Фартлек як спортивну афішу та цифрову платформу. Засновник бігової спільноти Фартлек у Харкові.",
      "Ми відкриті до нових знайомств, партнерств та ідей, які допомагають розвивати спорт і бігову культуру в Україні.",
    ],
    closing: "Фартлек — об'єднуємо тих, хто біжить!",
    seoTitle: "Контакти — Фартлек",
    seoDescription:
      "Контакти Фартлек: підтримка учасників, додавання забігів до календаря, співпраця з організаторами, клубами та спонсорами.",
  },
  en: {
    title: "Contacts",
    subtitle: "Fartlek contacts — always in touch!",
    intro:
      "Have questions about sporting events, want to add your run to the calendar, publish a race listing or propose a partnership? Get in touch with the Fartlek team — we are open to conversation and new sports projects!",
    back: "Back to events",
    phone: "Phone",
    address: "Address",
    addressValue: "Kharkiv, Vlasenka St. 24",
    project: "The Fartlek project",
    projectText: [
      "Fartlek is a Ukrainian sports project created to develop running culture and bring the sports community together.",
      "We develop a sports events billboard, a digital platform for sporting events and a running community in Kharkiv.",
      "Our goal is to make sport more accessible: to help athletes find interesting starts and to help organizers attract participants and grow their events.",
    ],
    directions: "Partnership directions",
    directionList: [
      {
        title: "Race organizers",
        text: "adding sporting events to the Fartlek calendar, publishing announcements and media support.",
      },
      {
        title: "Runners and athletes",
        text: "help with finding starts, registration and using the platform.",
      },
      {
        title: "Partners and sponsors",
        text: "advertising cooperation, media support and joint sports projects.",
      },
      {
        title: "Sports clubs and communities",
        text: "developing partnerships and promoting the running movement.",
      },
      {
        title: "Platform users",
        text: "consultations, technical support and suggestions for the development of Fartlek.",
      },
    ],
    founder: "Fartlek founder",
    founderName: "Andrii Kurshatsov",
    founderRole: "Fartlek founder",
    founderImageAlt: "Andrii Kurshatsov — Fartlek founder",
    founderText: [
      "Andrii Kurshatsov — founder and developer of the Fartlek project, organizer of running events in Kharkiv.",
      "Running since 2016; marathoner, ultramarathoner and trail runner. Organizer of the Kharkiv Half Marathon 2026.",
      "Over 5 years developing Fartlek as a sports billboard and a digital platform. Founder of the Fartlek running community in Kharkiv.",
      "We are open to new connections, partnerships and ideas that help develop sport and running culture in Ukraine.",
    ],
    closing: "Fartlek — bringing together those who run!",
    seoTitle: "Contacts — Fartlek",
    seoDescription:
      "Fartlek contacts: participant support, adding runs to the calendar, cooperation with organizers, clubs and sponsors.",
  },
};

const Contacts = () => {
  const { lang } = useApp();
  const c = COPY[lang === "uk" ? "uk" : "en"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={c.seoTitle} description={c.seoDescription} canonical="/contacts" />
      <Header />
      <main className="flex-1 container py-12 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {c.back}
        </Link>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">{c.title}</h1>
        <p className="mt-3 text-xl font-semibold text-secondary-foreground">{c.subtitle}</p>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground">{c.intro}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a href="mailto:info@fartlek.com.ua" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-base hover:border-primary">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Email</div>
              <div className="font-semibold">info@fartlek.com.ua</div>
            </div>
          </a>
          <a href="tel:+380972520551" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-base hover:border-primary">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.phone}</div>
              <div className="font-semibold">+38 097 252 05 51</div>
            </div>
          </a>
          <a href="https://t.me/Andres_K" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-base hover:border-primary">
            <Send className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Telegram</div>
              <div className="font-semibold">@Andres_K</div>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.address}</div>
              <div className="font-semibold">{c.addressValue}</div>
            </div>
          </div>
        </div>

        <section className="mt-12 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-card space-y-5">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{c.project}</h2>
          <div className="space-y-4 text-base sm:text-lg leading-relaxed">
            {c.projectText.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-card">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{c.directions}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {c.directionList.map((direction, i) => (
              <div
                key={direction.title}
                className={`rounded-2xl border border-border bg-background p-5${
                  i === c.directionList.length - 1 ? " sm:col-span-2" : ""
                }`}
              >
                <div className="font-semibold text-secondary-foreground">{direction.title}</div>
                <p className="mt-1 text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {direction.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-card">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{c.founder}</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
            <figure className="flex flex-col items-start">
              <img
                src={andriiAsset.url}
                alt={c.founderImageAlt}
                className="w-full max-w-md rounded-2xl border border-border object-cover shadow-card"
                loading="lazy"
              />
              <figcaption className="mt-4 text-left">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.founderRole}</div>
                <div className="font-display text-lg font-semibold mt-1">{c.founderName}</div>
              </figcaption>
            </figure>
            <div className="space-y-4 text-base sm:text-lg leading-relaxed">
              {c.founderText.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-10 text-center font-display text-2xl sm:text-3xl font-bold text-gradient">
          {c.closing}
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Contacts;

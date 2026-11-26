import { useL } from "@/lib/use-l";
const YOUTUBE_SHORT_ID = "_moYDXQLgoQ";
const TELEGRAM_COMMUNITY_URL = "https://t.me/+KgEHRsz677s4Zjhi";

export const FounderInvite = ({ className = "" }: { className?: string }) => {
  const L = useL();
  return (
    <div className={`rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-card ${className}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
      <div className="space-y-4 text-base sm:text-lg leading-relaxed lg:flex-1">
        <p>
          {L("Привіт! Я ", "Hi! I’m ")}<span className="font-semibold">{L("Андрій Куршацов", "Andrii Kurshatsov")}</span>{L(
            " — засновник спортивної афіші Фартлек, бігової спільноти Харкова та організатор Харківського напівмарафону.",
            " — founder of the Фартлек sports events platform and Kharkiv running community, and organizer of the Kharkiv Half Marathon.",
          )}
        </p>
        <p>
          {L("Запрошую тебе приєднатися до нашої бігової спільноти Фартлек 👉", "Join our Фартлек running community 👉")}{" "}
          <a
            href={TELEGRAM_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold underline underline-offset-4 hover:opacity-80"
          >
            {L("Telegram-спільнота Фартлек", "Фартлек Telegram community")}
          </a>
        </p>
        <p>
          {L("Ми регулярно проводимо недільні довгі тренування, організовуємо дружні пробіжки у Саржиному Яру, Сквері Стрілка, Центральному парку та проводимо бігові змагання в Харкові.", "We hold regular Sunday long runs, friendly group runs in Sarzhyn Yar, Strilka Square and Central Park, and organize running races in Kharkiv.")}
        </p>
        <p>
          {L("І знаєш, у нас немає значення, з якого ти спортивного клубу чи спільноти. Бігаєш самостійно чи з друзями — ти завжди можеш приєднатися до нас!", "It doesn’t matter which club or community you’re from. Whether you run alone or with friends, you’re always welcome to join us!")}
        </p>
        <p>
          {L("Приходь, будемо разом бігати, знайомитися, спілкуватися та відкривати нові бігові маршрути нашого міста.", "Come run with us, meet new people, chat and discover new running routes in our city.")}
        </p>
        <p>
          {L("Неважливо, ти тільки починаєш бігати чи вже маєш за плечима десятки марафонів — у Фартлек раді кожному!", "Whether you’re just starting out or have dozens of marathons behind you, everyone is welcome at Фартлек!")}
        </p>
        <p className="font-semibold">{L("До зустрічі на пробіжках! Біжимо разом 🏃", "See you on the run! Let’s run together 🏃")}</p>
      </div>
      <div className="mx-auto w-full max-w-sm shrink-0 overflow-hidden rounded-2xl border border-border shadow-card lg:mx-0 lg:w-80">
        <div className="relative aspect-[9/16]">
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_SHORT_ID}`}
            title={L("Фартлек — біжимо разом", "Фартлек — let’s run together")}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
      </div>
    </div>
  );
};

export default FounderInvite;

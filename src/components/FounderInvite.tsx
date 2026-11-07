const YOUTUBE_SHORT_ID = "_moYDXQLgoQ";
const TELEGRAM_COMMUNITY_URL = "https://t.me/+KgEHRsz677s4Zjhi";

export const FounderInvite = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-card space-y-5 ${className}`}>
      <div className="space-y-4 text-base sm:text-lg leading-relaxed">
        <p>
          Привіт! Я <span className="font-semibold">Андрій Куршацов</span> — засновник спортивної
          афіші Фартлек, бігової спільноти Харкова та організатор Харківського напівмарафону.
        </p>
        <p>
          Запрошую тебе приєднатися до нашої бігової спільноти Фартлек 👉{" "}
          <a
            href={TELEGRAM_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold underline underline-offset-4 hover:opacity-80"
          >
            Telegram-спільнота Фартлек
          </a>
        </p>
        <p>
          Ми регулярно проводимо недільні довгі тренування, організовуємо дружні пробіжки у
          Саржиному Яру, Сквері Стрілка, Центральному парку та проводимо бігові змагання в Харкові.
        </p>
        <p>
          І знаєш, у нас немає значення, з якого ти спортивного клубу чи спільноти. Бігаєш
          самостійно чи з друзями — ти завжди можеш приєднатися до нас!
        </p>
        <p>
          Приходь, будемо разом бігати, знайомитися, спілкуватися та відкривати нові бігові
          маршрути нашого міста.
        </p>
        <p>
          Неважливо, ти тільки починаєш бігати чи вже маєш за плечима десятки марафонів — у Фартлек
          раді кожному!
        </p>
        <p className="font-semibold">До зустрічі на пробіжках! Біжимо разом 🏃</p>
      </div>
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border shadow-card">
        <div className="relative aspect-[9/16]">
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_SHORT_ID}`}
            title="Фартлек — біжимо разом"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FounderInvite;

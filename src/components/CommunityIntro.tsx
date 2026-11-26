import { useApp } from "@/contexts/AppContext";
export const COMMUNITY_INTRO = {
  title: "Фартлек — найбільша бігова спільнота Харкова з 2026 року! 🏃‍♂️",
  paragraphs: [
    "У нашій спільноті вже понад 200 учасників — від новачків до досвідчених бігунів.",
    "До тренувань Фартлек долучаються спортсмени з різних бігових і триатлонних клубів та спільнот Харкова. Ми об'єднуємо людей, які люблять біг, прагнуть розвиватися, ставити нові цілі та знаходити однодумців.",
    "Фартлек — це біг для кожного! Незалежно від темпу, досвіду чи спортивних результатів, у нас знайдеться місце для тебе.",
    "Бігаємо разом, підтримуємо одне одного та розвиваємо бігову культуру Харкова!",
  ],
};

export const COMMUNITY_INTRO_EN = {
  title: "Fartlek — the largest running community in Kharkiv since 2026! 🏃‍♂️",
  paragraphs: [
    "Our community already has more than 200 members, from beginners to experienced runners.",
    "Athletes from many Kharkiv running and triathlon clubs and communities join Fartlek training sessions. We bring together people who love running, want to improve, set new goals and find like-minded friends.",
    "Fartlek is running for everyone! Whatever your pace, experience or results, there’s a place for you here.",
    "We run together, support each other and grow Kharkiv’s running culture!",
  ],
};

export const CommunityIntro = ({
  variant = "card",
  className = "",
  videoId,
  videoTitle = "Фартлек — відео спільноти",
}: {
  variant?: "card" | "plain";
  className?: string;
  videoId?: string;
  videoTitle?: string;
}) => {
  const { lang } = useApp();
  const intro = lang === "uk" ? COMMUNITY_INTRO : COMMUNITY_INTRO_EN;
  const text = (
    <div className="space-y-4 lg:flex-1">
      <h2 className="font-display text-2xl font-bold leading-snug">{intro.title}</h2>
      <div className="space-y-3 text-base sm:text-lg leading-relaxed">
        {intro.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
    </div>
  );

  const video = videoId ? (
    <div className="mx-auto w-full max-w-xs shrink-0 overflow-hidden rounded-2xl border border-border shadow-card lg:mx-0 lg:w-72">
      <div className="relative aspect-[9/16]">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={videoTitle}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  ) : null;

  const inner = video ? (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
      {text}
      {video}
    </div>
  ) : (
    text
  );

  if (variant === "plain") {
    return <div className={`space-y-4 ${className}`}>{inner}</div>;
  }
  return (
    <div className={`rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-card ${className}`}>
      {inner}
    </div>
  );
};

export default CommunityIntro;

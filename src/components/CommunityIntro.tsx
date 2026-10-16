export const COMMUNITY_INTRO = {
  title: "Фартлек — найбільша бігова спільнота Харкова з 2026 року! 🏃‍♂️",
  paragraphs: [
    "У нашій спільноті вже понад 200 учасників — від новачків до досвідчених бігунів.",
    "До тренувань Фартлек долучаються спортсмени з різних бігових і триатлонних клубів та спільнот Харкова. Ми об'єднуємо людей, які люблять біг, прагнуть розвиватися, ставити нові цілі та знаходити однодумців.",
    "Фартлек — це біг для кожного! Незалежно від темпу, досвіду чи спортивних результатів, у нас знайдеться місце для тебе.",
    "Бігаємо разом, підтримуємо одне одного та розвиваємо бігову культуру Харкова!",
  ],
};

const CommunityIntro = ({
  variant = "card",
  className = "",
}: {
  variant?: "card" | "plain";
  className?: string;
}) => {
  const inner = (
    <>
      <h2 className="font-display text-2xl font-bold leading-snug">{COMMUNITY_INTRO.title}</h2>
      <div className="space-y-3 text-base sm:text-lg leading-relaxed">
        {COMMUNITY_INTRO.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
    </>
  );
  if (variant === "plain") {
    return <div className={`space-y-4 ${className}`}>{inner}</div>;
  }
  return (
    <div className={`rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-card space-y-4 ${className}`}>
      {inner}
    </div>
  );
};

export default CommunityIntro;

import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Users, Trophy } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";

/** Real platform numbers + clubs/organizers entry points, shown after the catalog. */
export const HomeDirectory = () => {
  const { lang } = useApp();
  const uk = lang === "uk";
  const [s, setS] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    (supabase.rpc as any)("get_public_stats").then(({ data }: any) => {
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setS(row);
    });
  }, []);

  const stats = s
    ? [
        { v: s.events_count, l: uk ? "Подій" : "Events" },
        { v: s.registrations_count, l: uk ? "Реєстрацій" : "Registrations" },
        { v: s.cities_count, l: uk ? "Міст" : "Cities" },
        { v: s.clubs_count, l: uk ? "Клубів" : "Clubs" },
        { v: s.organizers_count, l: uk ? "Організаторів" : "Organizers" },
      ]
    : [];

  const cards = [
    { to: "/clubs", icon: Users, title: uk ? "Бігові клуби" : "Running clubs", text: uk ? "Знайди клуб і компанію для тренувань у своєму місті." : "Find a club and training buddies in your city." },
    { to: "/organizers", icon: Trophy, title: uk ? "Організатори" : "Organizers", text: uk ? "Хто проводить старти і які події вони готують." : "Who runs the races and what's coming next." },
  ];

  return (
    <section className="container py-6 sm:py-8">
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-base hover:border-primary">
            <Icon className="h-8 w-8 shrink-0 text-primary" />
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {uk ? "Переглянути" : "Browse"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      {stats.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {stats.map((x) => (
            <div key={x.l} className="text-center">
              <dt className="font-display text-2xl font-bold text-primary">{x.v ?? 0}</dt>
              <dd className="text-xs uppercase tracking-wider text-muted-foreground">{x.l}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {uk ? "Проводите забіг? " : "Organizing a race? "}
        <Link to="/for-organizers" className="font-semibold text-primary hover:underline">{uk ? "Для організаторів" : "For organizers"}</Link>
        {" · "}
        <Link to="/features" className="font-semibold text-primary hover:underline">{uk ? "Можливості платформи" : "Platform features"}</Link>
      </p>
    </section>
  );
};

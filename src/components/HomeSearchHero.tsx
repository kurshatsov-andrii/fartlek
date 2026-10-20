import { useState, type FormEvent } from "react";
import { Link } from "@/lib/router-compat";
import { Search, CalendarDays, Map, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";

export const HomeSearchHero = () => {
  const { lang } = useApp();
  const uk = lang === "uk";
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("fartlek:search", { detail: q }));
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const links = [
    { to: "/starts", icon: ListFilter, label: uk ? "Усі старти" : "All starts" },
    { to: "/calendar?year=2027", icon: CalendarDays, label: uk ? "Календар 2027" : "Calendar 2027" },
    { to: "/map", icon: Map, label: uk ? "Мапа забігів" : "Race map" },
  ];

  return (
    <section className="border-b border-border bg-secondary text-secondary-foreground">
      <div className="container py-6 sm:py-8">
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
          {uk ? "Забіги України — " : "Races in Ukraine — "}
          <span className="text-gradient">{uk ? "знайди свій старт" : "find your start"}</span>
        </h1>
        <p className="mt-3 text-secondary-foreground/70 sm:text-lg">
          {uk ? "Де і коли наступний забіг, який тобі підходить: місто, дата, дистанція." : "Where and when is your next race: city, date, distance."}
        </p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={uk ? "Назва, місто або організатор…" : "Name, city or organizer…"}
              aria-label={uk ? "Пошук забігів" : "Search races"}
              className="h-12 bg-background pl-10 text-base text-foreground"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-8 shadow-glow">
            {uk ? "Знайти забіг" : "Find a race"}
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map(({ to, icon: Icon, label }) => (
            <Button key={to} asChild variant="outline" size="sm" className="border-secondary-foreground/20 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground">
              <Link to={to}><Icon className="mr-1.5 h-4 w-4" />{label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

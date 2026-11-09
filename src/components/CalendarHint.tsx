import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

// Shown when a search/filter returns no starts: points visitors to the full calendar.
export const CalendarHint = () => {
  const { lang } = useApp();
  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <p className="text-muted-foreground">
        {lang === "uk"
          ? "Не знайшли свій старт? Загляньте в Календар — там зібрані всі старти України."
          : "Didn't find your race? Check the Calendar — it gathers all races in Ukraine."}
      </p>
      <Button asChild variant="outline">
        <Link to="/calendar">{lang === "uk" ? "Переглянути календар" : "View calendar"}</Link>
      </Button>
    </div>
  );
};

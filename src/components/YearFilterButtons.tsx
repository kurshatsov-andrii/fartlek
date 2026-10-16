import { Button } from "@/components/ui/button";

export const YEAR_OPTIONS = ["2026", "2027"];

export const matchesYear = (date: string | null | undefined, year: string) =>
  year === "all" || (date ?? "").startsWith(year);

export function YearFilterButtons({
  value,
  onChange,
  lang = "uk",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  lang?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground mr-1">{lang === "uk" ? "Рік:" : "Year:"}</span>
      <Button size="sm" variant={value === "all" ? "default" : "outline"} onClick={() => onChange("all")}>
        {lang === "uk" ? "Усі роки" : "All years"}
      </Button>
      {YEAR_OPTIONS.map((y) => (
        <Button key={y} size="sm" variant={value === y ? "default" : "outline"} onClick={() => onChange(y)}>
          {y}
        </Button>
      ))}
    </div>
  );
}

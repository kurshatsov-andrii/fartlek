import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GrowthPoint } from "@/lib/platform-stats.functions";

const MONTHS = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];
const label = (m: string) => { const [y, mo] = m.split("-"); return `${MONTHS[Number(mo) - 1] ?? ""} ${y?.slice(2) ?? ""}`; };

const series = [
  { key: "runners", title: "Зареєстровані бігуни" },
  { key: "registrations", title: "Онлайн-реєстрації на змагання" },
  { key: "events", title: "Події та старти на платформі" },
] as const;

export function GrowthCharts({ data }: { data: GrowthPoint[] }) {
  const rows = data.map((d) => ({ ...d, label: label(d.month) }));
  return (
    <section aria-labelledby="growth" className="mb-12">
      <h2 id="growth" className="text-2xl font-bold mb-2">Зростання з 21 квітня 2026 року</h2>
      <p className="text-muted-foreground mb-6">Накопичувальні показники на кінець кожного місяця; поточний місяць — станом на сьогодні. Графіки оновлюються автоматично.</p>
      <div className="grid lg:grid-cols-3 gap-4">
        {series.map((s) => {
          const first = rows[0]?.[s.key] ?? 0;
          const last = rows[rows.length - 1]?.[s.key] ?? 0;
          return (
            <div key={s.key} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold">{s.title}</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-primary">{last.toLocaleString("uk-UA")}</span>
                <span className="text-sm text-muted-foreground">+{(last - first).toLocaleString("uk-UA")} з квітня</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rows} margin={{ left: -16, right: 8, top: 4 }}>
                    <defs>
                      <linearGradient id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }} formatter={(v: number) => [v.toLocaleString("uk-UA"), s.title]} />
                    <Area type="monotone" dataKey={s.key} stroke="hsl(var(--primary))" strokeWidth={2.5} fill={`url(#g-${s.key})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

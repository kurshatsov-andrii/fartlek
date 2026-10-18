import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  GitCompareArrows,
  Bell,
  Download,
  X,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EventPoster } from "@/components/EventPoster";
import { RegistrationStatus } from "@/components/RegistrationStatus";
import { Checkbox } from "@/components/ui/checkbox";
import { StartActions } from "@/components/StartActions";
import { useStartPlanner } from "@/contexts/StartPlannerContext";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/contexts/AppContext";
import { Link } from "@/lib/router-compat";
import {
  resolveStarts,
  plannerAlerts,
  startKey,
  downloadPlannedCalendar,
  type StartRef,
} from "@/lib/start-planner";
import { kyivToday, calendarDate } from "@/lib/calendar-discovery";
export default function StartPlanner({ mode }: { mode: "saved" | "compare" }) {
  const planner = useStartPlanner();
  const { user, loading: authLoading } = useAuth();
  const { lang } = useApp();
  const uk = lang === "uk";
  const saved = mode === "saved";
  const refs: StartRef[] = saved
    ? planner.records.map((r) => ({
        source: r.source as StartRef["source"],
        id: r.target_id,
      }))
    : planner.comparison;
  const query = useQuery({
    queryKey: ["planned-start-details", refs.map(startKey)],
    queryFn: () => resolveStarts(refs),
    enabled: refs.length > 0 && (!saved || !!user),
  });
  const title = saved
    ? uk
      ? "Збережені старти"
      : "Saved starts"
    : uk
      ? "Порівняння стартів"
      : "Compare starts";
  const items = query.data ?? [];
  const today = kyivToday();
  const recordFor = (i: StartRef) =>
    planner.records.find((r) => r.source === i.source && r.target_id === i.id);
  const due = items.flatMap((i) => {
    const record = recordFor(i);
    return record
      ? plannerAlerts(i, record, today).map((kind) => ({ i, record, kind }))
      : [];
  });
  const unavailable = refs.filter(
    (r) => !items.some((i) => startKey(i) === startKey(r)),
  );
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={saved ? "/compare" : "/saved"}>
                {saved ? (
                  <GitCompareArrows className="h-4 w-4" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
                {saved
                  ? uk
                    ? "Порівняння"
                    : "Comparison"
                  : uk
                    ? "Збережені"
                    : "Saved"}
              </Link>
            </Button>
            {!saved && refs.length > 0 && (
              <Button variant="ghost" onClick={planner.clearComparison}>
                <X className="h-4 w-4" />
                {uk ? "Очистити" : "Clear"}
              </Button>
            )}
          </div>
        </div>
        {saved && !user && !authLoading ? (
          <Button asChild>
            <Link to="/auth">
              {uk
                ? "Увійти, щоб переглянути збережені старти"
                : "Sign in to view saved starts"}
            </Link>
          </Button>
        ) : authLoading || (planner.loading && saved) || query.isFetching ? (
          <div className="py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : query.error || (saved && planner.error) ? (
          <div>
            <p>
              {uk ? "Не вдалося завантажити старти" : "Could not load starts"}
            </p>
            <Button
              onClick={() => {
                planner.retry();
                query.refetch();
              }}
            >
              {uk ? "Спробувати ще раз" : "Retry"}
            </Button>
          </div>
        ) : (
          <>
            {saved && due.length > 0 && (
              <section className="mb-8 border-l-2 border-primary pl-4 space-y-2">
                <h2 className="mb-3 flex gap-2 font-semibold">
                  <Bell className="h-5 w-5 text-primary" />
                  {uk ? "Ваші нагадування" : "Your reminders"}
                </h2>
                {due.map(({ i, record, kind }) => (
                  <div
                    key={`${startKey(i)}-${kind}`}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <p>
                      <span className="font-medium">{i.title}</span> —{" "}
                      {kind === "registration"
                        ? uk
                          ? "реєстрацію відкрито"
                          : "registration is open"
                        : kind === "date"
                          ? `${uk ? "дату змінено" : "date changed"}: ${
                              record.known_date
                                ? calendarDate(record.known_date, uk ? "uk-UA" : "en-US")
                                : ""
                            } → ${i.date ? calendarDate(i.date, uk ? "uk-UA" : "en-US") : ""}`
                          : `${uk ? "старт наближається" : "start is coming"}: ${
                              i.date ? calendarDate(i.date, uk ? "uk-UA" : "en-US") : ""
                            }`}
                    </p>
                    {kind !== "start" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          planner.updatePrefs(
                            record.id,
                            kind === "date"
                              ? { known_date: i.date }
                              : { known_registration: i.registration.state },
                          )
                        }
                      >
                        {uk ? "Зрозуміло" : "Got it"}
                      </Button>
                    )}
                  </div>
                ))}
              </section>
            )}
            {refs.length === 0 ? (
              <div className="py-12 space-y-4">
                <p className="text-muted-foreground">
                  {saved
                    ? uk
                      ? "Поки немає збережених стартів"
                      : "No saved starts yet"
                    : uk
                      ? "Поки немає стартів для порівняння"
                      : "No starts selected for comparison"}
                </p>
                <Button asChild>
                  <Link to="/starts">{uk ? "Старти" : "Starts"}</Link>
                </Button>
              </div>
            ) : saved ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {items.map((i) => {
                  const record = planner.records.find(
                    (r) => r.source === i.source && r.target_id === i.id,
                  );
                  const days = record?.reminder_days ?? null;
                  return (
                    <article
                      key={startKey(i)}
                      className="overflow-hidden rounded-lg border border-border bg-card"
                    >
                      {i.image && (
                        <div className="aspect-video">
                          <EventPoster src={i.image} alt={i.title} />
                        </div>
                      )}
                      <div className="p-5 space-y-3">
                        <h2 className="font-semibold text-lg break-words">
                          {i.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {i.date
                            ? calendarDate(i.date, uk ? "uk-UA" : "en-US")
                            : uk
                              ? "Дата не зазначена"
                              : "Date not specified"}{" "}
                          · {i.location || "—"}
                        </p>
                        <StartActions source={i.source} id={i.id} />
                        {record && (
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 shrink-0" />
                            <Select
                              value={days === null ? "off" : String(days)}
                              disabled={!i.date || i.date < kyivToday()}
                              onValueChange={(value) =>
                                planner.setReminder(
                                  record.id,
                                  value === "off" ? null : Number(value),
                                )
                              }
                            >
                              <SelectTrigger
                                aria-label={`${uk ? "Нагадування" : "Reminder"}: ${i.title}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="off">
                                  {uk ? "Без нагадування" : "No reminder"}
                                </SelectItem>
                                {[1, 3, 7].map((d) => (
                                  <SelectItem key={d} value={String(d)}>
                                    {uk
                                      ? `За ${d} дн. до старту`
                                      : `${d} days before`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <RegistrationStatus info={i.registration} uk={uk} />
                        {record && (
                          <div className="space-y-2 text-sm">
                            {(
                              [
                                [
                                  "notify_registration",
                                  uk ? "Повідомити про відкриття реєстрації" : "Notify when registration opens",
                                ],
                                [
                                  "notify_date_change",
                                  uk ? "Повідомити про зміну дати" : "Notify about date changes",
                                ],
                              ] as const
                            ).map(([field, label]) => (
                              <label key={field} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={record[field]}
                                  onCheckedChange={(v) =>
                                    planner.updatePrefs(
                                      record.id,
                                      {
                                        [field]: v === true,
                                        ...(v === true
                                          ? field === "notify_date_change"
                                            ? { known_date: i.date }
                                            : { known_registration: i.registration.state }
                                          : {}),
                                      },
                                      v === true
                                        ? uk ? "Нагадування увімкнено" : "Reminder on"
                                        : uk ? "Нагадування вимкнено" : "Reminder off",
                                    )
                                  }
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {i.url && (
                            <Button variant="outline" asChild>
                              <a href={i.url}>{uk ? "Деталі" : "Details"}</a>
                            </Button>
                          )}
                          {i.date && (
                            <Button
                              variant="outline"
                              onClick={() => downloadPlannedCalendar(i, days)}
                            >
                              <Download className="h-4 w-4" />
                              {uk ? "У календар" : "Calendar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="w-36 text-left p-4">
                        {uk ? "Параметр" : "Field"}
                      </th>
                      {items.map((i) => (
                        <th
                          key={startKey(i)}
                          className="p-4 text-left align-top min-w-52 max-w-80"
                        >
                          <h2 className="font-display text-lg break-words">
                            {i.title}
                          </h2>
                          <StartActions source={i.source} id={i.id} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        uk ? "Дата" : "Date",
                        (i: (typeof items)[number]) =>
                          i.date
                            ? calendarDate(i.date, uk ? "uk-UA" : "en-US")
                            : null,
                      ],
                      [
                        uk ? "Час" : "Time",
                        (i: (typeof items)[number]) => i.time?.slice(0, 5),
                      ],
                      [
                        uk ? "Місце" : "Location",
                        (i: (typeof items)[number]) => i.location,
                      ],
                      [
                        uk ? "Дистанції" : "Distances",
                        (i: (typeof items)[number]) => i.distances,
                      ],
                      [
                        uk ? "Ціна" : "Price",
                        (i: (typeof items)[number]) =>
                          i.isPaid === false
                            ? uk
                              ? "Безкоштовно"
                              : "Free"
                            : i.price !== null
                              ? `${uk ? "від" : "from"} ${i.price} ₴`
                              : null,
                      ],
                      [
                        uk ? "Організатор" : "Organizer",
                        (i: (typeof items)[number]) => i.organizer,
                      ],
                      [
                        uk ? "Реєстрація" : "Registration",
                        (i: (typeof items)[number]) => (
                          <RegistrationStatus info={i.registration} uk={uk} />
                        ),
                      ],
                    ].map(([label, get]) => (
                      <tr
                        key={String(label)}
                        className="border-t border-border"
                      >
                        <th className="p-4 text-left font-medium">
                          {String(label)}
                        </th>
                        {items.map((i) => (
                          <td
                            key={startKey(i)}
                            className="p-4 align-top break-words"
                          >
                            {typeof get === "function"
                              ? get(i) ||
                                (uk ? "Не зазначено" : "Not specified")
                              : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-t border-border">
                      <th className="p-4 text-left">
                        {uk ? "Посилання" : "Link"}
                      </th>
                      {items.map((i) => (
                        <td key={startKey(i)} className="p-4">
                          {i.url && (
                            <Button asChild variant="outline">
                              <a href={i.url}>{uk ? "Деталі" : "Details"}</a>
                            </Button>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {!query.isFetching &&
              unavailable.map((r) => (
                <div className="mt-4 flex gap-3 items-center" key={startKey(r)}>
                  <span>
                    {uk
                      ? "Старт більше недоступний"
                      : "Start no longer available"}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      saved ? planner.toggleSave(r) : planner.compare(r)
                    }
                  >
                    <X className="h-4 w-4" />
                    {uk ? "Прибрати" : "Remove"}
                  </Button>
                </div>
              ))}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { calendarDate } from "@/lib/calendar-discovery";
import {
  registrationLabel,
  sourceHost,
  type RegistrationInfo,
} from "@/lib/registration-status";

const tone: Record<RegistrationInfo["state"], string> = {
  open: "bg-primary text-primary-foreground",
  expected: "bg-secondary text-secondary-foreground",
  closed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
  unknown: "bg-muted text-muted-foreground",
};

export function RegistrationStatus({
  info,
  uk = true,
  compact = false,
}: {
  info: RegistrationInfo;
  uk?: boolean;
  compact?: boolean;
}) {
  const locale = uk ? "uk-UA" : "en-US";
  const host = sourceHost(info.sourceUrl);
  return (
    <div className="space-y-1 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">
          {uk ? "Реєстрація:" : "Registration:"}
        </span>
        <Badge className={`border-transparent ${tone[info.state]}`}>
          {registrationLabel(info.state, uk)}
        </Badge>
        {info.state === "expected" && info.opensOn && (
          <span className="text-muted-foreground">
            {uk ? "з" : "from"} {calendarDate(info.opensOn, locale)}
          </span>
        )}
      </div>
      {!compact && (info.sourceLabel || host || info.checkedOn) && (
        <p className="text-xs text-muted-foreground">
          {(info.sourceLabel || host) && (
            <>
              {uk ? "Джерело: " : "Source: "}
              {host && info.sourceUrl ? (
                <a
                  href={info.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  {host}
                </a>
              ) : (
                info.sourceLabel
              )}
            </>
          )}
          {info.checkedOn && (
            <>
              {(info.sourceLabel || host) && " · "}
              {uk ? "Перевірено: " : "Checked: "}
              {calendarDate(info.checkedOn, locale)}
            </>
          )}
        </p>
      )}
    </div>
  );
}

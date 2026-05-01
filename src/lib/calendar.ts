// Generate and download an .ics calendar file for an event.
// Local Kyiv time is assumed for the event_date/event_time stored as plain strings.

interface IcsEvent {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM:SS or HH:MM */
  time: string;
  /** Duration in hours (default 4) */
  durationHours?: number;
  url?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatLocalDateTime(date: string, time: string): string {
  // "2026-05-12" + "09:30:00" → "20260512T093000"
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss = 0] = time.split(":").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}${pad(ss)}`;
}

function addHoursLocal(date: string, time: string, hours: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss = 0] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, ss);
  dt.setHours(dt.getHours() + hours);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`;
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildIcs(ev: IcsEvent): string {
  const dtStart = formatLocalDateTime(ev.date, ev.time);
  const dtEnd = addHoursLocal(ev.date, ev.time, ev.durationHours ?? 4);
  const dtStamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fartlek//Events//UK",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Kyiv",
    "BEGIN:STANDARD",
    "DTSTART:19701025T040000",
    "TZOFFSETFROM:+0300",
    "TZOFFSETTO:+0200",
    "TZNAME:EET",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "DTSTART:19700329T030000",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0300",
    "TZNAME:EEST",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${ev.uid}@fartlek.com.ua`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Europe/Kyiv:${dtStart}`,
    `DTEND;TZID=Europe/Kyiv:${dtEnd}`,
    `SUMMARY:${escapeIcsText(ev.title)}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
  if (ev.location) lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
  if (ev.url) lines.push(`URL:${ev.url}`);
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(ev.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return lines.join("\r\n");
}

/**
 * Convert local Kyiv (Europe/Kyiv) date+time to a UTC string formatted as YYYYMMDDTHHMMSSZ.
 * Used by Google / Outlook web calendar URLs which expect UTC.
 */
function kyivLocalToUtcZ(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss = 0] = time.split(":").map(Number);
  // Determine if Kyiv is on EEST (+3) or EET (+2) for that local date.
  // Use Intl to ask what offset Europe/Kyiv has at that local wall-clock instant.
  // Trick: build a UTC date from the wall-clock numbers, then compare what that UTC
  // instant looks like in Kyiv vs UTC to derive the offset.
  const asUtc = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Kyiv",
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(asUtc).map((p) => [p.type, p.value]));
  const kyivAsUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  const offsetMs = kyivAsUtc - asUtc.getTime(); // Kyiv offset from UTC
  const utcMs = asUtc.getTime() - offsetMs;
  const u = new Date(utcMs);
  return `${u.getUTCFullYear()}${pad(u.getUTCMonth() + 1)}${pad(u.getUTCDate())}T${pad(u.getUTCHours())}${pad(u.getUTCMinutes())}${pad(u.getUTCSeconds())}Z`;
}

function addHoursUtcZ(utcZ: string, hours: number): string {
  // utcZ: YYYYMMDDTHHMMSSZ
  const y = Number(utcZ.slice(0, 4));
  const m = Number(utcZ.slice(4, 6));
  const d = Number(utcZ.slice(6, 8));
  const hh = Number(utcZ.slice(9, 11));
  const mm = Number(utcZ.slice(11, 13));
  const ss = Number(utcZ.slice(13, 15));
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  dt.setUTCHours(dt.getUTCHours() + hours);
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`;
}

export function googleCalendarUrl(ev: IcsEvent): string {
  const start = kyivLocalToUtcZ(ev.date, ev.time);
  const end = addHoursUtcZ(start, ev.durationHours ?? 4);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${start}/${end}`,
    ctz: "Europe/Kyiv",
  });
  if (ev.description || ev.url) {
    const desc = [ev.description, ev.url].filter(Boolean).join("\n\n");
    params.set("details", desc);
  }
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(ev: IcsEvent): string {
  // Outlook web expects ISO 8601 with timezone — give it UTC ISO.
  const startZ = kyivLocalToUtcZ(ev.date, ev.time);
  const endZ = addHoursUtcZ(startZ, ev.durationHours ?? 4);
  const toIso = (z: string) =>
    `${z.slice(0, 4)}-${z.slice(4, 6)}-${z.slice(6, 8)}T${z.slice(9, 11)}:${z.slice(11, 13)}:${z.slice(13, 15)}Z`;
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.title,
    startdt: toIso(startZ),
    enddt: toIso(endZ),
  });
  if (ev.description || ev.url) {
    params.set("body", [ev.description, ev.url].filter(Boolean).join("\n\n"));
  }
  if (ev.location) params.set("location", ev.location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export type CalendarEvent = IcsEvent;

export function downloadIcs(ev: IcsEvent, filename?: string): void {
  const ics = buildIcs(ev);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safe = (filename || ev.title).replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60);
  a.download = `${safe}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

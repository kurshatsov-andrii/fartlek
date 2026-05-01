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

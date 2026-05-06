import React from "react";

// Matches URLs (with or without protocol), emails, and phone numbers
const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?])/gi;
const EMAIL_RE = /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
// Phones: +38 (066) 468 81 51, +380664688151, 066 468 81 51, 066-468-81-51, etc.
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/g;

type Token = { type: "text" | "url" | "email" | "phone"; value: string };

function tokenize(text: string): Token[] {
  const matches: { start: number; end: number; type: Token["type"]; value: string }[] = [];

  const push = (re: RegExp, type: Token["type"]) => {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, type, value: m[0] });
    }
  };

  push(URL_RE, "url");
  push(EMAIL_RE, "email");
  push(PHONE_RE, "phone");

  // Sort & remove overlaps (prefer earlier, longer match)
  matches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const filtered: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start < lastEnd) continue;
    filtered.push(m);
    lastEnd = m.end;
  }

  const tokens: Token[] = [];
  let cursor = 0;
  for (const m of filtered) {
    if (m.start > cursor) tokens.push({ type: "text", value: text.slice(cursor, m.start) });
    tokens.push({ type: m.type, value: m.value });
    cursor = m.end;
  }
  if (cursor < text.length) tokens.push({ type: "text", value: text.slice(cursor) });
  return tokens;
}

export function linkifyText(text: string, onPrimary = false): React.ReactNode[] {
  const linkClass = onPrimary
    ? "font-semibold underline underline-offset-2 hover:opacity-80"
    : "text-primary underline underline-offset-2 hover:opacity-80";
  return tokenize(text).map((t, i) => {
    if (t.type === "url") {
      const href = t.value.startsWith("http") ? t.value : `https://${t.value}`;
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {t.value}
        </a>
      );
    }
    if (t.type === "email") {
      return (
        <a key={i} href={`mailto:${t.value}`} className={linkClass}>
          {t.value}
        </a>
      );
    }
    if (t.type === "phone") {
      const tel = t.value.replace(/[^\d+]/g, "");
      return (
        <a key={i} href={`tel:${tel}`} className={linkClass}>
          {t.value}
        </a>
      );
    }
    return <React.Fragment key={i}>{t.value}</React.Fragment>;
  });
}

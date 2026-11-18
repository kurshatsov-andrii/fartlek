import React from "react";

// Matches URLs (with or without protocol), emails, and phone numbers
const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?])/gi;
const EMAIL_RE = /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
// Phones: +38 (066) 468 81 51, +380664688151, 066 468 81 51, 066-468-81-51, etc.
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/g;
// Race dates such as 29.11.2026, 14.11.2026 or 2026-11-14 are never phone numbers.
const DATE_RE = /\b\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}\b|\b\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2}\b/g;
const DATE_LIKE_RE = /\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}|\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2}/;

type Token = { type: "text" | "url" | "email" | "phone" | "date"; value: string };

function isPhoneNumber(value: string): boolean {
  if (DATE_LIKE_RE.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

function tokenize(text: string): Token[] {
  const matches: { start: number; end: number; type: Token["type"]; value: string }[] = [];

  const push = (
    re: RegExp,
    type: Token["type"],
    filter?: (value: string) => boolean,
  ) => {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      if (filter && !filter(m[0])) continue;
      matches.push({ start: m.index, end: m.index + m[0].length, type, value: m[0] });
    }
  };

  push(URL_RE, "url");
  push(EMAIL_RE, "email");
  push(DATE_RE, "date");
  push(PHONE_RE, "phone", isPhoneNumber);

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

export function isInternalArticleLink(href: string): boolean {
  try {
    const url = new URL(href);
    return ["fartlek.com.ua", "www.fartlek.com.ua", "fartlek.lovable.app"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function linkifyText(text: string, onPrimary = false, articleLinks = false): React.ReactNode[] {
  const linkClass = onPrimary
    ? "font-semibold underline underline-offset-2 hover:opacity-80"
    : "text-primary underline underline-offset-2 hover:opacity-80";
  // Dates keep the accent color but carry no link styling, so they read as text.
  const dateClass = onPrimary ? "font-semibold" : "text-primary";
  return tokenize(text).map((t, i) => {
    if (t.type === "url") {
      const href = t.value.startsWith("http") ? t.value : `https://${t.value}`;
      const internal = articleLinks && isInternalArticleLink(href);
      return (
        <a key={i} href={href} target={internal ? undefined : "_blank"} rel={internal ? undefined : "noopener noreferrer"} className={linkClass}>
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
    if (t.type === "date") {
      return (
        <span key={i} className={dateClass}>
          {t.value}
        </span>
      );
    }
    return <React.Fragment key={i}>{t.value}</React.Fragment>;
  });
}

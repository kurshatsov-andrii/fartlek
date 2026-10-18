export type RegistrationState =
  | "open"
  | "expected"
  | "closed"
  | "cancelled"
  | "unknown";

export const REGISTRATION_STATES = ["open", "expected", "closed", "cancelled"] as const;

export interface RegistrationInfo {
  state: RegistrationState;
  opensOn: string | null;
  sourceUrl: string | null;
  /** Set when the source is the organizer's own page on Fartlek. */
  sourceLabel: string | null;
  checkedOn: string | null;
}

export interface RegistrationInput {
  /** Status confirmed by an admin; null when nobody has verified it. */
  explicit?: string | null;
  opensOn?: string | null;
  cancelled?: boolean;
  closed?: boolean;
  /** Platform events accept registration by default; external starts do not. */
  defaultOpen?: boolean;
  date: string | null;
  today: string;
}

export function deriveRegistrationState(i: RegistrationInput): RegistrationState {
  if (i.cancelled || i.explicit === "cancelled") return "cancelled";
  if (i.date && i.date < i.today) return "closed";
  if (i.closed || i.explicit === "closed") return "closed";
  if (i.opensOn && i.opensOn > i.today) return "expected";
  if (i.explicit === "expected") return i.opensOn ? "open" : "expected";
  if (i.explicit === "open") return "open";
  return i.defaultOpen ? "open" : "unknown";
}

export function registrationLabel(state: RegistrationState, uk = true): string {
  const labels: Record<RegistrationState, [string, string]> = {
    open: ["Відкрита", "Open"],
    expected: ["Очікується", "Expected"],
    closed: ["Закрита", "Closed"],
    cancelled: ["Скасовано", "Cancelled"],
    unknown: ["Не зазначено", "Not specified"],
  };
  return labels[state][uk ? 0 : 1];
}

export function sourceHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

import { isCompletedDate } from "./event-date";

/** Listing cards must not offer registration once it is closed or cancelled; a past event date counts as closed,
 *  and per the owner rule a start is already finished the day before its date. */
export function canShowRegisterButton(input: RegistrationInput): boolean {
  const state = deriveRegistrationState(input);
  if (state === "closed" || state === "cancelled") return false;
  if (input.date && isCompletedDate(input.date, input.today)) return false;
  return true;
}

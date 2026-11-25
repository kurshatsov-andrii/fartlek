/**
 * Platform founding date, taken from the first records in the backend:
 * the first account and the first event were created on 21 April 2026.
 * Kept in one place so every page shows the same date.
 */
export const PLATFORM_SINCE_ISO = "2026-04-21";

export const PLATFORM_SINCE_UK = "21 квітня 2026 року";
export const PLATFORM_SINCE_EN = "21 April 2026";

/** e.g. "Платформа працює з 21 квітня 2026 року" / "The platform has been running since 21 April 2026" */
export const platformSinceLine = (uk: boolean) =>
  uk ? `Платформа працює з ${PLATFORM_SINCE_UK}` : `The platform has been running since ${PLATFORM_SINCE_EN}`;

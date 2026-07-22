/**
 * Pure date-only helpers, all operating on "YYYY-MM-DD" strings and UTC
 * midnight `Date` objects internally so calendar math (adding a month,
 * comparing dates, deriving a month key) never drifts a day from the
 * browser's local timezone or DST transitions.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Splits "YYYY-MM-DD" into [year, month, day] numbers. Only call on strings already matching ISO_DATE. */
function isoParts(value: string): [number, number, number] {
  const [y, m, d] = value.split("-").map(Number);
  return [y!, m!, d!];
}

/** Splits "YYYY-MM" into [year, month] numbers. */
function monthKeyParts(key: string): [number, number] {
  const [y, m] = key.split("-").map(Number);
  return [y!, m!];
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = isoParts(value);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

function toUtcDate(iso: string): Date {
  const [y, m, d] = isoParts(iso);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtcDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIso(now = new Date()): string {
  return fromUtcDate(
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
  );
}

export function compareIsoDates(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function isBeforeOrEqual(a: string, b: string): boolean {
  return compareIsoDates(a, b) <= 0;
}

export function addDays(iso: string, days: number): string {
  const date = toUtcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtcDate(date);
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

/** Adds calendar months, clamping the day into a shorter target month (e.g. Jan 31 + 1mo -> Feb 28/29). */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = isoParts(iso);
  const totalMonths = m - 1 + months;
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonthIndex0 = ((totalMonths % 12) + 12) % 12;
  const clampedDay = Math.min(d, daysInMonth(targetYear, targetMonthIndex0));
  return fromUtcDate(
    new Date(Date.UTC(targetYear, targetMonthIndex0, clampedDay)),
  );
}

export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * 12);
}

export type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "yearly";

export const FREQUENCIES: Frequency[] = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Day",
  weekly: "Week",
  biweekly: "2 weeks",
  monthly: "Month",
  yearly: "Year",
};

/** Advances `iso` by one occurrence of `frequency`, repeated `interval` times (interval >= 1). */
export function addInterval(
  iso: string,
  frequency: Frequency,
  interval: number,
): string {
  const n = Math.max(1, Math.floor(interval) || 1);
  switch (frequency) {
    case "daily":
      return addDays(iso, n);
    case "weekly":
      return addDays(iso, 7 * n);
    case "biweekly":
      return addDays(iso, 14 * n);
    case "monthly":
      return addMonths(iso, n);
    case "yearly":
      return addYears(iso, n);
  }
}

/** "YYYY-MM" key for the month a date falls in. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function monthKeyOf(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

export function currentMonthKey(now = new Date()): string {
  return monthKeyOf(now.getFullYear(), now.getMonth());
}

export function addMonthsToMonthKey(key: string, months: number): string {
  const [y, m] = monthKeyParts(key);
  const totalMonths = m - 1 + months;
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonthIndex0 = ((totalMonths % 12) + 12) % 12;
  return monthKeyOf(targetYear, targetMonthIndex0);
}

/** Returns `count` month keys ending at (and including) `endKey`, oldest first. */
export function recentMonthKeys(count: number, endKey: string): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(addMonthsToMonthKey(endKey, -i));
  }
  return keys;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMonthLabel(key: string): string {
  const [y, m] = monthKeyParts(key);
  return `${MONTH_LABELS[m - 1]} ${y}`;
}

export function formatMonthLabelShort(key: string): string {
  const [, m] = monthKeyParts(key);
  return MONTH_LABELS[m - 1] ?? key;
}

/** Last calendar day of the given "YYYY-MM" month key, as an ISO date. */
export function endOfMonthIso(key: string): string {
  const [y, m] = monthKeyParts(key);
  return fromUtcDate(new Date(Date.UTC(y, m, 0)));
}

/** First calendar day of the given "YYYY-MM" month key, as an ISO date. */
export function startOfMonthIso(key: string): string {
  return `${key}-01`;
}

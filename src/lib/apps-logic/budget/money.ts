/**
 * Every monetary amount in this app is an integer number of cents. Doing
 * arithmetic in floating-point dollars (0.1 + 0.2 !== 0.3) is exactly the
 * kind of bug that quietly corrupts a balance, so no dollar float ever
 * touches the domain logic or storage — only these two edges convert, and
 * both round explicitly.
 */

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Parses a user-typed amount ("12.5", "$1,234.56", "-3") into integer cents, or null if unparseable. */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.trim().replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return dollarsToCents(Number(cleaned));
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCents(cents: number): string {
  return CURRENCY_FORMATTER.format(centsToDollars(cents));
}

/** Compact signed form for deltas, e.g. "+$120.00" / "-$45.50". */
export function formatCentsSigned(cents: number): string {
  const sign = cents > 0 ? "+" : cents < 0 ? "-" : "";
  return `${sign}${CURRENCY_FORMATTER.format(Math.abs(centsToDollars(cents)))}`;
}

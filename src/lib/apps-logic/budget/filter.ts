import { normalizeText } from "@/lib/apps/normalize";
import { isBeforeOrEqual } from "./dates";
import type { Transaction, TransactionType } from "./model";

export interface TransactionFilters {
  query?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  minAmountCents?: number;
  maxAmountCents?: number;
  clearedOnly?: boolean;
  uncategorizedOnly?: boolean;
}

export function transactionMatchesFilters(
  tx: Transaction,
  filters: TransactionFilters,
): boolean {
  if (filters.query?.trim()) {
    const q = normalizeText(filters.query);
    const haystack = normalizeText(`${tx.payee} ${tx.memo}`);
    if (!haystack.includes(q)) return false;
  }
  if (filters.accountId) {
    const matchesAccount =
      tx.accountId === filters.accountId ||
      tx.transferAccountId === filters.accountId;
    if (!matchesAccount) return false;
  }
  if (filters.categoryId && tx.categoryId !== filters.categoryId) return false;
  if (filters.type && tx.type !== filters.type) return false;
  if (filters.dateFrom && !isBeforeOrEqual(filters.dateFrom, tx.date))
    return false;
  if (filters.dateTo && !isBeforeOrEqual(tx.date, filters.dateTo)) return false;
  if (
    filters.minAmountCents !== undefined &&
    tx.amountCents < filters.minAmountCents
  )
    return false;
  if (
    filters.maxAmountCents !== undefined &&
    tx.amountCents > filters.maxAmountCents
  )
    return false;
  if (filters.clearedOnly && !tx.cleared) return false;
  if (filters.uncategorizedOnly && tx.categoryId) return false;
  return true;
}

export function filterTransactions(
  transactions: readonly Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  return transactions.filter((tx) => transactionMatchesFilters(tx, filters));
}

export function hasActiveTransactionFilters(
  filters: TransactionFilters,
): boolean {
  return !!(
    filters.query?.trim() ||
    filters.accountId ||
    filters.categoryId ||
    filters.type ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.minAmountCents !== undefined ||
    filters.maxAmountCents !== undefined ||
    filters.clearedOnly ||
    filters.uncategorizedOnly
  );
}

export type TransactionSort =
  "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function sortTransactions(
  transactions: readonly Transaction[],
  sort: TransactionSort,
): Transaction[] {
  const copy = [...transactions];
  switch (sort) {
    case "date-desc":
      return copy.sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      );
    case "date-asc":
      return copy.sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.createdAt.localeCompare(b.createdAt),
      );
    case "amount-desc":
      return copy.sort((a, b) => b.amountCents - a.amountCents);
    case "amount-asc":
      return copy.sort((a, b) => a.amountCents - b.amountCents);
  }
}

import type {
  Account,
  BudgetEntry,
  Category,
  RecurringRule,
  SavingsGoal,
  Transaction,
} from "./model";
import { endOfMonthIso, isBeforeOrEqual, monthKey } from "./dates";

/** Signed contribution of one transaction to one specific account's balance. */
function signedAmountForAccount(tx: Transaction, accountId: string): number {
  if (tx.type === "income" && tx.accountId === accountId) return tx.amountCents;
  if (tx.type === "expense" && tx.accountId === accountId)
    return -tx.amountCents;
  if (tx.type === "transfer") {
    if (tx.accountId === accountId) return -tx.amountCents;
    if (tx.transferAccountId === accountId) return tx.amountCents;
  }
  return 0;
}

export interface BalanceOptions {
  /** Only count transactions dated on/before this ISO date. Omit for all-time. */
  asOf?: string;
}

export function accountBalanceCents(
  account: Account,
  transactions: readonly Transaction[],
  options: BalanceOptions = {},
): number {
  let balance = account.startingBalanceCents;
  for (const tx of transactions) {
    if (options.asOf && !isBeforeOrEqual(tx.date, options.asOf)) continue;
    balance += signedAmountForAccount(tx, account.id);
  }
  return balance;
}

export function totalBalanceCents(
  accounts: readonly Account[],
  transactions: readonly Transaction[],
  options: BalanceOptions & { includeArchived?: boolean } = {},
): number {
  return accounts
    .filter((a) => options.includeArchived || !a.archived)
    .reduce((sum, a) => sum + accountBalanceCents(a, transactions, options), 0);
}

/** Total balance at the end of each given month key, oldest first — a simple net-worth trend. */
export function netWorthSeries(
  accounts: readonly Account[],
  transactions: readonly Transaction[],
  monthKeys: readonly string[],
): { month: string; balanceCents: number }[] {
  return monthKeys.map((month) => ({
    month,
    balanceCents: totalBalanceCents(accounts, transactions, {
      asOf: endOfMonthIso(month),
    }),
  }));
}

export function transactionsInMonth(
  transactions: readonly Transaction[],
  month: string,
): Transaction[] {
  return transactions.filter((tx) => monthKey(tx.date) === month);
}

export interface MonthTotals {
  month: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}

export function monthlyTotals(
  transactions: readonly Transaction[],
  monthKeys: readonly string[],
): MonthTotals[] {
  return monthKeys.map((month) => {
    const inMonth = transactionsInMonth(transactions, month);
    const incomeCents = inMonth
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amountCents, 0);
    const expenseCents = inMonth
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amountCents, 0);
    return {
      month,
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
    };
  });
}

/** Sums expense (or income) transactions per category for one month, categories with no spending omitted. */
export function categoryTotalsForMonth(
  transactions: readonly Transaction[],
  month: string,
  kind: "income" | "expense",
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const tx of transactionsInMonth(transactions, month)) {
    if (tx.type !== kind || !tx.categoryId) continue;
    totals.set(
      tx.categoryId,
      (totals.get(tx.categoryId) ?? 0) + tx.amountCents,
    );
  }
  return totals;
}

export type BudgetStatus = "good" | "warning" | "critical";

export function budgetStatusForPercent(percent: number): BudgetStatus {
  if (percent >= 100) return "critical";
  if (percent >= 80) return "warning";
  return "good";
}

export interface BudgetProgress {
  categoryId: string;
  category: Category | undefined;
  limitCents: number;
  spentCents: number;
  remainingCents: number;
  /** Spent as a percentage of the limit, uncapped (can exceed 100). */
  percent: number;
  status: BudgetStatus;
}

export function budgetProgressForMonth(
  budgets: readonly BudgetEntry[],
  transactions: readonly Transaction[],
  categories: readonly Category[],
  month: string,
): BudgetProgress[] {
  const spentByCategory = categoryTotalsForMonth(
    transactions,
    month,
    "expense",
  );
  return budgets
    .filter((b) => b.month === month)
    .map((budget) => {
      const spentCents = spentByCategory.get(budget.categoryId) ?? 0;
      const percent =
        budget.limitCents > 0 ? (spentCents / budget.limitCents) * 100 : 0;
      return {
        categoryId: budget.categoryId,
        category: categories.find((c) => c.id === budget.categoryId),
        limitCents: budget.limitCents,
        spentCents,
        remainingCents: budget.limitCents - spentCents,
        percent,
        status: budgetStatusForPercent(percent),
      };
    });
}

export function upcomingRecurring(
  rules: readonly RecurringRule[],
  today: string,
  withinDays = 14,
): RecurringRule[] {
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() + withinDays);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  return rules
    .filter((r) => r.active && isBeforeOrEqual(r.nextDueDate, cutoffIso))
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
}

export interface GoalProgress {
  savedCents: number;
  targetCents: number;
  remainingCents: number;
  /** Saved as a percentage of the target, capped at 100 for display. */
  percent: number;
}

export function goalProgress(goal: SavingsGoal): GoalProgress {
  const savedCents = goal.contributions.reduce(
    (sum, c) => sum + c.amountCents,
    0,
  );
  const percent =
    goal.targetCents > 0
      ? Math.min(100, (savedCents / goal.targetCents) * 100)
      : 0;
  return {
    savedCents,
    targetCents: goal.targetCents,
    remainingCents: Math.max(0, goal.targetCents - savedCents),
    percent,
  };
}

/** Percentage of income not spent, 0 when there is no income (avoids divide-by-zero surfacing as Infinity/NaN in the UI). */
export function savingsRatePercent(
  incomeCents: number,
  expenseCents: number,
): number {
  if (incomeCents <= 0) return 0;
  return ((incomeCents - expenseCents) / incomeCents) * 100;
}

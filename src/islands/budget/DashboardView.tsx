import { useMemo } from "react";
import type { BudgetState } from "@/lib/apps-logic/budget/model";
import {
  budgetProgressForMonth,
  categoryTotalsForMonth,
  monthlyTotals,
  netWorthSeries,
  savingsRatePercent,
  totalBalanceCents,
  upcomingRecurring,
} from "@/lib/apps-logic/budget/calculations";
import {
  currentMonthKey,
  formatMonthLabel,
  recentMonthKeys,
  todayIso,
} from "@/lib/apps-logic/budget/dates";
import { formatCents, formatCentsSigned } from "@/lib/apps-logic/budget/money";
import { StatTile } from "./StatTile";
import { Meter } from "./Meter";
import { CashFlowChart } from "./charts/CashFlowChart";
import { CategoryBreakdownChart } from "./charts/CategoryBreakdownChart";
import { BalanceTrendChart } from "./charts/BalanceTrendChart";
import Icon from "@/components/react/Icon";
import { buttonPrimary } from "@/components/react/styles";

const MONTHS_OF_HISTORY = 6;
const MAX_CATEGORY_ROWS = 7;

interface DashboardViewProps {
  state: BudgetState;
  onGoToTransactions: () => void;
  onGoToAccounts: () => void;
}

export function DashboardView({
  state,
  onGoToTransactions,
  onGoToAccounts,
}: DashboardViewProps) {
  const today = todayIso();
  const month = currentMonthKey();
  const months = useMemo(
    () => recentMonthKeys(MONTHS_OF_HISTORY, month),
    [month],
  );

  const totals = useMemo(
    () => monthlyTotals(state.transactions, months),
    [state.transactions, months],
  );
  const thisMonth = totals[totals.length - 1]!;
  const lastMonth = totals[totals.length - 2];

  const netWorth = useMemo(
    () => netWorthSeries(state.accounts, state.transactions, months),
    [state.accounts, state.transactions, months],
  );

  const currentBalance = totalBalanceCents(state.accounts, state.transactions);
  const savingsRate = savingsRatePercent(
    thisMonth.incomeCents,
    thisMonth.expenseCents,
  );

  const categoryRows = useMemo(() => {
    const spentByCategory = categoryTotalsForMonth(
      state.transactions,
      month,
      "expense",
    );
    const rows = [...spentByCategory.entries()]
      .map(([categoryId, amountCents]) => {
        const category = state.categories.find((c) => c.id === categoryId);
        return {
          id: categoryId,
          name: category?.name ?? "Uncategorized",
          color: category?.color ?? null,
          amountCents,
        };
      })
      .sort((a, b) => b.amountCents - a.amountCents);

    if (rows.length <= MAX_CATEGORY_ROWS) return rows;
    const head = rows.slice(0, MAX_CATEGORY_ROWS - 1);
    const tail = rows.slice(MAX_CATEGORY_ROWS - 1);
    const otherTotal = tail.reduce((sum, r) => sum + r.amountCents, 0);
    return [
      ...head,
      { id: "other", name: "Other", color: null, amountCents: otherTotal },
    ];
  }, [state.transactions, state.categories, month]);

  const budgetProgress = useMemo(
    () =>
      budgetProgressForMonth(
        state.budgets,
        state.transactions,
        state.categories,
        month,
      )
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 4),
    [state.budgets, state.transactions, state.categories, month],
  );

  const upcoming = useMemo(
    () => upcomingRecurring(state.recurringRules, today, 14),
    [state.recurringRules, today],
  );

  const hasAnyData = state.accounts.length > 0;

  if (!hasAnyData) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center sm:px-6">
        <Icon name="wallet" className="text-text-muted h-8 w-8" />
        <p className="text-text">Add an account to see your dashboard.</p>
        <button
          type="button"
          className={buttonPrimary}
          onClick={onGoToAccounts}
        >
          <Icon name="plus" className="h-4 w-4" />
          Add your first account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total balance"
          value={formatCents(currentBalance)}
          icon="wallet"
        />
        <StatTile
          label="Income this month"
          value={formatCents(thisMonth.incomeCents)}
          icon="trending-up"
          delta={
            lastMonth
              ? {
                  text: `${formatCentsSigned(thisMonth.incomeCents - lastMonth.incomeCents)} vs last month`,
                  tone:
                    thisMonth.incomeCents >= lastMonth.incomeCents
                      ? "good"
                      : "bad",
                }
              : undefined
          }
        />
        <StatTile
          label="Expenses this month"
          value={formatCents(thisMonth.expenseCents)}
          icon="trending-down"
          delta={
            lastMonth
              ? {
                  text: `${formatCentsSigned(thisMonth.expenseCents - lastMonth.expenseCents)} vs last month`,
                  tone:
                    thisMonth.expenseCents <= lastMonth.expenseCents
                      ? "good"
                      : "bad",
                }
              : undefined
          }
        />
        <StatTile
          label="Savings rate"
          value={`${savingsRate.toFixed(0)}%`}
          icon="piggy-bank"
          delta={{
            text:
              thisMonth.incomeCents === 0
                ? "No income recorded yet"
                : savingsRate >= 0
                  ? "of income kept"
                  : "spent beyond income",
            tone: savingsRate >= 0 ? "good" : "bad",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="border-border bg-bg-elevated rounded-lg border p-4">
          <h2 className="text-text mb-3 text-sm font-semibold">
            Income vs. expenses
          </h2>
          <CashFlowChart data={totals} />
        </section>

        <section className="border-border bg-bg-elevated rounded-lg border p-4">
          <h2 className="text-text mb-3 text-sm font-semibold">
            Total balance over time
          </h2>
          <BalanceTrendChart data={netWorth} />
        </section>

        <section className="border-border bg-bg-elevated rounded-lg border p-4">
          <h2 className="text-text mb-3 text-sm font-semibold">
            Spending by category — {formatMonthLabel(month)}
          </h2>
          <CategoryBreakdownChart
            rows={categoryRows}
            emptyMessage="No expenses recorded yet this month."
          />
        </section>

        <section className="border-border bg-bg-elevated rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-text text-sm font-semibold">Budget check-in</h2>
          </div>
          {budgetProgress.length === 0 ? (
            <p className="text-text-muted text-sm">
              No budgets set for {formatMonthLabel(month)} yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {budgetProgress.map((b) => (
                <Meter
                  key={b.categoryId}
                  label={b.category?.name ?? "Uncategorized"}
                  valueCents={b.spentCents}
                  targetCents={b.limitCents}
                  percent={b.percent}
                  status={b.status}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="border-border bg-bg-elevated rounded-lg border p-4">
        <h2 className="text-text mb-3 text-sm font-semibold">
          Upcoming in the next 14 days
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-text-muted text-sm">
            No upcoming recurring bills.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-text flex items-center gap-2">
                  <Icon name="repeat" className="text-text-muted h-4 w-4" />
                  {rule.name}
                </span>
                <span className="text-text-muted">
                  {rule.nextDueDate} ·{" "}
                  <span
                    className={
                      rule.type === "income" ? "text-success" : "text-text"
                    }
                  >
                    {formatCents(rule.amountCents)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={onGoToTransactions}
        className="text-accent self-start text-sm font-medium hover:underline"
      >
        View all transactions →
      </button>
    </div>
  );
}

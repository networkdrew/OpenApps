import { useMemo, useState } from "react";
import type { BudgetState } from "@/lib/apps-logic/budget/model";
import type { BudgetAction } from "@/lib/apps-logic/budget/reducer";
import { categoryTotalsForMonth } from "@/lib/apps-logic/budget/calculations";
import {
  addMonthsToMonthKey,
  currentMonthKey,
  formatMonthLabel,
} from "@/lib/apps-logic/budget/dates";
import {
  centsToDollars,
  formatCents,
  parseAmountToCents,
} from "@/lib/apps-logic/budget/money";
import {
  buttonSecondary,
  iconButton,
  textField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { Meter } from "./Meter";
import { CategoryManagerDialog } from "./CategoryManagerDialog";

interface BudgetsViewProps {
  state: BudgetState;
  dispatch: (action: BudgetAction) => void;
}

function BudgetRow({
  categoryId,
  name,
  spentCents,
  limitCents,
  onSetLimit,
}: {
  categoryId: string;
  name: string;
  spentCents: number;
  limitCents: number;
  onSetLimit: (categoryId: string, cents: number) => void;
}) {
  const [text, setText] = useState(
    limitCents > 0 ? centsToDollars(limitCents).toFixed(2) : "",
  );

  function commit() {
    const cents = parseAmountToCents(text || "0");
    if (cents !== null && cents >= 0) onSetLimit(categoryId, cents);
    else setText(limitCents > 0 ? centsToDollars(limitCents).toFixed(2) : "");
  }

  const percent = limitCents > 0 ? (spentCents / limitCents) * 100 : 0;

  return (
    <div className="border-border bg-bg-elevated rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-text truncate text-sm font-medium">{name}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-text-muted text-xs">Limit</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            inputMode="decimal"
            placeholder="0.00"
            aria-label={`Monthly budget limit for ${name}`}
            className={`${textField} w-24 py-1 text-right`}
          />
        </div>
      </div>
      {limitCents > 0 ? (
        <Meter
          label=""
          valueCents={spentCents}
          targetCents={limitCents}
          percent={percent}
          status={
            percent >= 100 ? "critical" : percent >= 80 ? "warning" : "good"
          }
        />
      ) : (
        <p className="text-text-muted text-xs">
          Spent {formatCents(spentCents)} so far · no limit set
        </p>
      )}
    </div>
  );
}

export function BudgetsView({ state, dispatch }: BudgetsViewProps) {
  const [month, setMonth] = useState(currentMonthKey());
  const [managingCategories, setManagingCategories] = useState(false);

  const expenseCategories = state.categories.filter(
    (c) => c.kind === "expense",
  );

  const spentByCategory = useMemo(
    () => categoryTotalsForMonth(state.transactions, month, "expense"),
    [state.transactions, month],
  );

  const limitByCategory = useMemo(() => {
    const limits = new Map<string, number>();
    for (const budget of state.budgets) {
      if (budget.month === month)
        limits.set(budget.categoryId, budget.limitCents);
    }
    return limits;
  }, [state.budgets, month]);

  const previousMonth = addMonthsToMonthKey(month, -1);
  const hasPreviousBudgets = state.budgets.some(
    (b) => b.month === previousMonth,
  );

  function setLimit(categoryId: string, limitCents: number) {
    if (limitCents === 0) {
      dispatch({ type: "DELETE_BUDGET", categoryId, month });
    } else {
      dispatch({ type: "SET_BUDGET", categoryId, month, limitCents });
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-text mr-auto text-lg font-semibold">Budgets</h2>
        <button
          type="button"
          onClick={() => setManagingCategories(true)}
          className={buttonSecondary}
        >
          <Icon name="tag" className="h-4 w-4" />
          Manage categories
        </button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonthsToMonthKey(m, -1))}
          aria-label="Previous month"
          className={iconButton}
        >
          <Icon name="chevron-left" className="h-4 w-4" />
        </button>
        <span className="text-text w-36 text-center text-sm font-semibold">
          {formatMonthLabel(month)}
        </span>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonthsToMonthKey(m, 1))}
          aria-label="Next month"
          className={iconButton}
        >
          <Icon name="chevron-right" className="h-4 w-4" />
        </button>
      </div>

      {hasPreviousBudgets && (
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "COPY_BUDGETS_FROM_PREVIOUS_MONTH",
              fromMonth: previousMonth,
              toMonth: month,
            })
          }
          className={`${buttonSecondary} self-center`}
        >
          <Icon name="copy" className="h-4 w-4" />
          Copy limits from {formatMonthLabel(previousMonth)}
        </button>
      )}

      {expenseCategories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="target" className="text-text-muted h-8 w-8" />
          <p className="text-text-muted text-sm">
            Add an expense category to start budgeting.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {expenseCategories.map((category) => (
            <BudgetRow
              key={category.id}
              categoryId={category.id}
              name={category.name}
              spentCents={spentByCategory.get(category.id) ?? 0}
              limitCents={limitByCategory.get(category.id) ?? 0}
              onSetLimit={setLimit}
            />
          ))}
        </div>
      )}

      {managingCategories && (
        <CategoryManagerDialog
          categories={state.categories}
          dispatch={dispatch}
          onClose={() => setManagingCategories(false)}
        />
      )}
    </div>
  );
}

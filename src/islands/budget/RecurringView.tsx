import { useState } from "react";
import type { BudgetState, RecurringRule } from "@/lib/apps-logic/budget/model";
import type { BudgetAction } from "@/lib/apps-logic/budget/reducer";
import { FREQUENCY_LABELS } from "@/lib/apps-logic/budget/dates";
import { formatCents } from "@/lib/apps-logic/budget/money";
import { buttonPrimary, iconButton } from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { ConfirmDialog } from "@/components/react/ConfirmDialog";
import {
  RecurringEditorDialog,
  type RecurringFormValues,
} from "./RecurringEditorDialog";

interface RecurringViewProps {
  state: BudgetState;
  dispatch: (action: BudgetAction) => void;
}

export function RecurringView({ state, dispatch }: RecurringViewProps) {
  const [editing, setEditing] = useState<RecurringRule | null | "new">(null);
  const [deleting, setDeleting] = useState<RecurringRule | null>(null);

  function handleSave(values: RecurringFormValues, ruleId?: string) {
    if (ruleId) {
      dispatch({ type: "UPDATE_RECURRING", ruleId, patch: values });
    } else {
      dispatch({ type: "ADD_RECURRING", rule: { ...values, active: true } });
    }
  }

  if (state.accounts.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center sm:px-6">
        <Icon name="repeat" className="text-text-muted h-8 w-8" />
        <p className="text-text">
          Add an account before setting up recurring bills.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-text text-lg font-semibold">
          Recurring transactions
        </h2>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className={buttonPrimary}
        >
          <Icon name="plus" className="h-4 w-4" />
          Add recurring
        </button>
      </div>

      {state.recurringRules.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="repeat" className="text-text-muted h-8 w-8" />
          <p className="text-text-muted text-sm">
            Set up bills, subscriptions, or paychecks that repeat automatically.
          </p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className={buttonPrimary}
          >
            <Icon name="plus" className="h-4 w-4" />
            Add your first recurring transaction
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {state.recurringRules.map((rule) => (
            <li
              key={rule.id}
              className={`border-border bg-bg-elevated flex items-center gap-3 rounded-lg border p-3 ${rule.active ? "" : "opacity-60"}`}
            >
              <button
                type="button"
                onClick={() => setEditing(rule)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="bg-bg-sunken text-text-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                  <Icon name="repeat" className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-text block truncate text-sm font-medium">
                    {rule.name}
                  </span>
                  <span className="text-text-muted block truncate text-xs">
                    Every {rule.interval > 1 ? `${rule.interval} ` : ""}
                    {FREQUENCY_LABELS[rule.frequency].toLowerCase()}
                    {rule.interval > 1 ? "s" : ""} · next {rule.nextDueDate}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    rule.type === "income" ? "text-success" : "text-text"
                  }`}
                >
                  {rule.type === "income" ? "+" : "-"}
                  {formatCents(rule.amountCents)}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_RECURRING_ACTIVE",
                    ruleId: rule.id,
                    active: !rule.active,
                  })
                }
                aria-label={
                  rule.active ? `Pause ${rule.name}` : `Resume ${rule.name}`
                }
                aria-pressed={rule.active}
                className={iconButton}
              >
                <Icon
                  name={rule.active ? "clock" : "repeat"}
                  className="h-4 w-4"
                />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(rule)}
                aria-label={`Delete ${rule.name}`}
                className={iconButton}
              >
                <Icon name="trash-2" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <RecurringEditorDialog
          rule={editing === "new" ? null : editing}
          accounts={state.accounts}
          categories={state.categories}
          onClose={() => setEditing(null)}
          onSave={(values) =>
            handleSave(values, editing === "new" ? undefined : editing.id)
          }
          onDelete={
            editing !== "new"
              ? () => {
                  setDeleting(editing);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this recurring transaction?"
        description={`"${deleting?.name}" will stop generating new transactions. Transactions it already created stay in your history.`}
        confirmLabel="Delete recurring transaction"
        onConfirm={() => {
          if (deleting)
            dispatch({ type: "DELETE_RECURRING", ruleId: deleting.id });
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

import { useState } from "react";
import type { BudgetState, SavingsGoal } from "@/lib/apps-logic/budget/model";
import type { BudgetAction } from "@/lib/apps-logic/budget/reducer";
import { goalProgress } from "@/lib/apps-logic/budget/calculations";
import { formatCents, parseAmountToCents } from "@/lib/apps-logic/budget/money";
import { todayIso } from "@/lib/apps-logic/budget/dates";
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  iconButton,
  textField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { ConfirmDialog } from "@/components/react/ConfirmDialog";
import { Meter } from "./Meter";
import { GoalEditorDialog, type GoalFormValues } from "./GoalEditorDialog";
import { categoryColorVar } from "./constants";

interface GoalsViewProps {
  state: BudgetState;
  dispatch: (action: BudgetAction) => void;
}

function GoalCard({
  goal,
  dispatch,
  onEdit,
}: {
  goal: SavingsGoal;
  dispatch: (action: BudgetAction) => void;
  onEdit: () => void;
}) {
  const [contributionText, setContributionText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const progress = goalProgress(goal);

  function addContribution(sign: 1 | -1) {
    const cents = parseAmountToCents(contributionText);
    if (cents === null || cents <= 0) return;
    dispatch({
      type: "ADD_GOAL_CONTRIBUTION",
      goalId: goal.id,
      amountCents: cents * sign,
      date: todayIso(),
    });
    setContributionText("");
  }

  return (
    <div className="border-border bg-bg-elevated flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: categoryColorVar(goal.color) }}
          />
          <h3 className="text-text font-semibold">{goal.name}</h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${goal.name}`}
          className={iconButton}
        >
          <Icon name="pencil-line" className="h-4 w-4" />
        </button>
      </div>

      <Meter
        label=""
        valueCents={progress.savedCents}
        targetCents={progress.targetCents}
        percent={progress.percent}
      />

      {goal.targetDate && (
        <p className="text-text-muted text-xs">
          Target date: {goal.targetDate}
        </p>
      )}

      <div className="flex items-center gap-2">
        <label htmlFor={`goal-contribution-${goal.id}`} className="sr-only">
          Contribution amount for {goal.name}
        </label>
        <input
          id={`goal-contribution-${goal.id}`}
          inputMode="decimal"
          value={contributionText}
          onChange={(e) => setContributionText(e.target.value)}
          placeholder="0.00"
          className={`${textField} flex-1 py-1.5`}
        />
        <button
          type="button"
          onClick={() => addContribution(1)}
          className={buttonSecondary}
        >
          <Icon name="plus" className="h-4 w-4" />
          Add
        </button>
        <button
          type="button"
          onClick={() => addContribution(-1)}
          className={buttonGhost}
        >
          Withdraw
        </button>
      </div>

      {goal.contributions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="text-text-muted text-xs font-medium hover:underline"
          >
            {showHistory ? "Hide" : "Show"} history ({goal.contributions.length}
            )
          </button>
          {showHistory && (
            <ul className="mt-2 flex flex-col gap-1">
              {[...goal.contributions]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((c) => (
                  <li
                    key={c.id}
                    className="text-text-muted flex items-center justify-between text-xs"
                  >
                    <span>{c.date}</span>
                    <span
                      className={
                        c.amountCents < 0 ? "text-danger" : "text-text"
                      }
                    >
                      {formatCents(c.amountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "DELETE_GOAL_CONTRIBUTION",
                          goalId: goal.id,
                          contributionId: c.id,
                        })
                      }
                      aria-label={`Remove contribution of ${formatCents(c.amountCents)} on ${c.date}`}
                      className={iconButton}
                    >
                      <Icon name="x" className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function GoalsView({ state, dispatch }: GoalsViewProps) {
  const [editing, setEditing] = useState<SavingsGoal | null | "new">(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);

  const active = state.goals.filter((g) => !g.archived);

  function handleSave(values: GoalFormValues, goalId?: string) {
    if (goalId) {
      dispatch({ type: "UPDATE_GOAL", goalId, patch: values });
    } else {
      dispatch({
        type: "ADD_GOAL",
        name: values.name,
        targetCents: values.targetCents,
        color: values.color,
        targetDate: values.targetDate,
      });
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-text text-lg font-semibold">Savings goals</h2>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className={buttonPrimary}
        >
          <Icon name="plus" className="h-4 w-4" />
          Add goal
        </button>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="piggy-bank" className="text-text-muted h-8 w-8" />
          <p className="text-text-muted text-sm">
            Set a target for an emergency fund, vacation, or big purchase.
          </p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className={buttonPrimary}
          >
            <Icon name="plus" className="h-4 w-4" />
            Add your first goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {active.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              dispatch={dispatch}
              onEdit={() => setEditing(goal)}
            />
          ))}
        </div>
      )}

      {editing && (
        <GoalEditorDialog
          goal={editing === "new" ? null : editing}
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
        title="Delete this goal?"
        description={`"${deleting?.name}" and its contribution history will be permanently deleted.`}
        confirmLabel="Delete goal"
        onConfirm={() => {
          if (deleting) dispatch({ type: "DELETE_GOAL", goalId: deleting.id });
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

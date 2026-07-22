import { useEffect, useId, useRef, useState } from "react";
import type { CategoryColor, SavingsGoal } from "@/lib/apps-logic/budget/model";
import {
  centsToDollars,
  parseAmountToCents,
} from "@/lib/apps-logic/budget/money";
import {
  buttonDanger,
  buttonPrimary,
  labelText,
  selectField,
  textField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { FormDialog } from "./FormDialog";
import { ColorPicker } from "./ColorPicker";

export interface GoalFormValues {
  name: string;
  targetCents: number;
  color: CategoryColor;
  targetDate: string | null;
}

interface GoalEditorDialogProps {
  goal: SavingsGoal | null;
  onSave: (values: GoalFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function GoalEditorDialog({
  goal,
  onSave,
  onDelete,
  onClose,
}: GoalEditorDialogProps) {
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(goal?.name ?? "");
  const [targetText, setTargetText] = useState(
    goal ? centsToDollars(goal.targetCents).toFixed(2) : "",
  );
  const [color, setColor] = useState<CategoryColor>(goal?.color ?? "blue");
  const [hasTargetDate, setHasTargetDate] = useState(!!goal?.targetDate);
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give this goal a name.");
      return;
    }
    const cents = parseAmountToCents(targetText);
    if (cents === null || cents <= 0) {
      setError("Enter a target amount greater than zero.");
      return;
    }
    onSave({
      name: trimmed,
      targetCents: cents,
      color,
      targetDate: hasTargetDate && targetDate ? targetDate : null,
    });
    onClose();
  }

  return (
    <FormDialog
      titleId={titleId}
      title={goal ? "Edit savings goal" : "Add savings goal"}
      onClose={onClose}
      footer={
        <>
          {goal && onDelete ? (
            <button type="button" onClick={onDelete} className={buttonDanger}>
              <Icon name="trash-2" className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={handleSave} className={buttonPrimary}>
            {goal ? "Save changes" : "Add goal"}
          </button>
        </>
      }
    >
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="goal-name" className={labelText}>
          Name
        </label>
        <input
          id="goal-name"
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Emergency Fund, Vacation"
          className={textField}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="goal-target" className={labelText}>
          Target amount
        </label>
        <input
          id="goal-target"
          inputMode="decimal"
          value={targetText}
          onChange={(e) => setTargetText(e.target.value)}
          placeholder="0.00"
          className={textField}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={labelText}>Color</span>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hasTargetDate}
            onChange={(e) => setHasTargetDate(e.target.checked)}
            className="accent-accent h-4 w-4"
          />
          Target a specific date
        </label>
        {hasTargetDate && (
          <input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            aria-label="Target date"
            className={selectField}
          />
        )}
      </div>
    </FormDialog>
  );
}

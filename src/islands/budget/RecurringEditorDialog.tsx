import { useEffect, useId, useRef, useState } from "react";
import type {
  Account,
  Category,
  RecurringRule,
} from "@/lib/apps-logic/budget/model";
import {
  centsToDollars,
  parseAmountToCents,
} from "@/lib/apps-logic/budget/money";
import { todayIso, type Frequency } from "@/lib/apps-logic/budget/dates";
import {
  buttonDanger,
  buttonPrimary,
  labelText,
  selectField,
  textField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { FormDialog } from "./FormDialog";
import { FREQUENCY_OPTIONS } from "./constants";

export interface RecurringFormValues {
  name: string;
  accountId: string;
  type: "income" | "expense";
  amountCents: number;
  categoryId: string | null;
  payee: string;
  memo: string;
  frequency: Frequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
}

interface RecurringEditorDialogProps {
  rule: RecurringRule | null;
  accounts: Account[];
  categories: Category[];
  onSave: (values: RecurringFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function RecurringEditorDialog({
  rule,
  accounts,
  categories,
  onSave,
  onDelete,
  onClose,
}: RecurringEditorDialogProps) {
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(rule?.name ?? "");
  const [accountId, setAccountId] = useState(
    rule?.accountId ?? accounts[0]?.id ?? "",
  );
  const [type, setType] = useState<"income" | "expense">(
    rule?.type ?? "expense",
  );
  const [amountText, setAmountText] = useState(
    rule ? centsToDollars(rule.amountCents).toFixed(2) : "",
  );
  const [categoryId, setCategoryId] = useState(rule?.categoryId ?? "");
  const [payee, setPayee] = useState(rule?.payee ?? "");
  const [memo, setMemo] = useState(rule?.memo ?? "");
  const [frequency, setFrequency] = useState<Frequency>(
    rule?.frequency ?? "monthly",
  );
  const [interval, setInterval] = useState(String(rule?.interval ?? 1));
  const [startDate, setStartDate] = useState(rule?.startDate ?? todayIso());
  const [hasEndDate, setHasEndDate] = useState(!!rule?.endDate);
  const [endDate, setEndDate] = useState(rule?.endDate ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const relevantCategories = categories.filter((c) => c.kind === type);

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give this recurring transaction a name.");
      return;
    }
    if (!accountId) {
      setError("Choose an account.");
      return;
    }
    const cents = parseAmountToCents(amountText);
    if (cents === null || cents <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    const parsedInterval = Math.max(1, Math.floor(Number(interval)) || 1);
    if (!startDate) {
      setError("Choose a start date.");
      return;
    }
    if (hasEndDate && endDate && endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    onSave({
      name: trimmedName,
      accountId,
      type,
      amountCents: cents,
      categoryId: categoryId || null,
      payee: payee.trim(),
      memo: memo.trim(),
      frequency,
      interval: parsedInterval,
      startDate,
      endDate: hasEndDate && endDate ? endDate : null,
      nextDueDate: rule?.nextDueDate ?? startDate,
    });
    onClose();
  }

  return (
    <FormDialog
      titleId={titleId}
      title={rule ? "Edit recurring transaction" : "Add recurring transaction"}
      onClose={onClose}
      footer={
        <>
          {rule && onDelete ? (
            <button type="button" onClick={onDelete} className={buttonDanger}>
              <Icon name="trash-2" className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={handleSave} className={buttonPrimary}>
            {rule ? "Save changes" : "Add recurring transaction"}
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
        <label htmlFor="rr-name" className={labelText}>
          Name
        </label>
        <input
          id="rr-name"
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rent, Netflix, Paycheck"
          className={textField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rr-type" className={labelText}>
            Type
          </label>
          <select
            id="rr-type"
            value={type}
            onChange={(e) => setType(e.target.value as "income" | "expense")}
            className={selectField}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rr-amount" className={labelText}>
            Amount
          </label>
          <input
            id="rr-amount"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0.00"
            className={textField}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rr-account" className={labelText}>
            Account
          </label>
          <select
            id="rr-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={selectField}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rr-category" className={labelText}>
            Category
          </label>
          <select
            id="rr-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={selectField}
          >
            <option value="">Uncategorized</option>
            {relevantCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="rr-payee" className={labelText}>
          Payee (optional)
        </label>
        <input
          id="rr-payee"
          value={payee}
          onChange={(e) => setPayee(e.target.value)}
          className={textField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rr-frequency" className={labelText}>
            Repeats every
          </label>
          <div className="flex gap-2">
            <input
              id="rr-interval"
              type="number"
              min={1}
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              aria-label="Interval count"
              className={`${textField} w-16`}
            />
            <select
              id="rr-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className={selectField}
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                  {interval !== "1" ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rr-start" className={labelText}>
            Start date
          </label>
          <input
            id="rr-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={selectField}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hasEndDate}
            onChange={(e) => setHasEndDate(e.target.checked)}
            className="accent-accent h-4 w-4"
          />
          Ends on a specific date
        </label>
        {hasEndDate && (
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="End date"
            className={selectField}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="rr-memo" className={labelText}>
          Memo (optional)
        </label>
        <input
          id="rr-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className={textField}
        />
      </div>
    </FormDialog>
  );
}

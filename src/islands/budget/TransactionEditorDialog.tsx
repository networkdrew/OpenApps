import { useEffect, useId, useRef, useState } from "react";
import type {
  Account,
  Category,
  Transaction,
  TransactionType,
} from "@/lib/apps-logic/budget/model";
import {
  centsToDollars,
  parseAmountToCents,
} from "@/lib/apps-logic/budget/money";
import { todayIso } from "@/lib/apps-logic/budget/dates";
import {
  buttonDanger,
  buttonPrimary,
  labelText,
  selectField,
  textField,
  textareaField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { FormDialog } from "./FormDialog";

export interface TransactionFormValues {
  accountId: string;
  type: TransactionType;
  amountCents: number;
  date: string;
  categoryId: string | null;
  payee: string;
  memo: string;
  transferAccountId: string | null;
  cleared: boolean;
}

interface TransactionEditorDialogProps {
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  defaultAccountId?: string;
  onSave: (values: TransactionFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const TYPE_OPTIONS: {
  value: TransactionType;
  label: string;
  icon: "trending-up" | "trending-down" | "repeat";
}[] = [
  { value: "expense", label: "Expense", icon: "trending-down" },
  { value: "income", label: "Income", icon: "trending-up" },
  { value: "transfer", label: "Transfer", icon: "repeat" },
];

export function TransactionEditorDialog({
  transaction,
  accounts,
  categories,
  defaultAccountId,
  onSave,
  onDelete,
  onClose,
}: TransactionEditorDialogProps) {
  const titleId = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "expense",
  );
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? "",
  );
  const [transferAccountId, setTransferAccountId] = useState(
    transaction?.transferAccountId ?? "",
  );
  const [amountText, setAmountText] = useState(
    transaction ? centsToDollars(transaction.amountCents).toFixed(2) : "",
  );
  const [date, setDate] = useState(transaction?.date ?? todayIso());
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [payee, setPayee] = useState(transaction?.payee ?? "");
  const [memo, setMemo] = useState(transaction?.memo ?? "");
  const [cleared, setCleared] = useState(transaction?.cleared ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const relevantCategories = categories.filter(
    (c) => c.kind === (type === "income" ? "income" : "expense"),
  );

  function handleSave() {
    if (!accountId) {
      setError("Choose an account.");
      return;
    }
    if (
      type === "transfer" &&
      (!transferAccountId || transferAccountId === accountId)
    ) {
      setError("Choose a different destination account for the transfer.");
      return;
    }
    const cents = parseAmountToCents(amountText);
    if (cents === null || cents <= 0) {
      setError("Enter an amount greater than zero, like 42.50.");
      return;
    }
    if (!date) {
      setError("Choose a date.");
      return;
    }
    onSave({
      accountId,
      type,
      amountCents: cents,
      date,
      categoryId: type === "transfer" ? null : categoryId || null,
      payee: payee.trim(),
      memo: memo.trim(),
      transferAccountId: type === "transfer" ? transferAccountId : null,
      cleared,
    });
    onClose();
  }

  return (
    <FormDialog
      titleId={titleId}
      title={transaction ? "Edit transaction" : "Add transaction"}
      onClose={onClose}
      footer={
        <>
          {transaction && onDelete ? (
            <button type="button" onClick={onDelete} className={buttonDanger}>
              <Icon name="trash-2" className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={handleSave} className={buttonPrimary}>
            {transaction ? "Save changes" : "Add transaction"}
          </button>
        </>
      }
    >
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      <div
        role="radiogroup"
        aria-label="Transaction type"
        className="bg-bg-sunken flex gap-1 rounded-md p-1"
      >
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={type === opt.value}
            onClick={() => setType(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium transition-colors ${
              type === opt.value
                ? "bg-bg-elevated text-text shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Icon name={opt.icon} className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-account" className={labelText}>
            {type === "transfer" ? "From account" : "Account"}
          </label>
          <select
            id="tx-account"
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
        {type === "transfer" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tx-transfer-account" className={labelText}>
              To account
            </label>
            <select
              id="tx-transfer-account"
              value={transferAccountId}
              onChange={(e) => setTransferAccountId(e.target.value)}
              className={selectField}
            >
              <option value="">Choose an account…</option>
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tx-category" className={labelText}>
              Category
            </label>
            <select
              id="tx-category"
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
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-amount" className={labelText}>
            Amount
          </label>
          <input
            id="tx-amount"
            ref={amountRef}
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0.00"
            className={textField}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-date" className={labelText}>
            Date
          </label>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={selectField}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tx-payee" className={labelText}>
          Payee
        </label>
        <input
          id="tx-payee"
          value={payee}
          onChange={(e) => setPayee(e.target.value)}
          placeholder="e.g. Trader Joe's"
          className={textField}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tx-memo" className={labelText}>
          Memo (optional)
        </label>
        <textarea
          id="tx-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          className={textareaField}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cleared}
          onChange={(e) => setCleared(e.target.checked)}
          className="accent-accent h-4 w-4"
        />
        Cleared
      </label>
    </FormDialog>
  );
}

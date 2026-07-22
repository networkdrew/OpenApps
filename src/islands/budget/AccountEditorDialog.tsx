import { useEffect, useId, useRef, useState } from "react";
import type { Account, AccountType } from "@/lib/apps-logic/budget/model";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
} from "@/lib/apps-logic/budget/model";
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
  textareaField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { FormDialog } from "./FormDialog";

interface AccountEditorDialogProps {
  account: Account | null;
  onSave: (input: {
    name: string;
    type: AccountType;
    startingBalanceCents: number;
    notes: string;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function AccountEditorDialog({
  account,
  onSave,
  onDelete,
  onClose,
}: AccountEditorDialogProps) {
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "checking");
  const [balanceText, setBalanceText] = useState(
    account ? centsToDollars(account.startingBalanceCents).toFixed(2) : "0.00",
  );
  const [notes, setNotes] = useState(account?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give this account a name.");
      return;
    }
    const cents = parseAmountToCents(balanceText || "0");
    if (cents === null) {
      setError("Starting balance must be a number like 1000 or 1000.50.");
      return;
    }
    onSave({ name: trimmedName, type, startingBalanceCents: cents, notes });
    onClose();
  }

  return (
    <FormDialog
      titleId={titleId}
      title={account ? "Edit account" : "Add account"}
      onClose={onClose}
      footer={
        <>
          {account && onDelete ? (
            <button type="button" onClick={onDelete} className={buttonDanger}>
              <Icon name="trash-2" className="h-4 w-4" />
              Delete account
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={handleSave} className={buttonPrimary}>
            {account ? "Save changes" : "Add account"}
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
        <label htmlFor="account-name" className={labelText}>
          Name
        </label>
        <input
          id="account-name"
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Everyday Checking"
          className={textField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="account-type" className={labelText}>
            Type
          </label>
          <select
            id="account-type"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            className={selectField}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="account-balance" className={labelText}>
            Starting balance
          </label>
          <input
            id="account-balance"
            inputMode="decimal"
            value={balanceText}
            onChange={(e) => setBalanceText(e.target.value)}
            placeholder="0.00"
            className={textField}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="account-notes" className={labelText}>
          Notes (optional)
        </label>
        <textarea
          id="account-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={textareaField}
        />
      </div>
    </FormDialog>
  );
}

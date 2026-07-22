import { useState } from "react";
import type { Account, BudgetState } from "@/lib/apps-logic/budget/model";
import { ACCOUNT_TYPE_LABELS } from "@/lib/apps-logic/budget/model";
import { accountBalanceCents } from "@/lib/apps-logic/budget/calculations";
import { formatCents } from "@/lib/apps-logic/budget/money";
import { buttonPrimary, iconButton } from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { ConfirmDialog } from "@/components/react/ConfirmDialog";
import { AccountEditorDialog } from "./AccountEditorDialog";
import { ACCOUNT_TYPE_ICON } from "./constants";
import type { BudgetAction } from "@/lib/apps-logic/budget/reducer";

interface AccountsViewProps {
  state: BudgetState;
  dispatch: (action: BudgetAction) => void;
}

export function AccountsView({ state, dispatch }: AccountsViewProps) {
  const [editing, setEditing] = useState<Account | null | "new">(null);
  const [deleting, setDeleting] = useState<Account | null>(null);

  const active = state.accounts.filter((a) => !a.archived);
  const archived = state.accounts.filter((a) => a.archived);

  function renderAccount(account: Account) {
    const balance = accountBalanceCents(account, state.transactions);
    return (
      <li
        key={account.id}
        className="border-border bg-bg-elevated flex items-center justify-between gap-3 rounded-lg border p-3"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-bg-sunken text-text-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
            <Icon
              name={ACCOUNT_TYPE_ICON[account.type]}
              className="h-4.5 w-4.5"
            />
          </span>
          <div className="min-w-0">
            <p className="text-text truncate text-sm font-medium">
              {account.name}
            </p>
            <p className="text-text-muted text-xs">
              {ACCOUNT_TYPE_LABELS[account.type]}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`text-sm font-semibold tabular-nums ${balance < 0 ? "text-danger" : "text-text"}`}
          >
            {formatCents(balance)}
          </span>
          <button
            type="button"
            onClick={() => setEditing(account)}
            aria-label={`Edit ${account.name}`}
            className={iconButton}
          >
            <Icon name="pencil-line" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "ARCHIVE_ACCOUNT",
                accountId: account.id,
                archived: !account.archived,
              })
            }
            aria-label={
              account.archived
                ? `Unarchive ${account.name}`
                : `Archive ${account.name}`
            }
            className={iconButton}
          >
            <Icon
              name={account.archived ? "archive-restore" : "archive"}
              className="h-4 w-4"
            />
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-text text-lg font-semibold">Accounts</h2>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className={buttonPrimary}
        >
          <Icon name="plus" className="h-4 w-4" />
          Add account
        </button>
      </div>

      {state.accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="wallet" className="text-text-muted h-8 w-8" />
          <p className="text-text-muted text-sm">
            Add a checking, savings, credit card, or cash account to start
            tracking balances.
          </p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className={buttonPrimary}
          >
            <Icon name="plus" className="h-4 w-4" />
            Add your first account
          </button>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2">{active.map(renderAccount)}</ul>
          {archived.length > 0 && (
            <details className="text-sm">
              <summary className="text-text-muted cursor-pointer font-medium">
                Archived accounts ({archived.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-2">
                {archived.map(renderAccount)}
              </ul>
            </details>
          )}
        </>
      )}

      {editing && (
        <AccountEditorDialog
          account={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(input) => {
            if (editing === "new") {
              dispatch({
                type: "ADD_ACCOUNT",
                name: input.name,
                accountType: input.type,
                startingBalanceCents: input.startingBalanceCents,
              });
            } else {
              dispatch({
                type: "UPDATE_ACCOUNT",
                accountId: editing.id,
                patch: input,
              });
            }
          }}
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
        title="Delete this account?"
        description={`"${deleting?.name}" and every transaction and recurring rule tied to it will be permanently deleted. This can't be undone once you leave the page (Undo still works until then).`}
        confirmLabel="Delete account"
        onConfirm={() => {
          if (deleting)
            dispatch({ type: "DELETE_ACCOUNT", accountId: deleting.id });
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

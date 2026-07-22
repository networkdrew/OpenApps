import { useMemo, useState } from "react";
import type { BudgetState, Transaction } from "@/lib/apps-logic/budget/model";
import type { BudgetAction } from "@/lib/apps-logic/budget/reducer";
import {
  filterTransactions,
  hasActiveTransactionFilters,
  sortTransactions,
  type TransactionFilters,
  type TransactionSort,
} from "@/lib/apps-logic/budget/filter";
import { formatCents } from "@/lib/apps-logic/budget/money";
import {
  exportTransactionsToCsv,
  downloadCsv,
  type CsvImportResult,
} from "@/lib/apps-logic/budget/csv";
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  iconButton,
  selectField,
  textField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { ConfirmDialog } from "@/components/react/ConfirmDialog";
import { StatusMessage } from "@/components/react/StatusMessage";
import {
  TransactionEditorDialog,
  type TransactionFormValues,
} from "./TransactionEditorDialog";
import { ImportCsvDialog } from "./ImportCsvDialog";

interface TransactionsViewProps {
  state: BudgetState;
  dispatch: (action: BudgetAction) => void;
}

export function TransactionsView({ state, dispatch }: TransactionsViewProps) {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [sort, setSort] = useState<TransactionSort>("date-desc");
  const [editing, setEditing] = useState<Transaction | null | "new">(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      sortTransactions(filterTransactions(state.transactions, filters), sort),
    [state.transactions, filters, sort],
  );

  function categoryName(id: string | null): string {
    if (!id) return "Uncategorized";
    return state.categories.find((c) => c.id === id)?.name ?? "Uncategorized";
  }
  function accountName(id: string): string {
    return state.accounts.find((a) => a.id === id)?.name ?? "Unknown account";
  }

  function handleSave(values: TransactionFormValues, transactionId?: string) {
    if (transactionId) {
      dispatch({ type: "UPDATE_TRANSACTION", transactionId, patch: values });
    } else {
      dispatch({
        type: "ADD_TRANSACTION",
        transaction: { ...values, recurringId: null },
      });
    }
  }

  function handleImportResult(result: CsvImportResult) {
    dispatch({
      type: "IMPORT_TRANSACTIONS",
      transactions: result.transactions,
    });
    setMessage(
      `Imported ${result.transactions.length} transaction${result.transactions.length === 1 ? "" : "s"}.`,
    );
  }

  function handleExportCsv() {
    const csv = exportTransactionsToCsv(
      state.transactions,
      state.accounts,
      state.categories,
    );
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`openbudget-transactions-${date}.csv`, csv);
  }

  if (state.accounts.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center sm:px-6">
        <Icon name="receipt" className="text-text-muted h-8 w-8" />
        <p className="text-text">
          Add an account before recording transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
      {message && <StatusMessage tone="success">{message}</StatusMessage>}

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-text mr-auto text-lg font-semibold">
          Transactions
        </h2>
        <button
          type="button"
          onClick={() => setImporting(true)}
          className={buttonSecondary}
        >
          <Icon name="file-spreadsheet" className="h-4 w-4" />
          Import CSV
        </button>
        <button
          type="button"
          onClick={handleExportCsv}
          className={buttonSecondary}
        >
          <Icon name="download" className="h-4 w-4" />
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className={buttonPrimary}
        >
          <Icon name="plus" className="h-4 w-4" />
          Add transaction
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[10rem] flex-1">
          <Icon
            name="search"
            className="text-text-muted pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
          />
          <input
            value={filters.query ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, query: e.target.value }))
            }
            placeholder="Search payee or memo…"
            aria-label="Search transactions"
            className={`${textField} pl-8`}
          />
        </div>
        <select
          aria-label="Filter by account"
          value={filters.accountId ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              accountId: e.target.value || undefined,
            }))
          }
          className={selectField}
        >
          <option value="">All accounts</option>
          {state.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by category"
          value={filters.categoryId ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              categoryId: e.target.value || undefined,
            }))
          }
          className={selectField}
        >
          <option value="">All categories</option>
          {state.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by type"
          value={filters.type ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              type: (e.target.value || undefined) as TransactionFilters["type"],
            }))
          }
          className={selectField}
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
        <select
          aria-label="Sort transactions"
          value={sort}
          onChange={(e) => setSort(e.target.value as TransactionSort)}
          className={selectField}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Amount high to low</option>
          <option value="amount-asc">Amount low to high</option>
        </select>
        {hasActiveTransactionFilters(filters) && (
          <button
            type="button"
            onClick={() => setFilters({})}
            className={buttonGhost}
          >
            <Icon name="circle-x" className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Icon name="receipt" className="text-text-muted h-8 w-8" />
          <p className="text-text-muted text-sm">
            {state.transactions.length === 0
              ? "No transactions yet — add one or import a CSV."
              : "No transactions match these filters."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {visible.map((tx) => (
            <li
              key={tx.id}
              className="border-border bg-bg-elevated flex items-center gap-3 rounded-lg border p-3"
            >
              <button
                type="button"
                onClick={() => setEditing(tx)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="bg-bg-sunken text-text-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                  <Icon
                    name={
                      tx.type === "income"
                        ? "trending-up"
                        : tx.type === "transfer"
                          ? "repeat"
                          : "trending-down"
                    }
                    className="h-4 w-4"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-text flex items-center gap-1.5 truncate text-sm font-medium">
                    {tx.payee || "(no payee)"}
                    {!tx.cleared && (
                      <span className="text-text-muted text-[10px] font-normal">
                        · pending
                      </span>
                    )}
                  </span>
                  <span className="text-text-muted block truncate text-xs">
                    {tx.date} · {accountName(tx.accountId)}
                    {tx.type === "transfer"
                      ? ` → ${accountName(tx.transferAccountId ?? "")}`
                      : ` · ${categoryName(tx.categoryId)}`}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    tx.type === "income" ? "text-success" : "text-text"
                  }`}
                >
                  {tx.type === "income"
                    ? "+"
                    : tx.type === "expense"
                      ? "-"
                      : ""}
                  {formatCents(tx.amountCents)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeleting(tx)}
                aria-label={`Delete transaction with ${tx.payee || "no payee"}`}
                className={iconButton}
              >
                <Icon name="trash-2" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <TransactionEditorDialog
          transaction={editing === "new" ? null : editing}
          accounts={state.accounts}
          categories={state.categories}
          defaultAccountId={filters.accountId}
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

      {importing && (
        <ImportCsvDialog
          accounts={state.accounts}
          categories={state.categories}
          onClose={() => setImporting(false)}
          onImport={handleImportResult}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this transaction?"
        description="This transaction will be permanently deleted. This can't be undone once you leave the page (Undo still works until then)."
        confirmLabel="Delete transaction"
        onConfirm={() => {
          if (deleting)
            dispatch({
              type: "DELETE_TRANSACTION",
              transactionId: deleting.id,
            });
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { useBudgetController } from "./useBudgetController";
import { DashboardView } from "./DashboardView";
import { TransactionsView } from "./TransactionsView";
import { AccountsView } from "./AccountsView";
import { BudgetsView } from "./BudgetsView";
import { RecurringView } from "./RecurringView";
import { GoalsView } from "./GoalsView";
import { DataDialog } from "./DataDialog";
import { AutosaveIndicator } from "@/components/react/AutosaveIndicator";
import { StatusMessage } from "@/components/react/StatusMessage";
import { iconButton, stickyToolbar } from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { BUDGET_TABS, type BudgetTabId } from "./constants";

export default function BudgetApp() {
  const controller = useBudgetController();
  const [tab, setTab] = useState<BudgetTabId>("dashboard");
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);

  const {
    state,
    dispatch,
    replaceState,
    undo,
    redo,
    canUndo,
    canRedo,
    autosave,
    autosaveError,
    loaded,
    generatedCount,
  } = controller;

  useEffect(() => {
    if (loaded && generatedCount > 0) {
      setGeneratedMessage(
        `Generated ${generatedCount} transaction${generatedCount === 1 ? "" : "s"} from your recurring rules that came due.`,
      );
    }
  }, [loaded, generatedCount]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.key.toLowerCase() === "z" && e.shiftKey) ||
        e.key.toLowerCase() === "y"
      ) {
        e.preventDefault();
        redo();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  function handleClearAll() {
    dispatch({ type: "CLEAR_ALL" });
    setRefreshToken((t) => t + 1);
  }

  function handleReplaceState(next: typeof state) {
    replaceState(next);
    setRefreshToken((t) => t + 1);
  }

  if (!loaded) {
    return <p className="text-text-muted p-4 text-sm">Loading your budget…</p>;
  }

  return (
    <div className="budget-app flex h-full min-h-0 flex-col">
      {generatedMessage && (
        <div className="px-4 pt-3 sm:px-6">
          <StatusMessage tone="success">{generatedMessage}</StatusMessage>
        </div>
      )}

      <div className={stickyToolbar}>
        <div className="flex items-center gap-2">
          <nav
            aria-label="Budget sections"
            className="no-scrollbar flex flex-1 gap-1 overflow-x-auto"
          >
            {BUDGET_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-accent text-accent-contrast"
                    : "text-text-muted hover:bg-bg-sunken hover:text-text"
                }`}
              >
                <Icon name={t.icon} className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo"
              className={iconButton}
            >
              <Icon name="undo-2" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo"
              className={iconButton}
            >
              <Icon name="redo-2" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDataDialogOpen(true)}
              aria-label="Backup, restore, and data controls"
              aria-haspopup="dialog"
              className={iconButton}
            >
              <Icon name="database" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-1.5 h-4">
          <AutosaveIndicator state={autosave} errorMessage={autosaveError} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "dashboard" && (
          <DashboardView
            state={state}
            onGoToTransactions={() => setTab("transactions")}
            onGoToAccounts={() => setTab("accounts")}
          />
        )}
        {tab === "transactions" && (
          <TransactionsView state={state} dispatch={dispatch} />
        )}
        {tab === "accounts" && (
          <AccountsView state={state} dispatch={dispatch} />
        )}
        {tab === "budgets" && <BudgetsView state={state} dispatch={dispatch} />}
        {tab === "recurring" && (
          <RecurringView state={state} dispatch={dispatch} />
        )}
        {tab === "goals" && <GoalsView state={state} dispatch={dispatch} />}
      </div>

      {dataDialogOpen && (
        <DataDialog
          state={state}
          refreshToken={refreshToken}
          onReplaceState={handleReplaceState}
          onClearAll={handleClearAll}
          onClose={() => setDataDialogOpen(false)}
        />
      )}
    </div>
  );
}

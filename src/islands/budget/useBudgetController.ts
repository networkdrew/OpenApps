import { useCallback, useEffect, useRef, useState } from "react";
import {
  createHistory,
  pushHistory,
  undo as historyUndo,
  redo as historyRedo,
  canUndo as historyCanUndo,
  canRedo as historyCanRedo,
  type HistoryState,
} from "@/lib/storage/history";
import {
  budgetReducer,
  type BudgetAction,
} from "@/lib/apps-logic/budget/reducer";
import {
  createEmptyState,
  type BudgetState,
} from "@/lib/apps-logic/budget/model";
import {
  loadBudgetState,
  saveBudgetState,
} from "@/lib/apps-logic/budget/persistence";
import { todayIso } from "@/lib/apps-logic/budget/dates";
import type { AutosaveState } from "@/components/react/AutosaveIndicator";

const SAVE_DEBOUNCE_MS = 400;

/**
 * Owns OpenBudget's editable state: loads persisted data once on mount
 * (never synchronously during render — see docs/local-data-standard.md's
 * hydration note), immediately materializes any recurring transactions that
 * came due while the app was closed, wraps every change in the shared
 * undo/redo history stack, and autosaves to localStorage on a short
 * debounce.
 */
export function useBudgetController() {
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<HistoryState<BudgetState>>(() =>
    createHistory(createEmptyState()),
  );
  const [autosave, setAutosave] = useState<AutosaveState>("idle");
  const [autosaveError, setAutosaveError] = useState<string | undefined>();
  const [generatedCount, setGeneratedCount] = useState(0);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const stored = loadBudgetState();
    const withRecurring = budgetReducer(stored, {
      type: "GENERATE_DUE_RECURRING",
      asOf: todayIso(),
    });
    setGeneratedCount(
      withRecurring.transactions.length - stored.transactions.length,
    );
    setHistory(createHistory(withRecurring));
    setLoaded(true);
  }, []);

  const state = history.present;

  useEffect(() => {
    if (!loaded) return;
    setAutosave("saving");
    saveTimeoutRef.current = window.setTimeout(() => {
      const result = saveBudgetState(state);
      if (result.ok) {
        setAutosave("saved");
        setAutosaveError(undefined);
      } else {
        setAutosave("error");
        setAutosaveError(result.message);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(saveTimeoutRef.current);
  }, [state, loaded]);

  const dispatch = useCallback((action: BudgetAction) => {
    setHistory((h) => pushHistory(h, budgetReducer(h.present, action)));
  }, []);

  const replaceState = useCallback((next: BudgetState) => {
    setHistory((h) => pushHistory(h, next));
  }, []);

  const undo = useCallback(() => setHistory((h) => historyUndo(h)), []);
  const redo = useCallback(() => setHistory((h) => historyRedo(h)), []);

  return {
    loaded,
    state,
    dispatch,
    replaceState,
    undo,
    redo,
    canUndo: historyCanUndo(history),
    canRedo: historyCanRedo(history),
    autosave,
    autosaveError,
    /** How many recurring transactions were auto-generated on this load, for a one-time toast. */
    generatedCount,
  };
}

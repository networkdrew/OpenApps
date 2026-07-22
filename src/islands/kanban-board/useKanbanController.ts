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
  kanbanReducer,
  type KanbanAction,
} from "@/lib/apps-logic/kanban/reducer";
import {
  createEmptyState,
  type KanbanState,
} from "@/lib/apps-logic/kanban/model";
import {
  loadKanbanState,
  saveKanbanState,
} from "@/lib/apps-logic/kanban/persistence";
import type { AutosaveState } from "@/components/react/AutosaveIndicator";

const SAVE_DEBOUNCE_MS = 400;

/**
 * Owns the kanban board's editable state: loads persisted data once on
 * mount (deliberately not read synchronously — see the SSR/hydration note
 * below), wraps every change in the shared undo/redo history stack, and
 * autosaves to localStorage on a short debounce.
 *
 * State starts as a fresh empty board on both the server-rendered HTML and
 * the client's first paint (loading real data only happens in an effect,
 * after mount) — this keeps hydration consistent instead of racing
 * localStorage against React's hydration pass.
 */
export function useKanbanController() {
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<HistoryState<KanbanState>>(() =>
    createHistory(createEmptyState()),
  );
  const [autosave, setAutosave] = useState<AutosaveState>("idle");
  const [autosaveError, setAutosaveError] = useState<string | undefined>();
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setHistory(createHistory(loadKanbanState()));
    setLoaded(true);
  }, []);

  const state = history.present;

  useEffect(() => {
    if (!loaded) return;
    setAutosave("saving");
    saveTimeoutRef.current = window.setTimeout(() => {
      const result = saveKanbanState(state);
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

  const dispatch = useCallback((action: KanbanAction) => {
    setHistory((h) => pushHistory(h, kanbanReducer(h.present, action)));
  }, []);

  const replaceState = useCallback((next: KanbanState) => {
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
  };
}

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
import { notesReducer, type NotesAction } from "@/lib/apps-logic/notes/reducer";
import {
  createEmptyState,
  type NotesState,
} from "@/lib/apps-logic/notes/model";
import {
  loadNotesState,
  saveNotesState,
} from "@/lib/apps-logic/notes/persistence";
import type { AutosaveState } from "@/components/react/AutosaveIndicator";

const SAVE_DEBOUNCE_MS = 400;

/**
 * Owns OpenNotes' editable state: loads persisted data once on mount
 * (deliberately not read synchronously, to keep server/client hydration
 * consistent — see docs/local-data-standard.md), wraps every change in the
 * shared undo/redo history stack, and autosaves to localStorage on a short
 * debounce. Mirrors useKanbanController.ts.
 */
export function useNotesController() {
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<HistoryState<NotesState>>(() =>
    createHistory(createEmptyState()),
  );
  const [autosave, setAutosave] = useState<AutosaveState>("idle");
  const [autosaveError, setAutosaveError] = useState<string | undefined>();
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setHistory(createHistory(loadNotesState()));
    setLoaded(true);
  }, []);

  const state = history.present;

  useEffect(() => {
    if (!loaded) return;
    setAutosave("saving");
    saveTimeoutRef.current = window.setTimeout(() => {
      const result = saveNotesState(state);
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

  const dispatch = useCallback((action: NotesAction) => {
    setHistory((h) => pushHistory(h, notesReducer(h.present, action)));
  }, []);

  const replaceState = useCallback((next: NotesState) => {
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

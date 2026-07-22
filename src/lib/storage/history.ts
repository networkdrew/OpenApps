/**
 * Generic bounded undo/redo stack over full-value snapshots. Any app with
 * editable local state can reuse this instead of building its own —
 * `createHistory`/`pushHistory`/`undo`/`redo` are entirely content-agnostic.
 */
export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export const DEFAULT_HISTORY_LIMIT = 100;

export function createHistory<T>(initial: T): HistoryState<T> {
  return { past: [], present: initial, future: [] };
}

/** Records a new present value, clearing redo. Oldest past entries are dropped past `limit`. */
export function pushHistory<T>(
  state: HistoryState<T>,
  next: T,
  limit = DEFAULT_HISTORY_LIMIT,
): HistoryState<T> {
  const past = [...state.past, state.present];
  while (past.length > limit) past.shift();
  return { past, present: next, future: [] };
}

export function undo<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1] as T;
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future],
  };
}

export function redo<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.future.length === 0) return state;
  const next = state.future[0] as T;
  return {
    past: [...state.past, state.present],
    present: next,
    future: state.future.slice(1),
  };
}

export function canUndo<T>(state: HistoryState<T>): boolean {
  return state.past.length > 0;
}

export function canRedo<T>(state: HistoryState<T>): boolean {
  return state.future.length > 0;
}

/** Resets to a fresh history containing only `initial`, discarding all past/future. */
export function resetHistory<T>(initial: T): HistoryState<T> {
  return createHistory(initial);
}

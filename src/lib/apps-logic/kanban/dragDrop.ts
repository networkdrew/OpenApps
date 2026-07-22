import type { KanbanBoard } from "./model";

/**
 * Resolves a "drop before this card id" target (see useKanbanDnd) into the
 * numeric index `MOVE_CARD` expects — computed against the column's real,
 * unfiltered card order with the dragged card already removed, so a drop
 * computed from a filtered/searched view still lands in the right place in
 * the underlying board.
 */
export function resolveDropIndex(
  board: KanbanBoard,
  cardId: string,
  toColumnId: string,
  beforeCardId: string | null,
): number {
  const column = board.columns.find((c) => c.id === toColumnId);
  if (!column) return 0;
  const withoutDragged = column.cardIds.filter((id) => id !== cardId);
  if (beforeCardId === null) return withoutDragged.length;
  const index = withoutDragged.indexOf(beforeCardId);
  return index === -1 ? withoutDragged.length : index;
}

/** Finds which column a card is currently in and its index there, for keyboard-driven movement. */
export function findCardLocation(
  board: KanbanBoard,
  cardId: string,
): { columnId: string; index: number } | null {
  for (const column of board.columns) {
    const index = column.cardIds.indexOf(cardId);
    if (index !== -1) return { columnId: column.id, index };
  }
  return null;
}

/** Adjacent column id in the given direction, or null at the boundary — used by keyboard card movement. */
export function adjacentColumnId(
  board: KanbanBoard,
  columnId: string,
  direction: "prev" | "next",
): string | null {
  const index = board.columns.findIndex((c) => c.id === columnId);
  if (index === -1) return null;
  const targetIndex = direction === "prev" ? index - 1 : index + 1;
  return board.columns[targetIndex]?.id ?? null;
}

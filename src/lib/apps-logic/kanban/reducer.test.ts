import { describe, expect, it } from "vitest";
import { kanbanReducer } from "./reducer";
import { createEmptyState, type KanbanState } from "./model";

function withBoard(): { state: KanbanState; boardId: string } {
  const added = kanbanReducer(createEmptyState(), {
    type: "ADD_BOARD",
    name: "Board 1",
  });
  const boardId = added.boards[0]?.id;
  if (!boardId) throw new Error("expected a board");
  return { state: added, boardId };
}

describe("kanbanReducer — boards", () => {
  it("adds a board and makes it active", () => {
    const state = kanbanReducer(createEmptyState(), {
      type: "ADD_BOARD",
      name: "New",
    });
    expect(state.boards).toHaveLength(1);
    expect(state.activeBoardId).toBe(state.boards[0]?.id);
  });

  it("renames a board", () => {
    const { state, boardId } = withBoard();
    const renamed = kanbanReducer(state, {
      type: "RENAME_BOARD",
      boardId,
      name: "Renamed",
    });
    expect(renamed.boards[0]?.name).toBe("Renamed");
  });

  it("duplicates a board with a new id and name", () => {
    const { state, boardId } = withBoard();
    const withCard = kanbanReducer(state, {
      type: "ADD_CARD",
      boardId,
      columnId: state.boards[0]!.columns[0]!.id,
      title: "Task",
    });
    const duplicated = kanbanReducer(withCard, {
      type: "DUPLICATE_BOARD",
      boardId,
      name: "Board 1 (copy)",
    });
    expect(duplicated.boards).toHaveLength(2);
    expect(duplicated.boards[1]?.name).toBe("Board 1 (copy)");
    expect(Object.keys(duplicated.boards[1]!.cards)).toHaveLength(1);
    expect(duplicated.activeBoardId).toBe(duplicated.boards[1]?.id);
  });

  it("deletes a board and falls back to another board as active", () => {
    const { state, boardId } = withBoard();
    const withSecond = kanbanReducer(state, {
      type: "ADD_BOARD",
      name: "Board 2",
    });
    const deleted = kanbanReducer(withSecond, {
      type: "DELETE_BOARD",
      boardId,
    });
    expect(deleted.boards).toHaveLength(1);
    expect(deleted.activeBoardId).toBe(deleted.boards[0]?.id);
  });

  it("deleting the only board leaves no active board", () => {
    const { state, boardId } = withBoard();
    const deleted = kanbanReducer(state, { type: "DELETE_BOARD", boardId });
    expect(deleted.boards).toHaveLength(0);
    expect(deleted.activeBoardId).toBeNull();
  });
});

describe("kanbanReducer — columns", () => {
  it("adds a column", () => {
    const { state, boardId } = withBoard();
    const next = kanbanReducer(state, {
      type: "ADD_COLUMN",
      boardId,
      title: "Backlog",
    });
    expect(next.boards[0]?.columns.map((c) => c.title)).toContain("Backlog");
  });

  it("deleting a column removes its cards from the board", () => {
    const { state, boardId } = withBoard();
    const columnId = state.boards[0]!.columns[0]!.id;
    const withCard = kanbanReducer(state, {
      type: "ADD_CARD",
      boardId,
      columnId,
      title: "T",
    });
    const cardId = Object.keys(withCard.boards[0]!.cards)[0]!;
    const deleted = kanbanReducer(withCard, {
      type: "DELETE_COLUMN",
      boardId,
      columnId,
    });
    expect(
      deleted.boards[0]?.columns.find((c) => c.id === columnId),
    ).toBeUndefined();
    expect(deleted.boards[0]?.cards[cardId]).toBeUndefined();
  });

  it("reorders columns", () => {
    const { state, boardId } = withBoard();
    const ids = state.boards[0]!.columns.map((c) => c.id);
    const reversed = [...ids].reverse();
    const next = kanbanReducer(state, {
      type: "REORDER_COLUMNS",
      boardId,
      columnIds: reversed,
    });
    expect(next.boards[0]?.columns.map((c) => c.id)).toEqual(reversed);
  });

  it("ignores a reorder with a mismatched column set", () => {
    const { state, boardId } = withBoard();
    const next = kanbanReducer(state, {
      type: "REORDER_COLUMNS",
      boardId,
      columnIds: ["not-a-real-id"],
    });
    expect(next.boards[0]?.columns).toEqual(state.boards[0]?.columns);
  });
});

describe("kanbanReducer — cards", () => {
  it("adds a card to a column", () => {
    const { state, boardId } = withBoard();
    const columnId = state.boards[0]!.columns[0]!.id;
    const next = kanbanReducer(state, {
      type: "ADD_CARD",
      boardId,
      columnId,
      title: "Write tests",
    });
    const board = next.boards[0]!;
    expect(Object.keys(board.cards)).toHaveLength(1);
    expect(board.columns[0]?.cardIds).toHaveLength(1);
  });

  it("updates a card's fields", () => {
    const { state, boardId } = withBoard();
    const columnId = state.boards[0]!.columns[0]!.id;
    const added = kanbanReducer(state, {
      type: "ADD_CARD",
      boardId,
      columnId,
      title: "T",
    });
    const cardId = Object.keys(added.boards[0]!.cards)[0]!;
    const updated = kanbanReducer(added, {
      type: "UPDATE_CARD",
      boardId,
      cardId,
      patch: { priority: "high", description: "Details" },
    });
    const card = updated.boards[0]!.cards[cardId]!;
    expect(card.priority).toBe("high");
    expect(card.description).toBe("Details");
  });

  it("deletes a card and removes it from its column", () => {
    const { state, boardId } = withBoard();
    const columnId = state.boards[0]!.columns[0]!.id;
    const added = kanbanReducer(state, {
      type: "ADD_CARD",
      boardId,
      columnId,
      title: "T",
    });
    const cardId = Object.keys(added.boards[0]!.cards)[0]!;
    const deleted = kanbanReducer(added, {
      type: "DELETE_CARD",
      boardId,
      cardId,
    });
    expect(deleted.boards[0]?.cards[cardId]).toBeUndefined();
    expect(deleted.boards[0]?.columns[0]?.cardIds).not.toContain(cardId);
  });

  it("moves a card to a different column at a given index", () => {
    const { state, boardId } = withBoard();
    const [fromColumn, toColumn] = state.boards[0]!.columns;
    const added = kanbanReducer(state, {
      type: "ADD_CARD",
      boardId,
      columnId: fromColumn!.id,
      title: "T",
    });
    const cardId = Object.keys(added.boards[0]!.cards)[0]!;
    const moved = kanbanReducer(added, {
      type: "MOVE_CARD",
      boardId,
      cardId,
      toColumnId: toColumn!.id,
      toIndex: 0,
    });
    const board = moved.boards[0]!;
    expect(
      board.columns.find((c) => c.id === fromColumn!.id)?.cardIds,
    ).not.toContain(cardId);
    expect(board.columns.find((c) => c.id === toColumn!.id)?.cardIds).toEqual([
      cardId,
    ]);
  });

  it("reorders a card within the same column", () => {
    const { state, boardId } = withBoard();
    const columnId = state.boards[0]!.columns[0]!.id;
    let s = state;
    s = kanbanReducer(s, {
      type: "ADD_CARD",
      boardId,
      columnId,
      title: "First",
    });
    s = kanbanReducer(s, {
      type: "ADD_CARD",
      boardId,
      columnId,
      title: "Second",
    });
    const [firstId, secondId] = s.boards[0]!.columns[0]!.cardIds;
    const moved = kanbanReducer(s, {
      type: "MOVE_CARD",
      boardId,
      cardId: secondId!,
      toColumnId: columnId,
      toIndex: 0,
    });
    expect(moved.boards[0]?.columns[0]?.cardIds).toEqual([secondId, firstId]);
  });

  it("clamps an out-of-range move index instead of throwing", () => {
    const { state, boardId } = withBoard();
    const columnId = state.boards[0]!.columns[0]!.id;
    const added = kanbanReducer(state, {
      type: "ADD_CARD",
      boardId,
      columnId,
      title: "T",
    });
    const cardId = Object.keys(added.boards[0]!.cards)[0]!;
    const moved = kanbanReducer(added, {
      type: "MOVE_CARD",
      boardId,
      cardId,
      toColumnId: columnId,
      toIndex: 999,
    });
    expect(moved.boards[0]?.columns[0]?.cardIds).toEqual([cardId]);
  });
});

describe("kanbanReducer — labels", () => {
  it("adds a label and removes it from cards when deleted", () => {
    const { state, boardId } = withBoard();
    const withLabel = kanbanReducer(state, {
      type: "ADD_LABEL",
      boardId,
      id: "label-urgent",
      name: "Urgent",
      color: "red",
    });
    // Uses the caller-supplied id verbatim (rather than generating its own)
    // so callers can synchronously reference the new label right away.
    expect(withLabel.boards[0]!.labels[0]!.id).toBe("label-urgent");
    const labelId = withLabel.boards[0]!.labels[0]!.id;
    const columnId = withLabel.boards[0]!.columns[0]!.id;
    const withCard = kanbanReducer(withLabel, {
      type: "ADD_CARD",
      boardId,
      columnId,
      title: "T",
    });
    const cardId = Object.keys(withCard.boards[0]!.cards)[0]!;
    const labeled = kanbanReducer(withCard, {
      type: "UPDATE_CARD",
      boardId,
      cardId,
      patch: { labelIds: [labelId] },
    });
    const unlabeled = kanbanReducer(labeled, {
      type: "DELETE_LABEL",
      boardId,
      labelId,
    });
    expect(unlabeled.boards[0]?.labels).toHaveLength(0);
    expect(unlabeled.boards[0]?.cards[cardId]?.labelIds).toEqual([]);
  });
});

describe("kanbanReducer — bulk operations", () => {
  it("REPLACE_STATE swaps in an entirely new state", () => {
    const { state } = withBoard();
    const replacement = createEmptyState();
    const next = kanbanReducer(state, {
      type: "REPLACE_STATE",
      state: replacement,
    });
    expect(next).toBe(replacement);
  });

  it("CLEAR_ALL resets to an empty state", () => {
    const { state } = withBoard();
    const cleared = kanbanReducer(state, { type: "CLEAR_ALL" });
    expect(cleared.boards).toEqual([]);
    expect(cleared.activeBoardId).toBeNull();
  });
});

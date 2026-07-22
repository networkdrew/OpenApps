import { describe, expect, it } from "vitest";
import {
  createBoard,
  createEmptyCard,
  createEmptyState,
  duplicateBoard,
  isOverdue,
} from "./model";

describe("createBoard", () => {
  it("creates a board with three default columns and no cards", () => {
    const board = createBoard("My Board");
    expect(board.name).toBe("My Board");
    expect(board.columns.map((c) => c.title)).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
    expect(Object.keys(board.cards)).toHaveLength(0);
  });

  it("gives each board a unique id", () => {
    const a = createBoard("A");
    const b = createBoard("B");
    expect(a.id).not.toBe(b.id);
  });
});

describe("createEmptyCard", () => {
  it("defaults priority to none and dueDate to null", () => {
    const card = createEmptyCard("Task");
    expect(card.priority).toBe("none");
    expect(card.dueDate).toBeNull();
    expect(card.labelIds).toEqual([]);
  });
});

describe("createEmptyState", () => {
  it("starts with no boards and no active board", () => {
    const state = createEmptyState();
    expect(state.boards).toEqual([]);
    expect(state.activeBoardId).toBeNull();
  });
});

describe("duplicateBoard", () => {
  it("copies columns, cards, and labels with fresh ids", () => {
    const original = createBoard("Original");
    const card = createEmptyCard("Do the thing");
    original.cards[card.id] = card;
    const firstColumn = original.columns[0];
    if (!firstColumn) throw new Error("expected a column");
    firstColumn.cardIds.push(card.id);
    original.labels.push({ id: "label-1", name: "Urgent", color: "red" });
    card.labelIds.push("label-1");

    const copy = duplicateBoard(original, "Original (copy)");

    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe("Original (copy)");
    expect(Object.keys(copy.cards)).toHaveLength(1);

    const copiedCardId = copy.columns[0]?.cardIds[0];
    expect(copiedCardId).toBeDefined();
    expect(copiedCardId).not.toBe(card.id);

    const copiedCard = copiedCardId ? copy.cards[copiedCardId] : undefined;
    expect(copiedCard?.title).toBe("Do the thing");

    const copiedLabel = copy.labels[0];
    expect(copiedLabel?.id).not.toBe("label-1");
    expect(copiedCard?.labelIds).toEqual([copiedLabel?.id]);
  });

  it("does not mutate the original board", () => {
    const original = createBoard("Original");
    duplicateBoard(original, "Copy");
    expect(original.name).toBe("Original");
    expect(Object.keys(original.cards)).toHaveLength(0);
  });
});

describe("isOverdue", () => {
  it("is false for no due date", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("is true for a date before now", () => {
    expect(isOverdue("2020-01-01", new Date("2026-01-01"))).toBe(true);
  });

  it("is false for a date after now", () => {
    expect(isOverdue("2030-01-01", new Date("2026-01-01"))).toBe(false);
  });
});

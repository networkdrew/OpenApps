import { describe, expect, it } from "vitest";
import {
  adjacentColumnId,
  findCardLocation,
  resolveDropIndex,
} from "./dragDrop";
import { createBoard, createEmptyCard } from "./model";

describe("resolveDropIndex", () => {
  it("returns end-of-column length when beforeCardId is null", () => {
    const board = createBoard("B");
    const a = createEmptyCard("A");
    const b = createEmptyCard("B");
    board.cards[a.id] = a;
    board.cards[b.id] = b;
    board.columns[0]!.cardIds = [a.id, b.id];
    expect(resolveDropIndex(board, a.id, board.columns[0]!.id, null)).toBe(1);
  });

  it("resolves to the index of the anchor card after removing the dragged card", () => {
    const board = createBoard("B");
    const a = createEmptyCard("A");
    const b = createEmptyCard("B");
    const c = createEmptyCard("C");
    board.cards[a.id] = a;
    board.cards[b.id] = b;
    board.cards[c.id] = c;
    board.columns[0]!.cardIds = [a.id, b.id, c.id];
    // Dragging "a" to land before "c": after removing a, [b, c] -> index of c is 1.
    expect(resolveDropIndex(board, a.id, board.columns[0]!.id, c.id)).toBe(1);
  });

  it("falls back to end of column if the anchor card isn't in that column", () => {
    const board = createBoard("B");
    const a = createEmptyCard("A");
    board.cards[a.id] = a;
    board.columns[0]!.cardIds = [a.id];
    expect(resolveDropIndex(board, a.id, board.columns[0]!.id, "missing")).toBe(
      0,
    );
  });

  it("returns 0 for an unknown column", () => {
    const board = createBoard("B");
    expect(resolveDropIndex(board, "x", "missing-column", null)).toBe(0);
  });
});

describe("findCardLocation", () => {
  it("finds the column and index of a card", () => {
    const board = createBoard("B");
    const a = createEmptyCard("A");
    const b = createEmptyCard("B");
    board.cards[a.id] = a;
    board.cards[b.id] = b;
    board.columns[1]!.cardIds = [a.id, b.id];
    expect(findCardLocation(board, b.id)).toEqual({
      columnId: board.columns[1]!.id,
      index: 1,
    });
  });

  it("returns null for a card that isn't placed anywhere", () => {
    const board = createBoard("B");
    expect(findCardLocation(board, "missing")).toBeNull();
  });
});

describe("adjacentColumnId", () => {
  it("returns the next column id", () => {
    const board = createBoard("B");
    const [first, second] = board.columns;
    expect(adjacentColumnId(board, first!.id, "next")).toBe(second!.id);
  });

  it("returns the previous column id", () => {
    const board = createBoard("B");
    const [first, second] = board.columns;
    expect(adjacentColumnId(board, second!.id, "prev")).toBe(first!.id);
  });

  it("returns null at the boundary", () => {
    const board = createBoard("B");
    const last = board.columns[board.columns.length - 1]!;
    expect(adjacentColumnId(board, last.id, "next")).toBeNull();
  });
});

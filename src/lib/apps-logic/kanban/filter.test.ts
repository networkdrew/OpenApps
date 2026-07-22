import { describe, expect, it } from "vitest";
import {
  cardMatchesFilters,
  filterBoard,
  hasActiveCardFilters,
} from "./filter";
import { createBoard, createEmptyCard } from "./model";

describe("cardMatchesFilters", () => {
  it("matches by title text, case- and punctuation-insensitively", () => {
    const card = createEmptyCard("Fix the Login Bug!");
    expect(cardMatchesFilters(card, { query: "login bug" })).toBe(true);
    expect(cardMatchesFilters(card, { query: "signup" })).toBe(false);
  });

  it("matches by description text", () => {
    const card = {
      ...createEmptyCard("T"),
      description: "Needs a database migration",
    };
    expect(cardMatchesFilters(card, { query: "migration" })).toBe(true);
  });

  it("filters by priority", () => {
    const card = { ...createEmptyCard("T"), priority: "high" as const };
    expect(cardMatchesFilters(card, { priority: "high" })).toBe(true);
    expect(cardMatchesFilters(card, { priority: "low" })).toBe(false);
  });

  it("filters by label", () => {
    const card = { ...createEmptyCard("T"), labelIds: ["label-1"] };
    expect(cardMatchesFilters(card, { labelIds: ["label-1"] })).toBe(true);
    expect(cardMatchesFilters(card, { labelIds: ["label-2"] })).toBe(false);
  });

  it("filters overdue-only cards relative to `now`", () => {
    const now = new Date("2026-06-15");
    const overdue = { ...createEmptyCard("T"), dueDate: "2026-01-01" };
    const upcoming = { ...createEmptyCard("T"), dueDate: "2030-01-01" };
    const none = createEmptyCard("T");
    expect(cardMatchesFilters(overdue, { overdueOnly: true }, now)).toBe(true);
    expect(cardMatchesFilters(upcoming, { overdueOnly: true }, now)).toBe(
      false,
    );
    expect(cardMatchesFilters(none, { overdueOnly: true }, now)).toBe(false);
  });
});

describe("filterBoard", () => {
  it("returns only matching card ids per column, preserving order", () => {
    const board = createBoard("B");
    const match = createEmptyCard("Buy milk");
    const noMatch = createEmptyCard("Write report");
    board.cards[match.id] = match;
    board.cards[noMatch.id] = noMatch;
    board.columns[0]!.cardIds = [noMatch.id, match.id];

    const result = filterBoard(board, { query: "milk" });
    expect(result[board.columns[0]!.id]).toEqual([match.id]);
    expect(result[board.columns[1]!.id]).toEqual([]);
  });
});

describe("hasActiveCardFilters", () => {
  it("is false with no filters set", () => {
    expect(hasActiveCardFilters({})).toBe(false);
  });

  it("is true when any filter is set", () => {
    expect(hasActiveCardFilters({ query: "x" })).toBe(true);
    expect(hasActiveCardFilters({ priority: "high" })).toBe(true);
    expect(hasActiveCardFilters({ overdueOnly: true })).toBe(true);
    expect(hasActiveCardFilters({ labelIds: ["a"] })).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { searchApps, getSuggestions } from "./search";

function topId(query: string): string | undefined {
  return searchApps(query)[0]?.app.id;
}

describe("searchApps — descriptive and intent queries", () => {
  it.each([
    "organize work into columns",
    "free Trello alternative",
    "track jobs through stages",
    "move cards between lists",
    "project planning without an account",
  ])('finds the Kanban Board for "%s"', (query) => {
    expect(topId(query)).toBe("kanban-board");
  });

  it("ranks an exact name match first and explains why", () => {
    const results = searchApps("Kanban Board");
    expect(results[0]?.app.id).toBe("kanban-board");
    expect(results[0]?.reasons.some((r) => r.label === "Name")).toBe(true);
  });

  it("is tolerant of capitalization, punctuation, and spacing", () => {
    expect(topId("  KANBAN-BOARD!!  ")).toBe("kanban-board");
    expect(topId("kanban,board")).toBe("kanban-board");
  });

  it("tolerates a common misspelling", () => {
    expect(topId("kanbam board")).toBe("kanban-board");
  });

  it("matches a reworded use case via word coverage, not just exact phrasing", () => {
    expect(topId("somewhere to plan a wedding")).toBe("kanban-board");
  });

  it("matches replacement-for terms", () => {
    expect(topId("alternative to Asana")).toBe("kanban-board");
  });

  it("matches problems-solved phrasing", () => {
    expect(topId("losing track of what stage a task is in")).toBe(
      "kanban-board",
    );
  });

  it("returns every app for an empty query", () => {
    const results = searchApps("");
    expect(results.length).toBeGreaterThan(0);
  });

  it("surfaces a short, human-readable reason for a top result", () => {
    const results = searchApps("track jobs through stages");
    expect(results[0]?.reasons.length).toBeGreaterThan(0);
    expect(results[0]?.reasons[0]?.value.length).toBeGreaterThan(0);
  });
});

describe("searchApps — descriptive and intent queries for OpenNotes", () => {
  it.each([
    "write private notes offline",
    "free Evernote alternative",
    "link personal knowledge pages",
    "markdown editor with live preview",
    "notes app with no account",
  ])('finds OpenNotes for "%s"', (query) => {
    expect(topId(query)).toBe("notes");
  });

  it("ranks an exact name match first", () => {
    const results = searchApps("OpenNotes");
    expect(results[0]?.app.id).toBe("notes");
  });

  it("tolerates a common misspelling of Evernote", () => {
    expect(topId("evernot alternative")).toBe("notes");
  });

  it("matches a reworded use case via word coverage", () => {
    expect(topId("somewhere to keep a daily journal")).toBe("notes");
  });

  it("matches replacement-for terms", () => {
    expect(topId("alternative to Notion for notes")).toBe("notes");
  });

  it("matches problems-solved phrasing", () => {
    expect(
      topId("wanting a private notebook without creating an account"),
    ).toBe("notes");
  });
});

describe("getSuggestions — no-result fallback", () => {
  it("suggests featured apps when nothing matches at all", () => {
    const suggestions = getSuggestions("aquarium fish tank simulator");
    expect(suggestions.apps.length).toBeGreaterThan(0);
    expect(suggestions.message).toContain("aquarium fish tank simulator");
  });

  it("never returns an empty suggestion list", () => {
    const suggestions = getSuggestions("");
    expect(suggestions.apps.length).toBeGreaterThan(0);
  });
});

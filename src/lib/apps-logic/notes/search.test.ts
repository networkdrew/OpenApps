import { describe, expect, it } from "vitest";
import { createNote } from "./model";
import { searchNotes, sortNotes } from "./search";

describe("searchNotes", () => {
  it("matches on title", () => {
    const note = createNote("nb", null, "Recipe Book", "some content");
    expect(searchNotes([note], "recipe")[0]?.note.id).toBe(note.id);
  });

  it("matches on content", () => {
    const note = createNote("nb", null, "Untitled", "a secret ingredient");
    expect(searchNotes([note], "secret")[0]?.note.id).toBe(note.id);
  });

  it("matches on tags", () => {
    const note = { ...createNote("nb", null, "Untitled"), tags: ["urgent"] };
    expect(searchNotes([note], "urgent")[0]?.note.id).toBe(note.id);
  });

  it("is case-insensitive", () => {
    const note = createNote("nb", null, "Recipe Book");
    expect(searchNotes([note], "RECIPE")[0]?.note.id).toBe(note.id);
  });

  it("ranks a title match above a content-only match", () => {
    const titleMatch = createNote("nb", null, "Budget plan", "nothing else");
    const contentMatch = createNote(
      "nb",
      null,
      "Unrelated",
      "our budget is tight",
    );
    const results = searchNotes([contentMatch, titleMatch], "budget");
    expect(results[0]?.note.id).toBe(titleMatch.id);
  });

  it("excludes trashed notes", () => {
    const trashed = {
      ...createNote("nb", null, "Findable"),
      trashed: true,
      trashedAt: new Date().toISOString(),
    };
    expect(searchNotes([trashed], "findable")).toEqual([]);
  });

  it("returns nothing for an empty query", () => {
    const note = createNote("nb", null, "Anything");
    expect(searchNotes([note], "")).toEqual([]);
    expect(searchNotes([note], "   ")).toEqual([]);
  });

  it("returns nothing when nothing matches", () => {
    const note = createNote("nb", null, "Anything", "nothing relevant");
    expect(searchNotes([note], "xyzzy")).toEqual([]);
  });

  it("includes a snippet around a content match", () => {
    const note = createNote(
      "nb",
      null,
      "Untitled",
      "the quick brown fox jumps over the lazy dog",
    );
    const result = searchNotes([note], "fox")[0];
    expect(result?.snippet).toContain("fox");
  });
});

describe("sortNotes", () => {
  function noteAt(title: string, iso: string) {
    return { ...createNote("nb", null, title), createdAt: iso, updatedAt: iso };
  }

  it("sorts by last updated, most recent first", () => {
    const older = noteAt("Older", "2026-01-01T00:00:00.000Z");
    const newer = noteAt("Newer", "2026-02-01T00:00:00.000Z");
    expect(sortNotes([older, newer], "updated-desc")).toEqual([newer, older]);
  });

  it("sorts by date created, most recent first", () => {
    const older = noteAt("Older", "2026-01-01T00:00:00.000Z");
    const newer = noteAt("Newer", "2026-02-01T00:00:00.000Z");
    expect(sortNotes([older, newer], "created-desc")).toEqual([newer, older]);
  });

  it("sorts by title alphabetically, case-insensitively", () => {
    const b = createNote("nb", null, "banana");
    const a = createNote("nb", null, "Apple");
    expect(sortNotes([b, a], "title-asc")).toEqual([a, b]);
  });

  it("always floats pinned notes to the top regardless of sort", () => {
    const pinnedOld = {
      ...noteAt("Pinned old", "2026-01-01T00:00:00.000Z"),
      pinned: true,
    };
    const unpinnedNew = noteAt("Unpinned new", "2026-03-01T00:00:00.000Z");
    const result = sortNotes([unpinnedNew, pinnedOld], "updated-desc");
    expect(result[0]?.title).toBe("Pinned old");
  });
});

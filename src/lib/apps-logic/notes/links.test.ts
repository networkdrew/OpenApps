import { describe, expect, it } from "vitest";
import { createNote } from "./model";
import {
  computeBacklinks,
  extractWikiLinks,
  findNoteByTitle,
  parseWikiLinkInner,
} from "./links";

describe("extractWikiLinks", () => {
  it("finds a simple wiki link", () => {
    const links = extractWikiLinks("See [[Project Plan]] for details.");
    expect(links).toHaveLength(1);
    expect(links[0]?.target).toBe("Project Plan");
    expect(links[0]?.display).toBe("Project Plan");
  });

  it("finds an aliased wiki link", () => {
    const links = extractWikiLinks("Check [[Recipe Book|my recipes]] here.");
    expect(links[0]?.target).toBe("Recipe Book");
    expect(links[0]?.display).toBe("my recipes");
  });

  it("finds multiple links in order", () => {
    const links = extractWikiLinks("[[Alpha]] then [[Beta]]");
    expect(links.map((l) => l.target)).toEqual(["Alpha", "Beta"]);
  });

  it("returns nothing for content with no links", () => {
    expect(extractWikiLinks("just plain text")).toEqual([]);
  });

  it("ignores an empty [[]] link", () => {
    expect(extractWikiLinks("empty [[]] link")).toEqual([]);
  });

  it("trims whitespace inside the brackets", () => {
    const links = extractWikiLinks("[[  Padded Title  ]]");
    expect(links[0]?.target).toBe("Padded Title");
  });
});

describe("parseWikiLinkInner", () => {
  it("uses the target as display when no alias is given", () => {
    expect(parseWikiLinkInner("Title")).toEqual({
      target: "Title",
      display: "Title",
    });
  });

  it("uses the alias as display when given", () => {
    expect(parseWikiLinkInner("Title", "Alias")).toEqual({
      target: "Title",
      display: "Alias",
    });
  });

  it("falls back to target when alias is blank", () => {
    expect(parseWikiLinkInner("Title", "   ")).toEqual({
      target: "Title",
      display: "Title",
    });
  });
});

describe("findNoteByTitle", () => {
  it("finds a note case-insensitively", () => {
    const note = createNote("nb-1", null, "My Great Note");
    expect(findNoteByTitle([note], "my great note")).toBe(note);
  });

  it("ignores trashed notes", () => {
    const note = { ...createNote("nb-1", null, "Trashed"), trashed: true };
    expect(findNoteByTitle([note], "Trashed")).toBeUndefined();
  });

  it("returns undefined when nothing matches", () => {
    const note = createNote("nb-1", null, "Something");
    expect(findNoteByTitle([note], "Something Else")).toBeUndefined();
  });

  it("returns undefined for an empty title", () => {
    const note = createNote("nb-1", null, "Something");
    expect(findNoteByTitle([note], "  ")).toBeUndefined();
  });
});

describe("computeBacklinks", () => {
  it("finds notes that link to the target by title", () => {
    const target = createNote("nb-1", null, "Recipe Book");
    const linker = {
      ...createNote("nb-1", null, "Grocery List"),
      content: "Based on [[Recipe Book]]",
    };
    const stranger = createNote("nb-1", null, "Unrelated");
    const backlinks = computeBacklinks([target, linker, stranger], target);
    expect(backlinks).toEqual([linker]);
  });

  it("matches an aliased link by target title, not display text", () => {
    const target = createNote("nb-1", null, "Recipe Book");
    const linker = {
      ...createNote("nb-1", null, "Grocery List"),
      content: "See [[Recipe Book|my recipes]]",
    };
    expect(computeBacklinks([target, linker], target)).toEqual([linker]);
  });

  it("excludes the target note itself even if self-referencing", () => {
    const target = {
      ...createNote("nb-1", null, "Self"),
      content: "[[Self]]",
    };
    expect(computeBacklinks([target], target)).toEqual([]);
  });

  it("excludes trashed notes", () => {
    const target = createNote("nb-1", null, "Recipe Book");
    const trashedLinker = {
      ...createNote("nb-1", null, "Old note"),
      content: "[[Recipe Book]]",
      trashed: true,
    };
    expect(computeBacklinks([target, trashedLinker], target)).toEqual([]);
  });

  it("returns nothing when the target has an empty title", () => {
    const target = createNote("nb-1", null, "");
    const linker = { ...createNote("nb-1", null, "x"), content: "[[]]" };
    expect(computeBacklinks([target, linker], target)).toEqual([]);
  });
});

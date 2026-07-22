import { describe, expect, it } from "vitest";
import {
  BUILT_IN_TEMPLATES,
  createEmptyState,
  createFolder,
  createNote,
  createNotebook,
  createTemplate,
} from "./model";

describe("createEmptyState", () => {
  it("seeds exactly one default notebook and no notes/folders/templates", () => {
    const state = createEmptyState();
    expect(state.notebooks).toHaveLength(1);
    expect(state.notebooks[0]?.name).toBe("My Notebook");
    expect(state.folders).toEqual([]);
    expect(state.notes).toEqual({});
    expect(state.templates).toEqual([]);
    expect(state.activeView).toEqual({ type: "all" });
    expect(state.activeNoteId).toBeNull();
  });
});

describe("createNotebook", () => {
  it("creates a notebook with a unique id and timestamps", () => {
    const a = createNotebook("Work");
    const b = createNotebook("Work");
    expect(a.id).not.toBe(b.id);
    expect(a.name).toBe("Work");
    expect(a.createdAt).toBe(a.updatedAt);
  });
});

describe("createFolder", () => {
  it("creates a folder scoped to a notebook with an optional parent", () => {
    const folder = createFolder("nb-1", null, "Recipes");
    expect(folder.notebookId).toBe("nb-1");
    expect(folder.parentFolderId).toBeNull();
    expect(folder.name).toBe("Recipes");
  });

  it("supports a parent folder id for nesting", () => {
    const child = createFolder("nb-1", "folder-1", "Desserts");
    expect(child.parentFolderId).toBe("folder-1");
  });
});

describe("createNote", () => {
  it("creates a note with sensible defaults", () => {
    const note = createNote("nb-1", null, "Untitled", "");
    expect(note.notebookId).toBe("nb-1");
    expect(note.folderId).toBeNull();
    expect(note.title).toBe("Untitled");
    expect(note.content).toBe("");
    expect(note.tags).toEqual([]);
    expect(note.favorite).toBe(false);
    expect(note.pinned).toBe(false);
    expect(note.archived).toBe(false);
    expect(note.trashed).toBe(false);
    expect(note.trashedAt).toBeNull();
    expect(note.createdAt).toBe(note.updatedAt);
  });

  it("defaults content to an empty string", () => {
    const note = createNote("nb-1", "folder-1", "My note");
    expect(note.content).toBe("");
    expect(note.folderId).toBe("folder-1");
  });
});

describe("createTemplate", () => {
  it("creates a template with the given name and content", () => {
    const template = createTemplate("Weekly review", "# Weekly review");
    expect(template.name).toBe("Weekly review");
    expect(template.content).toBe("# Weekly review");
    expect(template.id).toBeTruthy();
  });
});

describe("BUILT_IN_TEMPLATES", () => {
  it("has real, non-empty starter templates", () => {
    expect(BUILT_IN_TEMPLATES.length).toBeGreaterThan(0);
    for (const t of BUILT_IN_TEMPLATES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.content.length).toBeGreaterThan(0);
    }
  });

  it("has unique names", () => {
    const names = BUILT_IN_TEMPLATES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

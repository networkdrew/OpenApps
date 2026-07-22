import { describe, expect, it, beforeEach } from "vitest";
import {
  clearNotesState,
  importNotesState,
  loadNotesState,
  saveNotesState,
  STORAGE_KEY,
} from "./persistence";
import { createEmptyState, createNote, createNotebook } from "./model";

describe("notes persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns a fresh empty state (one default notebook) when nothing is stored", () => {
    const state = loadNotesState();
    expect(state.notebooks).toHaveLength(1);
    expect(state.notes).toEqual({});
    expect(state.folders).toEqual([]);
    expect(state.templates).toEqual([]);
  });

  it("saves and reloads a state with a notebook and note", () => {
    const notebook = createNotebook("Saved notebook");
    const note = createNote(notebook.id, null, "Saved note", "content");
    const state = {
      ...createEmptyState(),
      notebooks: [notebook],
      notes: { [note.id]: note },
    };
    saveNotesState(state);
    const reloaded = loadNotesState();
    expect(reloaded.notebooks[0]?.name).toBe("Saved notebook");
    expect(reloaded.notes[note.id]?.title).toBe("Saved note");
  });

  it("clears stored state", () => {
    const state = {
      ...createEmptyState(),
      notebooks: [createNotebook("Saved")],
    };
    saveNotesState(state);
    clearNotesState();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadNotesState().notebooks[0]?.name).toBe("My Notebook");
  });

  it("imports a previously exported state", async () => {
    const notebook = createNotebook("Exported notebook");
    const state = { ...createEmptyState(), notebooks: [notebook] };
    const file = new File([JSON.stringify(state)], "export.json", {
      type: "application/json",
    });
    const result = await importNotesState(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.notebooks[0]?.name).toBe("Exported notebook");
    }
  });

  it("rejects a file that isn't a valid notes export", async () => {
    const file = new File([JSON.stringify({ hello: "world" })], "bad.json", {
      type: "application/json",
    });
    const result = await importNotesState(file);
    expect(result.ok).toBe(false);
  });

  it("rejects a file that isn't valid JSON", async () => {
    const file = new File(["not json"], "bad.json", {
      type: "application/json",
    });
    const result = await importNotesState(file);
    expect(result.ok).toBe(false);
  });

  it("rejects an import with zero notebooks", async () => {
    const state = { ...createEmptyState(), notebooks: [] };
    const file = new File([JSON.stringify(state)], "bad.json", {
      type: "application/json",
    });
    const result = await importNotesState(file);
    expect(result.ok).toBe(false);
  });
});

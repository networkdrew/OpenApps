import { describe, expect, it, beforeEach } from "vitest";
import {
  clearKanbanState,
  importKanbanState,
  loadKanbanState,
  saveKanbanState,
  STORAGE_KEY,
} from "./persistence";
import { createBoard, createEmptyState } from "./model";

describe("kanban persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty state when nothing is stored", () => {
    expect(loadKanbanState()).toEqual(createEmptyState());
  });

  it("saves and reloads a state with a board", () => {
    const state = { ...createEmptyState(), boards: [createBoard("Saved")] };
    saveKanbanState(state);
    const reloaded = loadKanbanState();
    expect(reloaded.boards[0]?.name).toBe("Saved");
  });

  it("clears stored state", () => {
    const state = { ...createEmptyState(), boards: [createBoard("Saved")] };
    saveKanbanState(state);
    clearKanbanState();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadKanbanState()).toEqual(createEmptyState());
  });

  it("imports a previously exported state", async () => {
    const state = { ...createEmptyState(), boards: [createBoard("Exported")] };
    const file = new File([JSON.stringify(state)], "export.json", {
      type: "application/json",
    });
    const result = await importKanbanState(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.boards[0]?.name).toBe("Exported");
    }
  });

  it("rejects a file that isn't a valid kanban export", async () => {
    const file = new File([JSON.stringify({ hello: "world" })], "bad.json", {
      type: "application/json",
    });
    const result = await importKanbanState(file);
    expect(result.ok).toBe(false);
  });

  it("rejects a file that isn't valid JSON", async () => {
    const file = new File(["not json"], "bad.json", {
      type: "application/json",
    });
    const result = await importKanbanState(file);
    expect(result.ok).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { notesReducer } from "./reducer";
import { createEmptyState, type NotesState } from "./model";

function baseNotebookId(state: NotesState): string {
  const id = state.notebooks[0]?.id;
  if (!id) throw new Error("expected a default notebook");
  return id;
}

function withNote(state = createEmptyState()) {
  const notebookId = baseNotebookId(state);
  const added = notesReducer(state, {
    type: "ADD_NOTE",
    notebookId,
    folderId: null,
    title: "First note",
    content: "hello",
  });
  const noteId = added.activeNoteId;
  if (!noteId) throw new Error("expected an active note");
  return { state: added, notebookId, noteId };
}

describe("notesReducer — notebooks", () => {
  it("adds a notebook", () => {
    const state = notesReducer(createEmptyState(), {
      type: "ADD_NOTEBOOK",
      name: "Work",
    });
    expect(state.notebooks).toHaveLength(2);
    expect(state.notebooks[1]?.name).toBe("Work");
  });

  it("renames a notebook", () => {
    const initial = createEmptyState();
    const notebookId = baseNotebookId(initial);
    const state = notesReducer(initial, {
      type: "RENAME_NOTEBOOK",
      notebookId,
      name: "Renamed",
    });
    expect(state.notebooks[0]?.name).toBe("Renamed");
  });

  it("refuses to delete the only remaining notebook", () => {
    const initial = createEmptyState();
    const notebookId = baseNotebookId(initial);
    const state = notesReducer(initial, {
      type: "DELETE_NOTEBOOK",
      notebookId,
    });
    expect(state.notebooks).toHaveLength(1);
  });

  it("deletes a notebook, trashing its notes and removing its folders", () => {
    const initial = createEmptyState();
    const withSecond = notesReducer(initial, {
      type: "ADD_NOTEBOOK",
      name: "Second",
    });
    const secondId = withSecond.notebooks[1]!.id;
    const withFolder = notesReducer(withSecond, {
      type: "ADD_FOLDER",
      notebookId: secondId,
      parentFolderId: null,
      name: "Folder",
    });
    const withNoteAdded = notesReducer(withFolder, {
      type: "ADD_NOTE",
      notebookId: secondId,
      folderId: null,
      title: "Doomed",
    });
    const noteId = withNoteAdded.activeNoteId!;
    const deleted = notesReducer(withNoteAdded, {
      type: "DELETE_NOTEBOOK",
      notebookId: secondId,
    });
    expect(deleted.notebooks).toHaveLength(1);
    expect(deleted.folders).toHaveLength(0);
    expect(deleted.notes[noteId]?.trashed).toBe(true);
  });

  it("resets active view to 'all' when its notebook is deleted", () => {
    const initial = createEmptyState();
    const withSecond = notesReducer(initial, {
      type: "ADD_NOTEBOOK",
      name: "Second",
    });
    const secondId = withSecond.notebooks[1]!.id;
    const withView = notesReducer(withSecond, {
      type: "SET_ACTIVE_VIEW",
      view: { type: "notebook", notebookId: secondId },
    });
    const deleted = notesReducer(withView, {
      type: "DELETE_NOTEBOOK",
      notebookId: secondId,
    });
    expect(deleted.activeView).toEqual({ type: "all" });
  });
});

describe("notesReducer — folders", () => {
  it("adds a folder", () => {
    const notebookId = baseNotebookId(createEmptyState());
    const state = notesReducer(createEmptyState(), {
      type: "ADD_FOLDER",
      notebookId,
      parentFolderId: null,
      name: "Recipes",
    });
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0]?.name).toBe("Recipes");
  });

  it("renames a folder", () => {
    const notebookId = baseNotebookId(createEmptyState());
    const added = notesReducer(createEmptyState(), {
      type: "ADD_FOLDER",
      notebookId,
      parentFolderId: null,
      name: "Recipes",
    });
    const folderId = added.folders[0]!.id;
    const renamed = notesReducer(added, {
      type: "RENAME_FOLDER",
      folderId,
      name: "Renamed",
    });
    expect(renamed.folders[0]?.name).toBe("Renamed");
  });

  it("deletes a folder, its descendants, and unfiles (not trashes) its notes", () => {
    const notebookId = baseNotebookId(createEmptyState());
    let state = notesReducer(createEmptyState(), {
      type: "ADD_FOLDER",
      notebookId,
      parentFolderId: null,
      name: "Root",
    });
    const rootId = state.folders[0]!.id;
    state = notesReducer(state, {
      type: "ADD_FOLDER",
      notebookId,
      parentFolderId: rootId,
      name: "Child",
    });
    const childId = state.folders[1]!.id;
    state = notesReducer(state, {
      type: "ADD_NOTE",
      notebookId,
      folderId: childId,
      title: "In child folder",
    });
    const noteId = state.activeNoteId!;

    const deleted = notesReducer(state, {
      type: "DELETE_FOLDER",
      folderId: rootId,
    });
    expect(deleted.folders).toHaveLength(0);
    expect(deleted.notes[noteId]?.folderId).toBeNull();
    expect(deleted.notes[noteId]?.trashed).toBe(false);
  });

  it("resets active view to 'all' when its folder is deleted", () => {
    const notebookId = baseNotebookId(createEmptyState());
    const added = notesReducer(createEmptyState(), {
      type: "ADD_FOLDER",
      notebookId,
      parentFolderId: null,
      name: "Recipes",
    });
    const folderId = added.folders[0]!.id;
    const withView = notesReducer(added, {
      type: "SET_ACTIVE_VIEW",
      view: { type: "folder", folderId },
    });
    const deleted = notesReducer(withView, {
      type: "DELETE_FOLDER",
      folderId,
    });
    expect(deleted.activeView).toEqual({ type: "all" });
  });
});

describe("notesReducer — notes", () => {
  it("adds a note and makes it active", () => {
    const { state, noteId } = withNote();
    expect(state.notes[noteId]?.title).toBe("First note");
    expect(state.activeNoteId).toBe(noteId);
  });

  it("updates a note's title/content/tags and touches updatedAt", () => {
    const { state, noteId } = withNote();
    const before = state.notes[noteId]!.updatedAt;
    const updated = notesReducer(state, {
      type: "UPDATE_NOTE",
      noteId,
      patch: { title: "Renamed", content: "new content" },
    });
    expect(updated.notes[noteId]?.title).toBe("Renamed");
    expect(updated.notes[noteId]?.content).toBe("new content");
    expect((updated.notes[noteId]?.updatedAt ?? "") >= before).toBe(true);
  });

  it("is a no-op when updating a note that doesn't exist", () => {
    const { state } = withNote();
    const updated = notesReducer(state, {
      type: "UPDATE_NOTE",
      noteId: "missing",
      patch: { title: "x" },
    });
    expect(updated).toEqual(state);
  });

  it("moves a note to a different notebook/folder", () => {
    const { state, noteId, notebookId } = withNote();
    const withSecond = notesReducer(state, {
      type: "ADD_NOTEBOOK",
      name: "Second",
    });
    const secondId = withSecond.notebooks[1]!.id;
    const moved = notesReducer(withSecond, {
      type: "MOVE_NOTE",
      noteId,
      notebookId: secondId,
      folderId: null,
    });
    expect(moved.notes[noteId]?.notebookId).toBe(secondId);
    expect(moved.notes[noteId]?.notebookId).not.toBe(notebookId);
  });

  it("toggles favorite and pinned", () => {
    const { state, noteId } = withNote();
    const favorited = notesReducer(state, {
      type: "TOGGLE_FAVORITE",
      noteId,
    });
    expect(favorited.notes[noteId]?.favorite).toBe(true);
    const unfavorited = notesReducer(favorited, {
      type: "TOGGLE_FAVORITE",
      noteId,
    });
    expect(unfavorited.notes[noteId]?.favorite).toBe(false);

    const pinned = notesReducer(state, { type: "TOGGLE_PINNED", noteId });
    expect(pinned.notes[noteId]?.pinned).toBe(true);
  });

  it("archives and unarchives a note", () => {
    const { state, noteId } = withNote();
    const archived = notesReducer(state, { type: "ARCHIVE_NOTE", noteId });
    expect(archived.notes[noteId]?.archived).toBe(true);
    const unarchived = notesReducer(archived, {
      type: "UNARCHIVE_NOTE",
      noteId,
    });
    expect(unarchived.notes[noteId]?.archived).toBe(false);
  });

  it("trashes and restores a note", () => {
    const { state, noteId } = withNote();
    const trashed = notesReducer(state, { type: "TRASH_NOTE", noteId });
    expect(trashed.notes[noteId]?.trashed).toBe(true);
    expect(trashed.notes[noteId]?.trashedAt).not.toBeNull();

    const restored = notesReducer(trashed, { type: "RESTORE_NOTE", noteId });
    expect(restored.notes[noteId]?.trashed).toBe(false);
    expect(restored.notes[noteId]?.trashedAt).toBeNull();
  });

  it("restoring a note whose notebook was deleted reassigns it to a remaining notebook", () => {
    const initial = createEmptyState();
    const withSecond = notesReducer(initial, {
      type: "ADD_NOTEBOOK",
      name: "Second",
    });
    const secondId = withSecond.notebooks[1]!.id;
    const withNoteAdded = notesReducer(withSecond, {
      type: "ADD_NOTE",
      notebookId: secondId,
      folderId: null,
      title: "Orphan-to-be",
    });
    const noteId = withNoteAdded.activeNoteId!;
    const deleted = notesReducer(withNoteAdded, {
      type: "DELETE_NOTEBOOK",
      notebookId: secondId,
    });
    const restored = notesReducer(deleted, {
      type: "RESTORE_NOTE",
      noteId,
    });
    expect(restored.notes[noteId]?.trashed).toBe(false);
    expect(restored.notes[noteId]?.notebookId).toBe(deleted.notebooks[0]?.id);
    expect(restored.notes[noteId]?.folderId).toBeNull();
  });

  it("deletes a note forever and clears activeNoteId if it was active", () => {
    const { state, noteId } = withNote();
    const deleted = notesReducer(state, {
      type: "DELETE_NOTE_FOREVER",
      noteId,
    });
    expect(deleted.notes[noteId]).toBeUndefined();
    expect(deleted.activeNoteId).toBeNull();
  });

  it("empties the trash, removing every trashed note", () => {
    const { state, noteId } = withNote();
    const trashed = notesReducer(state, { type: "TRASH_NOTE", noteId });
    const emptied = notesReducer(trashed, { type: "EMPTY_TRASH" });
    expect(emptied.notes[noteId]).toBeUndefined();
  });

  it("empty trash leaves non-trashed notes alone", () => {
    const { state, noteId } = withNote();
    const emptied = notesReducer(state, { type: "EMPTY_TRASH" });
    expect(emptied.notes[noteId]).toBeDefined();
  });
});

describe("notesReducer — tags", () => {
  it("adds a tag without duplicating case-insensitively", () => {
    const { state, noteId } = withNote();
    const tagged = notesReducer(state, {
      type: "ADD_TAG",
      noteId,
      tag: "Work",
    });
    const again = notesReducer(tagged, {
      type: "ADD_TAG",
      noteId,
      tag: "work",
    });
    expect(again.notes[noteId]?.tags).toEqual(["Work"]);
  });

  it("removes a tag case-insensitively", () => {
    const { state, noteId } = withNote();
    const tagged = notesReducer(state, {
      type: "ADD_TAG",
      noteId,
      tag: "Work",
    });
    const removed = notesReducer(tagged, {
      type: "REMOVE_TAG",
      noteId,
      tag: "WORK",
    });
    expect(removed.notes[noteId]?.tags).toEqual([]);
  });

  it("renames a tag across every note that has it", () => {
    const { state, noteId } = withNote();
    const second = notesReducer(state, {
      type: "ADD_NOTE",
      notebookId: baseNotebookId(state),
      folderId: null,
      title: "Second",
    });
    const secondId = second.activeNoteId!;
    const tagged1 = notesReducer(second, {
      type: "ADD_TAG",
      noteId,
      tag: "old",
    });
    const tagged2 = notesReducer(tagged1, {
      type: "ADD_TAG",
      noteId: secondId,
      tag: "old",
    });
    const renamed = notesReducer(tagged2, {
      type: "RENAME_TAG",
      oldTag: "old",
      newTag: "new",
    });
    expect(renamed.notes[noteId]?.tags).toEqual(["new"]);
    expect(renamed.notes[secondId]?.tags).toEqual(["new"]);
  });

  it("deletes a tag from every note that has it", () => {
    const { state, noteId } = withNote();
    const tagged = notesReducer(state, {
      type: "ADD_TAG",
      noteId,
      tag: "temp",
    });
    const deleted = notesReducer(tagged, { type: "DELETE_TAG", tag: "temp" });
    expect(deleted.notes[noteId]?.tags).toEqual([]);
  });

  it("resets a 'tag' active view to 'all' when that tag is deleted", () => {
    const { state, noteId } = withNote();
    const tagged = notesReducer(state, {
      type: "ADD_TAG",
      noteId,
      tag: "temp",
    });
    const viewed = notesReducer(tagged, {
      type: "SET_ACTIVE_VIEW",
      view: { type: "tag", tag: "temp" },
    });
    const deleted = notesReducer(viewed, { type: "DELETE_TAG", tag: "temp" });
    expect(deleted.activeView).toEqual({ type: "all" });
  });
});

describe("notesReducer — templates", () => {
  it("adds and deletes a template", () => {
    const added = notesReducer(createEmptyState(), {
      type: "ADD_TEMPLATE",
      name: "Weekly review",
      content: "# Weekly review",
    });
    expect(added.templates).toHaveLength(1);
    const templateId = added.templates[0]!.id;
    const deleted = notesReducer(added, {
      type: "DELETE_TEMPLATE",
      templateId,
    });
    expect(deleted.templates).toHaveLength(0);
  });
});

describe("notesReducer — bulk state operations", () => {
  it("REPLACE_STATE swaps in a whole new state", () => {
    const replacement = createEmptyState();
    const result = notesReducer(createEmptyState(), {
      type: "REPLACE_STATE",
      state: replacement,
    });
    expect(result).toBe(replacement);
  });

  it("CLEAR_ALL resets to a fresh empty state", () => {
    const { state } = withNote();
    const cleared = notesReducer(state, { type: "CLEAR_ALL" });
    expect(cleared.notes).toEqual({});
    expect(cleared.notebooks).toHaveLength(1);
  });

  it("SET_ACTIVE_VIEW and SET_ACTIVE_NOTE update selection", () => {
    const { state, noteId } = withNote();
    const viewed = notesReducer(state, {
      type: "SET_ACTIVE_VIEW",
      view: { type: "favorites" },
    });
    expect(viewed.activeView).toEqual({ type: "favorites" });
    const deselected = notesReducer(viewed, {
      type: "SET_ACTIVE_NOTE",
      noteId: null,
    });
    expect(deselected.activeNoteId).toBeNull();
    expect(deselected.notes[noteId]).toBeDefined();
  });
});

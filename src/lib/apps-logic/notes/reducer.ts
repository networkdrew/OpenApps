import {
  createEmptyState,
  createFolder,
  createNote,
  createNotebook,
  createTemplate,
  type ActiveView,
  type Note,
  type NotesState,
} from "./model";
import { descendantFolderIds } from "./filter";

export type NotesAction =
  | { type: "ADD_NOTEBOOK"; name: string }
  | { type: "RENAME_NOTEBOOK"; notebookId: string; name: string }
  | { type: "DELETE_NOTEBOOK"; notebookId: string }
  | {
      type: "ADD_FOLDER";
      notebookId: string;
      parentFolderId: string | null;
      name: string;
    }
  | { type: "RENAME_FOLDER"; folderId: string; name: string }
  | { type: "DELETE_FOLDER"; folderId: string }
  | { type: "SET_ACTIVE_VIEW"; view: ActiveView }
  | { type: "SET_ACTIVE_NOTE"; noteId: string | null }
  | {
      type: "ADD_NOTE";
      notebookId: string;
      folderId: string | null;
      title: string;
      content?: string;
    }
  | {
      type: "UPDATE_NOTE";
      noteId: string;
      patch: Partial<Pick<Note, "title" | "content" | "tags">>;
    }
  | {
      type: "MOVE_NOTE";
      noteId: string;
      notebookId: string;
      folderId: string | null;
    }
  | { type: "TOGGLE_FAVORITE"; noteId: string }
  | { type: "TOGGLE_PINNED"; noteId: string }
  | { type: "ARCHIVE_NOTE"; noteId: string }
  | { type: "UNARCHIVE_NOTE"; noteId: string }
  | { type: "TRASH_NOTE"; noteId: string }
  | { type: "RESTORE_NOTE"; noteId: string }
  | { type: "DELETE_NOTE_FOREVER"; noteId: string }
  | { type: "EMPTY_TRASH" }
  | { type: "ADD_TAG"; noteId: string; tag: string }
  | { type: "REMOVE_TAG"; noteId: string; tag: string }
  | { type: "RENAME_TAG"; oldTag: string; newTag: string }
  | { type: "DELETE_TAG"; tag: string }
  | { type: "ADD_TEMPLATE"; name: string; content: string }
  | { type: "DELETE_TEMPLATE"; templateId: string }
  | { type: "REPLACE_STATE"; state: NotesState }
  | { type: "CLEAR_ALL" };

function nowIso(): string {
  return new Date().toISOString();
}

function updateNote(
  state: NotesState,
  noteId: string,
  fn: (note: Note) => Note,
): NotesState {
  const note = state.notes[noteId];
  if (!note) return state;
  return { ...state, notes: { ...state.notes, [noteId]: fn(note) } };
}

function viewReferencesNotebook(view: ActiveView, notebookId: string): boolean {
  return view.type === "notebook" && view.notebookId === notebookId;
}

function viewReferencesFolder(
  view: ActiveView,
  folderIds: Set<string>,
): boolean {
  return view.type === "folder" && folderIds.has(view.folderId);
}

function addTagToList(tags: string[], tag: string): string[] {
  const trimmed = tag.trim();
  if (!trimmed) return tags;
  if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return tags;
  return [...tags, trimmed];
}

export function notesReducer(
  state: NotesState,
  action: NotesAction,
): NotesState {
  switch (action.type) {
    case "ADD_NOTEBOOK": {
      const notebook = createNotebook(action.name);
      return { ...state, notebooks: [...state.notebooks, notebook] };
    }

    case "RENAME_NOTEBOOK":
      return {
        ...state,
        notebooks: state.notebooks.map((nb) =>
          nb.id === action.notebookId
            ? { ...nb, name: action.name, updatedAt: nowIso() }
            : nb,
        ),
      };

    case "DELETE_NOTEBOOK": {
      if (state.notebooks.length <= 1) return state;
      const remaining = state.notebooks.filter(
        (nb) => nb.id !== action.notebookId,
      );
      const removedFolderIds = new Set(
        state.folders
          .filter((f) => f.notebookId === action.notebookId)
          .map((f) => f.id),
      );
      const folders = state.folders.filter(
        (f) => f.notebookId !== action.notebookId,
      );
      const notes = Object.fromEntries(
        Object.entries(state.notes).map(([id, note]) => [
          id,
          note.notebookId === action.notebookId
            ? { ...note, trashed: true, trashedAt: nowIso() }
            : note,
        ]),
      );
      const activeView =
        viewReferencesNotebook(state.activeView, action.notebookId) ||
        viewReferencesFolder(state.activeView, removedFolderIds)
          ? ({ type: "all" } as const)
          : state.activeView;
      return {
        ...state,
        notebooks: remaining,
        folders,
        notes,
        activeView,
      };
    }

    case "ADD_FOLDER": {
      const folder = createFolder(
        action.notebookId,
        action.parentFolderId,
        action.name,
      );
      return { ...state, folders: [...state.folders, folder] };
    }

    case "RENAME_FOLDER":
      return {
        ...state,
        folders: state.folders.map((f) =>
          f.id === action.folderId ? { ...f, name: action.name } : f,
        ),
      };

    case "DELETE_FOLDER": {
      const toRemove = new Set([
        action.folderId,
        ...descendantFolderIds(state.folders, action.folderId),
      ]);
      const folders = state.folders.filter((f) => !toRemove.has(f.id));
      const notes = Object.fromEntries(
        Object.entries(state.notes).map(([id, note]) => [
          id,
          note.folderId && toRemove.has(note.folderId)
            ? { ...note, folderId: null }
            : note,
        ]),
      );
      const activeView = viewReferencesFolder(state.activeView, toRemove)
        ? ({ type: "all" } as const)
        : state.activeView;
      return { ...state, folders, notes, activeView };
    }

    case "SET_ACTIVE_VIEW":
      return { ...state, activeView: action.view };

    case "SET_ACTIVE_NOTE":
      return { ...state, activeNoteId: action.noteId };

    case "ADD_NOTE": {
      const note = createNote(
        action.notebookId,
        action.folderId,
        action.title,
        action.content ?? "",
      );
      return {
        ...state,
        notes: { ...state.notes, [note.id]: note },
        activeNoteId: note.id,
      };
    }

    case "UPDATE_NOTE":
      return updateNote(state, action.noteId, (note) => ({
        ...note,
        ...action.patch,
        updatedAt: nowIso(),
      }));

    case "MOVE_NOTE":
      return updateNote(state, action.noteId, (note) => ({
        ...note,
        notebookId: action.notebookId,
        folderId: action.folderId,
        updatedAt: nowIso(),
      }));

    case "TOGGLE_FAVORITE":
      return updateNote(state, action.noteId, (note) => ({
        ...note,
        favorite: !note.favorite,
      }));

    case "TOGGLE_PINNED":
      return updateNote(state, action.noteId, (note) => ({
        ...note,
        pinned: !note.pinned,
      }));

    case "ARCHIVE_NOTE":
      return updateNote(state, action.noteId, (note) => ({
        ...note,
        archived: true,
      }));

    case "UNARCHIVE_NOTE":
      return updateNote(state, action.noteId, (note) => ({
        ...note,
        archived: false,
      }));

    case "TRASH_NOTE":
      return updateNote(state, action.noteId, (note) => ({
        ...note,
        trashed: true,
        trashedAt: nowIso(),
      }));

    case "RESTORE_NOTE": {
      const note = state.notes[action.noteId];
      if (!note) return state;
      const notebookStillExists = state.notebooks.some(
        (nb) => nb.id === note.notebookId,
      );
      const fallbackNotebookId = state.notebooks[0]?.id ?? note.notebookId;
      return updateNote(state, action.noteId, (n) => ({
        ...n,
        trashed: false,
        trashedAt: null,
        notebookId: notebookStillExists ? n.notebookId : fallbackNotebookId,
        folderId: notebookStillExists ? n.folderId : null,
      }));
    }

    case "DELETE_NOTE_FOREVER": {
      if (!state.notes[action.noteId]) return state;
      const notes = { ...state.notes };
      delete notes[action.noteId];
      const activeNoteId =
        state.activeNoteId === action.noteId ? null : state.activeNoteId;
      return { ...state, notes, activeNoteId };
    }

    case "EMPTY_TRASH": {
      const notes = Object.fromEntries(
        Object.entries(state.notes).filter(([, note]) => !note.trashed),
      );
      const activeNoteId =
        state.activeNoteId && !notes[state.activeNoteId]
          ? null
          : state.activeNoteId;
      return { ...state, notes, activeNoteId };
    }

    case "ADD_TAG":
      return updateNote(state, action.noteId, (note) => ({
        ...note,
        tags: addTagToList(note.tags, action.tag),
      }));

    case "REMOVE_TAG":
      return updateNote(state, action.noteId, (note) => ({
        ...note,
        tags: note.tags.filter(
          (t) => t.toLowerCase() !== action.tag.trim().toLowerCase(),
        ),
      }));

    case "RENAME_TAG": {
      const oldKey = action.oldTag.trim().toLowerCase();
      const newTag = action.newTag.trim();
      if (!oldKey || !newTag) return state;
      const notes = Object.fromEntries(
        Object.entries(state.notes).map(([id, note]) => {
          if (!note.tags.some((t) => t.toLowerCase() === oldKey)) {
            return [id, note];
          }
          const withoutOld = note.tags.filter(
            (t) => t.toLowerCase() !== oldKey,
          );
          return [id, { ...note, tags: addTagToList(withoutOld, newTag) }];
        }),
      );
      const activeView =
        state.activeView.type === "tag" &&
        state.activeView.tag.toLowerCase() === oldKey
          ? ({ type: "tag", tag: newTag } as const)
          : state.activeView;
      return { ...state, notes, activeView };
    }

    case "DELETE_TAG": {
      const key = action.tag.trim().toLowerCase();
      const notes = Object.fromEntries(
        Object.entries(state.notes).map(([id, note]) => [
          id,
          { ...note, tags: note.tags.filter((t) => t.toLowerCase() !== key) },
        ]),
      );
      const activeView =
        state.activeView.type === "tag" &&
        state.activeView.tag.toLowerCase() === key
          ? ({ type: "all" } as const)
          : state.activeView;
      return { ...state, notes, activeView };
    }

    case "ADD_TEMPLATE": {
      const template = createTemplate(action.name, action.content);
      return { ...state, templates: [...state.templates, template] };
    }

    case "DELETE_TEMPLATE":
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.templateId),
      };

    case "REPLACE_STATE":
      return action.state;

    case "CLEAR_ALL":
      return createEmptyState();

    default:
      return state;
  }
}

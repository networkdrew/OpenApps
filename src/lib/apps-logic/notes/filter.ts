import type { ActiveView, Note, NoteFolder } from "./model";

/** All notes visible for a given sidebar view — the single place "what counts as in the trash / archive / a given tag" is decided. */
export function notesForView(notes: Note[], view: ActiveView): Note[] {
  switch (view.type) {
    case "all":
      return notes.filter((n) => !n.trashed && !n.archived);
    case "notebook":
      return notes.filter(
        (n) => !n.trashed && !n.archived && n.notebookId === view.notebookId,
      );
    case "folder":
      return notes.filter(
        (n) => !n.trashed && !n.archived && n.folderId === view.folderId,
      );
    case "tag": {
      const key = view.tag.toLowerCase();
      return notes.filter(
        (n) =>
          !n.trashed &&
          !n.archived &&
          n.tags.some((t) => t.toLowerCase() === key),
      );
    }
    case "favorites":
      return notes.filter((n) => !n.trashed && n.favorite);
    case "archive":
      return notes.filter((n) => n.archived && !n.trashed);
    case "trash":
      return notes.filter((n) => n.trashed);
  }
}

/** Every distinct tag across non-trashed notes, case-insensitively deduped (first-seen casing wins), sorted alphabetically. */
export function allTags(notes: Note[]): string[] {
  const seen = new Map<string, string>();
  for (const note of notes) {
    if (note.trashed) continue;
    for (const tag of note.tags) {
      const key = tag.toLowerCase();
      if (!seen.has(key)) seen.set(key, tag);
    }
  }
  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function foldersForNotebook(
  folders: NoteFolder[],
  notebookId: string,
): NoteFolder[] {
  return folders.filter((f) => f.notebookId === notebookId);
}

export function childFolders(
  folders: NoteFolder[],
  notebookId: string,
  parentFolderId: string | null,
): NoteFolder[] {
  return folders.filter(
    (f) => f.notebookId === notebookId && f.parentFolderId === parentFolderId,
  );
}

/** Every folder id nested (at any depth) under `folderId`, not including `folderId` itself. */
export function descendantFolderIds(
  folders: NoteFolder[],
  folderId: string,
): string[] {
  const result: string[] = [];
  const stack = [folderId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) continue;
    for (const folder of folders) {
      if (folder.parentFolderId === current) {
        result.push(folder.id);
        stack.push(folder.id);
      }
    }
  }
  return result;
}

export function notebookNoteCount(notes: Note[], notebookId: string): number {
  return notes.filter(
    (n) => !n.trashed && !n.archived && n.notebookId === notebookId,
  ).length;
}

export function folderNoteCount(notes: Note[], folderId: string): number {
  return notes.filter(
    (n) => !n.trashed && !n.archived && n.folderId === folderId,
  ).length;
}

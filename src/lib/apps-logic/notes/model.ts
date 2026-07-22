export interface Notebook {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteFolder {
  id: string;
  notebookId: string;
  parentFolderId: string | null;
  name: string;
  createdAt: string;
}

export interface Note {
  id: string;
  notebookId: string;
  folderId: string | null;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  trashed: boolean;
  /** ISO timestamp of when the note was moved to trash, or null if not trashed. */
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export type ActiveView =
  | { type: "all" }
  | { type: "notebook"; notebookId: string }
  | { type: "folder"; folderId: string }
  | { type: "tag"; tag: string }
  | { type: "favorites" }
  | { type: "archive" }
  | { type: "trash" };

export interface NotesState {
  version: 1;
  notebooks: Notebook[];
  folders: NoteFolder[];
  notes: Record<string, Note>;
  templates: NoteTemplate[];
  activeView: ActiveView;
  activeNoteId: string | null;
}

/** Built-in starter templates always offered from "New from template", independent of user-saved templates. */
export const BUILT_IN_TEMPLATES: readonly Omit<
  NoteTemplate,
  "id" | "createdAt"
>[] = [
  {
    name: "Meeting notes",
    content:
      "# Meeting notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n\n- \n\n## Notes\n\n\n\n## Action items\n\n- [ ] \n",
  },
  {
    name: "Daily journal",
    content:
      "# Journal\n\n**Date:** \n\n## Today\n\n\n\n## Grateful for\n\n- \n",
  },
  {
    name: "To-do list",
    content: "# To-do\n\n- [ ] \n- [ ] \n- [ ] \n",
  },
  {
    name: "Project brief",
    content:
      "# Project brief\n\n## Goal\n\n\n\n## Scope\n\n\n\n## Open questions\n\n- \n",
  },
  {
    name: "Reading notes",
    content:
      "# Reading notes\n\n**Title:** \n**Author:** \n\n## Key ideas\n\n- \n\n## Quotes\n\n> \n",
  },
];

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createNotebook(name: string): Notebook {
  const ts = nowIso();
  return { id: newId(), name, createdAt: ts, updatedAt: ts };
}

export function createFolder(
  notebookId: string,
  parentFolderId: string | null,
  name: string,
): NoteFolder {
  return {
    id: newId(),
    notebookId,
    parentFolderId,
    name,
    createdAt: nowIso(),
  };
}

export function createNote(
  notebookId: string,
  folderId: string | null,
  title: string,
  content = "",
): Note {
  const ts = nowIso();
  return {
    id: newId(),
    notebookId,
    folderId,
    title,
    content,
    tags: [],
    favorite: false,
    pinned: false,
    archived: false,
    trashed: false,
    trashedAt: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function createTemplate(name: string, content: string): NoteTemplate {
  return { id: newId(), name, content, createdAt: nowIso() };
}

const DEFAULT_NOTEBOOK_NAME = "My Notebook";

export function createEmptyState(): NotesState {
  const notebook = createNotebook(DEFAULT_NOTEBOOK_NAME);
  return {
    version: 1,
    notebooks: [notebook],
    folders: [],
    notes: {},
    templates: [],
    activeView: { type: "all" },
    activeNoteId: null,
  };
}

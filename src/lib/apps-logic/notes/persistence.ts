import {
  loadLocalStore,
  saveLocalStore,
  clearLocalStore,
  type SaveResult,
} from "@/lib/storage/localStore";
import { downloadJson, readJsonFile } from "@/lib/storage/jsonTransfer";
import { createEmptyState, type Note, type NotesState } from "./model";
import { notesStateSchemaV1 } from "./schema";

function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function slugifyFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "untitled-note";
}

export const STORAGE_KEY = "openapps:notes:state";
export const SCHEMA_VERSION = 1;

export function loadNotesState(): NotesState {
  return loadLocalStore<NotesState>({
    key: STORAGE_KEY,
    version: SCHEMA_VERSION,
    fallback: createEmptyState(),
    // No prior schema versions exist yet — a future v2 migration would read
    // `stored.data` here and return valid v2 `NotesState`.
  });
}

export function saveNotesState(state: NotesState): SaveResult {
  return saveLocalStore(
    { key: STORAGE_KEY, version: SCHEMA_VERSION, fallback: state },
    state,
  );
}

export function clearNotesState(): void {
  clearLocalStore(STORAGE_KEY);
}

export function exportNotesState(state: NotesState): void {
  const date = new Date().toISOString().slice(0, 10);
  downloadJson(`opennotes-export-${date}.json`, state);
}

/** Downloads a single note as a standalone `.md` file — its title as an H1 heading followed by its raw content. */
export function exportNoteAsMarkdown(note: Note): void {
  const heading = note.title.trim() || "Untitled note";
  const body = `# ${heading}\n\n${note.content}`;
  downloadMarkdown(`${slugifyFilename(heading)}.md`, body);
}

/** Downloads every given (non-trashed) note as one combined `.md` file, separated by `---` rules with each note's title as a heading. */
export function exportAllNotesAsMarkdown(notes: Note[]): void {
  const date = new Date().toISOString().slice(0, 10);
  const body = notes
    .map(
      (note) => `# ${note.title.trim() || "Untitled note"}\n\n${note.content}`,
    )
    .join("\n\n---\n\n");
  downloadMarkdown(`opennotes-export-${date}.md`, body);
}

export type ImportResult =
  { ok: true; state: NotesState } | { ok: false; message: string };

export async function importNotesState(file: File): Promise<ImportResult> {
  const read = await readJsonFile(file);
  if (!read.ok) return { ok: false, message: read.message };

  const parsed = notesStateSchemaV1.safeParse(read.data);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        "That file doesn't look like an OpenNotes export — check it's the right file and try again.",
    };
  }
  return { ok: true, state: parsed.data };
}

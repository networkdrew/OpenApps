import type { Note } from "./model";

export type SortOption = "updated-desc" | "created-desc" | "title-asc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "updated-desc", label: "Last updated" },
  { value: "created-desc", label: "Date created" },
  { value: "title-asc", label: "Title A–Z" },
];

function comparatorFor(sort: SortOption): (a: Note, b: Note) => number {
  switch (sort) {
    case "updated-desc":
      return (a, b) => b.updatedAt.localeCompare(a.updatedAt);
    case "created-desc":
      return (a, b) => b.createdAt.localeCompare(a.createdAt);
    case "title-asc":
      return (a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) ||
        a.createdAt.localeCompare(b.createdAt);
  }
}

/** Sorts notes by the given option, always floating pinned notes to the top. */
export function sortNotes(notes: Note[], sort: SortOption): Note[] {
  const cmp = comparatorFor(sort);
  const pinned = notes.filter((n) => n.pinned).sort(cmp);
  const rest = notes.filter((n) => !n.pinned).sort(cmp);
  return [...pinned, ...rest];
}

export interface NoteSearchResult {
  note: Note;
  score: number;
  /** A short excerpt of the content around the first match, or undefined if the match was only in the title/tags. */
  snippet?: string;
}

const SNIPPET_RADIUS = 40;

function extractSnippet(
  content: string,
  index: number,
  matchLength: number,
): string {
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(content.length, index + matchLength + SNIPPET_RADIUS);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < content.length ? "…" : "";
  return (
    prefix + content.slice(start, end).replace(/\s+/g, " ").trim() + suffix
  );
}

/**
 * Simple, dependency-free full-text search across note titles, content, and
 * tags. Case-insensitive substring matching with title/tag matches weighted
 * above content matches — deliberately not fuzzy, since exact substring
 * recall matters more than typo tolerance for searching your own notes.
 */
export function searchNotes(notes: Note[], query: string): NoteSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: NoteSearchResult[] = [];
  for (const note of notes) {
    if (note.trashed) continue;

    const title = note.title.toLowerCase();
    const content = note.content.toLowerCase();
    const tags = note.tags.map((t) => t.toLowerCase());

    let score = 0;
    if (title === q) score += 100;
    else if (title.includes(q)) score += 50;

    if (tags.some((t) => t === q)) score += 40;
    else if (tags.some((t) => t.includes(q))) score += 20;

    const contentIndex = content.indexOf(q);
    if (contentIndex !== -1) score += 10;

    if (score === 0) continue;

    const snippet =
      contentIndex !== -1
        ? extractSnippet(note.content, contentIndex, q.length)
        : undefined;

    results.push({ note, score, snippet });
  }

  return results.sort(
    (a, b) =>
      b.score - a.score || b.note.updatedAt.localeCompare(a.note.updatedAt),
  );
}

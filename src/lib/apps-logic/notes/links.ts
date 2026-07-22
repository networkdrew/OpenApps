import type { Note } from "./model";

/** Matches [[Target]] or [[Target|Display text]]. Not global-flag-shared — callers create their own via `WIKI_LINK_PATTERN()` to avoid lastIndex bugs from a shared regex instance. */
export function WIKI_LINK_PATTERN(): RegExp {
  return /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
}

export interface WikiLinkMatch {
  /** The raw matched text, e.g. "[[Recipe|my recipe]]". */
  raw: string;
  /** The note title being linked to. */
  target: string;
  /** The text to display — the alias if given, otherwise the target. */
  display: string;
  index: number;
}

/** Splits a `[[Target]]` or `[[Target|Alias]]` inner string into its target/display parts. */
export function parseWikiLinkInner(
  inner: string,
  alias?: string,
): { target: string; display: string } {
  const target = inner.trim();
  const display = alias?.trim() || target;
  return { target, display };
}

/** Extracts every wiki link in a note's raw markdown content, in order of appearance. */
export function extractWikiLinks(content: string): WikiLinkMatch[] {
  const matches: WikiLinkMatch[] = [];
  const pattern = WIKI_LINK_PATTERN();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content))) {
    const [raw, inner, alias] = match;
    if (!inner) continue;
    const { target, display } = parseWikiLinkInner(inner, alias);
    if (!target) continue;
    matches.push({ raw: raw ?? "", target, display, index: match.index });
  }
  return matches;
}

function titleKey(title: string): string {
  return title.trim().toLowerCase();
}

/** Finds a non-trashed note whose title exactly matches (case-insensitively) the given wiki-link target. */
export function findNoteByTitle(
  notes: readonly Note[],
  title: string,
): Note | undefined {
  const key = titleKey(title);
  if (!key) return undefined;
  return notes.find((n) => !n.trashed && titleKey(n.title) === key);
}

/** Every non-trashed note (other than `target` itself) that contains a wiki link resolving to `target`'s title. */
export function computeBacklinks(notes: readonly Note[], target: Note): Note[] {
  const key = titleKey(target.title);
  if (!key) return [];
  return notes.filter((note) => {
    if (note.id === target.id || note.trashed) return false;
    return extractWikiLinks(note.content).some(
      (link) => titleKey(link.target) === key,
    );
  });
}

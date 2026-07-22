const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Normalizes text for matching: lowercases, strips diacritics and
 * punctuation, and collapses whitespace. Used on both the search query and
 * (implicitly, via Fuse's case-insensitive matching) the registry text, so
 * "Kanban-Board!", "kanban board", and "  KANBAN   BOARD " all compare
 * equal for search purposes.
 */
export function normalizeText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(DIACRITICS_RE, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Common low-signal words excluded from word-coverage scoring so they don't dilute intent matches. */
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "for",
  "of",
  "to",
  "in",
  "on",
  "with",
  "without",
  "and",
  "or",
  "is",
  "are",
  "that",
  "this",
  "my",
  "i",
  "me",
  "need",
  "want",
  "app",
  "apps",
]);

export function significantWords(normalizedQuery: string): string[] {
  return normalizedQuery
    .split(" ")
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

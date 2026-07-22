import Fuse, { type IFuseOptions, type FuseResultMatch } from "fuse.js";
import { apps } from "./registry";
import { getCategory } from "./categories";
import { normalizeText, significantWords } from "./normalize";
import type { AppMeta } from "./schema";

/**
 * The generated search index. This is derived entirely from the registry
 * (`apps`) at module-load time — there is no separate hand-maintained
 * search list to fall out of sync. See docs/search-and-discovery.md.
 */
interface SearchableApp {
  app: AppMeta;
  name: string;
  aliases: string[];
  alternateNames: string[];
  misspellings: string[];
  tasksPerformed: string[];
  problemsSolved: string[];
  descriptivePhrases: string[];
  useCases: string[];
  replacesProducts: string[];
  replacesCategories: string[];
  tags: string[];
  features: string[];
  searchKeywords: string[];
  audiences: string[];
  subcategories: string[];
  categoryName: string;
  shortDescription: string;
  description: string;
}

function toSearchable(app: AppMeta): SearchableApp {
  return {
    app,
    name: app.name,
    aliases: app.aliases,
    alternateNames: app.alternateNames,
    misspellings: app.misspellings,
    tasksPerformed: app.tasksPerformed,
    problemsSolved: app.problemsSolved,
    descriptivePhrases: app.descriptivePhrases,
    useCases: app.useCases,
    replacesProducts: app.replacesProducts,
    replacesCategories: app.replacesCategories,
    tags: app.tags,
    features: app.features,
    searchKeywords: app.searchKeywords,
    audiences: app.audiences,
    subcategories: app.subcategories,
    categoryName: getCategory(app.categoryId)?.name ?? "",
    shortDescription: app.shortDescription,
    description: app.description.join(" "),
  };
}

const searchableApps: SearchableApp[] = apps.map(toSearchable);

/**
 * Field weights: exact-name and alternate-name matches rank highest, then
 * the "intent" fields (what it does / what problem it solves / how people
 * describe it) that make natural-language queries work, then keywords, then
 * looser prose fields last.
 */
const fuseOptions: IFuseOptions<SearchableApp> = {
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  threshold: 0.4,
  distance: 200,
  minMatchCharLength: 2,
  keys: [
    { name: "name", weight: 6 },
    { name: "aliases", weight: 5 },
    { name: "alternateNames", weight: 4.5 },
    { name: "misspellings", weight: 4.5 },
    { name: "tasksPerformed", weight: 4 },
    { name: "problemsSolved", weight: 4 },
    { name: "descriptivePhrases", weight: 4 },
    { name: "useCases", weight: 3 },
    { name: "replacesProducts", weight: 3 },
    { name: "replacesCategories", weight: 2.5 },
    { name: "tags", weight: 2.5 },
    { name: "features", weight: 2 },
    { name: "searchKeywords", weight: 2 },
    { name: "audiences", weight: 1.5 },
    { name: "subcategories", weight: 1.5 },
    { name: "categoryName", weight: 1.2 },
    { name: "shortDescription", weight: 1 },
    { name: "description", weight: 0.6 },
  ],
};

let fuse: Fuse<SearchableApp> | undefined;

function getFuse(): Fuse<SearchableApp> {
  fuse ??= new Fuse(searchableApps, fuseOptions);
  return fuse;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  aliases: "Also known as",
  alternateNames: "Also known as",
  misspellings: "Close to what you typed",
  tasksPerformed: "Does this",
  problemsSolved: "Solves this",
  descriptivePhrases: "Matches your search",
  useCases: "Common use case",
  replacesProducts: "Free alternative to",
  replacesCategories: "Replaces",
  tags: "Tagged",
  features: "Feature",
  searchKeywords: "Related term",
  audiences: "Made for",
  subcategories: "Subcategory",
  categoryName: "Category",
  shortDescription: "Description",
  description: "Description",
};

/** Field match quality, used only to pick which reasons to surface first. */
const FIELD_RANK: Record<string, number> = {
  name: 0,
  aliases: 1,
  alternateNames: 1,
  misspellings: 1,
  tasksPerformed: 2,
  problemsSolved: 2,
  descriptivePhrases: 2,
  useCases: 3,
  replacesProducts: 3,
  replacesCategories: 3,
  tags: 4,
  features: 4,
  searchKeywords: 4,
  audiences: 5,
  subcategories: 5,
  categoryName: 5,
  shortDescription: 6,
  description: 6,
};

export interface MatchReason {
  label: string;
  value: string;
}

export interface SearchResult {
  app: AppMeta;
  /** Higher is better; not meaningful outside this module, just for sorting/testing relative order. */
  score: number;
  reasons: MatchReason[];
}

function reasonsFromMatches(
  matches: readonly FuseResultMatch[],
): MatchReason[] {
  const byField = new Map<string, MatchReason>();
  for (const match of matches) {
    const key = match.key;
    if (!key) continue;
    const value = match.value;
    if (!value) continue;
    if (!byField.has(key)) {
      byField.set(key, { label: FIELD_LABELS[key] ?? key, value });
    }
  }
  return [...byField.entries()]
    .sort(([a], [b]) => (FIELD_RANK[a] ?? 9) - (FIELD_RANK[b] ?? 9))
    .slice(0, 3)
    .map(([, reason]) => reason);
}

/** Bonus for how many distinct significant query words appear anywhere in an app's searchable text — rewards reworded, multi-word intent queries even when no single field is a close fuzzy match. */
function wordCoverageBonus(item: SearchableApp, words: string[]): number {
  if (words.length === 0) return 0;
  const haystack = normalizeText(
    [
      item.name,
      ...item.aliases,
      ...item.alternateNames,
      ...item.tasksPerformed,
      ...item.problemsSolved,
      ...item.descriptivePhrases,
      ...item.useCases,
      ...item.replacesProducts,
      ...item.replacesCategories,
      ...item.tags,
      ...item.features,
      ...item.searchKeywords,
      ...item.audiences,
      item.shortDescription,
      item.description,
    ].join(" "),
  );
  const hits = words.filter((w) => haystack.includes(w)).length;
  return (hits / words.length) * 0.5;
}

/**
 * Searches every app by name, aliases, alternate names, misspellings,
 * features, tasks, problems solved, descriptive phrases, use cases,
 * replaced products/categories, tags, audiences, and description —
 * normalizing capitalization/punctuation/spacing, tolerating minor typos,
 * and ranking exact name/alias matches above incidental description
 * matches. Returns results with human-readable "why this matched" reasons.
 */
export function searchApps(query: string, limit = 20): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return apps.map((app) => ({ app, score: 1, reasons: [] }));
  }

  const normalizedQuery = normalizeText(trimmed);
  const words = significantWords(normalizedQuery);

  // Exact (normalized) name/alias match always wins outright.
  const exact = searchableApps.find(
    (item) =>
      normalizeText(item.name) === normalizedQuery ||
      item.aliases.some((a) => normalizeText(a) === normalizedQuery) ||
      item.alternateNames.some((a) => normalizeText(a) === normalizedQuery),
  );

  const fuseResults = getFuse().search(trimmed, { limit: limit + 5 });

  const scored = new Map<string, SearchResult>();

  for (const result of fuseResults) {
    const fuseScore = result.score ?? 1;
    const coverage = wordCoverageBonus(result.item, words);
    const score = 1 - fuseScore + coverage;
    scored.set(result.item.app.id, {
      app: result.item.app,
      score,
      reasons: reasonsFromMatches(result.matches ?? []),
    });
  }

  // Word-coverage-only fallback: catches reworded multi-word queries where
  // no single field is fuzzy-close enough for Fuse's threshold, but most of
  // the query's meaningful words still appear across the app's metadata.
  if (words.length >= 2) {
    for (const item of searchableApps) {
      if (scored.has(item.app.id)) continue;
      const coverage = wordCoverageBonus(item, words);
      const matchedWordFraction =
        words.filter((w) =>
          normalizeText(
            [
              item.tasksPerformed.join(" "),
              item.problemsSolved.join(" "),
              item.descriptivePhrases.join(" "),
              item.useCases.join(" "),
            ].join(" "),
          ).includes(w),
        ).length / words.length;
      if (matchedWordFraction >= 0.6) {
        scored.set(item.app.id, {
          app: item.app,
          score: coverage,
          reasons: reasonsFromMatches(
            words.length
              ? [
                  {
                    key: "descriptivePhrases",
                    value:
                      item.descriptivePhrases[0] ??
                      item.tasksPerformed[0] ??
                      "",
                    indices: [[0, 0]],
                  },
                ]
              : [],
          ),
        });
      }
    }
  }

  let results = [...scored.values()].sort((a, b) => b.score - a.score);

  if (exact) {
    results = [
      {
        app: exact.app,
        score: Number.POSITIVE_INFINITY,
        reasons: [{ label: "Name", value: exact.name }],
      },
      ...results.filter((r) => r.app.id !== exact.app.id),
    ];
  }

  return results.slice(0, limit);
}

export interface Suggestions {
  message: string;
  apps: AppMeta[];
}

/**
 * Called when a search returns nothing. Widens the fuzzy threshold once; if
 * that still finds nothing, falls back to featured apps so the user always
 * has somewhere useful to go instead of a dead end.
 */
export function getSuggestions(query: string): Suggestions {
  const trimmed = query.trim();
  const relaxedFuse = new Fuse(searchableApps, {
    ...fuseOptions,
    threshold: 0.65,
    distance: 400,
  });
  const relaxed = trimmed ? relaxedFuse.search(trimmed, { limit: 5 }) : [];

  if (relaxed.length > 0) {
    return {
      message: `No exact match for "${trimmed}" — here's the closest we found:`,
      apps: relaxed.map((r) => r.item.app),
    };
  }

  const featured = apps.filter((a) => a.featured);
  return {
    message: trimmed
      ? `Nothing matched "${trimmed}" yet. Try a shorter or more general term, or browse featured apps:`
      : "Browse featured apps:",
    apps: featured.length > 0 ? featured : apps.slice(0, 5),
  };
}

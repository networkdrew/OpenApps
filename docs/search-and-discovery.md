# Search and discovery

Search is a foundational requirement of this project, not a feature bolted on later. An app that exists but can't be found by what it does is, for practical purposes, not part of the site. Read this before adding any app — see `docs/adding-an-app.md` for the step-by-step process; this document explains the _why_ and the metadata contract behind it.

## The registry is the only source of truth

`src/lib/apps/registry.ts` holds every app's metadata as an object validated against `appMetaSchema` in `src/lib/apps/schema.ts`. `src/lib/apps/search.ts` builds its search index **from that registry** at module load — there is no separate, hand-maintained search list to fall out of sync. If an app is hard to find, the fix is almost always "add more/better metadata to its registry entry," not "special-case the search code."

## Every field, and what it's for

| Field                             | Purpose                                                                                        | Example                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `id`                              | Permanent internal id. Never reuse or repurpose.                                               | `kanban-board`                                |
| `slug`                            | URL path segment under `/apps/`. Usually equals `id`.                                          | `kanban-board`                                |
| `componentId`                     | Optional override for the `AppIslandLoader` map key, if it must diverge from `id`.             | —                                             |
| `name`                            | The app's actual name. Highest search weight.                                                  | `Kanban Board`                                |
| `shortDescription`                | ≤160 chars, used as meta description and on cards.                                             | —                                             |
| `description`                     | Paragraphs shown on the app's page.                                                            | —                                             |
| `categoryId`                      | Must reference an entry in `categories.ts`.                                                    | `productivity`                                |
| `subcategories`                   | Free-text sub-groupings within the category.                                                   | `["task management"]`                         |
| `appType`                         | Orthogonal axis to category: `workspace` \| `utility` \| `generator` \| `game` \| `reference`. | `workspace`                                   |
| `tags`                            | Short keyword labels, shown on the app page and used in search/filtering.                      | `["kanban", "board"]`                         |
| `aliases`                         | Other names people call the _concept_.                                                         | `["task board", "sprint board"]`              |
| `alternateNames`                  | Plausible alternate product-style names.                                                       | `["Local Kanban"]`                            |
| `misspellings`                    | Real, likely typos worth matching — don't pad this.                                            | `["kanbam board"]`                            |
| `features`                        | Concrete capabilities.                                                                         | `["drag-and-drop cards"]`                     |
| `tasksPerformed`                  | Verb-phrased tasks, in the user's words.                                                       | `["organize work into columns"]`              |
| `problemsSolved`                  | Pain points the app addresses.                                                                 | `["losing track of what stage a task is in"]` |
| `descriptivePhrases`              | Natural-language search bait — phrases someone might literally type.                           | `["free Trello alternative"]`                 |
| `audiences`                       | Who it's for.                                                                                  | `["freelancers", "students"]`                 |
| `useCases`                        | Concrete scenarios.                                                                            | `["tracking job applications"]`               |
| `replacesProducts`                | Named paid products this replaces.                                                             | `["Trello", "Asana"]`                         |
| `replacesCategories`              | Categories of paid software this replaces.                                                     | `["project management SaaS"]`                 |
| `privacy`                         | `{ storageMode, dataLeavesDevice, details }` — must be accurate, drives the privacy badge.     | —                                             |
| `offlineCapable` / `offlineNotes` | Offline behavior and any caveat.                                                               | —                                             |
| `featured`                        | Shows on the homepage's featured section.                                                      | —                                             |
| `addedAt` / `updatedAt`           | ISO dates (`YYYY-MM-DD`). `addedAt` drives the 30-day "New" badge.                             | —                                             |
| `relatedApps`                     | ids of other apps to cross-link.                                                               | —                                             |
| `searchKeywords`                  | Catch-all extra terms not covered by any field above.                                          | —                                             |
| `usageNotes`                      | Short, honest tips shown on the app page.                                                      | —                                             |
| `seo.description`                 | Optional override for meta/OG description.                                                     | —                                             |

**Every new app must fill in real content for `tags`, `tasksPerformed`, `problemsSolved`, `descriptivePhrases`, `useCases`, and `audiences`** — `registry.test.ts` enforces this isn't left empty. "Real" means specific to that app, not copy-pasted boilerplate: write the phrases a person would actually type or say when they don't know this app's name yet.

## How the search engine works (`src/lib/apps/search.ts`)

1. **Normalization** (`normalize.ts`): both the query and every indexed field are lowercased, diacritics/punctuation stripped, whitespace collapsed, before any comparison. `"KANBAN-BOARD!!"`, `"kanban,board"`, and `"  kanban   board "` all match identically.
2. **Exact match short-circuit**: a normalized query that exactly equals an app's `name`, an `alias`, or an `alternateName` always ranks that app first.
3. **Fuse.js fuzzy index**: every field is indexed with a weight (name highest, then aliases/misspellings, then the "intent" fields — `tasksPerformed`/`problemsSolved`/`descriptivePhrases` — then `useCases`/`replacesProducts`/`tags`, then looser prose fields last). This is what gives typo tolerance and ranks exact-ish matches above incidental ones.
4. **Word-coverage layer**: for multi-word queries, a second pass scores how many significant query words (stopwords excluded) appear anywhere across an app's metadata. This is what catches a _reworded_ query — e.g. "somewhere to plan a wedding" — that Fuse's single-pattern fuzzy match alone might score too low, as long as the registry's `useCases`/`tasksPerformed`/etc. contain the relevant words somewhere.
5. **Reasons**: `reasonsFromMatches` turns Fuse's raw match data into up to three human-readable `{ label, value }` reasons (e.g. `{ label: "Solves this", value: "losing track of what stage a task is in" }`), shown in the UI as "Matched: …".
6. **Suggestions** (`getSuggestions`): when a search returns nothing, first retries with a relaxed threshold; if still nothing, falls back to featured apps with an explanatory message. The directory and search palette both use this so there's never a dead end.

## Filters (`src/lib/apps/filters.ts`)

Orthogonal to search: `categoryId`, `appType`, `storageMode`, `dataLeavesDevice`, `offlineCapable`. Used by `AppDirectory.tsx`'s pill buttons, composable with an active search query.

## Testing search behavior

`src/lib/apps/search.test.ts` is the pattern to follow for every new app: assert that a handful of realistic descriptive/intent queries return that app as the top result, plus at least one misspelling-tolerance case and one reworded-use-case test. Required verification examples for Kanban Board (all pass today):

- "organize work into columns"
- "free Trello alternative"
- "track jobs through stages"
- "move cards between lists"
- "project planning without an account"

When adding an app, write equivalent tests for its own real use cases — don't just copy these strings.

## Why Fuse.js

A lightweight, dependency-free, purely client-side fuzzy search library was a hard requirement (no server, no paid search API, must work instantly). Fuse.js gives configurable per-field weights and typo tolerance out of the box; the normalization, word-coverage layer, reason extraction, and suggestions fallback on top are custom because the brief's specific requirements (highlighted match reasons, graceful no-result suggestions, tolerance for fully reworded intent queries) go beyond what any off-the-shelf config provides. This combination is deliberately designed to keep scaling to hundreds/thousands of registry entries: it's O(entries) per query with no external index to rebuild or serve, and adding an app only ever means adding one registry object.

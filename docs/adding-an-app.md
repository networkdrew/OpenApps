# Adding a new app

This is the full, predictable recipe for adding exactly one new app. Read `docs/architecture.md` and `docs/search-and-discovery.md` first if you haven't — they explain _why_ the registry, search index, and `AppIslandLoader` work the way they do. If you were told simply "build the next highest-value missing OpenApps app," this document plus `docs/roadmap.md` is everything you need to decide what and how.

Use the Kanban Board (`src/lib/apps-logic/kanban/`, `src/islands/kanban-board/`) as the template if you want to see every piece in one place — it's a complete reference implementation of every convention below.

## 0. Decide what to build

Check `docs/roadmap.md`'s "Next up" list and the current registry (`src/lib/apps/registry.ts`) for what already exists. Pick one app you can build to a genuinely polished, complete state — not a shallow stub. A bare-minimum version of a valuable app is worse for this project than not building it yet: it costs a slot in the directory and search results without earning its place. Confirm the app can be:

- built with local browser storage only (no required backend)
- free of any paid API dependency
- given complete discovery metadata (see step 4) honestly, not padded

## 1. Write the pure domain logic first

Create `src/lib/apps-logic/<app-name>/*.ts` — plain, framework-free functions and types. Follow the existing patterns:

- A `model.ts` with your core types and factory functions (see `kanban/model.ts`).
- If the app has meaningfully complex state transitions, a pure `reducer.ts` (`(state, action) => state`) rather than scattering mutations across React components — this is what makes undo/redo (via `src/lib/storage/history.ts`) and thorough unit testing possible.
- A `schema.ts` with a Zod schema for your persisted state shape, used to validate imports.
- A `persistence.ts` wiring `src/lib/storage/localStore.ts` + `jsonTransfer.ts` to your app's specific state shape (load/save/clear/export/import functions with a real error type, not thrown exceptions).
- Any pure filtering/search/geometry helpers your UI needs (see `kanban/filter.ts`, `kanban/dragDrop.ts`).

Write `*.test.ts` next to each file. Cover the normal case, edge cases (empty state, boundary indices, missing references), and anything a real bug could hide in (see `kanban/reducer.test.ts` for the depth expected — every action type, every edge case). Get this green with `npm run test` before touching any UI — it's much faster to get logic right in isolation.

## 2. Build the island UI

Create `src/islands/<app-name>/` with a default-exported top-level component (e.g. `KanbanBoardApp.tsx`) taking **no required props** — it's rendered as `<Component />` via `AppIslandLoader`. Reuse:

- `src/components/react/styles.ts` for button/input/select/textarea class strings
- `src/components/react/Icon.tsx` (React) / `src/components/astro/Icon.astro` (Astro) — add new icons by copying a raw SVG from `node_modules/lucide-static/icons/` into `src/icons/` and adding the name to both `IconName` unions
- `StatusMessage`, `ConfirmDialog`, `AutosaveIndicator`, `StorageUsageIndicator`, `ImportExportControls` from `src/components/react/` — see `docs/local-data-standard.md` for what each is for and the hydration-timing gotcha around loading persisted state
- If drag-and-drop is involved, prefer pointer events (`onPointerDown`/`onPointerMove`/`onPointerUp`/`onPointerCancel` with `touchAction: "none"`) over native HTML5 DnD — the latter has no real touch support. See `useKanbanDnd.ts`. **Every drag interaction needs a keyboard equivalent** — see `CardTile.tsx`'s Alt+Arrow handling.

Every app needs: a working, obviously-labeled way to undo a destructive action or reset; accessible labels on every input; `role="alert"`/`role="status"` (via `StatusMessage` or inline) for errors and important status changes; and no visible control that does nothing.

Write `*.test.tsx` next to interactive components using Testing Library where there's real interaction logic worth locking in — you don't need exhaustive UI tests for every presentational component, but reducer-adjacent wiring (does clicking X actually dispatch Y) is worth covering.

## 3. Wire it into `AppIslandLoader`

Add one line to the map in `src/components/react/AppIslandLoader.tsx`:

```ts
"<app-id>": lazy(() => import("@/islands/<app-name>/<AppName>App")),
```

`AppIslandLoader.test.tsx` fails if you forget this (or add it without a matching registry entry), so you can't silently ship a broken app page.

## 4. Add the registry entry — this is the step that makes the app discoverable

Add an object to `rawApps` in `src/lib/apps/registry.ts`. Every field is explained in `docs/search-and-discovery.md` — read it, don't guess. In particular, for real discoverability:

- `tags`, `tasksPerformed`, `problemsSolved`, `descriptivePhrases`, `useCases`, `audiences` **must all have genuine, specific content** — `registry.test.ts` fails the build if any are empty.
- Write `descriptivePhrases` as things a real person would type when they don't know the app's name — think about how you'd Google this app if you didn't know it existed.
- `replacesProducts`/`replacesCategories`: name the actual paid products/categories this replaces, honestly (don't claim a replacement that isn't real).
- `categoryId` must match an existing entry in `src/lib/apps/categories.ts`, or add a new category there **only if this app genuinely doesn't fit an existing one** (categories only exist once they have ≥1 real app — `registry.test.ts` enforces this).
- `privacy` and `offlineCapable`/`offlineNotes` must be accurate — they drive the on-page privacy badge and are a stated project principle, not decoration.
- `id`/`slug` are permanent — don't reuse or repurpose one later.
- `addedAt`: today's date (`YYYY-MM-DD`). `updatedAt`: same, at creation.

## 5. Write search verification tests

Add a describe block to `src/lib/apps/search.test.ts` (or a small addition alongside it) asserting that 3-5 realistic descriptive queries for _this app_ return it as the top result — mirror the pattern already there for Kanban Board. This is the concrete proof the app is actually findable, not just registered.

## 6. Verify

```
npm run format:check
npm run lint
npm run check
npm run test
npm run build
```

Then, since `astro dev` has a known local Miniflare limitation in this environment (see `docs/deployment.md`), verify interactively with:

```
npm run build
npx wrangler dev
```

and in a real browser: the app's page renders at `/<slug>/` (not `/apps/<slug>/` — see "URL structure" in `docs/architecture.md`), appears on `/apps/`, appears under its category page, the Cmd/Ctrl+K search palette finds it via at least one non-obvious descriptive query, its primary workflow actually works (create/edit/save/reload persists, export/import round-trips, any destructive action asks for confirmation), and it's usable on a narrow/touch viewport.

## 7. Update the roadmap

Move the app from "Next up" to "Shipped" in `docs/roadmap.md`, and add a new "best next app" suggestion if you have one worth recording.

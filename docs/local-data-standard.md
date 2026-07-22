# Local-first application standard

Every app on OpenApps should, by default:

- work without an account
- store its data locally (not on a server) by default
- avoid paid APIs
- never silently upload user content
- support JSON import and export
- give users clear storage-usage and deletion controls
- remain useful offline when the underlying task allows it
- clearly disclose, on its own page, any limitation or external dependency

The registry's `privacy` and `offlineCapable`/`offlineNotes` fields (see `docs/search-and-discovery.md`) are how an app states this — keep them accurate. `PrivacyBadge.astro` renders them automatically on every app page; don't write a separate ad hoc privacy blurb per app.

## Shared building blocks

Reuse these instead of reinventing them. They exist because the Kanban Board needed them first and proved the shape — see `src/islands/kanban-board/` for a complete reference implementation of every piece below.

### `src/lib/storage/localStore.ts` — versioned browser storage

```ts
loadLocalStore<T>({ key, version, fallback, migrate? }): T
saveLocalStore<T>({ key, version, fallback }, data: T): { ok: true } | { ok: false; message: string }
clearLocalStore(key: string): void
```

Store one JSON envelope (`{ version, data }`) per app under a key prefixed with the app's id (e.g. `openapps:kanban-board:state`). `version` is a plain integer your app controls; bump it whenever the stored shape changes in a way older data can't be read as-is.

**Do not call `loadLocalStore` synchronously in a component's initial render state.** `localStorage` isn't available during Astro's build-time prerender, and reading it synchronously on the client's first render (before hydration) will not match the server-rendered HTML. Load in a `useEffect` after mount instead — see `useKanbanController.ts`'s `loaded` flag pattern. This keeps hydration consistent and avoids a mismatch, at the cost of a one-frame "Loading…" state, which is an acceptable, expected tradeoff for local-first apps.

### `src/lib/storage/migrations.ts` — schema versioning

```ts
migrateThroughSteps(stored: { version; data }, steps: Array<(data: unknown) => unknown>): unknown
```

`steps[0]` upgrades v1→v2, `steps[1]` upgrades v2→v3, etc. Pass this as your `localStore` config's `migrate` function once you actually have a second schema version — an app's first version needs no migration steps.

### `src/lib/storage/history.ts` — undo/redo

```ts
createHistory<T>(initial: T): HistoryState<T>
pushHistory<T>(state, next: T, limit?): HistoryState<T>
undo<T>(state): HistoryState<T>
redo<T>(state): HistoryState<T>
canUndo / canRedo(state): boolean
```

A generic, content-agnostic bounded undo/redo stack over full-value snapshots. Wrap your reducer's output in `pushHistory` on every dispatch; see `useKanbanController.ts`.

### `src/lib/storage/storageUsage.ts` and `jsonTransfer.ts`

- `estimateKeyBytes(key)` / `estimateTotalLocalStorageBytes()` / `formatBytes(n)` — for a "X KB used" readout.
- `downloadJson(filename, data)` — triggers a browser download of any JSON-serializable value.
- `readJsonFile(file: File)` — reads and parses a user-selected file; always validate the parsed shape (with a Zod schema — see `src/lib/apps-logic/kanban/schema.ts`) before trusting it as app state.

### React components (`src/components/react/`)

- `AutosaveIndicator` — `idle | saving | saved | error` status text with `aria-live="polite"`. Debounce your actual save (see `useKanbanController.ts`'s `SAVE_DEBOUNCE_MS`) so this doesn't thrash on every keystroke.
- `StorageUsageIndicator` — pass your app's storage key; pass a changing `refreshToken` prop after any write so it re-reads (storage events don't fire in the same tab).
- `ImportExportControls` — export/import buttons; you supply `onExport`/`onImportFile`.
- `ConfirmDialog` — route every destructive, hard-to-reverse action (delete a board, clear all data) through this rather than a bare `confirm()` or an inline toggle. Requires explicit `title`/`description`/`confirmLabel`.

## Schema validation for import

Every app that supports JSON import must validate the parsed file against a Zod schema before accepting it as state (see `kanbanStateSchemaV1` in `src/lib/apps-logic/kanban/schema.ts`), and show a specific, honest error message on failure — never silently accept malformed data or crash.

## What not to build yet

Don't add a shared abstraction (a generic "board" primitive, a generic "document" primitive, a plugin system) until a _second_ app actually needs it and the shape it needs is clear from real code, not speculation. The Kanban Board proved what's genuinely app-agnostic (storage, history, autosave UI, import/export UI, confirm dialogs) — that's what's shared today. Board/column/card domain logic (`src/lib/apps-logic/kanban/`) stays specific to Kanban.

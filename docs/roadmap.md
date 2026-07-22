# Roadmap

A lightweight, honest list — not a commitment with dates. See `docs/adding-an-app.md` for how new apps get added.

## Shipped (v0.3)

- **OpenBudget** (`productivity` category, permanent route `/budget/`) — a fully local-first Mint/YNAB-style personal budgeting app: accounts (checking, savings, credit card, cash, investment) with balances computed from a full transaction ledger; income, expense, and transfer transactions; built-in and custom categories; monthly budgets per category with progress meters and a "copy last month" shortcut; recurring transactions (bills, subscriptions, paychecks) that auto-generate on load with a hard iteration ceiling against corrupt data; savings goals with a contribution/withdrawal history; transaction search, filters, and sorting; a dashboard with an income-vs-expenses chart, a category spending breakdown, a balance-over-time trend, and budget check-ins; CSV import with column mapping and a sign-convention toggle; CSV and JSON export; full JSON backup/restore; undo/redo; autosave; and complete local-data deletion. All money is handled as integer cents (never floats) to avoid rounding bugs. Domain logic (`src/lib/apps-logic/budget/`) — money, dates/recurrence math, calculations, CSV parsing, filtering, the reducer — is fully unit-tested (413 tests project-wide) separately from the UI (`src/islands/budget/`).

## Shipped (v0.2)

- **OpenNotes** (`notes-writing` category, permanent route `/notes/`) — a fully local-first Evernote/Notion-style note app: notebooks with nested folders, cross-notebook tags, favorites, pinning, archive, and a recoverable trash. Markdown editor with a formatting toolbar, edit/split/preview modes, `[[wiki links]]` with automatic backlinks (click a missing link to create that note on the spot), built-in and custom templates, instant full-text search, sorting, keyboard shortcuts, undo/redo, autosave, JSON backup/restore, Markdown export (single note or all notes), and complete local-data deletion. Domain logic (`src/lib/apps-logic/notes/`) is fully unit-tested (markdown rendering, wiki-link/backlink resolution, reducer, search, filters) separately from the UI (`src/islands/notes/`).

## Shipped (v0.1 — foundation)

- Site shell: header/footer, responsive nav, theme switcher, Cmd/Ctrl+K command search, skip link.
- Search-first homepage (no decorative hero dominating the fold), category browsing, featured/recent apps, local-first privacy explanation.
- Typed, richly-metadata'd, Zod-validated app registry — the discovery foundation for hundreds/thousands of future entries (see `docs/search-and-discovery.md`).
- Fuse.js-powered search engine: normalized matching, typo tolerance, weighted ranking, word-coverage matching for reworded intent queries, human-readable match reasons, no-result suggestions fallback. Verified against real descriptive/replacement-style queries in `src/lib/apps/search.test.ts`.
- Searchable/filterable app directory (by category, app type, privacy, offline support) and category pages.
- Reusable app-page system (`AppLayout`) with privacy/offline badge, usage notes, tags, related apps, "replaces" callout.
- Shared local-first data conventions: versioned localStorage wrapper, schema migrations, undo/redo history stack, storage-usage readout, JSON import/export, destructive-action confirmation, autosave indicator (`src/lib/storage/`, `docs/local-data-standard.md`).
- One fully polished app: **Kanban Board** — multiple boards, unlimited columns, pointer-based drag-and-drop with a full keyboard alternative (Alt+Arrow move, focus-driven), card descriptions/labels/priorities/due dates, in-board search and filters, autosave, undo/redo, board duplication, JSON export/import, complete local-data deletion, responsive desktop/touch/mobile. Domain logic (`src/lib/apps-logic/kanban/`) is fully unit-tested and separated from UI.
- SEO: per-page canonical/OG/Twitter meta, JSON-LD (`SoftwareApplication`), sitemap, robots.txt, custom 404 page.
- Cloudflare Workers deployment configuration, verified via `wrangler deploy --dry-run` and a live `wrangler dev` browser check (see `docs/deployment.md`).

## Next up (not yet built)

Candidates from the product brief, roughly in likely-value order — pick the next one via `docs/adding-an-app.md`:

- **Habit/routine tracker** (`productivity`) — daily habit tracking with streaks, local-only.
- **Pomodoro / focus timer** (`productivity` or `utilities`) — simple, no-account timer app; a free alternative to paid focus-timer apps.
- **Simple drawing/whiteboard app** (`creative-design`) — canvas-based sketching with local save/export, a lightweight Excalidraw-style alternative.
- **Markdown editor/previewer with local file management** (`notes-writing`) — a free alternative to paid Markdown editors.

Each of these should become its own category's first app when built, per the planned taxonomy noted in `src/lib/apps/categories.ts`.

## Deliberately not planned

- Accounts, sign-in, or any per-user server-side storage.
- A backend/database for any app — only add one for a specific future app that genuinely can't work client-side, and say so explicitly and honestly on that app's page and in its registry `privacy` field.
- Ads or tracking scripts.
- Fake statistics, reviews, users, or testimonials, ever.
- A universal cross-app framework beyond what `src/lib/storage/` already proves is genuinely shared — grow it only when a second and third app show the same real need.

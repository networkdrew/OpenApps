# Roadmap

A lightweight, honest list — not a commitment with dates. See `docs/adding-an-app.md` for how new apps get added.

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

- **Notes app** (`notes-writing` category) — a local-first note editor/organizer; a real alternative to Notion/Evernote for simple note-taking.
- **Habit/routine tracker** (`productivity`) — daily habit tracking with streaks, local-only.
- **Pomodoro / focus timer** (`productivity` or `utilities`) — simple, no-account timer app; a free alternative to paid focus-timer apps.
- **Simple drawing/whiteboard app** (`creative-design`) — canvas-based sketching with local save/export, a lightweight Excalidraw-style alternative.
- **Markdown editor/previewer with local file management** (`notes-writing`) — a free alternative to paid Markdown editors.
- **Budget/expense tracker** (`productivity` or `utilities`) — local-only personal finance tracking (no bank linking — that would violate the local-first/no-external-API principle).

Each of these should become its own category's first app when built, per the planned taxonomy noted in `src/lib/apps/categories.ts`.

## Deliberately not planned

- Accounts, sign-in, or any per-user server-side storage.
- A backend/database for any app — only add one for a specific future app that genuinely can't work client-side, and say so explicitly and honestly on that app's page and in its registry `privacy` field.
- Ads or tracking scripts.
- Fake statistics, reviews, users, or testimonials, ever.
- A universal cross-app framework beyond what `src/lib/storage/` already proves is genuinely shared — grow it only when a second and third app show the same real need.

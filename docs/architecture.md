# Architecture

## Stack and why

- **Astro, static output (`output: "static"`).** Every page is pre-rendered HTML at build time — good for SEO, good for Cloudflare, and it means most of the site ships zero JavaScript by default. Astro's "islands" model lets individual interactive widgets opt into hydration without turning the whole page into a client-rendered app. The `@astrojs/cloudflare` adapter and `wrangler.jsonc` are layered on top purely so Cloudflare's Workers platform can serve that static output (see `docs/deployment.md`) — there is no server-side application logic.
- **React, only for islands.** The header's search palette, the theme toggle, the app directory, and each app's actual UI are React components hydrated on the client. Everything else — layouts, headers, footers, cards — is plain `.astro` markup with no client JS cost.
- **Tailwind CSS v4.** Utility classes plus a small set of CSS custom-property design tokens (`src/styles/global.css`) for light/dark theming. No component library — cards, buttons, and form fields are a handful of shared Tailwind class strings (`src/components/react/styles.ts`) plus a few Astro components.
- **Zod.** Validates the app and category registries at module-load time, so a malformed entry fails immediately and loudly instead of silently breaking a page. Also validates imported JSON for apps that support import/export.
- **Fuse.js.** Powers the fuzzy, typo-tolerant, weighted search index built from the registry — see `docs/search-and-discovery.md`.
- **Vitest + Testing Library.** Fast, Vite-native, no separate config split between unit and component tests.

This reuses the proven pattern from OpenToolbox (a separate, already-deployed sibling project) almost exactly, because it works and avoids known pitfalls — see `docs/deployment.md` for the one real incident that pattern avoids. What's different here, deliberately: a much richer registry schema (see below), a generated search index with match explanations and no-result suggestions instead of a plain fuzzy list, and a shared local-data layer (`src/lib/storage/`) for apps with real persistent state instead of one-shot converters.

## The app registry — the foundation of discoverability

`src/lib/apps/registry.ts` is the single source of truth for every app's metadata: name, descriptions, category, tags/aliases/misspellings, features, tasks performed, problems solved, descriptive phrases, audiences, use cases, what paid products/categories it replaces, privacy/storage mode, offline capability, related apps, and SEO copy. `src/lib/apps/categories.ts` is the same for categories. Nothing else in the codebase should hardcode an app's name or description — pages, the search index, the sitemap, and the homepage's featured/recent sections all read from these two files.

Both are validated against Zod schemas (`src/lib/apps/schema.ts`) at import time, and `registry.test.ts` enforces integrity rules: unique ids/slugs, no dangling `relatedApps`/category references, no empty categories, valid non-future dates, and — specific to this project — that every app actually has the minimum discovery metadata filled in (tags, tasks performed, problems solved, descriptive phrases, use cases, audiences). See `docs/search-and-discovery.md` for the full field-by-field guide.

## Why app UIs are wired through `AppIslandLoader`

Astro decides what to hydrate on the client by statically analyzing the imports in an `.astro` file — it cannot follow a dynamic `import()` stored inside a plain data structure (like a registry entry) back to a real module. `src/components/react/AppIslandLoader.tsx` is the **one** component `[slug].astro` statically imports and hydrates (`<AppIslandLoader componentId={...} client:load />`). Internally it holds a small map from an app's `componentId` (defaults to its `id`) to `React.lazy(() => import("@/islands/..."))`. Vite still code-splits each app into its own chunk; Astro only has to understand one static import. `AppIslandLoader.test.tsx` asserts the map's keys exactly match the registry's component ids, so adding an app to one without the other fails a test instead of silently 404-ing at runtime.

## Directory layout

```
src/
  components/
    astro/       Server-rendered building blocks (Header, Footer, AppCard, PrivacyBadge, Icon, ...)
    react/        Shared interactive primitives (SearchPalette, AppDirectory, ConfirmDialog,
                   AutosaveIndicator, StorageUsageIndicator, ImportExportControls, ...)
  islands/         One directory per app, holding that app's React UI (e.g. islands/kanban-board/)
  layouts/         BaseLayout (document shell, SEO) and AppLayout (app-page chrome + privacy badge)
  lib/
    config/        site.ts (identity/URLs), theme.ts (theme-init script)
    apps/           registry.ts, categories.ts, schema.ts, search.ts, filters.ts, normalize.ts —
                     the content model and discovery engine
    apps-logic/     Pure, framework-free domain logic per app, colocated with its tests
                     (e.g. apps-logic/kanban/ — model, reducer, filter, persistence, drag/drop math)
    storage/        Shared local-first conventions: localStore.ts, history.ts, migrations.ts,
                     storageUsage.ts, jsonTransfer.ts — reusable by any future app
  pages/            Astro file-based routes
  styles/            global.css — design tokens, Tailwind entry, base styles
docs/                This file, the app-adding recipe, search/discovery guide, local-data
                     standard, deployment notes, roadmap
```

## Search and discovery

See `docs/search-and-discovery.md` for the full picture. In short: `src/lib/apps/search.ts` builds a Fuse.js index over every registry field, normalized for case/punctuation/spacing, weighted so name/alias matches outrank incidental description matches, with a word-coverage layer on top so reworded multi-word intent queries still surface the right app, human-readable "why this matched" reasons, and a suggestions fallback when nothing matches. It's used by both the header's `SearchPalette` (Cmd/Ctrl+K) and the `/apps` directory's filter UI — one generated index, two presentations.

## Directory page: a deliberate SEO tradeoff

The `/apps` directory's search and filtering are a client-rendered React island (`AppDirectory.tsx`), not a static + progressively-enhanced list. A crawler that doesn't execute JavaScript won't see the full app list _on that specific page_ — deliberate: every app has its own fully static, indexable page at `/<slug>/` (off the root — see the note below), every category page lists its apps with real `<a>` links, and the sitemap includes all of them directly. The directory page's job is being a fast, instant-feeling UX for real visitors; it doesn't need to also be the crawl path.

## URL structure: individual apps live at the root

Individual app pages are `src/pages/[slug].astro`, served at `/<slug>/` directly off `apps.drewcassidy.dev` — **not** `/apps/<slug>/`, which would repeat "apps" pointlessly given the subdomain is already `apps.*`. `/apps/` itself is a separate, static "browse all" listing page (`src/pages/apps/index.astro`) and is unaffected by this. Notes and Budget are the exception within the exception: they need extra surrounding page content, so they ship as their own static routes (`src/pages/notes/index.astro`, `src/pages/budget/index.astro`) rather than going through `[slug].astro` — `[slug].astro`'s `getStaticPaths` explicitly excludes them to avoid a route collision. Old `/apps/<slug>/` URLs still resolve via the `redirects` map built from the app registry in `astro.config.mjs`. When adding a new app, its page and every internal link to it should point at `/<slug>/`, not `/apps/<slug>/`.

## Local-first apps

`src/lib/storage/` holds shared, app-agnostic conventions any app with real persisted state should reuse rather than reinventing:

- `localStore.ts` — a typed, versioned localStorage wrapper (`loadLocalStore`/`saveLocalStore`/`clearLocalStore`)
- `migrations.ts` — chains single-step schema migrations for `localStore`'s `migrate` hook
- `history.ts` — a generic bounded undo/redo stack over full-value snapshots
- `storageUsage.ts` — byte-usage estimation for a "storage used" readout
- `jsonTransfer.ts` — `downloadJson`/`readJsonFile` for export/import

Paired React components in `src/components/react/`: `AutosaveIndicator`, `StorageUsageIndicator`, `ImportExportControls`, `ConfirmDialog` (for any destructive action), and `PrivacyBadge.astro` (the astro-side privacy/offline explanation driven by an app's registry `privacy` field). See `docs/local-data-standard.md`.

The Kanban Board (`src/lib/apps-logic/kanban/`, `src/islands/kanban-board/`) is the reference implementation of all of the above — read it before building the next stateful app.

## Theming

Light/dark is driven by a `data-theme="light"|"dark"` attribute on `<html>`, read from `localStorage` by a small inline script in `BaseLayout`'s `<head>` (before first paint, so there's no flash). If nothing is stored, CSS falls back to `prefers-color-scheme`. `ThemeToggle.tsx` is mounted with `client:only="react"` since its initial state depends on `matchMedia`/`localStorage`, which don't exist during Astro's static render.

## Centralized site configuration

`src/lib/config/site.ts` exports `SITE_URL` (the production canonical origin), `SITE_NAME`, `SITE_DESCRIPTION`, and nav links. `astro.config.mjs` imports `SITE_URL` from this file to set Astro's `site` config, which powers canonical links, Open Graph URLs, and the sitemap. Change the production URL in exactly one place: `src/lib/config/site.ts`.

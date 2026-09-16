# Status — OpenApps

Where the project stands, written to be resumed from a cold session with no
memory of prior conversations. Update this in the same change that moves the
state it describes. `docs/roadmap.md` is what's shipped/next at the product
level; this file is the working state and the decisions that took effort to
reach.

Last updated: 2026-09-16.

## Current state — verified

- **Desktop OS-style landing page** is built at `/` and passes full verification:
  `npm run format:check`, `npm run lint`, `npm run check` (142 files, 0 errors),
  `npm run test` (413 passed), `npm run build` (success). Browser-verified via
  the built output: header + live Clock, desktop app icons, the dock, the
  Cmd/Ctrl+K launcher (opens, searches, filters, keyboard-navigates, Esc
  closes), and all three app pages plus the `/apps/notes` → `/notes` redirect —
  no console errors.
- The desktop shell consists of: `src/components/react/DesktopDock.tsx` (fixed
  dock + app-launcher dialog), `src/components/react/Clock.tsx`, and
  `AppIcon` in both `astro/` and `react/`, plus a new `appearance` field
  (`appearance.icon` lucide name + `.gradient` CSS) on `AppMeta` in
  `src/lib/apps/schema.ts`, filled in for all three apps in `registry.ts`.
  `BaseLayout` gained a `desktop` prop (hides Header/Footer, pins body to
  viewport); `index.astro` was rewritten to a wallpaper + desktop + dock layout.

## What is next

The desktop homepage work is done but **not yet committed**. Also not yet done:
the roadmap's next app candidates, in order — `docs/adding-an-app.md` is the
recipe:

1. **Habit/routine tracker** (`productivity`) — daily habits with streaks, local-only.
2. **Pomodoro / focus timer** (`productivity` | `utilities`).
3. **Simple drawing/whiteboard** (`creative-design`) — canvas, local save/export.
4. **Markdown editor/previewer** (`notes-writing`).

The single best next app is the **habit tracker**: it opens a fresh category
area, is fully local-first (fits the storage layer), and has no dependency
needs.

## Known issue — do not re-investigate

`npm run dev` (`astro dev` with `@astrojs/cloudflare`) intermittently returns
Miniflare `fetch failed` 500s on every route in this sandbox. This is a
**known, documented local-only limitation** of the adapter's dev-mode Workers
emulation (see `docs/deployment.md` line ~65), unrelated to app code or the
static build. **Verify with `npm run preview` (build + `wrangler dev`) instead
of `npm run dev`** before assuming the code is broken. The workerd binary is
present and correct (`node_modules/@cloudflare/workerd-windows-64/bin/workerd.exe`);
do not re-attempt to "fix" the dev server.

## Decisions locked in — do not re-litigate

- **`appearance.icon`/`appearance.gradient` are plain strings** on the schema,
  not validated against the `IconName` union at parse time. The components fall
  back to the category's icon + a neutral accent gradient when `appearance` is
  omitted. Do not add runtime icon-name validation to the Zod schema — the
  Astro `Icon` component already throws loudly at build time for an unknown
  name, which is the right place for it.
- **`AppIcon` exists twice on purpose** — `astro/` for SSR (desktop icons on the
  index page) and `react/` for client islands (inside the launcher). They must
  stay in sync; the gradient/icon fallback logic is identical in both.
- **OpenNotes and OpenBudget live at top-level routes** (`/notes/`, `/budget/`),
  not `/apps/<slug>/`; `astro.config.mjs` `redirects` forward the old URLs, and
  `[slug].astro`'s `getStaticPaths` filters those two out. Keep `slug` and `id`
  as separate fields for this reason.
- **The launcher is Cmd/Ctrl+K** (matches the header's old SearchPalette
  convention) and also reachable from the dock's grid button.

## Deliberately not done

- No mobile-specific layout for the desktop landing page beyond the existing
  responsive desktop-icon grid (`index.astro`) — the dock and launcher are
  already responsive; revisit only if a real device shows a problem.
- Did not add the desktop shell to the header's old `SearchPalette`/directory
  search paths — those remain on `/apps` and the app pages, unchanged.

## Commands

```powershell
npm run verify                     # format:check + lint + check + test + build
npm run preview                    # build + wrangler dev (use for browser checks)
npx wrangler deploy --dry-run      # sanity-check the Cloudflare config
npm run deploy                     # build + wrangler deploy
```

Production is `https://apps.drewcassidy.dev` (Worker `openapps`). Deploy is
Git-connected (push to `master`); see `docs/deployment.md`.

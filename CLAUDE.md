# OpenApps — Claude Code Instructions

## Mission

Build a large, long-lived, privacy-first museum of free browser apps that replace paid and subscription software. This is a **discovery product first, app collection second**: an app nobody can find is functionally not part of the site. Every app must be findable by what it does, what problem it solves, and what it replaces — not just by its exact name.

## Stack

Astro (static output) + React islands for interactive app UIs + TypeScript (strict) + Tailwind CSS v4 + Zod + Fuse.js (search) + Vitest + Testing Library. Package manager is npm. Deployed as a fully static site to Cloudflare Workers (Git-connected, `wrangler.jsonc`-driven) — see `docs/deployment.md`.

This is a **separate repository and Cloudflare project from OpenToolbox** (`tools.drewcassidy.dev`). Do not touch that repository, its GitHub project, or its Cloudflare deployment from here. Where OpenToolbox proved a pattern (static Astro + Cloudflare Workers, registry-driven content, Fuse.js search, pointer-based drag), OpenApps reuses it — see `docs/architecture.md` for what's identical and what's intentionally different (richer registry schema, a maintained-generated search index, apps with real persistent local data instead of one-shot converters).

## Project principles

- Core apps must not require paid APIs or accounts.
- Data is local by default (`localStorage`/`IndexedDB`); never silently upload user content.
- Never claim an app is private unless its implementation supports that claim.
- Never add fake reviews, statistics, users, companies, downloads, ratings, or testimonials.
- Never leave visible controls nonfunctional.
- Keep the site statically deployable unless a reviewed feature requires a backend.
- Preserve stable app URLs and registry IDs — never reuse or repurpose one.
- Accessibility, mobile/touch behavior, performance, and error handling are required, not optional polish.
- **Discoverability is not optional.** An app without complete registry metadata (see `docs/search-and-discovery.md`) is an incomplete app, full stop.

## Before changing code

- Inspect the relevant implementation, tests, and nearby patterns.
- Understand the root cause or requested behavior before editing.
- Reuse established components and conventions (see `docs/architecture.md`, `docs/local-data-standard.md`).
- Keep changes focused; do not rewrite unrelated working code.
- State assumptions when requirements are genuinely ambiguous.

## Architecture (see `docs/architecture.md` for the full picture)

- `src/lib/apps/registry.ts` is the single authoritative source of app metadata. Nothing else should hardcode an app's name, description, or category.
- `src/lib/apps/search.ts` builds the search index **from the registry** at build/runtime — never maintain a separate manual search list.
- `src/components/react/AppIslandLoader.tsx` maps each registry app `id` to its React island via a static-per-id `React.lazy` map. Astro cannot hydrate a component reached only through a dynamic import stored in data — it needs a static import it can see at compile time. Do not try to "simplify" this into a dynamic `import(tool.id)`.
- Pure app logic lives under `src/lib/apps-logic/<app>/` with colocated `*.test.ts` files, completely separate from the React UI in `src/islands/`. Keep it that way — logic must be testable without rendering anything.
- Local-first data conventions (`src/lib/storage/`) are shared: typed `localStorage` wrapper, schema versioning/migration helper, JSON export/import, storage-usage estimation. Reuse them for every new app; extend them only when a second app actually needs something the first didn't.
- `src/lib/config/site.ts` is the only place the production URL and site identity constants live. `astro.config.mjs` imports `SITE_URL` from it.

## Adding a new app

Follow `docs/adding-an-app.md` exactly. It is written so a fresh Claude session with no prior context can add one complete, discoverable app end to end — logic, UI, registry entry with full metadata, search verification, and tests — from an instruction as short as "build the next highest-value missing OpenApps app."

Do not add a shallow or partially-featured app to raise the count. One polished, fully-registered app beats three thin ones.

## Quality requirements

- Use strict TypeScript; avoid `any` unless documented and unavoidable.
- Validate external and user-controlled input (Zod schemas in `src/lib/apps/schema.ts`; the `ok`/error-result pattern used by app logic modules).
- Provide accessible labels, focus states, keyboard behavior, and status messages (`role="alert"` / `role="status"`) for every interactive control, including drag-and-drop (every drag interaction needs a keyboard alternative).
- Respect `prefers-reduced-motion` (handled globally in `src/styles/global.css`).
- Prevent avoidable layout shift.
- Do not log or persist sensitive user content outside the user's own browser storage.
- Write or update tests for meaningful behavior and bug fixes. Domain/reducer logic needs thorough unit tests; UI wiring tests (Testing Library) are expected for real interaction branches. Search behavior needs descriptive-query tests (see `docs/search-and-discovery.md`).
- Treat warnings as problems to investigate.

## Verification

Run before calling anything done:

```
npm run format:check
npm run lint
npm run check      # astro check — type checking
npm run test
npm run build
```

`npm run verify` runs all five in sequence. Do not report success unless these actually pass. When browser tooling is available, test the primary desktop, mobile, and keyboard-only workflows in a real browser.

## Git and safety

- Work only inside this repository.
- Never commit secrets, local credentials, generated user content, or environment files containing secrets.
- Do not use destructive Git commands or erase user work.
- Do not change deployment, billing, domains, or external accounts without explicit approval.
- Keep commits focused and descriptive when commits are requested.

## Communication

- Be concise but surface important decisions, risks, and failures.
- Prefer implementing and verifying over proposing excessive options.
- At completion, summarize changes, verification, known limitations, and the single best next app to build.

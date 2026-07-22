# Deployment (Cloudflare Workers)

This project deploys via Cloudflare's Git-connected **Workers** integration (the modern unified successor to classic Cloudflare Pages), not the classic Pages "build command / output directory" dashboard settings. Deployment is entirely driven by `wrangler.jsonc` in the repo root — Cloudflare reads it directly, so there's no separate dashboard build configuration to keep in sync. This exact pattern is proven in production on the sibling OpenToolbox project (`tools.drewcassidy.dev`) — see "Differences from OpenToolbox" below for what's deliberately not copied.

The site itself is fully static (`output: "static"` in `astro.config.mjs`, every page prerendered, no SSR, no environment variables or secrets required). The `@astrojs/cloudflare` adapter and `wrangler.jsonc` exist only so Cloudflare's Workers platform knows how to serve that static output — there is no server-side application logic.

## Production target

- Production URL: **https://apps.drewcassidy.dev**
- This is a separate Cloudflare project from both the existing `drewcassidy.dev` portfolio site and the `tools.drewcassidy.dev` (OpenToolbox) project. It must stay its own project, attached only to the `apps` subdomain — it does not touch the root domain's or `tools` subdomain's DNS record, project, or deployment.

## Exact Cloudflare configuration

| Setting           | Value                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Integration type  | **Workers** (Git-connected), not classic Pages                                                                                  |
| Framework preset  | None needed — Cloudflare reads `wrangler.jsonc` directly                                                                        |
| Production branch | `master`                                                                                                                        |
| Build command     | Not set manually — driven by `wrangler.jsonc`; Cloudflare runs `npm install && npm run build` per the repo's own `package.json` |
| Output directory  | Not set manually — `wrangler.jsonc`'s `assets.directory` (`./dist/client`) is authoritative                                     |
| Root directory    | Repository root (`/`)                                                                                                           |
| Node version      | 22.12.0 or later (see `package.json`'s `engines.node`)                                                                          |
| Worker name       | `openapps` (`wrangler.jsonc`'s `name`)                                                                                          |

## How the build maps to `wrangler.jsonc`

`npm run build` (`astro build`) produces:

- `dist/client/` — every static asset: HTML, CSS, JS, `robots.txt`, the sitemap, favicon. **This is what actually gets served.**
- `dist/server/` — a Cloudflare Worker entry Astro generates for the adapter's plumbing (routing/headers), not application logic.

`wrangler.jsonc` points Cloudflare at that split:

```jsonc
"assets": {
  "directory": "./dist/client", // must be dist/client, not dist — the adapter build always splits client/server
  "binding": "ASSETS",
},
```

**If this ever points at plain `./dist` instead of `./dist/client`, the deploy will build "successfully" but serve nothing usable.** This is a known incident class on the sibling OpenToolbox project (Cloudflare's own auto-generated config PR once guessed `./dist`) — this repo's `wrangler.jsonc` is written correctly from the start specifically to avoid repeating it. If the site ever goes blank/404 after a config change, check this value first.

## Verifying the config without deploying

```
npm run build
npx wrangler deploy --dry-run
```

Look for `Configuration being used: dist\client\wrangler.json` (confirms the adapter's build-generated config was picked up) and `Read N files from the assets directory .../dist/client` (confirms the directory is correct). Verified locally for this project: 39 files read, no errors.

## Connecting the project (first time)

1. Cloudflare dashboard → Workers & Pages → Create → **Workers** → connect this GitHub repository (not the classic "Pages" creation flow).
2. Cloudflare reads `wrangler.jsonc` automatically; no manual build command/output directory fields need to be set for this integration type.
3. Set **Production branch** to `master`.
4. Deploy once to get a working `*.workers.dev` URL and confirm it actually serves the homepage (not just that the build step succeeded).
5. Add the custom domain: project → **Domains & Routes** → add `apps.drewcassidy.dev`. If `drewcassidy.dev` is already on this Cloudflare account, Cloudflare can create the DNS record automatically (a record for the `apps` subdomain only) — this does not modify the root domain's or `tools` subdomain's record, project, or deployment.
6. Wait for the domain to show "Active" before relying on it.

## Local development and previews

- `npm run dev` runs the plain Astro dev server.
- `npm run preview` builds and runs `wrangler dev` against the built output — closer to how the real Worker will behave than `astro preview` alone, and is what was used to verify this project's UI locally (see verification notes in the repo history / PR description).
- **Known local-only issue**: in this development sandbox, `astro dev` (and, historically, the same command on the sibling OpenToolbox project) fails dynamic routes with a Miniflare `fetch failed` error — a local networking limitation of the `@astrojs/cloudflare` adapter's dev-mode Workers emulation in this environment, unrelated to app code or the static build. `npm run build` + `npx wrangler dev` (i.e. `npm run preview`) is unaffected and was used for all interactive browser verification. If this surfaces again, verify via `npm run preview` rather than `npm run dev` before assuming the code is broken.
- Preview deployments still declare canonical/Open Graph URLs pointing at `https://apps.drewcassidy.dev` rather than the preview host — intentional, standard SEO practice.

## Verifying a live deploy

After a deploy, check the actual served site, not just the build log:

- The homepage loads (not blank, not a Cloudflare error page). If it doesn't, check `assets.directory` in `wrangler.jsonc` first.
- `/robots.txt` returns the expected content with the production `Sitemap:` URL.
- `/sitemap-index.xml` and `/sitemap-0.xml` list the production URLs for every app/category page.
- An app page's `<link rel="canonical">` and Open Graph tags point at `https://apps.drewcassidy.dev/...`, not a preview host.
- The Kanban Board actually loads its client-side UI (not stuck on "Loading your boards…") and localStorage persists across a reload.

## Differences from the OpenToolbox configuration

The overall deployment pattern (Workers integration, `wrangler.jsonc`-driven, static output, `dist/client` split) is copied deliberately because it's proven. What's intentionally different:

- **Project/Worker name and domain**: `openapps` / `apps.drewcassidy.dev`, a fully separate Cloudflare project from `opentoolbox` / `tools.drewcassidy.dev`.
- **No `vite.resolve.alias` workarounds for `pdf-lib`/`tslib`, and no `onnxruntime-web-use-extern-wasm` vite condition.** OpenToolbox needs those because specific tools bundle `pdf-lib` and an ONNX runtime with known CJS/ESM interop and asset-size issues. OpenApps' current app set (Kanban Board) has no such dependency, so `astro.config.mjs` here is simpler. Add the equivalent workaround only if a future app actually pulls in a library with the same problem — don't pre-copy it speculatively.
- **No `qrcode-generator`, `pdf-lib`, `pdfjs-dist`, `onnxruntime-web`, `fflate` dependencies.** Those are OpenToolbox-specific tool implementations; OpenApps' `package.json` only includes what its current apps actually use.
- **Accent color / favicon** differ (teal vs. OpenToolbox's orange) — a deliberate visual distinction between the two sibling products, not a functional difference.

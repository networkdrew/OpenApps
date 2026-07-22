# OpenApps

A free, privacy-first museum of browser apps that replace paid and subscription software. No accounts, no tracking — most apps keep all data on your device, and every app's page states exactly how it handles yours.

Production: **https://apps.drewcassidy.dev**

This is a companion project to [OpenToolbox](https://tools.drewcassidy.dev) (a separate repository and Cloudflare project) — OpenApps is for full, persistent, stateful apps (a kanban board, a note editor, a drawing tool); OpenToolbox is for single-purpose, mostly stateless converters and generators. They share proven architectural patterns but are independently deployed and must not be conflated.

## Stack

Astro (static output) + React islands + TypeScript (strict) + Tailwind CSS v4 + Zod + Fuse.js (search) + Vitest + Testing Library. Deployed as a fully static site to Cloudflare Workers.

## Getting started

```
npm install
npm run dev
```

## Scripts

| Script                            | Purpose                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | Local dev server                                              |
| `npm run build`                   | Production build (`dist/client` is the deployable output)     |
| `npm run check`                   | Astro/TypeScript type checking                                |
| `npm run lint` / `lint:fix`       | ESLint                                                        |
| `npm run format` / `format:check` | Prettier                                                      |
| `npm run test` / `test:watch`     | Vitest                                                        |
| `npm run verify`                  | format:check + lint + check + test + build, in sequence       |
| `npm run preview`                 | Build, then run `wrangler dev` against the real static output |
| `npm run deploy`                  | Build, then `wrangler deploy`                                 |

Run `npm run verify` before considering any change done.

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — durable rules for AI-assisted work in this repo
- [`docs/architecture.md`](./docs/architecture.md) — how the site is put together
- [`docs/adding-an-app.md`](./docs/adding-an-app.md) — the full recipe for adding one new app
- [`docs/search-and-discovery.md`](./docs/search-and-discovery.md) — the registry schema and search engine, field by field
- [`docs/local-data-standard.md`](./docs/local-data-standard.md) — the shared local-first storage conventions
- [`docs/deployment.md`](./docs/deployment.md) — exact Cloudflare configuration and how to deploy
- [`docs/roadmap.md`](./docs/roadmap.md) — what's shipped and what's next

## License

Private project; no license granted for reuse.

import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { SITE_URL } from "./src/lib/config/site.ts";

export default defineConfig({
  site: SITE_URL,
  output: "static",
  integrations: [react(), sitemap()],
  // OpenNotes and OpenBudget ship at permanent top-level routes (/notes/,
  // /budget/) instead of the default /apps/<slug>/ page — see
  // src/pages/apps/[slug].astro's TOP_LEVEL_ROUTE_APP_IDS. This keeps every
  // existing /apps/<slug>/ link (cards, search results, sitemap) working by
  // forwarding to the real page.
  redirects: {
    "/apps/notes": "/notes",
    "/apps/budget": "/budget",
  },
  // Static output + the Cloudflare adapter together means: prerender
  // everything (no SSR), but still emit the thin Worker entry Cloudflare's
  // Workers Static Assets deployment needs to serve dist/client (see
  // wrangler.jsonc and docs/deployment.md).
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});

import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { SITE_URL } from "./src/lib/config/site.ts";
import { apps } from "./src/lib/apps/registry.ts";

// Individual app pages live at /<slug>/ off the root (see the "URL
// structure" note in docs/architecture.md) — not /apps/<slug>/, which would
// repeat "apps" pointlessly given the subdomain is already apps.*. This
// keeps every old /apps/<slug>/ link (cards, search results, bookmarks)
// working by forwarding to the real page. /apps/ itself (the "browse all"
// listing page) is untouched — only individual app pages moved.
const legacyAppRedirects = Object.fromEntries(
  apps.map((app) => [`/apps/${app.slug}/`, `/${app.slug}/`]),
);

export default defineConfig({
  site: SITE_URL,
  output: "static",
  integrations: [react(), sitemap()],
  redirects: legacyAppRedirects,
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

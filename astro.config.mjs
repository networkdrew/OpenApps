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
// working by forwarding to the real page. The old /apps/ "browse all"
// listing page is gone (the homepage desktop is now the app store), so it
// redirects home.
const legacyAppRedirects = Object.fromEntries(
  apps.map((app) => [`/apps/${app.slug}/`, `/${app.slug}/`]),
);

const redirects = {
  "/apps/": "/",
  ...legacyAppRedirects,
};

export default defineConfig({
  site: SITE_URL,
  output: "static",
  integrations: [react(), sitemap()],
  redirects,
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

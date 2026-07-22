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
  // OpenNotes ships at a permanent top-level route (/notes/) instead of the
  // default /apps/<slug>/ page — see src/pages/apps/[slug].astro's
  // TOP_LEVEL_ROUTE_APP_IDS. This keeps every existing /apps/notes/ link
  // (cards, search results, sitemap) working by forwarding to the real page.
  redirects: {
    "/apps/notes": "/notes",
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

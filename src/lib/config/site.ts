/**
 * Single source of truth for site-wide identity and URLs.
 * `astro.config.mjs` imports SITE_URL from here to set Astro's `site` field,
 * so this file — not astro.config — is the one place to change the
 * production origin. Astro also exposes it at runtime as `Astro.site`.
 */

export const SITE_NAME = "OpenApps";

export const SITE_TAGLINE = "Free apps that replace paid software";

export const SITE_DESCRIPTION =
  "A free, privacy-first museum of browser apps that replace paid and subscription software — no accounts, no tracking, your data stays on your device.";

/** Production canonical origin, no trailing slash. Mirrors astro.config.mjs `site`. */
export const SITE_URL = "https://apps.drewcassidy.dev";

export const GITHUB_URL: string | undefined = undefined;

export const NAV_LINKS = [
  { label: "All apps", href: "/apps" },
  { label: "Categories", href: "/apps#categories" },
] as const;

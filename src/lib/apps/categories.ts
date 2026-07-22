import { categorySchema, type Category } from "./schema";

/**
 * Every category an app can belong to. A category only appears here once it
 * has at least one real app (enforced by registry.test.ts) — see
 * docs/adding-an-app.md. Kept broad and few in number on purpose: with
 * hundreds of apps, subcategories (a per-app free-text field) and search are
 * what keep things navigable, not an ever-growing category list.
 *
 * The planned full taxonomy (add entries here as the first app in each
 * lands — see docs/roadmap.md for what's next):
 * productivity, notes-writing, creative-design, developer-tools, media,
 * utilities, games.
 */
const rawCategories = [
  {
    id: "productivity",
    name: "Productivity",
    description:
      "Plan, organize, and track work — boards, lists, and project tools.",
    icon: "layout-grid",
  },
] as const satisfies readonly Category[];

export const categories: readonly Category[] = rawCategories.map((c) =>
  categorySchema.parse(c),
);

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

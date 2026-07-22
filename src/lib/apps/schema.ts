import { z } from "zod";

const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A second, orthogonal axis to category — "what kind of thing is this app"
 * rather than "what domain is it in". Lets the directory filter e.g.
 * persistent multi-item workspaces (a board, a notebook) separately from
 * one-shot stateless utilities, independent of which category they're in.
 */
export const appTypeSchema = z.enum([
  "workspace", // persistent, multi-item, user-authored data (boards, docs, projects)
  "utility", // single-purpose, mostly stateless tool
  "generator", // produces output artifacts from input/config
  "game", // played, not "used"
  "reference", // lookup/reference material, little or no user data
]);
export type AppType = z.infer<typeof appTypeSchema>;

export const storageModeSchema = z.enum([
  "none", // nothing persisted; state lives only for the page's lifetime
  "local-storage", // browser localStorage
  "indexed-db", // browser IndexedDB (larger/structured data)
  "local-files", // File System Access API / manual download-import, no automatic persistence
]);
export type StorageMode = z.infer<typeof storageModeSchema>;

export const privacySchema = z.object({
  storageMode: storageModeSchema,
  /** True if this app ever transmits user content off the device (must be honest — drives the privacy badge copy). */
  dataLeavesDevice: z.boolean(),
  /** One or two concrete, specific sentences — not marketing language. */
  details: z.string().min(1),
});
export type Privacy = z.infer<typeof privacySchema>;

/**
 * The authoritative shape of one app's discovery metadata. Every field here
 * exists because it answers a real way a person might look for this app —
 * see docs/search-and-discovery.md before adding, removing, or leaving a
 * field empty for a new app.
 */
export const appMetaSchema = z.object({
  /** Permanent internal identifier. Never reuse or repurpose after publishing. */
  id: z.string().regex(kebab, "id must be kebab-case"),
  /** URL path segment under /apps/. Usually equal to id; kept distinct so an
   *  app can be renamed for SEO without breaking its permanent id. */
  slug: z.string().regex(kebab, "slug must be kebab-case"),
  /** Key into AppIslandLoader's static import map. Defaults to `id` if omitted —
   *  only set this if the component key must diverge from the permanent id. */
  componentId: z.string().regex(kebab).optional(),

  name: z.string().min(1),
  shortDescription: z.string().min(1).max(160),
  /** Paragraphs shown in the app page's intro. */
  description: z.array(z.string().min(1)).min(1),

  categoryId: z.string().min(1),
  /** Free-text sub-groupings within the category, e.g. "task management" under "Productivity". */
  subcategories: z.array(z.string().min(1)).default([]),
  appType: appTypeSchema,

  tags: z.array(z.string().min(1)).default([]),
  /** Other names people call this app or its concept (e.g. "task board" for a kanban board). */
  aliases: z.array(z.string().min(1)).default([]),
  /** Alternate product-style names this app could plausibly be called. */
  alternateNames: z.array(z.string().min(1)).default([]),
  /** Common misspellings/typos worth matching (only add real, likely ones). */
  misspellings: z.array(z.string().min(1)).default([]),

  /** Concrete capabilities ("drag and drop cards", "due dates"). */
  features: z.array(z.string().min(1)).default([]),
  /** Verb-phrased tasks the app performs ("organize work into columns"). */
  tasksPerformed: z.array(z.string().min(1)).default([]),
  /** Problems/pain points the app addresses ("losing track of what stage a job is in"). */
  problemsSolved: z.array(z.string().min(1)).default([]),
  /** Natural-language phrases a user might type or say, verbatim search bait. */
  descriptivePhrases: z.array(z.string().min(1)).default([]),
  /** Who this is for ("freelancers", "students", "small teams"). */
  audiences: z.array(z.string().min(1)).default([]),
  /** Concrete scenarios ("planning a home renovation", "tracking job applications"). */
  useCases: z.array(z.string().min(1)).default([]),

  /** Named paid products this app is a free alternative to ("Trello", "Asana"). */
  replacesProducts: z.array(z.string().min(1)).default([]),
  /** Categories of paid software this replaces ("project management SaaS"). */
  replacesCategories: z.array(z.string().min(1)).default([]),

  privacy: privacySchema,
  offlineCapable: z.boolean(),
  /** Only needed when offline behavior has a caveat worth stating. */
  offlineNotes: z.string().optional(),

  featured: z.boolean().default(false),
  /** ISO date (YYYY-MM-DD) the app was first published. Drives "new" badges and sort. */
  addedAt: z.string().regex(isoDate, "addedAt must be YYYY-MM-DD"),
  /** ISO date (YYYY-MM-DD) of the last meaningful update. Defaults to addedAt at creation. */
  updatedAt: z.string().regex(isoDate, "updatedAt must be YYYY-MM-DD"),

  /** ids of other apps to surface as "related". */
  relatedApps: z.array(z.string()).default([]),
  /** Extra search terms that don't fit any category above. */
  searchKeywords: z.array(z.string().min(1)).default([]),

  /** Short, practical tips shown below the app UI. */
  usageNotes: z.array(z.string().min(1)).default([]),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .default({}),
});

export type AppMeta = z.infer<typeof appMetaSchema>;

export const categorySchema = z.object({
  id: z.string().regex(kebab, "id must be kebab-case"),
  name: z.string().min(1),
  description: z.string().min(1),
  /** lucide icon name, rendered via lucide-static. */
  icon: z.string().min(1),
});

export type Category = z.infer<typeof categorySchema>;

import { appMetaSchema, type AppMeta } from "./schema";

/**
 * The authoritative list of every app on the site. Nothing else defines app
 * metadata — pages, search, the sitemap, and navigation all read from here.
 * See docs/adding-an-app.md for the full checklist, and
 * docs/search-and-discovery.md for what every field below is for and why
 * it must be filled in thoughtfully, not left as boilerplate.
 */
const rawApps = [
  {
    id: "kanban-board",
    slug: "kanban-board",
    name: "Kanban Board",
    shortDescription:
      "Organize work into boards, columns, and cards — a free, private Trello alternative that saves everything on your device.",
    description: [
      "Create as many boards as you need, add columns for each stage of your workflow, and fill them with cards you can drag between lists, describe, label, prioritize, and give due dates. Search and filter across a board instantly, undo or redo any change, and duplicate a whole board as a template for the next project.",
      "Every board lives entirely in your browser's local storage — there's no account, no server, and no sign-up. Export any board to a JSON file to back it up or move it to another device, import it back in, or wipe all local data in one confirmed action whenever you want a clean slate.",
    ],
    categoryId: "productivity",
    subcategories: ["task management", "project planning", "team boards"],
    appType: "workspace",
    tags: [
      "kanban",
      "board",
      "task management",
      "project management",
      "to-do list",
      "workflow",
      "cards",
      "columns",
      "backlog",
    ],
    aliases: [
      "task board",
      "kanban board",
      "project board",
      "sprint board",
      "work board",
      "to-do board",
    ],
    alternateNames: ["Local Kanban", "Kanban Planner", "Board Planner"],
    misspellings: ["kanbam board", "kanban bord", "canban board", "kan ban"],
    features: [
      "multiple boards",
      "unlimited columns per board",
      "drag-and-drop cards",
      "keyboard-based card movement",
      "touch-friendly dragging",
      "card descriptions",
      "labels",
      "priority levels",
      "due dates",
      "search and filters",
      "autosave",
      "undo and redo",
      "board duplication",
      "JSON export and import",
      "complete local data deletion",
    ],
    tasksPerformed: [
      "organize work into columns",
      "move cards between lists",
      "track jobs through stages",
      "plan a project without an account",
      "prioritize tasks",
      "set due dates on tasks",
      "manage a backlog",
      "visualize a workflow",
    ],
    problemsSolved: [
      "losing track of what stage a task is in",
      "needing a paid subscription just to organize a to-do list",
      "wanting a private task board without creating an account",
      "juggling sticky notes for a project",
      "needing to see a whole workflow at a glance",
      "team boards that require monthly per-seat billing for personal use",
    ],
    descriptivePhrases: [
      "organize work into columns",
      "free Trello alternative",
      "track jobs through stages",
      "move cards between lists",
      "project planning without an account",
      "visual to-do list with columns",
      "drag and drop task board",
      "private task board with no sign up",
    ],
    audiences: [
      "freelancers",
      "small teams",
      "students",
      "job seekers",
      "personal project planners",
      "software developers",
      "solo founders",
    ],
    useCases: [
      "tracking job applications",
      "planning a home renovation",
      "running a personal sprint board",
      "managing a content calendar",
      "organizing a house move",
      "tracking a backlog of ideas",
      "planning a wedding or event",
    ],
    replacesProducts: [
      "Trello",
      "Asana",
      "Monday.com",
      "ClickUp",
      "Jira (for lightweight boards)",
    ],
    replacesCategories: [
      "project management software",
      "kanban SaaS",
      "task management apps",
    ],
    privacy: {
      storageMode: "local-storage",
      dataLeavesDevice: false,
      details:
        "All boards, columns, and cards are stored only in your browser's localStorage. Nothing is ever transmitted to a server. Export a JSON backup any time, or delete everything permanently from the app's data controls.",
    },
    offlineCapable: true,
    featured: true,
    addedAt: "2026-07-21",
    updatedAt: "2026-07-21",
    relatedApps: [],
    searchKeywords: [
      "scrum board",
      "agile board",
      "sprint planning",
      "workflow board",
      "to-do columns",
      "swimlane",
      "card based planner",
    ],
    usageNotes: [
      "Drag cards with a mouse or touch, or press Enter on a focused card to open a keyboard-friendly move menu.",
      "Use Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or the toolbar buttons) to undo and redo — including column, card, and board changes.",
      "Export creates a single JSON file with every board; import merges or replaces from that same file.",
      "Clearing all data is permanent and asks for confirmation first — export a backup beforehand if you might want it later.",
    ],
    seo: {
      description:
        "Free kanban board app that runs entirely in your browser. Organize boards, columns, and cards with drag-and-drop, labels, due dates, and JSON export — no account required.",
    },
  },
] as const;

export const apps: readonly AppMeta[] = rawApps.map((a) =>
  appMetaSchema.parse(a),
);

export function getAppBySlug(slug: string): AppMeta | undefined {
  return apps.find((a) => a.slug === slug);
}

export function getAppById(id: string): AppMeta | undefined {
  return apps.find((a) => a.id === id);
}

export function getFeaturedApps(): AppMeta[] {
  return apps.filter((a) => a.featured);
}

export function getRecentApps(limit = 4): AppMeta[] {
  return [...apps]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, limit);
}

export function getAppsByCategory(categoryId: string): AppMeta[] {
  return apps.filter((a) => a.categoryId === categoryId);
}

export function getAppsByType(appType: AppMeta["appType"]): AppMeta[] {
  return apps.filter((a) => a.appType === appType);
}

export function getRelatedApps(app: AppMeta): AppMeta[] {
  return app.relatedApps
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is AppMeta => a !== undefined);
}

/** The key AppIslandLoader should use to find this app's component. */
export function getComponentId(app: AppMeta): string {
  return app.componentId ?? app.id;
}

const NEW_WINDOW_DAYS = 30;

export function isNewApp(app: AppMeta, now = new Date()): boolean {
  const added = new Date(`${app.addedAt}T00:00:00Z`);
  const ageMs = now.getTime() - added.getTime();
  return ageMs >= 0 && ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

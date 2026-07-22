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
    relatedApps: ["budget"],
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
  {
    id: "notes",
    slug: "notes",
    name: "OpenNotes",
    shortDescription:
      "Notebooks, folders, tags, and linked notes with Markdown and full-text search — a free, private Evernote alternative that saves everything on your device.",
    description: [
      "Write in Markdown with a live preview, organize notes into notebooks and nested folders, and tag anything across notebooks. Pin your most-used notes, favorite the ones you come back to, and archive or trash the rest without losing them — everything stays recoverable until you choose to delete it forever.",
      "Link notes together with [[wiki-style links]] and jump between them instantly; every note automatically shows its backlinks, so your notes build into a real personal knowledge base instead of a flat list. Start from a blank page or one of several built-in templates (meeting notes, daily journal, to-do list, project brief, reading notes), or save your own.",
      "Every notebook, folder, note, and template lives entirely in your browser's local storage — there's no account, no server, and no sync. Search instantly across every note's title, content, and tags, undo or redo any change, export a full JSON backup (or just one note, or everything, as Markdown), and wipe all local data in one confirmed action whenever you want a clean slate.",
    ],
    categoryId: "notes-writing",
    subcategories: [
      "note taking",
      "personal knowledge base",
      "Markdown editor",
    ],
    appType: "workspace",
    tags: [
      "notes",
      "notebook",
      "markdown",
      "wiki links",
      "backlinks",
      "tags",
      "folders",
      "personal knowledge base",
      "journal",
      "to-do list",
      "templates",
    ],
    aliases: [
      "note app",
      "note taking app",
      "markdown notes",
      "personal wiki",
      "digital notebook",
      "knowledge base app",
    ],
    alternateNames: ["Local Notes", "OpenNotes Notebook", "Markdown Notebook"],
    misspellings: [
      "evernot",
      "evernote alternative",
      "markdown notess",
      "notess app",
    ],
    features: [
      "notebooks and nested folders",
      "tags across notebooks",
      "favorites and pinning",
      "archive",
      "trash with recovery",
      "Markdown editing with live preview",
      "split edit/preview view",
      "formatting toolbar",
      "[[wiki links]] and automatic backlinks",
      "built-in and custom templates",
      "instant full-text search",
      "sorting by updated, created, or title",
      "keyboard shortcuts",
      "autosave",
      "undo and redo",
      "JSON backup and restore",
      "Markdown export (single note or all notes)",
      "complete local data deletion",
      "focus mode and fullscreen",
      "mobile-friendly single-pane workspace",
    ],
    tasksPerformed: [
      "write private notes offline",
      "organize notes into notebooks and folders",
      "link personal knowledge pages together",
      "tag notes across notebooks",
      "search across every note instantly",
      "keep a daily journal",
      "take meeting notes",
      "build a personal wiki",
      "draft in Markdown with a live preview",
      "recover an accidentally deleted note",
      "back up notes to a file",
    ],
    problemsSolved: [
      "needing a paid subscription just to take notes",
      "wanting a private notebook without creating an account",
      "notes scattered across sticky notes and random files",
      "losing an old note with no way to get it back",
      "notes with no way to connect related ideas",
      "wanting to search across years of notes instantly",
      "needing to write Markdown without installing an app",
      "wanting a knowledge base that isn't locked to a subscription",
    ],
    descriptivePhrases: [
      "write private notes offline",
      "free Evernote alternative",
      "link personal knowledge pages",
      "notes app with no account",
      "markdown editor with live preview",
      "personal wiki with backlinks",
      "notebook app that works offline",
      "private note taking app",
      "note app with tags and folders",
      "simple notes alternative to Notion",
    ],
    audiences: [
      "students",
      "writers",
      "researchers",
      "software developers",
      "journalers",
      "freelancers",
      "knowledge workers",
      "privacy-conscious note takers",
    ],
    useCases: [
      "keeping a daily journal",
      "building a personal knowledge base",
      "taking meeting notes",
      "drafting articles or blog posts in Markdown",
      "organizing research notes by topic",
      "writing a reading list with linked notes",
      "planning a project with a brief and to-do list",
      "keeping a private diary with no cloud account",
    ],
    replacesProducts: [
      "Evernote",
      "Notion",
      "Simplenote",
      "OneNote",
      "Obsidian",
    ],
    replacesCategories: [
      "note-taking SaaS",
      "personal knowledge management apps",
      "Markdown editors",
    ],
    privacy: {
      storageMode: "local-storage",
      dataLeavesDevice: false,
      details:
        "Every notebook, folder, note, tag, and template is stored only in your browser's localStorage. Nothing is ever transmitted to a server. Export a JSON backup any time, or delete everything permanently from the app's data controls.",
    },
    offlineCapable: true,
    featured: true,
    addedAt: "2026-07-22",
    updatedAt: "2026-07-22",
    relatedApps: ["kanban-board", "budget"],
    searchKeywords: [
      "second brain",
      "zettelkasten",
      "markdown notebook",
      "linked notes",
      "note linking",
      "private journal app",
      "offline notes",
      "note organizer",
    ],
    usageNotes: [
      "Type [[Note Title]] anywhere in a note to link to another note — click it to jump there, or create it on the spot if it doesn't exist yet.",
      "Ctrl/Cmd+F focuses search, Ctrl/Cmd+N creates a new note, and Ctrl/Cmd+E toggles preview — Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z undo and redo app changes (your browser's own undo still works while typing in a note).",
      "Trash keeps deleted notes recoverable until you empty it or delete a note forever; archiving hides a note without deleting it.",
      "Export creates a JSON file with everything (for backup/restore), or a Markdown file for one note or all notes at once.",
      "Deleting a notebook moves its notes to Trash rather than erasing them; deleting a folder only unfiles its notes, it never deletes them.",
    ],
    seo: {
      description:
        "Free Markdown notes app that runs entirely in your browser. Notebooks, folders, tags, wiki links with backlinks, templates, full-text search, and JSON/Markdown export — no account required.",
    },
  },
  {
    id: "budget",
    slug: "budget",
    name: "OpenBudget",
    shortDescription:
      "Accounts, budgets, recurring bills, and savings goals with real charts — a free, private Mint alternative that never connects to your bank.",
    description: [
      "Track every account's balance by hand — checking, savings, credit cards, cash, and investments — and log income, expenses, and transfers between them. Organize spending with built-in categories or your own, set a monthly budget per category and watch it fill up as you spend, and set up recurring bills and paychecks so OpenBudget quietly logs them for you when they come due.",
      "The dashboard turns your data into charts that actually help: income vs. expenses over the last six months, a spending breakdown by category, a running balance trend, and at-a-glance budget check-ins for the categories closest to their limit. Search and filter every transaction by account, category, type, date, or amount, and set savings goals — an emergency fund, a vacation, a big purchase — with simple contributions you track toward a target.",
      "There is no bank login, no linked accounts, and no server: every account, transaction, category, budget, recurring rule, and goal lives only in your browser's local storage. Import transactions from a bank or card CSV export with your own column mapping, export everything to CSV or a full JSON backup, restore a backup any time, undo or redo any change, and permanently delete all local data in one confirmed action whenever you want a clean slate.",
    ],
    categoryId: "productivity",
    subcategories: ["personal finance", "budgeting", "expense tracking"],
    appType: "workspace",
    tags: [
      "budget",
      "budgeting",
      "personal finance",
      "expense tracker",
      "money management",
      "bills",
      "savings goals",
      "recurring transactions",
      "accounts",
      "net worth",
    ],
    aliases: [
      "budget app",
      "budget tracker",
      "expense tracker",
      "money tracker",
      "personal finance app",
      "bill tracker",
      "spending tracker",
    ],
    alternateNames: ["Local Budget", "OpenBudget Planner", "Budget Ledger"],
    misspellings: [
      "buget tracker",
      "budjet app",
      "openbudjet",
      "expence tracker",
    ],
    features: [
      "unlimited accounts (checking, savings, credit card, cash, investment)",
      "income, expense, and transfer transactions",
      "built-in and custom categories",
      "monthly budgets per category with progress meters",
      "copy last month's budget limits forward",
      "recurring transactions (bills, subscriptions, paychecks) with flexible frequency",
      "automatic generation of recurring transactions when they come due",
      "savings goals with contribution history",
      "transaction search, filters, and sorting",
      "dashboard with income/expense, category breakdown, and balance trend charts",
      "CSV import with column mapping",
      "CSV and JSON export",
      "full JSON backup and restore",
      "undo and redo",
      "autosave",
      "complete local data deletion",
      "responsive desktop and mobile layouts",
      "focus mode and fullscreen",
      "light and dark themes",
    ],
    tasksPerformed: [
      "track monthly spending",
      "manage bills offline",
      "set a monthly budget by category",
      "track account balances by hand",
      "log income and expenses",
      "record transfers between accounts",
      "set up recurring bills and paychecks",
      "import bank transactions from a CSV file",
      "search and filter transaction history",
      "set and track a savings goal",
      "back up personal finance data to a file",
      "see spending broken down by category",
    ],
    problemsSolved: [
      "needing a paid subscription just to track a budget",
      "not wanting to link a bank account to a budgeting app",
      "losing track of which bills are due this month",
      "wanting to see spending by category without exporting spreadsheets",
      "budgeting apps that stop working for free after a trial",
      "wanting a private place to track money without creating an account",
      "forgetting a recurring bill until it's overdue",
      "not knowing if this month's spending is on track for the budget",
    ],
    descriptivePhrases: [
      "track monthly spending",
      "free Mint alternative",
      "personal budget without bank login",
      "manage bills offline",
      "budget app with no account",
      "private expense tracker",
      "budget tracker that doesn't connect to my bank",
      "simple budgeting app with charts",
      "track recurring bills and subscriptions",
      "envelope budgeting without a subscription",
    ],
    audiences: [
      "budget-conscious individuals",
      "students",
      "freelancers",
      "couples managing shared finances",
      "people paying off debt",
      "privacy-conscious spenders",
      "anyone who doesn't want to link a bank account",
    ],
    useCases: [
      "tracking monthly spending against a budget",
      "managing rent, utilities, and subscription bills",
      "saving for an emergency fund or vacation",
      "reviewing where money went each month",
      "importing a year of bank transactions from CSV",
      "tracking balances across several accounts",
      "planning cash flow around recurring paychecks and bills",
    ],
    replacesProducts: [
      "Mint",
      "YNAB",
      "EveryDollar",
      "PocketGuard",
      "Monarch Money",
    ],
    replacesCategories: [
      "personal budgeting apps",
      "expense tracking SaaS",
      "money management subscriptions",
    ],
    privacy: {
      storageMode: "local-storage",
      dataLeavesDevice: false,
      details:
        "Every account, transaction, category, budget, recurring rule, and goal is stored only in your browser's localStorage. OpenBudget never connects to a bank, never links accounts, and never transmits your financial data to a server. Export a full JSON backup or a CSV of your transactions any time, or delete everything permanently from the app's data controls.",
    },
    offlineCapable: true,
    featured: true,
    addedAt: "2026-07-22",
    updatedAt: "2026-07-22",
    relatedApps: ["kanban-board", "notes"],
    searchKeywords: [
      "envelope budget",
      "zero-based budget",
      "cash flow tracker",
      "spending tracker",
      "bill organizer",
      "finance dashboard",
      "money app no bank",
      "offline budgeting",
    ],
    usageNotes: [
      "Add an account first with its current balance, then log transactions — the balance updates automatically as you add income, expenses, and transfers.",
      "Recurring transactions generate automatically when their due date arrives while you have the app open; pause a recurring rule instead of deleting it if you just want to skip it for a while.",
      "CSV import lets you map whichever columns your bank or card export uses to date, amount, payee, category, and memo, with a preview before anything is imported.",
      "Backups are a single JSON file with everything; CSV export is transactions only, for spreadsheets or other tools.",
      "Deleting all data is permanent and asks for confirmation first — export a backup beforehand if you might want it later.",
    ],
    seo: {
      description:
        "Free personal budgeting app that runs entirely in your browser. Accounts, budgets, recurring bills, savings goals, and real charts — no bank login, no account, CSV/JSON export.",
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

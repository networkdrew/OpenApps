export type Priority = "none" | "low" | "medium" | "high";

export const PRIORITIES: Priority[] = ["none", "low", "medium", "high"];

export interface KanbanLabel {
  id: string;
  name: string;
  /** A key into a fixed swatch palette (see LABEL_COLORS in the UI layer), not a raw CSS color, so themes stay consistent. */
  color: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  labelIds: string[];
  priority: Priority;
  /** ISO date (YYYY-MM-DD), or null if unset. */
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cardIds: string[];
}

export interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
  cards: Record<string, KanbanCard>;
  labels: KanbanLabel[];
  createdAt: string;
  updatedAt: string;
}

export interface KanbanState {
  version: 1;
  boards: KanbanBoard[];
  activeBoardId: string | null;
}

export const LABEL_COLORS = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
] as const;

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createEmptyCard(title: string): KanbanCard {
  const ts = nowIso();
  return {
    id: newId(),
    title,
    description: "",
    labelIds: [],
    priority: "none",
    dueDate: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function createColumn(title: string): KanbanColumn {
  return { id: newId(), title, cardIds: [] };
}

const DEFAULT_COLUMN_TITLES = ["To Do", "In Progress", "Done"];

export function createBoard(name: string): KanbanBoard {
  const ts = nowIso();
  return {
    id: newId(),
    name,
    columns: DEFAULT_COLUMN_TITLES.map((title) => createColumn(title)),
    cards: {},
    labels: [],
    createdAt: ts,
    updatedAt: ts,
  };
}

export function createEmptyState(): KanbanState {
  return { version: 1, boards: [], activeBoardId: null };
}

/** Deep-clones a board with fresh ids for every column, card, and label — used by "duplicate board". */
export function duplicateBoard(
  board: KanbanBoard,
  newName: string,
): KanbanBoard {
  const idMap = new Map<string, string>();
  const ts = nowIso();

  const cards: Record<string, KanbanCard> = {};
  for (const card of Object.values(board.cards)) {
    const id = newId();
    idMap.set(card.id, id);
    cards[id] = { ...card, id, createdAt: ts, updatedAt: ts };
  }

  const labelIdMap = new Map<string, string>();
  const labels = board.labels.map((label) => {
    const id = newId();
    labelIdMap.set(label.id, id);
    return { ...label, id };
  });
  for (const card of Object.values(cards)) {
    card.labelIds = card.labelIds.map((id) => labelIdMap.get(id) ?? id);
  }

  const columns = board.columns.map((column) => ({
    id: newId(),
    title: column.title,
    cardIds: column.cardIds.map((id) => idMap.get(id) ?? id),
  }));

  return {
    id: newId(),
    name: newName,
    columns,
    cards,
    labels,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function isOverdue(dueDate: string | null, now = new Date()): boolean {
  if (!dueDate) return false;
  const due = new Date(`${dueDate}T23:59:59`);
  return due.getTime() < now.getTime();
}

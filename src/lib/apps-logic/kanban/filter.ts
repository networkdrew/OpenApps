import type { KanbanBoard, KanbanCard, Priority } from "./model";
import { normalizeText } from "@/lib/apps/normalize";

export interface CardFilters {
  query?: string;
  labelIds?: string[];
  priority?: Priority;
  overdueOnly?: boolean;
}

export function cardMatchesFilters(
  card: KanbanCard,
  filters: CardFilters,
  now = new Date(),
): boolean {
  if (filters.query?.trim()) {
    const q = normalizeText(filters.query);
    const haystack = normalizeText(`${card.title} ${card.description}`);
    if (!haystack.includes(q)) return false;
  }
  if (filters.labelIds && filters.labelIds.length > 0) {
    if (!filters.labelIds.some((id) => card.labelIds.includes(id)))
      return false;
  }
  if (filters.priority && card.priority !== filters.priority) return false;
  if (filters.overdueOnly) {
    if (!card.dueDate) return false;
    if (new Date(`${card.dueDate}T23:59:59`).getTime() >= now.getTime())
      return false;
  }
  return true;
}

/** Returns the visible card ids per column after applying filters, preserving column order. */
export function filterBoard(
  board: KanbanBoard,
  filters: CardFilters,
  now = new Date(),
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const column of board.columns) {
    result[column.id] = column.cardIds.filter((id) => {
      const card = board.cards[id];
      return card ? cardMatchesFilters(card, filters, now) : false;
    });
  }
  return result;
}

export function hasActiveCardFilters(filters: CardFilters): boolean {
  return !!(
    filters.query?.trim() ||
    (filters.labelIds && filters.labelIds.length > 0) ||
    filters.priority ||
    filters.overdueOnly
  );
}

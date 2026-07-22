import type { KanbanCard, KanbanLabel } from "@/lib/apps-logic/kanban/model";
import { isOverdue } from "@/lib/apps-logic/kanban/model";
import { LABEL_COLOR_SWATCHES, PRIORITY_META } from "./constants";
import Icon from "@/components/react/Icon";

interface CardTileProps {
  card: KanbanCard;
  labels: KanbanLabel[];
  isDragging: boolean;
  isDropTarget: boolean;
  dragHandleProps: React.HTMLAttributes<HTMLElement>;
  registerCard: (id: string, el: HTMLElement | null) => void;
  onOpenEditor: () => void;
  onKeyboardMove: (
    direction: "prev-column" | "next-column" | "up" | "down",
  ) => void;
}

const MOVE_KEY_MAP: Record<
  string,
  "prev-column" | "next-column" | "up" | "down"
> = {
  ArrowLeft: "prev-column",
  ArrowRight: "next-column",
  ArrowUp: "up",
  ArrowDown: "down",
};

/**
 * A card is draggable via pointer events (dragHandleProps) and separately
 * keyboard-movable: focus the card (Tab) and hold Alt with an arrow key to
 * move it — drag-and-drop is an enhancement here, not the only way to
 * reorder. Enter/Space opens the full editor.
 */
export function CardTile({
  card,
  labels,
  isDragging,
  isDropTarget,
  dragHandleProps,
  registerCard,
  onOpenEditor,
  onKeyboardMove,
}: CardTileProps) {
  const cardLabels = labels.filter((l) => card.labelIds.includes(l.id));
  const overdue = isOverdue(card.dueDate);
  const priority = PRIORITY_META[card.priority];

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.altKey) {
      const direction = MOVE_KEY_MAP[e.key];
      if (direction) {
        e.preventDefault();
        onKeyboardMove(direction);
        return;
      }
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenEditor();
    }
  }

  return (
    <div
      ref={(el) => registerCard(card.id, el)}
      role="button"
      tabIndex={0}
      aria-label={`${card.title}. Open card, or hold Alt and press an arrow key to move it.`}
      onClick={onOpenEditor}
      onKeyDown={handleKeyDown}
      {...dragHandleProps}
      className={`border-border bg-bg-elevated hover:border-accent focus-visible:outline-accent flex w-full cursor-grab flex-col gap-2 rounded-md border p-3 text-left transition-colors focus-visible:outline-2 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      } ${isDropTarget ? "border-accent border-2" : ""}`}
    >
      {cardLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cardLabels.map((label) => (
            <span
              key={label.id}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                LABEL_COLOR_SWATCHES[label.color] ?? LABEL_COLOR_SWATCHES.blue
              }`}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <span className="text-text text-sm font-medium">{card.title}</span>
      {(card.priority !== "none" || card.dueDate) && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {card.priority !== "none" && (
            <span className={`flex items-center gap-1 ${priority.className}`}>
              <Icon name="flag" className="h-3 w-3" />
              {priority.label}
            </span>
          )}
          {card.dueDate && (
            <span
              className={`flex items-center gap-1 ${overdue ? "text-danger" : "text-text-muted"}`}
            >
              <Icon name="calendar" className="h-3 w-3" />
              {card.dueDate}
              {overdue ? " (overdue)" : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

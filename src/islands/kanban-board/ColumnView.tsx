import { useEffect, useRef, useState } from "react";
import type {
  KanbanCard,
  KanbanColumn,
  KanbanLabel,
} from "@/lib/apps-logic/kanban/model";
import { CardTile } from "./CardTile";
import { buttonGhost, textField } from "@/components/react/styles";
import Icon from "@/components/react/Icon";

interface ColumnViewProps {
  column: KanbanColumn;
  visibleCardIds: string[];
  totalCardCount: number;
  cardsById: Record<string, KanbanCard>;
  labels: KanbanLabel[];
  dragState: {
    cardId: string | null;
    overColumnId: string | null;
    overBeforeCardId: string | null;
  };
  registerCard: (id: string, el: HTMLElement | null) => void;
  registerColumn: (id: string, el: HTMLElement | null) => void;
  cardHandleProps: (cardId: string) => React.HTMLAttributes<HTMLElement>;
  onAddCard: (title: string) => void;
  onRenameColumn: (title: string) => void;
  onDeleteColumn: () => void;
  onOpenCardEditor: (cardId: string) => void;
  onKeyboardMoveCard: (
    cardId: string,
    direction: "prev-column" | "next-column" | "up" | "down",
  ) => void;
}

export function ColumnView({
  column,
  visibleCardIds,
  totalCardCount,
  cardsById,
  labels,
  dragState,
  registerCard,
  registerColumn,
  cardHandleProps,
  onAddCard,
  onRenameColumn,
  onDeleteColumn,
  onOpenCardEditor,
  onKeyboardMoveCard,
}: ColumnViewProps) {
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);
  const [addingTitle, setAddingTitle] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  function submitRename() {
    const trimmed = titleDraft.trim();
    if (trimmed) onRenameColumn(trimmed);
    else setTitleDraft(column.title);
    setRenaming(false);
  }

  function submitAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = addingTitle.trim();
    if (!trimmed) return;
    onAddCard(trimmed);
    setAddingTitle("");
  }

  return (
    <div
      ref={(el) => registerColumn(column.id, el)}
      className="bg-bg-sunken flex h-full w-72 shrink-0 snap-start flex-col gap-3 rounded-lg p-3"
    >
      <div className="flex items-center justify-between gap-2">
        {renaming ? (
          <input
            ref={renameInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") {
                setTitleDraft(column.title);
                setRenaming(false);
              }
            }}
            aria-label="Column name"
            className={`${textField} py-1`}
          />
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="text-text text-sm font-semibold hover:underline"
          >
            {column.title}
            <span className="text-text-muted ml-1.5 font-normal">
              {totalCardCount}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onDeleteColumn}
          aria-label={`Delete column ${column.title}`}
          className="text-text-muted hover:text-danger hover:bg-bg-elevated inline-flex h-7 w-7 items-center justify-center rounded-md"
        >
          <Icon name="trash-2" className="h-4 w-4" />
        </button>
      </div>

      <div
        className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
        role="list"
        aria-label={`${column.title} cards`}
      >
        {visibleCardIds.length === 0 && (
          <p className="text-text-muted px-1 py-2 text-xs">
            {totalCardCount === 0
              ? "No cards yet."
              : "No cards match the current filter."}
          </p>
        )}
        {visibleCardIds.map((cardId) => {
          const card = cardsById[cardId];
          if (!card) return null;
          return (
            <div key={cardId} role="listitem">
              <CardTile
                card={card}
                labels={labels}
                isDragging={dragState.cardId === cardId}
                isDropTarget={
                  dragState.overColumnId === column.id &&
                  dragState.overBeforeCardId === cardId
                }
                dragHandleProps={cardHandleProps(cardId)}
                registerCard={registerCard}
                onOpenEditor={() => onOpenCardEditor(cardId)}
                onKeyboardMove={(direction) =>
                  onKeyboardMoveCard(cardId, direction)
                }
              />
            </div>
          );
        })}
        {dragState.cardId &&
          dragState.overColumnId === column.id &&
          dragState.overBeforeCardId === null &&
          !visibleCardIds.includes(dragState.cardId) && (
            <div
              className="border-accent h-10 rounded-md border-2 border-dashed"
              aria-hidden="true"
            />
          )}
      </div>

      <form onSubmit={submitAdd} className="flex flex-col gap-1.5">
        <label htmlFor={`add-card-${column.id}`} className="sr-only">
          Add a card to {column.title}
        </label>
        <input
          id={`add-card-${column.id}`}
          value={addingTitle}
          onChange={(e) => setAddingTitle(e.target.value)}
          placeholder="Add a card…"
          className={`${textField} py-1.5`}
        />
        {addingTitle.trim() && (
          <button type="submit" className={`${buttonGhost} justify-center`}>
            <Icon name="plus" className="h-4 w-4" />
            Add card
          </button>
        )}
      </form>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useKanbanController } from "./useKanbanController";
import { useKanbanDnd } from "./useKanbanDnd";
import { ColumnView } from "./ColumnView";
import { CardEditorDialog } from "./CardEditorDialog";
import { BoardToolbar } from "./BoardToolbar";
import { ConfirmDialog } from "@/components/react/ConfirmDialog";
import { StatusMessage } from "@/components/react/StatusMessage";
import {
  buttonPrimary,
  iconButton,
  stickyToolbar,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { filterBoard, type CardFilters } from "@/lib/apps-logic/kanban/filter";
import {
  adjacentColumnId,
  findCardLocation,
  resolveDropIndex,
} from "@/lib/apps-logic/kanban/dragDrop";
import {
  exportKanbanState,
  importKanbanState,
  STORAGE_KEY,
} from "@/lib/apps-logic/kanban/persistence";

type PendingConfirm = { type: "delete-board" } | { type: "clear-all" } | null;

export default function KanbanBoardApp() {
  const controller = useKanbanController();
  const [filters, setFilters] = useState<CardFilters>({});
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [importMessage, setImportMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [visibleColumnIndex, setVisibleColumnIndex] = useState(0);

  const {
    state,
    dispatch,
    replaceState,
    undo,
    redo,
    canUndo,
    canRedo,
    autosave,
    autosaveError,
    loaded,
  } = controller;

  const activeBoard =
    state.boards.find((b) => b.id === state.activeBoardId) ?? null;

  const visibleCardsByColumn = useMemo(
    () => (activeBoard ? filterBoard(activeBoard, filters) : {}),
    [activeBoard, filters],
  );

  const dndColumns = useMemo(
    () =>
      activeBoard?.columns.map((c) => ({
        id: c.id,
        cardIds: visibleCardsByColumn[c.id] ?? [],
      })) ?? [],
    [activeBoard, visibleCardsByColumn],
  );

  const { dragState, registerCard, registerColumn, cardHandleProps } =
    useKanbanDnd(dndColumns, (cardId, toColumnId, beforeCardId) => {
      if (!activeBoard) return;
      const toIndex = resolveDropIndex(
        activeBoard,
        cardId,
        toColumnId,
        beforeCardId,
      );
      dispatch({
        type: "MOVE_CARD",
        boardId: activeBoard.id,
        cardId,
        toColumnId,
        toIndex,
      });
    });

  function handleKeyboardMove(
    cardId: string,
    direction: "prev-column" | "next-column" | "up" | "down",
  ) {
    if (!activeBoard) return;
    const location = findCardLocation(activeBoard, cardId);
    if (!location) return;

    if (direction === "prev-column" || direction === "next-column") {
      const targetColumnId = adjacentColumnId(
        activeBoard,
        location.columnId,
        direction === "prev-column" ? "prev" : "next",
      );
      if (!targetColumnId) return;
      const toIndex = resolveDropIndex(
        activeBoard,
        cardId,
        targetColumnId,
        null,
      );
      dispatch({
        type: "MOVE_CARD",
        boardId: activeBoard.id,
        cardId,
        toColumnId: targetColumnId,
        toIndex,
      });
    } else {
      const toIndex =
        direction === "up" ? location.index - 1 : location.index + 1;
      dispatch({
        type: "MOVE_CARD",
        boardId: activeBoard.id,
        cardId,
        toColumnId: location.columnId,
        toIndex,
      });
    }
  }

  function handleExport() {
    exportKanbanState(state);
  }

  async function handleImportFile(file: File) {
    const result = await importKanbanState(file);
    if (result.ok) {
      replaceState(result.state);
      setImportMessage({ tone: "success", text: "Import complete." });
      setRefreshToken((t) => t + 1);
    } else {
      setImportMessage({ tone: "error", text: result.message });
    }
  }

  function handleClearAll() {
    dispatch({ type: "CLEAR_ALL" });
    setPendingConfirm(null);
    setRefreshToken((t) => t + 1);
  }

  function handleDeleteBoard() {
    if (!activeBoard) return;
    dispatch({ type: "DELETE_BOARD", boardId: activeBoard.id });
    setPendingConfirm(null);
  }

  const editingCard =
    activeBoard && editingCardId ? activeBoard.cards[editingCardId] : undefined;

  const columnCount = activeBoard?.columns.length ?? 0;

  function scrollToColumn(index: number) {
    const container = scrollerRef.current;
    if (!container) return;
    const target = container.children[index] as HTMLElement | undefined;
    target?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }

  useEffect(() => {
    const container = scrollerRef.current;
    if (!container) return;

    function updateVisibleColumn() {
      const children = Array.from(container!.children) as HTMLElement[];
      let closest = 0;
      let closestDistance = Infinity;
      children.forEach((child, index) => {
        const distance = Math.abs(child.offsetLeft - container!.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = index;
        }
      });
      setVisibleColumnIndex(closest);
    }

    updateVisibleColumn();
    container.addEventListener("scroll", updateVisibleColumn, {
      passive: true,
    });
    return () => container.removeEventListener("scroll", updateVisibleColumn);
  }, [activeBoard?.id, columnCount]);

  if (!loaded) {
    return <p className="text-text-muted text-sm">Loading your boards…</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {importMessage && (
        <div className="px-4 pt-3 sm:px-6">
          <StatusMessage
            tone={importMessage.tone === "error" ? "error" : "success"}
          >
            {importMessage.text}
          </StatusMessage>
        </div>
      )}

      <div className={stickyToolbar}>
        <BoardToolbar
          boards={state.boards}
          activeBoard={activeBoard}
          onSelectBoard={(id) =>
            dispatch({ type: "SET_ACTIVE_BOARD", boardId: id })
          }
          onNewBoard={() =>
            dispatch({
              type: "ADD_BOARD",
              name: `Board ${state.boards.length + 1}`,
            })
          }
          onDuplicateBoard={() => {
            if (!activeBoard) return;
            dispatch({
              type: "DUPLICATE_BOARD",
              boardId: activeBoard.id,
              name: `${activeBoard.name} (copy)`,
            });
          }}
          onDeleteBoard={() => setPendingConfirm({ type: "delete-board" })}
          onAddColumn={(title) => {
            if (!activeBoard) return;
            dispatch({ type: "ADD_COLUMN", boardId: activeBoard.id, title });
          }}
          filters={filters}
          onFiltersChange={setFilters}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onExport={handleExport}
          onImportFile={handleImportFile}
          onClearAll={() => setPendingConfirm({ type: "clear-all" })}
          autosave={autosave}
          autosaveError={autosaveError}
          storageKey={STORAGE_KEY}
          refreshToken={refreshToken}
        />
      </div>

      {!activeBoard ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-4 py-16 text-center sm:px-6">
          <Icon name="kanban" className="text-text-muted h-8 w-8" />
          <p className="text-text">
            {state.boards.length === 0
              ? "You don't have any boards yet."
              : "No board selected."}
          </p>
          <button
            type="button"
            className={buttonPrimary}
            onClick={() =>
              dispatch({ type: "ADD_BOARD", name: "My first board" })
            }
          >
            <Icon name="plus" className="h-4 w-4" />
            Create a board
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {columnCount > 1 && (
            <div className="border-border bg-bg flex items-center justify-between gap-2 border-b px-4 py-2 sm:hidden">
              <button
                type="button"
                onClick={() => scrollToColumn(visibleColumnIndex - 1)}
                disabled={visibleColumnIndex <= 0}
                aria-label="Previous column"
                className={iconButton}
              >
                <Icon name="chevron-left" className="h-4 w-4" />
              </button>
              <span className="text-text-muted text-xs">
                {activeBoard.columns[visibleColumnIndex]?.title ?? ""} · Column{" "}
                {visibleColumnIndex + 1} of {columnCount}
              </span>
              <button
                type="button"
                onClick={() => scrollToColumn(visibleColumnIndex + 1)}
                disabled={visibleColumnIndex >= columnCount - 1}
                aria-label="Next column"
                className={iconButton}
              >
                <Icon name="chevron-right" className="h-4 w-4" />
              </button>
            </div>
          )}
          <div
            ref={scrollerRef}
            className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-3 sm:snap-none sm:px-6"
          >
            {activeBoard.columns.map((column) => (
              <ColumnView
                key={column.id}
                column={column}
                visibleCardIds={visibleCardsByColumn[column.id] ?? []}
                totalCardCount={column.cardIds.length}
                cardsById={activeBoard.cards}
                labels={activeBoard.labels}
                dragState={dragState}
                registerCard={registerCard}
                registerColumn={registerColumn}
                cardHandleProps={cardHandleProps}
                onAddCard={(title) =>
                  dispatch({
                    type: "ADD_CARD",
                    boardId: activeBoard.id,
                    columnId: column.id,
                    title,
                  })
                }
                onRenameColumn={(title) =>
                  dispatch({
                    type: "RENAME_COLUMN",
                    boardId: activeBoard.id,
                    columnId: column.id,
                    title,
                  })
                }
                onDeleteColumn={() =>
                  dispatch({
                    type: "DELETE_COLUMN",
                    boardId: activeBoard.id,
                    columnId: column.id,
                  })
                }
                onOpenCardEditor={setEditingCardId}
                onKeyboardMoveCard={handleKeyboardMove}
              />
            ))}
          </div>
        </div>
      )}

      {activeBoard && editingCard && (
        <CardEditorDialog
          card={editingCard}
          boardLabels={activeBoard.labels}
          onUpdate={(patch) =>
            dispatch({
              type: "UPDATE_CARD",
              boardId: activeBoard.id,
              cardId: editingCard.id,
              patch,
            })
          }
          onDelete={() => {
            dispatch({
              type: "DELETE_CARD",
              boardId: activeBoard.id,
              cardId: editingCard.id,
            });
            setEditingCardId(null);
          }}
          onCreateLabel={(name, color) => {
            const labelId = crypto.randomUUID();
            dispatch({
              type: "ADD_LABEL",
              boardId: activeBoard.id,
              id: labelId,
              name,
              color,
            });
            return labelId;
          }}
          onClose={() => setEditingCardId(null)}
        />
      )}

      <ConfirmDialog
        open={pendingConfirm?.type === "delete-board"}
        title="Delete this board?"
        description={`"${activeBoard?.name}" and all of its columns and cards will be permanently deleted. This can't be undone once you leave the page (Undo still works until then).`}
        confirmLabel="Delete board"
        onConfirm={handleDeleteBoard}
        onCancel={() => setPendingConfirm(null)}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "clear-all"}
        title="Delete all local data?"
        description="Every board, column, and card will be permanently deleted from this browser. Export a backup first if you might want this data later."
        confirmLabel="Delete everything"
        onConfirm={handleClearAll}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}

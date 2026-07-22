import { useState } from "react";
import type { KanbanBoard, Priority } from "@/lib/apps-logic/kanban/model";
import { PRIORITY_META } from "./constants";
import type { CardFilters } from "@/lib/apps-logic/kanban/filter";
import {
  buttonGhost,
  buttonSecondary,
  selectField,
  textField,
} from "@/components/react/styles";
import {
  AutosaveIndicator,
  type AutosaveState,
} from "@/components/react/AutosaveIndicator";
import { StorageUsageIndicator } from "@/components/react/StorageUsageIndicator";
import { ImportExportControls } from "@/components/react/ImportExportControls";
import Icon from "@/components/react/Icon";

interface BoardToolbarProps {
  boards: KanbanBoard[];
  activeBoard: KanbanBoard | null;
  onSelectBoard: (id: string) => void;
  onNewBoard: () => void;
  onDuplicateBoard: () => void;
  onDeleteBoard: () => void;
  onAddColumn: (title: string) => void;
  filters: CardFilters;
  onFiltersChange: (filters: CardFilters) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onClearAll: () => void;
  autosave: AutosaveState;
  autosaveError?: string;
  storageKey: string;
  refreshToken: number;
}

export function BoardToolbar({
  boards,
  activeBoard,
  onSelectBoard,
  onNewBoard,
  onDuplicateBoard,
  onDeleteBoard,
  onAddColumn,
  filters,
  onFiltersChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onImportFile,
  onClearAll,
  autosave,
  autosaveError,
  storageKey,
  refreshToken,
}: BoardToolbarProps) {
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    (filters.query ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    (filters.overdueOnly ? 1 : 0) +
    (filters.labelIds?.length ?? 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="board-select" className="sr-only">
          Select board
        </label>
        <select
          id="board-select"
          value={activeBoard?.id ?? ""}
          onChange={(e) => onSelectBoard(e.target.value)}
          className={selectField}
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>

        <button type="button" onClick={onNewBoard} className={buttonSecondary}>
          <Icon name="plus" className="h-4 w-4" />
          New board
        </button>
        <button
          type="button"
          onClick={onDuplicateBoard}
          disabled={!activeBoard}
          className={buttonSecondary}
        >
          <Icon name="copy" className="h-4 w-4" />
          Duplicate
        </button>
        <button
          type="button"
          onClick={onDeleteBoard}
          disabled={!activeBoard}
          className={buttonGhost}
        >
          <Icon name="trash-2" className="h-4 w-4" />
          Delete board
        </button>

        {activeBoard && (
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={buttonGhost}
          >
            <Icon name="search" className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-accent text-accent-contrast inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            className={buttonGhost}
          >
            <Icon name="undo-2" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            className={buttonGhost}
          >
            <Icon name="redo-2" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeBoard && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = newColumnTitle.trim();
            if (!trimmed) return;
            onAddColumn(trimmed);
            setNewColumnTitle("");
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="new-column-title" className="sr-only">
            New column name
          </label>
          <input
            id="new-column-title"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="New column…"
            className={`${textField} max-w-40`}
          />
          <button type="submit" className={buttonSecondary}>
            <Icon name="plus" className="h-4 w-4" />
            Column
          </button>
        </form>
      )}

      {activeBoard && showFilters && (
        <div className="border-border bg-bg-sunken flex flex-wrap items-center gap-2 rounded-md border p-3">
          <label htmlFor="card-search" className="sr-only">
            Search cards
          </label>
          <input
            id="card-search"
            type="search"
            value={filters.query ?? ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, query: e.target.value })
            }
            placeholder="Search cards…"
            className={`${textField} max-w-xs`}
          />
          <label htmlFor="priority-filter" className="sr-only">
            Filter by priority
          </label>
          <select
            id="priority-filter"
            value={filters.priority ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                priority: (e.target.value || undefined) as Priority | undefined,
              })
            }
            className={selectField}
          >
            <option value="">Any priority</option>
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-pressed={!!filters.overdueOnly}
            onClick={() =>
              onFiltersChange({ ...filters, overdueOnly: !filters.overdueOnly })
            }
            className={
              filters.overdueOnly
                ? "bg-accent text-accent-contrast rounded-full px-3 py-1.5 text-sm font-medium"
                : "border-border-strong bg-bg-elevated text-text-muted hover:text-text rounded-full border px-3 py-1.5 text-sm font-medium"
            }
          >
            Overdue only
          </button>
          {activeBoard.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeBoard.labels.map((label) => {
                const active = filters.labelIds?.includes(label.id) ?? false;
                return (
                  <button
                    key={label.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        labelIds: active
                          ? (filters.labelIds ?? []).filter(
                              (id) => id !== label.id,
                            )
                          : [...(filters.labelIds ?? []), label.id],
                      })
                    }
                    className={
                      active
                        ? "bg-accent text-accent-contrast rounded-full px-2.5 py-1 text-xs font-medium"
                        : "border-border-strong bg-bg-elevated text-text-muted hover:text-text rounded-full border px-2.5 py-1 text-xs"
                    }
                  >
                    {label.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <AutosaveIndicator state={autosave} errorMessage={autosaveError} />
        <button
          type="button"
          onClick={() => setShowDataPanel((v) => !v)}
          className={buttonGhost}
          aria-expanded={showDataPanel}
        >
          <Icon name="database" className="h-4 w-4" />
          Data & privacy
        </button>
      </div>

      {showDataPanel && (
        <div className="border-border bg-bg-sunken flex flex-col gap-3 rounded-md border p-3">
          <StorageUsageIndicator
            storageKey={storageKey}
            refreshToken={refreshToken}
          />
          <ImportExportControls
            onExport={onExport}
            onImportFile={onImportFile}
          />
          <button
            type="button"
            onClick={onClearAll}
            className="text-danger inline-flex w-fit items-center gap-2 text-sm font-medium hover:underline"
          >
            <Icon name="trash-2" className="h-4 w-4" />
            Delete all local data
          </button>
        </div>
      )}
    </div>
  );
}

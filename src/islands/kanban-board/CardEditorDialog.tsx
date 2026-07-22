import { useEffect, useRef, useState } from "react";
import type {
  KanbanCard,
  KanbanLabel,
  Priority,
} from "@/lib/apps-logic/kanban/model";
import { LABEL_COLORS } from "@/lib/apps-logic/kanban/model";
import { LABEL_COLOR_SWATCHES, PRIORITY_META } from "./constants";
import {
  buttonDanger,
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  labelText,
  selectField,
  textField,
  textareaField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";

interface CardEditorDialogProps {
  card: KanbanCard;
  boardLabels: KanbanLabel[];
  onUpdate: (
    patch: Partial<
      Pick<
        KanbanCard,
        "title" | "description" | "priority" | "dueDate" | "labelIds"
      >
    >,
  ) => void;
  onDelete: () => void;
  onCreateLabel: (name: string, color: string) => string;
  onClose: () => void;
}

export function CardEditorDialog({
  card,
  boardLabels,
  onUpdate,
  onDelete,
  onCreateLabel,
  onClose,
}: CardEditorDialogProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [newLabelName, setNewLabelName] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function commitTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== card.title) onUpdate({ title: trimmed });
    else if (!trimmed) setTitle(card.title);
  }

  function commitDescription() {
    if (description !== card.description) onUpdate({ description });
  }

  function toggleLabel(labelId: string) {
    const next = card.labelIds.includes(labelId)
      ? card.labelIds.filter((id) => id !== labelId)
      : [...card.labelIds, labelId];
    onUpdate({ labelIds: next });
  }

  function addNewLabel() {
    const name = newLabelName.trim();
    if (!name) return;
    const color =
      LABEL_COLORS[boardLabels.length % LABEL_COLORS.length] ?? "blue";
    const labelId = onCreateLabel(name, color);
    onUpdate({ labelIds: [...card.labelIds, labelId] });
    setNewLabelName("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close card"
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-editor-title"
        className="border-border bg-bg-elevated relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg border p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <label htmlFor="card-editor-title" className="sr-only">
            Card title
          </label>
          <input
            id="card-editor-title"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className={`${textField} text-base font-semibold`}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text shrink-0"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-editor-description" className={labelText}>
            Description
          </label>
          <textarea
            id="card-editor-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={commitDescription}
            rows={4}
            className={textareaField}
            placeholder="Add more detail…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="card-editor-priority" className={labelText}>
              Priority
            </label>
            <select
              id="card-editor-priority"
              value={card.priority}
              onChange={(e) =>
                onUpdate({ priority: e.target.value as Priority })
              }
              className={selectField}
            >
              {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="card-editor-due" className={labelText}>
              Due date
            </label>
            <div className="flex gap-1">
              <input
                id="card-editor-due"
                type="date"
                value={card.dueDate ?? ""}
                onChange={(e) => onUpdate({ dueDate: e.target.value || null })}
                className={selectField}
              />
              {card.dueDate && (
                <button
                  type="button"
                  onClick={() => onUpdate({ dueDate: null })}
                  aria-label="Clear due date"
                  className={buttonGhost}
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelText}>Labels</span>
          <div className="flex flex-wrap gap-2">
            {boardLabels.map((label) => {
              const active = card.labelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleLabel(label.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity ${
                    LABEL_COLOR_SWATCHES[label.color] ??
                    LABEL_COLOR_SWATCHES.blue
                  } ${active ? "" : "opacity-40"}`}
                >
                  {label.name}
                </button>
              );
            })}
          </div>
          <div className="mt-1 flex gap-2">
            <input
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewLabel();
                }
              }}
              placeholder="New label name"
              aria-label="New label name"
              className={`${textField} py-1.5`}
            />
            <button
              type="button"
              onClick={addNewLabel}
              className={buttonSecondary}
            >
              <Icon name="tag" className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <div className="border-border mt-2 flex items-center justify-between border-t pt-4">
          <button type="button" onClick={onDelete} className={buttonDanger}>
            <Icon name="trash-2" className="h-4 w-4" />
            Delete card
          </button>
          <button type="button" onClick={onClose} className={buttonPrimary}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

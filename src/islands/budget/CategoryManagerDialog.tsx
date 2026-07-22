import { useId, useState } from "react";
import type { Category, CategoryKind } from "@/lib/apps-logic/budget/model";
import { CATEGORY_COLORS } from "@/lib/apps-logic/budget/model";
import type { BudgetAction } from "@/lib/apps-logic/budget/reducer";
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  labelText,
  selectField,
  textField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { ConfirmDialog } from "@/components/react/ConfirmDialog";
import { FormDialog } from "./FormDialog";
import { categoryColorStyle } from "./constants";
import { ColorPicker } from "./ColorPicker";

interface CategoryManagerDialogProps {
  categories: Category[];
  dispatch: (action: BudgetAction) => void;
  onClose: () => void;
}

function CategoryRow({
  category,
  dispatch,
  onRequestDelete,
}: {
  category: Category;
  dispatch: (action: BudgetAction) => void;
  onRequestDelete: (category: Category) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  function commit() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== category.name) {
      dispatch({
        type: "UPDATE_CATEGORY",
        categoryId: category.id,
        patch: { name: trimmed },
      });
    } else {
      setName(category.name);
    }
    setEditing(false);
  }

  return (
    <li className="flex items-center gap-2 py-1.5">
      <span
        aria-hidden="true"
        className="h-3 w-3 shrink-0 rounded-full"
        style={categoryColorStyle(category.color)}
      />
      {editing ? (
        <input
          ref={(el) => el?.focus()}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setName(category.name);
              setEditing(false);
            }
          }}
          aria-label={`Rename ${category.name}`}
          className={`${textField} flex-1 py-1`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-text flex-1 truncate text-left text-sm"
        >
          {category.name}
        </button>
      )}
      <ColorPicker
        value={category.color}
        onChange={(color) =>
          dispatch({
            type: "UPDATE_CATEGORY",
            categoryId: category.id,
            patch: { color },
          })
        }
      />
      <button
        type="button"
        onClick={() => onRequestDelete(category)}
        aria-label={`Delete category ${category.name}`}
        className={buttonGhost}
      >
        <Icon name="trash-2" className="h-4 w-4" />
      </button>
    </li>
  );
}

export function CategoryManagerDialog({
  categories,
  dispatch,
  onClose,
}: CategoryManagerDialogProps) {
  const titleId = useId();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<CategoryKind>("expense");
  const [deleting, setDeleting] = useState<Category | null>(null);

  const income = categories.filter((c) => c.kind === "income");
  const expense = categories.filter((c) => c.kind === "expense");

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const pool = newKind === "income" ? income : expense;
    const color = CATEGORY_COLORS[pool.length % CATEGORY_COLORS.length]!;
    dispatch({ type: "ADD_CATEGORY", name: trimmed, kind: newKind, color });
    setNewName("");
  }

  return (
    <FormDialog
      titleId={titleId}
      title="Manage categories"
      onClose={onClose}
      footer={
        <>
          <span />
          <button type="button" onClick={onClose} className={buttonPrimary}>
            Done
          </button>
        </>
      }
    >
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="New category name"
          aria-label="New category name"
          className={`${textField} flex-1`}
        />
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value as CategoryKind)}
          aria-label="New category type"
          className={selectField}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <button type="button" onClick={handleAdd} className={buttonSecondary}>
          <Icon name="plus" className="h-4 w-4" />
          Add
        </button>
      </div>

      <div>
        <h3 className={`${labelText} mb-1`}>Expense categories</h3>
        <ul className="divide-border divide-y">
          {expense.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              dispatch={dispatch}
              onRequestDelete={setDeleting}
            />
          ))}
        </ul>
      </div>
      <div>
        <h3 className={`${labelText} mb-1`}>Income categories</h3>
        <ul className="divide-border divide-y">
          {income.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              dispatch={dispatch}
              onRequestDelete={setDeleting}
            />
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this category?"
        description={`"${deleting?.name}" will be removed. Transactions and recurring rules using it become Uncategorized, and any budgets set for it are deleted.`}
        confirmLabel="Delete category"
        onConfirm={() => {
          if (deleting)
            dispatch({ type: "DELETE_CATEGORY", categoryId: deleting.id });
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </FormDialog>
  );
}

import { useEffect, useRef } from "react";
import { buttonDanger, buttonSecondary } from "./styles";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shared confirmation dialog for any destructive, hard-to-reverse local
 * action (deleting a board, clearing all data, etc). Every app should
 * route destructive actions through this rather than a bare `confirm()` or
 * an inline "are you sure" toggle, so the UX and accessibility are
 * consistent everywhere.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel"
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="border-border bg-bg-elevated relative w-full max-w-sm rounded-lg border p-5 shadow-2xl"
      >
        <h2
          id="confirm-dialog-title"
          className="text-text text-base font-semibold"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-description"
          className="text-text-muted mt-2 text-sm"
        >
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={buttonSecondary}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={buttonDanger}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

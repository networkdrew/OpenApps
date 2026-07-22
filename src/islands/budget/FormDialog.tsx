import { useEffect, type ReactNode } from "react";
import Icon from "@/components/react/Icon";

interface FormDialogProps {
  titleId: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

/** Shared modal shell for OpenBudget's several editor dialogs (account, transaction, recurring, goal, category). */
export function FormDialog({
  titleId,
  title,
  onClose,
  children,
  footer,
}: FormDialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="border-border bg-bg-elevated relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg border p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-text text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text shrink-0"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        {children}
        <div className="border-border mt-2 flex items-center justify-between gap-2 border-t pt-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

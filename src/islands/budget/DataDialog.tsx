import { useId, useState } from "react";
import type { BudgetState } from "@/lib/apps-logic/budget/model";
import {
  exportBudgetState,
  importBudgetState,
  STORAGE_KEY,
} from "@/lib/apps-logic/budget/persistence";
import { buttonDanger, buttonPrimary } from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { ImportExportControls } from "@/components/react/ImportExportControls";
import { StorageUsageIndicator } from "@/components/react/StorageUsageIndicator";
import { StatusMessage } from "@/components/react/StatusMessage";
import { ConfirmDialog } from "@/components/react/ConfirmDialog";
import { FormDialog } from "./FormDialog";

interface DataDialogProps {
  state: BudgetState;
  refreshToken: number;
  onReplaceState: (state: BudgetState) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function DataDialog({
  state,
  refreshToken,
  onReplaceState,
  onClearAll,
  onClose,
}: DataDialogProps) {
  const titleId = useId();
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  async function handleImportFile(file: File) {
    const result = await importBudgetState(file);
    if (result.ok) {
      onReplaceState(result.state);
      setMessage({ tone: "success", text: "Backup restored." });
    } else {
      setMessage({ tone: "error", text: result.message });
    }
  }

  return (
    <FormDialog
      titleId={titleId}
      title="Backup, restore & data"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className={buttonDanger}
          >
            <Icon name="trash-2" className="h-4 w-4" />
            Delete all data
          </button>
          <button type="button" onClick={onClose} className={buttonPrimary}>
            Done
          </button>
        </>
      }
    >
      {message && (
        <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
      )}

      <p className="text-text-muted text-sm">
        Everything OpenBudget knows — accounts, transactions, categories,
        budgets, recurring rules, and goals — lives only in this browser's local
        storage. Export a full backup any time, and restore it here or in
        another browser.
      </p>

      <ImportExportControls
        onExport={() => exportBudgetState(state)}
        onImportFile={handleImportFile}
        exportLabel="Export backup (JSON)"
        importLabel="Restore backup (JSON)"
      />

      <StorageUsageIndicator
        storageKey={STORAGE_KEY}
        refreshToken={refreshToken}
      />

      <ConfirmDialog
        open={confirmingClear}
        title="Delete all OpenBudget data?"
        description="Every account, transaction, category, budget, recurring rule, and goal will be permanently deleted from this browser. Export a backup first if you might want this data later."
        confirmLabel="Delete everything"
        onConfirm={() => {
          onClearAll();
          setConfirmingClear(false);
          onClose();
        }}
        onCancel={() => setConfirmingClear(false)}
      />
    </FormDialog>
  );
}

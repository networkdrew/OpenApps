import { useRef } from "react";
import { buttonSecondary } from "./styles";
import Icon from "./Icon";

interface ImportExportControlsProps {
  onExport: () => void;
  onImportFile: (file: File) => void;
  exportLabel?: string;
  importLabel?: string;
}

/** Shared JSON export/import controls for any app's data panel. */
export function ImportExportControls({
  onExport,
  onImportFile,
  exportLabel = "Export JSON",
  importLabel = "Import JSON",
}: ImportExportControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onExport} className={buttonSecondary}>
        <Icon name="download" className="h-4 w-4" />
        {exportLabel}
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={buttonSecondary}
      >
        <Icon name="upload" className="h-4 w-4" />
        {importLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="sr-only"
        aria-label={importLabel}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

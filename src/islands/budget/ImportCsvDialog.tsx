import { useId, useMemo, useState } from "react";
import type { Account, Category } from "@/lib/apps-logic/budget/model";
import {
  buildTransactionsFromCsv,
  parseCsv,
  type CsvColumnMapping,
  type CsvImportResult,
} from "@/lib/apps-logic/budget/csv";
import {
  buttonPrimary,
  buttonSecondary,
  labelText,
  selectField,
  textField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { StatusMessage } from "@/components/react/StatusMessage";
import { FormDialog } from "./FormDialog";

interface ImportCsvDialogProps {
  accounts: Account[];
  categories: Category[];
  onImport: (result: CsvImportResult) => void;
  onClose: () => void;
}

type FieldKey =
  | "dateColumn"
  | "payeeColumn"
  | "amountColumn"
  | "categoryColumn"
  | "memoColumn";

const FIELD_LABELS: { key: FieldKey; label: string; required: boolean }[] = [
  { key: "dateColumn", label: "Date", required: true },
  { key: "payeeColumn", label: "Payee / description", required: true },
  { key: "amountColumn", label: "Amount", required: true },
  { key: "categoryColumn", label: "Category (optional)", required: false },
  { key: "memoColumn", label: "Memo (optional)", required: false },
];

function guessColumn(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (const candidate of candidates) {
    const index = lower.findIndex((h) => h.includes(candidate));
    if (index !== -1) return index;
  }
  return -1;
}

export function ImportCsvDialog({
  accounts,
  categories,
  onImport,
  onClose,
}: ImportCsvDialogProps) {
  const titleId = useId();
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [flipSign, setFlipSign] = useState(false);
  const [columns, setColumns] = useState<Record<FieldKey, number>>({
    dateColumn: -1,
    payeeColumn: -1,
    amountColumn: -1,
    categoryColumn: -1,
    memoColumn: -1,
  });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setError("That file doesn't have any data rows to import.");
      return;
    }
    const [header, ...rest] = rows;
    setFileName(file.name);
    setHeaders(header!);
    setDataRows(rest);
    setColumns({
      dateColumn: guessColumn(header!, ["date"]),
      payeeColumn: guessColumn(header!, [
        "payee",
        "description",
        "merchant",
        "name",
      ]),
      amountColumn: guessColumn(header!, ["amount", "value"]),
      categoryColumn: guessColumn(header!, ["category"]),
      memoColumn: guessColumn(header!, ["memo", "note"]),
    });
  }

  const mapping: CsvColumnMapping | null = useMemo(() => {
    if (
      columns.dateColumn < 0 ||
      columns.payeeColumn < 0 ||
      columns.amountColumn < 0
    ) {
      return null;
    }
    return {
      dateColumn: columns.dateColumn,
      payeeColumn: columns.payeeColumn,
      amountColumn: columns.amountColumn,
      categoryColumn:
        columns.categoryColumn >= 0 ? columns.categoryColumn : null,
      memoColumn: columns.memoColumn >= 0 ? columns.memoColumn : null,
    };
  }, [columns]);

  function handleImport() {
    if (!mapping || !accountId) return;
    const built = buildTransactionsFromCsv(
      dataRows,
      mapping,
      accountId,
      categories,
      {
        flipSign,
      },
    );
    setResult(built);
  }

  function handleConfirm() {
    if (!result) return;
    onImport(result);
    onClose();
  }

  return (
    <FormDialog
      titleId={titleId}
      title="Import transactions from CSV"
      onClose={onClose}
      footer={
        result ? (
          <>
            <button
              type="button"
              onClick={() => setResult(null)}
              className={buttonSecondary}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={buttonPrimary}
              disabled={result.transactions.length === 0}
            >
              Import {result.transactions.length} transaction
              {result.transactions.length === 1 ? "" : "s"}
            </button>
          </>
        ) : (
          <>
            <span />
            <button
              type="button"
              onClick={handleImport}
              disabled={!mapping || !accountId || dataRows.length === 0}
              className={buttonPrimary}
            >
              Preview import
            </button>
          </>
        )
      }
    >
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      {!fileName && (
        <div className="flex flex-col gap-2">
          <label htmlFor="csv-file" className={labelText}>
            Choose a CSV file exported from your bank or another budgeting app
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className={textField}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>
      )}

      {fileName && !result && (
        <div className="flex flex-col gap-4">
          <p className="text-text-muted text-sm">
            <Icon name="file-spreadsheet" className="mr-1 inline h-4 w-4" />
            {fileName} · {dataRows.length} row{dataRows.length === 1 ? "" : "s"}
          </p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="csv-account" className={labelText}>
              Import into account
            </label>
            <select
              id="csv-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={selectField}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELD_LABELS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label htmlFor={`csv-col-${field.key}`} className={labelText}>
                  {field.label}
                </label>
                <select
                  id={`csv-col-${field.key}`}
                  value={columns[field.key]}
                  onChange={(e) =>
                    setColumns((c) => ({
                      ...c,
                      [field.key]: Number(e.target.value),
                    }))
                  }
                  className={selectField}
                >
                  <option value={-1}>
                    {field.required ? "Choose a column…" : "(none)"}
                  </option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={flipSign}
              onChange={(e) => setFlipSign(e.target.checked)}
              className="accent-accent h-4 w-4"
            />
            Flip sign (use this if income shows as negative in this file)
          </label>

          {dataRows.length > 0 && (
            <div className="border-border overflow-x-auto rounded-md border">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-sunken">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-2 py-1.5 font-medium">
                        {h || `Column ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-border border-t">
                      {row.map((cell, j) => (
                        <td key={j} className="text-text-muted px-2 py-1.5">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          <StatusMessage
            tone={result.transactions.length > 0 ? "success" : "neutral"}
          >
            {result.transactions.length} transaction
            {result.transactions.length === 1 ? "" : "s"} ready to import.
          </StatusMessage>
          {result.errors.length > 0 && (
            <StatusMessage tone="error">
              {result.errors.length} row{result.errors.length === 1 ? "" : "s"}{" "}
              couldn't be read and will be skipped: row {result.errors[0]?.row}{" "}
              — {result.errors[0]?.message}
              {result.errors.length > 1
                ? ` (and ${result.errors.length - 1} more)`
                : ""}
            </StatusMessage>
          )}
          {result.unmatchedCategoryNames.length > 0 && (
            <StatusMessage tone="neutral">
              These categories weren't found and will import as Uncategorized:{" "}
              {result.unmatchedCategoryNames.join(", ")}
            </StatusMessage>
          )}
        </div>
      )}
    </FormDialog>
  );
}

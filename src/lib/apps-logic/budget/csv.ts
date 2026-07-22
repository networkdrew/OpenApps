import { isValidIsoDate } from "./dates";
import { parseAmountToCents, centsToDollars } from "./money";
import {
  createTransaction,
  type Account,
  type Category,
  type Transaction,
} from "./model";

/**
 * A small hand-rolled RFC4180-ish CSV parser (no dependency): handles quoted
 * fields, embedded commas/newlines inside quotes, doubled-quote escaping,
 * and both \n and \r\n line endings. Trailing blank lines are dropped.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  function endField() {
    row.push(field);
    field = "";
  }
  function endRow() {
    endField();
    rows.push(row);
    row = [];
  }

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field !== "" || row.length > 0) endRow();

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsvText(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csvText: string): void {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Accepts ISO (YYYY-MM-DD), MM/DD/YYYY, M/D/YYYY, and MM-DD-YYYY; returns ISO or null. */
export function parseFlexibleDate(input: string): string | null {
  const trimmed = input.trim();
  if (isValidIsoDate(trimmed)) return trimmed;

  const slashOrDash = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashOrDash) {
    const [, m, d, y] = slashOrDash;
    const iso = `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
    return isValidIsoDate(iso) ? iso : null;
  }
  return null;
}

export interface CsvColumnMapping {
  dateColumn: number;
  payeeColumn: number;
  amountColumn: number;
  categoryColumn: number | null;
  memoColumn: number | null;
}

export interface CsvImportOptions {
  /** Flip so negative amounts are income and positive are expenses (some exports use this convention). */
  flipSign: boolean;
}

export interface CsvImportError {
  row: number;
  message: string;
}

export interface CsvImportResult {
  transactions: Transaction[];
  errors: CsvImportError[];
  /** Distinct category names referenced in the file that didn't match any existing category (imported as Uncategorized). */
  unmatchedCategoryNames: string[];
}

/** Builds transactions from parsed CSV data rows (header excluded) using a column mapping the user confirmed. */
export function buildTransactionsFromCsv(
  dataRows: readonly string[][],
  mapping: CsvColumnMapping,
  accountId: string,
  existingCategories: readonly Category[],
  options: CsvImportOptions = { flipSign: false },
): CsvImportResult {
  const transactions: Transaction[] = [];
  const errors: CsvImportError[] = [];
  const unmatchedCategoryNames = new Set<string>();

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2; // account for the header row, 1-indexed for humans
    if (row.every((cell) => cell.trim() === "")) return;

    const dateRaw = row[mapping.dateColumn]?.trim() ?? "";
    const date = parseFlexibleDate(dateRaw);
    if (!date) {
      errors.push({
        row: rowNumber,
        message: `Couldn't read a date from "${dateRaw || "(empty)"}".`,
      });
      return;
    }

    const amountRaw = row[mapping.amountColumn]?.trim() ?? "";
    const parsedCents = parseAmountToCents(amountRaw);
    if (parsedCents === null) {
      errors.push({
        row: rowNumber,
        message: `Couldn't read an amount from "${amountRaw || "(empty)"}".`,
      });
      return;
    }
    const signedCents = options.flipSign ? -parsedCents : parsedCents;
    const type: "income" | "expense" = signedCents < 0 ? "expense" : "income";
    const amountCents = Math.abs(signedCents);

    const payee = row[mapping.payeeColumn]?.trim() || "Imported transaction";
    const memo =
      mapping.memoColumn !== null
        ? (row[mapping.memoColumn]?.trim() ?? "")
        : "";

    let categoryId: string | null = null;
    if (mapping.categoryColumn !== null) {
      const categoryName = row[mapping.categoryColumn]?.trim();
      if (categoryName) {
        const match = existingCategories.find(
          (c) =>
            c.kind === type &&
            c.name.toLowerCase() === categoryName.toLowerCase(),
        );
        if (match) {
          categoryId = match.id;
        } else {
          unmatchedCategoryNames.add(categoryName);
        }
      }
    }

    transactions.push(
      createTransaction({
        accountId,
        type,
        amountCents,
        date,
        categoryId,
        payee,
        memo,
        transferAccountId: null,
        cleared: false,
        recurringId: null,
      }),
    );
  });

  return {
    transactions,
    errors,
    unmatchedCategoryNames: [...unmatchedCategoryNames].sort(),
  };
}

const EXPORT_HEADER = [
  "Date",
  "Account",
  "Type",
  "Category",
  "Payee",
  "Memo",
  "Amount",
  "Cleared",
];

export function exportTransactionsToCsv(
  transactions: readonly Transaction[],
  accounts: readonly Account[],
  categories: readonly Category[],
): string {
  const accountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? "Unknown account";
  const categoryName = (id: string | null) =>
    (id && categories.find((c) => c.id === id)?.name) || "Uncategorized";

  const rows = transactions.map((tx) => {
    const signedDollars =
      tx.type === "expense" || tx.type === "transfer"
        ? -centsToDollars(tx.amountCents)
        : centsToDollars(tx.amountCents);
    const typeLabel =
      tx.type === "transfer"
        ? `Transfer to ${accountName(tx.transferAccountId ?? "")}`
        : tx.type === "income"
          ? "Income"
          : "Expense";
    return [
      tx.date,
      accountName(tx.accountId),
      typeLabel,
      tx.type === "transfer" ? "" : categoryName(tx.categoryId),
      tx.payee,
      tx.memo,
      signedDollars.toFixed(2),
      tx.cleared ? "Yes" : "No",
    ];
  });

  return toCsvText([EXPORT_HEADER, ...rows]);
}

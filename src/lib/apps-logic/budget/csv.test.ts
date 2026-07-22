import { describe, expect, it } from "vitest";
import {
  buildTransactionsFromCsv,
  exportTransactionsToCsv,
  parseCsv,
  parseFlexibleDate,
  toCsvText,
} from "./csv";
import { createAccount, createCategory, createTransaction } from "./model";

describe("parseCsv", () => {
  it("parses a simple comma-separated grid", () => {
    const rows = parseCsv("Date,Amount\n2026-07-01,10.00\n2026-07-02,20.00");
    expect(rows).toEqual([
      ["Date", "Amount"],
      ["2026-07-01", "10.00"],
      ["2026-07-02", "20.00"],
    ]);
  });

  it("handles quoted fields containing commas", () => {
    const rows = parseCsv('Date,Payee\n2026-07-01,"Smith, John"');
    expect(rows[1]).toEqual(["2026-07-01", "Smith, John"]);
  });

  it("handles doubled quotes as an escaped quote", () => {
    const rows = parseCsv('Payee\n"Say ""hi"" now"');
    expect(rows[1]).toEqual(['Say "hi" now']);
  });

  it("handles quoted fields with embedded newlines", () => {
    const rows = parseCsv('Memo\n"line one\nline two"\nplain');
    expect(rows[1]).toEqual(["line one\nline two"]);
    expect(rows[2]).toEqual(["plain"]);
  });

  it("handles CRLF line endings", () => {
    const rows = parseCsv("A,B\r\n1,2\r\n3,4");
    expect(rows).toEqual([
      ["A", "B"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("drops a trailing blank line", () => {
    const rows = parseCsv("A,B\n1,2\n");
    expect(rows).toEqual([
      ["A", "B"],
      ["1", "2"],
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("toCsvText", () => {
  it("quotes a field containing a comma", () => {
    expect(toCsvText([["a", "b,c"]])).toBe('a,"b,c"');
  });
  it("escapes embedded quotes", () => {
    expect(toCsvText([['say "hi"']])).toBe('"say ""hi"""');
  });
  it("round-trips through parseCsv", () => {
    const original = [["a", "b,c", 'has "quotes"', "plain"]];
    expect(parseCsv(toCsvText(original))).toEqual(original);
  });
});

describe("parseFlexibleDate", () => {
  it("accepts ISO dates", () => {
    expect(parseFlexibleDate("2026-07-22")).toBe("2026-07-22");
  });
  it("accepts MM/DD/YYYY", () => {
    expect(parseFlexibleDate("07/22/2026")).toBe("2026-07-22");
  });
  it("accepts single-digit M/D/YYYY", () => {
    expect(parseFlexibleDate("7/2/2026")).toBe("2026-07-02");
  });
  it("accepts MM-DD-YYYY", () => {
    expect(parseFlexibleDate("07-22-2026")).toBe("2026-07-22");
  });
  it("rejects an impossible date", () => {
    expect(parseFlexibleDate("13/40/2026")).toBeNull();
  });
  it("rejects garbage", () => {
    expect(parseFlexibleDate("not a date")).toBeNull();
  });
});

describe("buildTransactionsFromCsv", () => {
  const mapping = {
    dateColumn: 0,
    payeeColumn: 1,
    amountColumn: 2,
    categoryColumn: 3 as number | null,
    memoColumn: null as number | null,
  };

  it("builds income and expense transactions from signed amounts", () => {
    const rows = [
      ["2026-07-01", "Paycheck", "1500.00", ""],
      ["2026-07-02", "Coffee Shop", "-4.50", ""],
    ];
    const result = buildTransactionsFromCsv(rows, mapping, "acc-1", []);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      type: "income",
      amountCents: 150000,
    });
    expect(result.transactions[1]).toMatchObject({
      type: "expense",
      amountCents: 450,
    });
  });

  it("flips the sign convention when requested", () => {
    const rows = [["2026-07-01", "Coffee Shop", "4.50", ""]];
    const result = buildTransactionsFromCsv(rows, mapping, "acc-1", [], {
      flipSign: true,
    });
    expect(result.transactions[0]).toMatchObject({
      type: "expense",
      amountCents: 450,
    });
  });

  it("reports a row-level error for an unparseable date without dropping the whole import", () => {
    const rows = [
      ["not-a-date", "Coffee Shop", "-4.50", ""],
      ["2026-07-02", "Groceries", "-20.00", ""],
    ];
    const result = buildTransactionsFromCsv(rows, mapping, "acc-1", []);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.row).toBe(2);
    expect(result.transactions).toHaveLength(1);
  });

  it("reports a row-level error for an unparseable amount", () => {
    const rows = [["2026-07-01", "Coffee Shop", "free", ""]];
    const result = buildTransactionsFromCsv(rows, mapping, "acc-1", []);
    expect(result.errors).toHaveLength(1);
    expect(result.transactions).toHaveLength(0);
  });

  it("skips fully blank rows silently", () => {
    const rows = [
      ["", "", "", ""],
      ["2026-07-01", "Coffee Shop", "-4.50", ""],
    ];
    const result = buildTransactionsFromCsv(rows, mapping, "acc-1", []);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions).toHaveLength(1);
  });

  it("matches an existing category case-insensitively by name and kind", () => {
    const groceries = createCategory("Groceries", "expense", "green");
    const rows = [["2026-07-01", "Trader Joe's", "-40.00", "groceries"]];
    const result = buildTransactionsFromCsv(rows, mapping, "acc-1", [
      groceries,
    ]);
    expect(result.transactions[0]?.categoryId).toBe(groceries.id);
    expect(result.unmatchedCategoryNames).toEqual([]);
  });

  it("leaves unmatched category names uncategorized and reports them", () => {
    const rows = [
      ["2026-07-01", "Trader Joe's", "-40.00", "Snacks"],
      ["2026-07-02", "Trader Joe's", "-10.00", "Snacks"],
    ];
    const result = buildTransactionsFromCsv(rows, mapping, "acc-1", []);
    expect(result.transactions.every((t) => t.categoryId === null)).toBe(true);
    expect(result.unmatchedCategoryNames).toEqual(["Snacks"]);
  });

  it("defaults a blank payee to a placeholder rather than erroring", () => {
    const rows = [["2026-07-01", "", "-4.50", ""]];
    const result = buildTransactionsFromCsv(rows, mapping, "acc-1", []);
    expect(result.transactions[0]?.payee).toBe("Imported transaction");
  });
});

describe("exportTransactionsToCsv", () => {
  it("produces a header row and one row per transaction", () => {
    const account = createAccount("Checking", "checking");
    const category = createCategory("Groceries", "expense", "green");
    const tx = createTransaction({
      accountId: account.id,
      type: "expense",
      amountCents: 4000,
      date: "2026-07-01",
      categoryId: category.id,
      payee: "Trader Joe's",
      memo: "weekly shop",
      transferAccountId: null,
      cleared: true,
      recurringId: null,
    });
    const csv = exportTransactionsToCsv([tx], [account], [category]);
    const rows = parseCsv(csv);
    expect(rows[0]).toEqual([
      "Date",
      "Account",
      "Type",
      "Category",
      "Payee",
      "Memo",
      "Amount",
      "Cleared",
    ]);
    expect(rows[1]).toEqual([
      "2026-07-01",
      "Checking",
      "Expense",
      "Groceries",
      "Trader Joe's",
      "weekly shop",
      "-40.00",
      "Yes",
    ]);
  });

  it("labels a transfer with its destination account and omits a category", () => {
    const source = createAccount("Checking", "checking");
    const dest = createAccount("Savings", "savings");
    const tx = createTransaction({
      accountId: source.id,
      type: "transfer",
      amountCents: 10000,
      date: "2026-07-01",
      categoryId: null,
      payee: "",
      memo: "",
      transferAccountId: dest.id,
      cleared: true,
      recurringId: null,
    });
    const csv = exportTransactionsToCsv([tx], [source, dest], []);
    const rows = parseCsv(csv);
    expect(rows[1]?.[2]).toBe("Transfer to Savings");
    expect(rows[1]?.[3]).toBe("");
    expect(rows[1]?.[6]).toBe("-100.00");
  });
});

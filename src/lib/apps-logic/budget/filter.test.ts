import { describe, expect, it } from "vitest";
import {
  filterTransactions,
  hasActiveTransactionFilters,
  sortTransactions,
  transactionMatchesFilters,
} from "./filter";
import { createTransaction } from "./model";

function tx(overrides: Partial<Parameters<typeof createTransaction>[0]>) {
  return createTransaction({
    accountId: "acc-1",
    type: "expense",
    amountCents: 1000,
    date: "2026-07-15",
    categoryId: "cat-1",
    payee: "Coffee Shop",
    memo: "morning coffee",
    transferAccountId: null,
    cleared: true,
    recurringId: null,
    ...overrides,
  });
}

describe("transactionMatchesFilters", () => {
  it("matches free-text query against payee and memo, case/punctuation-insensitive", () => {
    const t = tx({ payee: "Trader Joe's", memo: "" });
    expect(transactionMatchesFilters(t, { query: "trader joes" })).toBe(true);
    expect(transactionMatchesFilters(t, { query: "TRADER" })).toBe(true);
    expect(transactionMatchesFilters(t, { query: "walmart" })).toBe(false);
  });

  it("filters by account, matching either side of a transfer", () => {
    const t = tx({
      type: "transfer",
      accountId: "acc-1",
      transferAccountId: "acc-2",
    });
    expect(transactionMatchesFilters(t, { accountId: "acc-1" })).toBe(true);
    expect(transactionMatchesFilters(t, { accountId: "acc-2" })).toBe(true);
    expect(transactionMatchesFilters(t, { accountId: "acc-3" })).toBe(false);
  });

  it("filters by category", () => {
    const t = tx({ categoryId: "food" });
    expect(transactionMatchesFilters(t, { categoryId: "food" })).toBe(true);
    expect(transactionMatchesFilters(t, { categoryId: "gas" })).toBe(false);
  });

  it("filters by type", () => {
    const t = tx({ type: "income" });
    expect(transactionMatchesFilters(t, { type: "income" })).toBe(true);
    expect(transactionMatchesFilters(t, { type: "expense" })).toBe(false);
  });

  it("filters by an inclusive date range", () => {
    const t = tx({ date: "2026-07-15" });
    expect(
      transactionMatchesFilters(t, {
        dateFrom: "2026-07-01",
        dateTo: "2026-07-31",
      }),
    ).toBe(true);
    expect(transactionMatchesFilters(t, { dateFrom: "2026-08-01" })).toBe(
      false,
    );
    expect(transactionMatchesFilters(t, { dateTo: "2026-07-01" })).toBe(false);
  });

  it("filters by an amount range", () => {
    const t = tx({ amountCents: 5000 });
    expect(
      transactionMatchesFilters(t, {
        minAmountCents: 4000,
        maxAmountCents: 6000,
      }),
    ).toBe(true);
    expect(transactionMatchesFilters(t, { minAmountCents: 6000 })).toBe(false);
    expect(transactionMatchesFilters(t, { maxAmountCents: 4000 })).toBe(false);
  });

  it("filters cleared-only", () => {
    const t = tx({ cleared: false });
    expect(transactionMatchesFilters(t, { clearedOnly: true })).toBe(false);
  });

  it("filters uncategorized-only", () => {
    const categorized = tx({ categoryId: "food" });
    const uncategorized = tx({ categoryId: null });
    expect(
      transactionMatchesFilters(categorized, { uncategorizedOnly: true }),
    ).toBe(false);
    expect(
      transactionMatchesFilters(uncategorized, { uncategorizedOnly: true }),
    ).toBe(true);
  });

  it("matches everything when no filters are set", () => {
    expect(transactionMatchesFilters(tx({}), {})).toBe(true);
  });
});

describe("filterTransactions", () => {
  it("applies filters across a list", () => {
    const list = [tx({ categoryId: "food" }), tx({ categoryId: "gas" })];
    expect(filterTransactions(list, { categoryId: "gas" })).toHaveLength(1);
  });
});

describe("hasActiveTransactionFilters", () => {
  it("is false for an empty filter set", () => {
    expect(hasActiveTransactionFilters({})).toBe(false);
  });
  it("is true when any field is set", () => {
    expect(hasActiveTransactionFilters({ query: "coffee" })).toBe(true);
    expect(hasActiveTransactionFilters({ minAmountCents: 0 })).toBe(true);
  });
});

describe("sortTransactions", () => {
  const list = [
    tx({ date: "2026-07-01", amountCents: 500 }),
    tx({ date: "2026-07-15", amountCents: 2000 }),
  ];

  it("sorts by date descending", () => {
    expect(sortTransactions(list, "date-desc").map((t) => t.date)).toEqual([
      "2026-07-15",
      "2026-07-01",
    ]);
  });
  it("sorts by date ascending", () => {
    expect(sortTransactions(list, "date-asc").map((t) => t.date)).toEqual([
      "2026-07-01",
      "2026-07-15",
    ]);
  });
  it("sorts by amount descending", () => {
    expect(
      sortTransactions(list, "amount-desc").map((t) => t.amountCents),
    ).toEqual([2000, 500]);
  });
  it("sorts by amount ascending", () => {
    expect(
      sortTransactions(list, "amount-asc").map((t) => t.amountCents),
    ).toEqual([500, 2000]);
  });
  it("does not mutate the input array", () => {
    const original = [...list];
    sortTransactions(list, "date-desc");
    expect(list).toEqual(original);
  });
});

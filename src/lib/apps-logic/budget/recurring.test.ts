import { describe, expect, it } from "vitest";
import { generateDueTransactions } from "./recurring";
import { createRecurringRule } from "./model";

function rule(overrides: Partial<Parameters<typeof createRecurringRule>[0]>) {
  return createRecurringRule({
    name: "Rent",
    accountId: "acc-1",
    type: "expense",
    amountCents: 150000,
    categoryId: "housing",
    payee: "Landlord",
    memo: "",
    frequency: "monthly",
    interval: 1,
    startDate: "2026-01-01",
    endDate: null,
    nextDueDate: "2026-07-01",
    active: true,
    ...overrides,
  });
}

describe("generateDueTransactions", () => {
  it("generates nothing for a rule not yet due", () => {
    const r = rule({ nextDueDate: "2026-08-01" });
    const result = generateDueTransactions([r], "2026-07-22");
    expect(result.transactions).toHaveLength(0);
    expect(result.updatedRules[0]).toEqual(r);
  });

  it("generates one transaction and advances nextDueDate when due today", () => {
    const r = rule({ nextDueDate: "2026-07-22" });
    const result = generateDueTransactions([r], "2026-07-22");
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-07-22",
      amountCents: 150000,
      accountId: "acc-1",
      recurringId: r.id,
      cleared: false,
    });
    expect(result.updatedRules[0]?.nextDueDate).toBe("2026-08-22");
  });

  it("generates every missed occurrence when overdue by several periods", () => {
    const r = rule({
      nextDueDate: "2026-04-01",
      frequency: "monthly",
      interval: 1,
    });
    const result = generateDueTransactions([r], "2026-07-22");
    expect(result.transactions.map((t) => t.date)).toEqual([
      "2026-04-01",
      "2026-05-01",
      "2026-06-01",
      "2026-07-01",
    ]);
    expect(result.updatedRules[0]?.nextDueDate).toBe("2026-08-01");
  });

  it("leaves inactive rules untouched", () => {
    const r = rule({ nextDueDate: "2026-01-01", active: false });
    const result = generateDueTransactions([r], "2026-07-22");
    expect(result.transactions).toHaveLength(0);
    expect(result.updatedRules[0]).toBe(r);
  });

  it("deactivates a rule once its occurrences pass endDate", () => {
    const r = rule({
      nextDueDate: "2026-06-01",
      endDate: "2026-06-15",
      frequency: "monthly",
    });
    const result = generateDueTransactions([r], "2026-08-01");
    expect(result.transactions.map((t) => t.date)).toEqual(["2026-06-01"]);
    expect(result.updatedRules[0]?.active).toBe(false);
  });

  it("respects a custom interval (every N periods)", () => {
    const r = rule({
      frequency: "weekly",
      interval: 2,
      nextDueDate: "2026-07-01",
    });
    const result = generateDueTransactions([r], "2026-07-22");
    expect(result.transactions.map((t) => t.date)).toEqual([
      "2026-07-01",
      "2026-07-15",
    ]);
  });

  it("never runs away on a zero/invalid interval", () => {
    const r = rule({
      frequency: "daily",
      interval: 0,
      nextDueDate: "2020-01-01",
    });
    const result = generateDueTransactions([r], "2026-07-22");
    expect(result.transactions.length).toBeLessThanOrEqual(500);
  });

  it("handles multiple independent rules in one pass", () => {
    const a = rule({ nextDueDate: "2026-07-22" });
    const b = rule({ nextDueDate: "2026-07-20", frequency: "weekly" });
    const result = generateDueTransactions([a, b], "2026-07-22");
    expect(result.transactions).toHaveLength(2);
    expect(result.updatedRules).toHaveLength(2);
  });
});

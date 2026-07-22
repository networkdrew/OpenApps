import { describe, expect, it } from "vitest";
import {
  createAccount,
  createBudgetEntry,
  createCategory,
  createDefaultCategories,
  createEmptyState,
  createGoalContribution,
  createRecurringRule,
  createSavingsGoal,
  createTransaction,
} from "./model";

describe("createEmptyState", () => {
  it("starts with no accounts, transactions, budgets, or goals", () => {
    const state = createEmptyState();
    expect(state.accounts).toEqual([]);
    expect(state.transactions).toEqual([]);
    expect(state.recurringRules).toEqual([]);
    expect(state.budgets).toEqual([]);
    expect(state.goals).toEqual([]);
  });

  it("seeds a real, distinct set of default income and expense categories", () => {
    const state = createEmptyState();
    expect(state.categories.length).toBeGreaterThan(0);
    expect(state.categories.every((c) => c.isDefault)).toBe(true);
    const ids = state.categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(state.categories.some((c) => c.kind === "income")).toBe(true);
    expect(state.categories.some((c) => c.kind === "expense")).toBe(true);
  });
});

describe("createDefaultCategories", () => {
  it("produces fresh ids on every call", () => {
    const a = createDefaultCategories();
    const b = createDefaultCategories();
    expect(a[0]?.id).not.toBe(b[0]?.id);
  });
});

describe("createAccount", () => {
  it("defaults to a zero starting balance and unarchived", () => {
    const account = createAccount("Checking", "checking");
    expect(account.startingBalanceCents).toBe(0);
    expect(account.archived).toBe(false);
    expect(account.name).toBe("Checking");
    expect(account.type).toBe("checking");
  });

  it("accepts a nonzero starting balance", () => {
    const account = createAccount("Savings", "savings", 50000);
    expect(account.startingBalanceCents).toBe(50000);
  });

  it("generates unique ids", () => {
    const a = createAccount("A", "checking");
    const b = createAccount("B", "checking");
    expect(a.id).not.toBe(b.id);
  });
});

describe("createCategory", () => {
  it("defaults isDefault to false for user-created categories", () => {
    const category = createCategory("Custom", "expense", "blue");
    expect(category.isDefault).toBe(false);
  });
});

describe("createTransaction", () => {
  it("assigns a fresh id and timestamps", () => {
    const tx = createTransaction({
      accountId: "acc-1",
      type: "expense",
      amountCents: 1000,
      date: "2026-07-22",
      categoryId: "cat-1",
      payee: "Coffee Shop",
      memo: "",
      transferAccountId: null,
      cleared: true,
      recurringId: null,
    });
    expect(tx.id).toBeTruthy();
    expect(tx.createdAt).toBeTruthy();
    expect(tx.updatedAt).toBe(tx.createdAt);
    expect(tx.amountCents).toBe(1000);
  });
});

describe("createRecurringRule", () => {
  it("assigns a fresh id and createdAt", () => {
    const rule = createRecurringRule({
      name: "Rent",
      accountId: "acc-1",
      type: "expense",
      amountCents: 150000,
      categoryId: "cat-1",
      payee: "Landlord",
      memo: "",
      frequency: "monthly",
      interval: 1,
      startDate: "2026-07-01",
      endDate: null,
      nextDueDate: "2026-07-01",
      active: true,
    });
    expect(rule.id).toBeTruthy();
    expect(rule.createdAt).toBeTruthy();
  });
});

describe("createBudgetEntry", () => {
  it("stores the category, month, and limit", () => {
    const entry = createBudgetEntry("cat-1", "2026-07", 20000);
    expect(entry.categoryId).toBe("cat-1");
    expect(entry.month).toBe("2026-07");
    expect(entry.limitCents).toBe(20000);
  });
});

describe("createSavingsGoal", () => {
  it("starts with no contributions and unarchived", () => {
    const goal = createSavingsGoal("Emergency Fund", 500000, "green");
    expect(goal.contributions).toEqual([]);
    expect(goal.archived).toBe(false);
    expect(goal.targetDate).toBeNull();
  });
});

describe("createGoalContribution", () => {
  it("defaults to today's date when none is given", () => {
    const contribution = createGoalContribution(1000);
    expect(contribution.amountCents).toBe(1000);
    expect(contribution.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

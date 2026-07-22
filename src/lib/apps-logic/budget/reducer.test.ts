import { describe, expect, it } from "vitest";
import { budgetReducer } from "./reducer";
import { createEmptyState } from "./model";

function withAccount(state = createEmptyState()) {
  const next = budgetReducer(state, {
    type: "ADD_ACCOUNT",
    name: "Checking",
    accountType: "checking",
    startingBalanceCents: 100000,
  });
  return { state: next, accountId: next.accounts[0]!.id };
}

describe("budgetReducer — accounts", () => {
  it("ADD_ACCOUNT appends a new account", () => {
    const state = budgetReducer(createEmptyState(), {
      type: "ADD_ACCOUNT",
      name: "Checking",
      accountType: "checking",
      startingBalanceCents: 5000,
    });
    expect(state.accounts).toHaveLength(1);
    expect(state.accounts[0]).toMatchObject({
      name: "Checking",
      type: "checking",
      startingBalanceCents: 5000,
    });
  });

  it("UPDATE_ACCOUNT patches only the targeted account", () => {
    const { state, accountId } = withAccount();
    const next = budgetReducer(state, {
      type: "UPDATE_ACCOUNT",
      accountId,
      patch: { name: "Renamed" },
    });
    expect(next.accounts[0]?.name).toBe("Renamed");
  });

  it("ARCHIVE_ACCOUNT toggles the archived flag without deleting data", () => {
    const { state, accountId } = withAccount();
    const archived = budgetReducer(state, {
      type: "ARCHIVE_ACCOUNT",
      accountId,
      archived: true,
    });
    expect(archived.accounts[0]?.archived).toBe(true);
  });

  it("DELETE_ACCOUNT removes the account and its transactions and recurring rules", () => {
    const { state, accountId } = withAccount();
    const withTx = budgetReducer(state, {
      type: "ADD_TRANSACTION",
      transaction: {
        accountId,
        type: "expense",
        amountCents: 1000,
        date: "2026-07-01",
        categoryId: null,
        payee: "Test",
        memo: "",
        transferAccountId: null,
        cleared: true,
        recurringId: null,
      },
    });
    const withRule = budgetReducer(withTx, {
      type: "ADD_RECURRING",
      rule: {
        name: "Rent",
        accountId,
        type: "expense",
        amountCents: 1000,
        categoryId: null,
        payee: "",
        memo: "",
        frequency: "monthly",
        interval: 1,
        startDate: "2026-07-01",
        endDate: null,
        nextDueDate: "2026-07-01",
        active: true,
      },
    });
    const deleted = budgetReducer(withRule, {
      type: "DELETE_ACCOUNT",
      accountId,
    });
    expect(deleted.accounts).toHaveLength(0);
    expect(deleted.transactions).toHaveLength(0);
    expect(deleted.recurringRules).toHaveLength(0);
  });

  it("DELETE_ACCOUNT removes a transfer transaction referencing it on either side", () => {
    const state1 = budgetReducer(createEmptyState(), {
      type: "ADD_ACCOUNT",
      name: "A",
      accountType: "checking",
      startingBalanceCents: 0,
    });
    const state2 = budgetReducer(state1, {
      type: "ADD_ACCOUNT",
      name: "B",
      accountType: "savings",
      startingBalanceCents: 0,
    });
    const [a, b] = state2.accounts;
    const withTransfer = budgetReducer(state2, {
      type: "ADD_TRANSACTION",
      transaction: {
        accountId: a!.id,
        type: "transfer",
        amountCents: 1000,
        date: "2026-07-01",
        categoryId: null,
        payee: "",
        memo: "",
        transferAccountId: b!.id,
        cleared: true,
        recurringId: null,
      },
    });
    const deleted = budgetReducer(withTransfer, {
      type: "DELETE_ACCOUNT",
      accountId: b!.id,
    });
    expect(deleted.transactions).toHaveLength(0);
  });
});

describe("budgetReducer — categories", () => {
  it("ADD_CATEGORY appends a category", () => {
    const state = budgetReducer(createEmptyState(), {
      type: "ADD_CATEGORY",
      name: "Custom Category",
      kind: "expense",
      color: "blue",
    });
    expect(state.categories.some((c) => c.name === "Custom Category")).toBe(
      true,
    );
  });

  it("UPDATE_CATEGORY patches name and color", () => {
    const base = createEmptyState();
    const category = base.categories[0]!;
    const next = budgetReducer(base, {
      type: "UPDATE_CATEGORY",
      categoryId: category.id,
      patch: { name: "Renamed", color: "red" },
    });
    const updated = next.categories.find((c) => c.id === category.id);
    expect(updated?.name).toBe("Renamed");
    expect(updated?.color).toBe("red");
  });

  it("DELETE_CATEGORY removes it, uncategorizes transactions/rules, and drops its budgets", () => {
    const base = createEmptyState();
    const category = base.categories[0]!;
    const { state: withAcct, accountId } = withAccount(base);
    const withTx = budgetReducer(withAcct, {
      type: "ADD_TRANSACTION",
      transaction: {
        accountId,
        type: "expense",
        amountCents: 500,
        date: "2026-07-01",
        categoryId: category.id,
        payee: "",
        memo: "",
        transferAccountId: null,
        cleared: true,
        recurringId: null,
      },
    });
    const withBudget = budgetReducer(withTx, {
      type: "SET_BUDGET",
      categoryId: category.id,
      month: "2026-07",
      limitCents: 10000,
    });
    const deleted = budgetReducer(withBudget, {
      type: "DELETE_CATEGORY",
      categoryId: category.id,
    });
    expect(
      deleted.categories.find((c) => c.id === category.id),
    ).toBeUndefined();
    expect(deleted.transactions[0]?.categoryId).toBeNull();
    expect(deleted.budgets).toHaveLength(0);
  });
});

describe("budgetReducer — transactions", () => {
  it("ADD_TRANSACTION appends a transaction", () => {
    const { state, accountId } = withAccount();
    const next = budgetReducer(state, {
      type: "ADD_TRANSACTION",
      transaction: {
        accountId,
        type: "income",
        amountCents: 2000,
        date: "2026-07-01",
        categoryId: null,
        payee: "Paycheck",
        memo: "",
        transferAccountId: null,
        cleared: true,
        recurringId: null,
      },
    });
    expect(next.transactions).toHaveLength(1);
  });

  it("UPDATE_TRANSACTION patches fields and bumps updatedAt", async () => {
    const { state, accountId } = withAccount();
    const withTx = budgetReducer(state, {
      type: "ADD_TRANSACTION",
      transaction: {
        accountId,
        type: "expense",
        amountCents: 1000,
        date: "2026-07-01",
        categoryId: null,
        payee: "Original",
        memo: "",
        transferAccountId: null,
        cleared: false,
        recurringId: null,
      },
    });
    const txId = withTx.transactions[0]!.id;
    const originalUpdatedAt = withTx.transactions[0]!.updatedAt;
    await new Promise((r) => setTimeout(r, 2));
    const next = budgetReducer(withTx, {
      type: "UPDATE_TRANSACTION",
      transactionId: txId,
      patch: { payee: "Renamed", cleared: true },
    });
    expect(next.transactions[0]?.payee).toBe("Renamed");
    expect(next.transactions[0]?.cleared).toBe(true);
    expect(next.transactions[0]?.updatedAt).not.toBe(originalUpdatedAt);
  });

  it("DELETE_TRANSACTION removes only the targeted transaction", () => {
    const { state, accountId } = withAccount();
    const withTwo = [1, 2].reduce(
      (s) =>
        budgetReducer(s, {
          type: "ADD_TRANSACTION",
          transaction: {
            accountId,
            type: "expense",
            amountCents: 100,
            date: "2026-07-01",
            categoryId: null,
            payee: "",
            memo: "",
            transferAccountId: null,
            cleared: true,
            recurringId: null,
          },
        }),
      state,
    );
    const toDelete = withTwo.transactions[0]!.id;
    const next = budgetReducer(withTwo, {
      type: "DELETE_TRANSACTION",
      transactionId: toDelete,
    });
    expect(next.transactions).toHaveLength(1);
    expect(next.transactions.find((t) => t.id === toDelete)).toBeUndefined();
  });

  it("IMPORT_TRANSACTIONS bulk-appends transactions", () => {
    const { state, accountId } = withAccount();
    const imported = [1, 2, 3].map((n) => ({
      id: `imp-${n}`,
      accountId,
      type: "expense" as const,
      amountCents: n * 100,
      date: "2026-07-01",
      categoryId: null,
      payee: "",
      memo: "",
      transferAccountId: null,
      cleared: false,
      recurringId: null,
      createdAt: "now",
      updatedAt: "now",
    }));
    const next = budgetReducer(state, {
      type: "IMPORT_TRANSACTIONS",
      transactions: imported,
    });
    expect(next.transactions).toHaveLength(3);
  });
});

describe("budgetReducer — recurring rules", () => {
  function withRule() {
    const { state, accountId } = withAccount();
    const next = budgetReducer(state, {
      type: "ADD_RECURRING",
      rule: {
        name: "Rent",
        accountId,
        type: "expense",
        amountCents: 150000,
        categoryId: null,
        payee: "Landlord",
        memo: "",
        frequency: "monthly",
        interval: 1,
        startDate: "2026-01-01",
        endDate: null,
        nextDueDate: "2026-07-01",
        active: true,
      },
    });
    return { state: next, ruleId: next.recurringRules[0]!.id };
  }

  it("ADD_RECURRING appends a rule", () => {
    const { state } = withRule();
    expect(state.recurringRules).toHaveLength(1);
  });

  it("UPDATE_RECURRING patches fields", () => {
    const { state, ruleId } = withRule();
    const next = budgetReducer(state, {
      type: "UPDATE_RECURRING",
      ruleId,
      patch: { amountCents: 160000 },
    });
    expect(next.recurringRules[0]?.amountCents).toBe(160000);
  });

  it("DELETE_RECURRING removes the rule", () => {
    const { state, ruleId } = withRule();
    const next = budgetReducer(state, { type: "DELETE_RECURRING", ruleId });
    expect(next.recurringRules).toHaveLength(0);
  });

  it("SET_RECURRING_ACTIVE toggles active without deleting", () => {
    const { state, ruleId } = withRule();
    const next = budgetReducer(state, {
      type: "SET_RECURRING_ACTIVE",
      ruleId,
      active: false,
    });
    expect(next.recurringRules[0]?.active).toBe(false);
    expect(next.recurringRules).toHaveLength(1);
  });

  it("GENERATE_DUE_RECURRING materializes due transactions and advances nextDueDate", () => {
    const { state } = withRule();
    const next = budgetReducer(state, {
      type: "GENERATE_DUE_RECURRING",
      asOf: "2026-07-22",
    });
    expect(next.transactions).toHaveLength(1);
    expect(next.recurringRules[0]?.nextDueDate).toBe("2026-08-01");
  });

  it("GENERATE_DUE_RECURRING is a no-op (same state) when nothing is due", () => {
    const { state } = withRule();
    const rescheduled = budgetReducer(state, {
      type: "UPDATE_RECURRING",
      ruleId: state.recurringRules[0]!.id,
      patch: { nextDueDate: "2030-01-01" },
    });
    const next = budgetReducer(rescheduled, {
      type: "GENERATE_DUE_RECURRING",
      asOf: "2026-07-22",
    });
    expect(next).toBe(rescheduled);
  });
});

describe("budgetReducer — budgets", () => {
  it("SET_BUDGET creates a new entry for a category/month pair", () => {
    const state = createEmptyState();
    const categoryId = state.categories[0]!.id;
    const next = budgetReducer(state, {
      type: "SET_BUDGET",
      categoryId,
      month: "2026-07",
      limitCents: 20000,
    });
    expect(next.budgets).toHaveLength(1);
    expect(next.budgets[0]?.limitCents).toBe(20000);
  });

  it("SET_BUDGET updates the existing entry instead of duplicating it", () => {
    const state = createEmptyState();
    const categoryId = state.categories[0]!.id;
    const first = budgetReducer(state, {
      type: "SET_BUDGET",
      categoryId,
      month: "2026-07",
      limitCents: 20000,
    });
    const second = budgetReducer(first, {
      type: "SET_BUDGET",
      categoryId,
      month: "2026-07",
      limitCents: 30000,
    });
    expect(second.budgets).toHaveLength(1);
    expect(second.budgets[0]?.limitCents).toBe(30000);
  });

  it("DELETE_BUDGET removes only the matching category/month entry", () => {
    const state = createEmptyState();
    const categoryId = state.categories[0]!.id;
    const withTwoMonths = budgetReducer(
      budgetReducer(state, {
        type: "SET_BUDGET",
        categoryId,
        month: "2026-06",
        limitCents: 100,
      }),
      { type: "SET_BUDGET", categoryId, month: "2026-07", limitCents: 200 },
    );
    const next = budgetReducer(withTwoMonths, {
      type: "DELETE_BUDGET",
      categoryId,
      month: "2026-06",
    });
    expect(next.budgets).toHaveLength(1);
    expect(next.budgets[0]?.month).toBe("2026-07");
  });

  it("COPY_BUDGETS_FROM_PREVIOUS_MONTH copies entries not already present in the target month", () => {
    const state = createEmptyState();
    const [catA, catB] = state.categories;
    const withJune = budgetReducer(
      budgetReducer(state, {
        type: "SET_BUDGET",
        categoryId: catA!.id,
        month: "2026-06",
        limitCents: 100,
      }),
      {
        type: "SET_BUDGET",
        categoryId: catB!.id,
        month: "2026-06",
        limitCents: 200,
      },
    );
    const withJulyOverride = budgetReducer(withJune, {
      type: "SET_BUDGET",
      categoryId: catA!.id,
      month: "2026-07",
      limitCents: 999,
    });
    const next = budgetReducer(withJulyOverride, {
      type: "COPY_BUDGETS_FROM_PREVIOUS_MONTH",
      fromMonth: "2026-06",
      toMonth: "2026-07",
    });
    const july = next.budgets.filter((b) => b.month === "2026-07");
    expect(july).toHaveLength(2);
    expect(july.find((b) => b.categoryId === catA!.id)?.limitCents).toBe(999);
    expect(july.find((b) => b.categoryId === catB!.id)?.limitCents).toBe(200);
  });
});

describe("budgetReducer — savings goals", () => {
  function withGoal() {
    const state = budgetReducer(createEmptyState(), {
      type: "ADD_GOAL",
      name: "Emergency Fund",
      targetCents: 500000,
      color: "green",
      targetDate: null,
    });
    return { state, goalId: state.goals[0]!.id };
  }

  it("ADD_GOAL appends a goal with no contributions", () => {
    const { state } = withGoal();
    expect(state.goals).toHaveLength(1);
    expect(state.goals[0]?.contributions).toEqual([]);
  });

  it("UPDATE_GOAL patches fields", () => {
    const { state, goalId } = withGoal();
    const next = budgetReducer(state, {
      type: "UPDATE_GOAL",
      goalId,
      patch: { name: "Renamed" },
    });
    expect(next.goals[0]?.name).toBe("Renamed");
  });

  it("DELETE_GOAL removes the goal", () => {
    const { state, goalId } = withGoal();
    const next = budgetReducer(state, { type: "DELETE_GOAL", goalId });
    expect(next.goals).toHaveLength(0);
  });

  it("ADD_GOAL_CONTRIBUTION appends a contribution", () => {
    const { state, goalId } = withGoal();
    const next = budgetReducer(state, {
      type: "ADD_GOAL_CONTRIBUTION",
      goalId,
      amountCents: 10000,
      date: "2026-07-01",
    });
    expect(next.goals[0]?.contributions).toHaveLength(1);
    expect(next.goals[0]?.contributions[0]?.amountCents).toBe(10000);
  });

  it("DELETE_GOAL_CONTRIBUTION removes only the targeted contribution", () => {
    const { state, goalId } = withGoal();
    const withTwo = budgetReducer(
      budgetReducer(state, {
        type: "ADD_GOAL_CONTRIBUTION",
        goalId,
        amountCents: 1000,
        date: "2026-07-01",
      }),
      {
        type: "ADD_GOAL_CONTRIBUTION",
        goalId,
        amountCents: 2000,
        date: "2026-07-02",
      },
    );
    const toDelete = withTwo.goals[0]!.contributions[0]!.id;
    const next = budgetReducer(withTwo, {
      type: "DELETE_GOAL_CONTRIBUTION",
      goalId,
      contributionId: toDelete,
    });
    expect(next.goals[0]?.contributions).toHaveLength(1);
  });
});

describe("budgetReducer — bulk state operations", () => {
  it("REPLACE_STATE swaps in an entirely new state", () => {
    const replacement = createEmptyState();
    const next = budgetReducer(createEmptyState(), {
      type: "REPLACE_STATE",
      state: replacement,
    });
    expect(next).toBe(replacement);
  });

  it("CLEAR_ALL resets to a fresh empty state with fresh default categories", () => {
    const { state, accountId } = withAccount();
    const withTx = budgetReducer(state, {
      type: "ADD_TRANSACTION",
      transaction: {
        accountId,
        type: "expense",
        amountCents: 100,
        date: "2026-07-01",
        categoryId: null,
        payee: "",
        memo: "",
        transferAccountId: null,
        cleared: true,
        recurringId: null,
      },
    });
    const cleared = budgetReducer(withTx, { type: "CLEAR_ALL" });
    expect(cleared.accounts).toEqual([]);
    expect(cleared.transactions).toEqual([]);
    expect(cleared.categories.length).toBeGreaterThan(0);
  });

  it("an unknown action returns the same state unchanged", () => {
    const state = createEmptyState();
    // @ts-expect-error deliberately invalid action for the default-case test
    const next = budgetReducer(state, { type: "NOT_REAL" });
    expect(next).toBe(state);
  });
});

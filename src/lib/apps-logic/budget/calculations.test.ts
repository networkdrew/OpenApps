import { describe, expect, it } from "vitest";
import {
  accountBalanceCents,
  budgetProgressForMonth,
  budgetStatusForPercent,
  categoryTotalsForMonth,
  goalProgress,
  monthlyTotals,
  netWorthSeries,
  savingsRatePercent,
  totalBalanceCents,
  transactionsInMonth,
  upcomingRecurring,
} from "./calculations";
import {
  createAccount,
  createCategory,
  createRecurringRule,
  createSavingsGoal,
  createTransaction,
} from "./model";
import { createGoalContribution } from "./model";

function tx(overrides: Partial<Parameters<typeof createTransaction>[0]>) {
  return createTransaction({
    accountId: "acc-1",
    type: "expense",
    amountCents: 1000,
    date: "2026-07-15",
    categoryId: "cat-1",
    payee: "Test",
    memo: "",
    transferAccountId: null,
    cleared: true,
    recurringId: null,
    ...overrides,
  });
}

describe("accountBalanceCents", () => {
  it("starts at the starting balance with no transactions", () => {
    const account = createAccount("Checking", "checking", 10000);
    expect(accountBalanceCents(account, [])).toBe(10000);
  });

  it("adds income and subtracts expenses for that account", () => {
    const account = createAccount("Checking", "checking", 10000);
    account.id = "acc-1";
    const transactions = [
      tx({ type: "income", amountCents: 5000 }),
      tx({ type: "expense", amountCents: 2000 }),
    ];
    expect(accountBalanceCents(account, transactions)).toBe(
      10000 + 5000 - 2000,
    );
  });

  it("ignores transactions on other accounts", () => {
    const account = createAccount("Checking", "checking", 1000);
    account.id = "acc-1";
    const transactions = [
      tx({ accountId: "acc-2", type: "income", amountCents: 5000 }),
    ];
    expect(accountBalanceCents(account, transactions)).toBe(1000);
  });

  it("moves money out of the source and into the destination of a transfer", () => {
    const source = createAccount("Checking", "checking", 10000);
    source.id = "acc-1";
    const dest = createAccount("Savings", "savings", 0);
    dest.id = "acc-2";
    const transactions = [
      tx({
        type: "transfer",
        accountId: "acc-1",
        transferAccountId: "acc-2",
        amountCents: 3000,
      }),
    ];
    expect(accountBalanceCents(source, transactions)).toBe(7000);
    expect(accountBalanceCents(dest, transactions)).toBe(3000);
  });

  it("respects an asOf cutoff, ignoring later transactions", () => {
    const account = createAccount("Checking", "checking", 0);
    account.id = "acc-1";
    const transactions = [
      tx({ type: "income", amountCents: 1000, date: "2026-07-01" }),
      tx({ type: "income", amountCents: 2000, date: "2026-08-01" }),
    ];
    expect(
      accountBalanceCents(account, transactions, { asOf: "2026-07-31" }),
    ).toBe(1000);
  });
});

describe("totalBalanceCents", () => {
  it("sums non-archived accounts by default", () => {
    const a = createAccount("A", "checking", 1000);
    const b = createAccount("B", "savings", 2000);
    b.archived = true;
    expect(totalBalanceCents([a, b], [])).toBe(1000);
  });

  it("includes archived accounts when asked", () => {
    const a = createAccount("A", "checking", 1000);
    const b = createAccount("B", "savings", 2000);
    b.archived = true;
    expect(totalBalanceCents([a, b], [], { includeArchived: true })).toBe(3000);
  });
});

describe("netWorthSeries", () => {
  it("reflects only transactions dated on/before each month's end", () => {
    const account = createAccount("Checking", "checking", 0);
    account.id = "acc-1";
    const transactions = [
      tx({ type: "income", amountCents: 1000, date: "2026-06-15" }),
      tx({ type: "income", amountCents: 2000, date: "2026-07-15" }),
    ];
    const series = netWorthSeries([account], transactions, [
      "2026-06",
      "2026-07",
    ]);
    expect(series).toEqual([
      { month: "2026-06", balanceCents: 1000 },
      { month: "2026-07", balanceCents: 3000 },
    ]);
  });
});

describe("transactionsInMonth", () => {
  it("filters to the given month only", () => {
    const transactions = [
      tx({ date: "2026-07-01" }),
      tx({ date: "2026-08-01" }),
    ];
    expect(transactionsInMonth(transactions, "2026-07")).toHaveLength(1);
  });
});

describe("monthlyTotals", () => {
  it("sums income and expense separately per month", () => {
    const transactions = [
      tx({ type: "income", amountCents: 5000, date: "2026-07-01" }),
      tx({ type: "expense", amountCents: 2000, date: "2026-07-15" }),
      tx({
        type: "transfer",
        amountCents: 9999,
        date: "2026-07-20",
        transferAccountId: "acc-2",
      }),
    ];
    const [july] = monthlyTotals(transactions, ["2026-07"]);
    expect(july).toEqual({
      month: "2026-07",
      incomeCents: 5000,
      expenseCents: 2000,
      netCents: 3000,
    });
  });

  it("excludes transfers from income/expense totals", () => {
    const transactions = [
      tx({
        type: "transfer",
        amountCents: 5000,
        date: "2026-07-01",
        transferAccountId: "acc-2",
      }),
    ];
    const [july] = monthlyTotals(transactions, ["2026-07"]);
    expect(july?.incomeCents).toBe(0);
    expect(july?.expenseCents).toBe(0);
  });
});

describe("categoryTotalsForMonth", () => {
  it("groups expense totals by category, omitting categories with no spending", () => {
    const transactions = [
      tx({ categoryId: "food", amountCents: 1000, date: "2026-07-01" }),
      tx({ categoryId: "food", amountCents: 500, date: "2026-07-10" }),
      tx({ categoryId: "gas", amountCents: 2000, date: "2026-07-05" }),
    ];
    const totals = categoryTotalsForMonth(transactions, "2026-07", "expense");
    expect(totals.get("food")).toBe(1500);
    expect(totals.get("gas")).toBe(2000);
    expect(totals.has("rent")).toBe(false);
  });

  it("ignores transactions with no category", () => {
    const transactions = [tx({ categoryId: null, amountCents: 1000 })];
    const totals = categoryTotalsForMonth(transactions, "2026-07", "expense");
    expect(totals.size).toBe(0);
  });
});

describe("budgetStatusForPercent", () => {
  it("is good under 80%", () => {
    expect(budgetStatusForPercent(50)).toBe("good");
  });
  it("is warning from 80% to under 100%", () => {
    expect(budgetStatusForPercent(80)).toBe("warning");
    expect(budgetStatusForPercent(99)).toBe("warning");
  });
  it("is critical at or over 100%", () => {
    expect(budgetStatusForPercent(100)).toBe("critical");
    expect(budgetStatusForPercent(150)).toBe("critical");
  });
});

describe("budgetProgressForMonth", () => {
  it("computes spent, remaining, percent, and status per budgeted category", () => {
    const category = createCategory("Groceries", "expense", "green");
    const transactions = [
      tx({ categoryId: category.id, amountCents: 8000, date: "2026-07-05" }),
    ];
    const budgets = [
      {
        id: "b1",
        categoryId: category.id,
        month: "2026-07",
        limitCents: 10000,
      },
    ];
    const [progress] = budgetProgressForMonth(
      budgets,
      transactions,
      [category],
      "2026-07",
    );
    expect(progress).toMatchObject({
      spentCents: 8000,
      limitCents: 10000,
      remainingCents: 2000,
      percent: 80,
      status: "warning",
    });
  });

  it("only includes budgets for the requested month", () => {
    const budgets = [
      { id: "b1", categoryId: "cat-1", month: "2026-06", limitCents: 5000 },
    ];
    expect(budgetProgressForMonth(budgets, [], [], "2026-07")).toEqual([]);
  });

  it("treats a zero limit as 0% rather than dividing by zero", () => {
    const budgets = [
      { id: "b1", categoryId: "cat-1", month: "2026-07", limitCents: 0 },
    ];
    const [progress] = budgetProgressForMonth(budgets, [], [], "2026-07");
    expect(progress?.percent).toBe(0);
    expect(Number.isFinite(progress?.percent)).toBe(true);
  });
});

describe("upcomingRecurring", () => {
  it("includes only active rules due within the window", () => {
    const soon = createRecurringRule({
      name: "Rent",
      accountId: "acc-1",
      type: "expense",
      amountCents: 1000,
      categoryId: null,
      payee: "",
      memo: "",
      frequency: "monthly",
      interval: 1,
      startDate: "2026-07-01",
      endDate: null,
      nextDueDate: "2026-07-25",
      active: true,
    });
    const far = createRecurringRule({
      name: "Insurance",
      accountId: "acc-1",
      type: "expense",
      amountCents: 1000,
      categoryId: null,
      payee: "",
      memo: "",
      frequency: "yearly",
      interval: 1,
      startDate: "2026-07-01",
      endDate: null,
      nextDueDate: "2027-01-01",
      active: true,
    });
    const inactive = {
      ...soon,
      id: "inactive",
      active: false,
      nextDueDate: "2026-07-23",
    };
    const result = upcomingRecurring([soon, far, inactive], "2026-07-22", 14);
    expect(result.map((r) => r.id)).toEqual([soon.id]);
  });

  it("sorts by soonest due date first", () => {
    const a = createRecurringRule({
      name: "A",
      accountId: "acc-1",
      type: "expense",
      amountCents: 100,
      categoryId: null,
      payee: "",
      memo: "",
      frequency: "monthly",
      interval: 1,
      startDate: "2026-07-01",
      endDate: null,
      nextDueDate: "2026-07-28",
      active: true,
    });
    const b = { ...a, id: "b", nextDueDate: "2026-07-23" };
    const result = upcomingRecurring([a, b], "2026-07-22", 14);
    expect(result.map((r) => r.id)).toEqual(["b", a.id]);
  });
});

describe("goalProgress", () => {
  it("sums contributions and computes percent complete", () => {
    const goal = createSavingsGoal("Vacation", 100000, "blue");
    goal.contributions = [
      createGoalContribution(25000, "2026-07-01"),
      createGoalContribution(25000, "2026-07-15"),
    ];
    const progress = goalProgress(goal);
    expect(progress.savedCents).toBe(50000);
    expect(progress.percent).toBe(50);
    expect(progress.remainingCents).toBe(50000);
  });

  it("caps percent at 100 even if contributions exceed the target", () => {
    const goal = createSavingsGoal("Vacation", 10000, "blue");
    goal.contributions = [createGoalContribution(20000)];
    const progress = goalProgress(goal);
    expect(progress.percent).toBe(100);
    expect(progress.remainingCents).toBe(0);
  });

  it("is 0% for a zero target rather than dividing by zero", () => {
    const goal = createSavingsGoal("No target", 0, "blue");
    expect(goalProgress(goal).percent).toBe(0);
  });
});

describe("savingsRatePercent", () => {
  it("computes the percentage of income retained", () => {
    expect(savingsRatePercent(100000, 75000)).toBe(25);
  });
  it("is 0 when there is no income, not NaN or Infinity", () => {
    expect(savingsRatePercent(0, 5000)).toBe(0);
    expect(savingsRatePercent(-100, 5000)).toBe(0);
  });
  it("can go negative when spending exceeds income", () => {
    expect(savingsRatePercent(1000, 1500)).toBe(-50);
  });
});

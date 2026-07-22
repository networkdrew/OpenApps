import { describe, expect, it, beforeEach } from "vitest";
import {
  clearBudgetState,
  importBudgetState,
  loadBudgetState,
  saveBudgetState,
  STORAGE_KEY,
} from "./persistence";
import { createAccount, createEmptyState } from "./model";

describe("budget persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns a fresh empty state (with seeded default categories) when nothing is stored", () => {
    const state = loadBudgetState();
    expect(state.accounts).toEqual([]);
    expect(state.transactions).toEqual([]);
    expect(state.categories.length).toBeGreaterThan(0);
  });

  it("saves and reloads a state with an account", () => {
    const state = {
      ...createEmptyState(),
      accounts: [createAccount("Checking", "checking", 10000)],
    };
    saveBudgetState(state);
    const reloaded = loadBudgetState();
    expect(reloaded.accounts[0]?.name).toBe("Checking");
    expect(reloaded.accounts[0]?.startingBalanceCents).toBe(10000);
  });

  it("clears stored state", () => {
    const state = {
      ...createEmptyState(),
      accounts: [createAccount("Checking", "checking")],
    };
    saveBudgetState(state);
    clearBudgetState();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadBudgetState().accounts).toEqual([]);
  });

  it("imports a previously exported state", async () => {
    const state = {
      ...createEmptyState(),
      accounts: [createAccount("Exported", "savings")],
    };
    const file = new File([JSON.stringify(state)], "export.json", {
      type: "application/json",
    });
    const result = await importBudgetState(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.accounts[0]?.name).toBe("Exported");
    }
  });

  it("rejects a file that isn't a valid budget export", async () => {
    const file = new File([JSON.stringify({ hello: "world" })], "bad.json", {
      type: "application/json",
    });
    const result = await importBudgetState(file);
    expect(result.ok).toBe(false);
  });

  it("rejects a file that isn't valid JSON", async () => {
    const file = new File(["not json"], "bad.json", {
      type: "application/json",
    });
    const result = await importBudgetState(file);
    expect(result.ok).toBe(false);
  });
});

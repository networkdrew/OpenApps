import { generateDueTransactions } from "./recurring";
import {
  createAccount,
  createBudgetEntry,
  createCategory,
  createEmptyState,
  createGoalContribution,
  createRecurringRule,
  createSavingsGoal,
  createTransaction,
  type Account,
  type AccountType,
  type BudgetState,
  type Category,
  type CategoryColor,
  type CategoryKind,
  type RecurringRule,
  type SavingsGoal,
  type Transaction,
} from "./model";

export type NewTransactionInput = Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt"
>;

export type NewRecurringInput = Omit<RecurringRule, "id" | "createdAt">;

export type BudgetAction =
  | {
      type: "ADD_ACCOUNT";
      name: string;
      accountType: AccountType;
      startingBalanceCents: number;
    }
  | {
      type: "UPDATE_ACCOUNT";
      accountId: string;
      patch: Partial<
        Pick<Account, "name" | "type" | "startingBalanceCents" | "notes">
      >;
    }
  | { type: "ARCHIVE_ACCOUNT"; accountId: string; archived: boolean }
  | { type: "DELETE_ACCOUNT"; accountId: string }
  | {
      type: "ADD_CATEGORY";
      name: string;
      kind: CategoryKind;
      color: CategoryColor;
    }
  | {
      type: "UPDATE_CATEGORY";
      categoryId: string;
      patch: Partial<Pick<Category, "name" | "color">>;
    }
  | { type: "DELETE_CATEGORY"; categoryId: string }
  | { type: "ADD_TRANSACTION"; transaction: NewTransactionInput }
  | {
      type: "UPDATE_TRANSACTION";
      transactionId: string;
      patch: Partial<
        Pick<
          Transaction,
          | "accountId"
          | "type"
          | "amountCents"
          | "date"
          | "categoryId"
          | "payee"
          | "memo"
          | "transferAccountId"
          | "cleared"
        >
      >;
    }
  | { type: "DELETE_TRANSACTION"; transactionId: string }
  | { type: "IMPORT_TRANSACTIONS"; transactions: Transaction[] }
  | { type: "ADD_RECURRING"; rule: NewRecurringInput }
  | {
      type: "UPDATE_RECURRING";
      ruleId: string;
      patch: Partial<
        Pick<
          RecurringRule,
          | "name"
          | "accountId"
          | "type"
          | "amountCents"
          | "categoryId"
          | "payee"
          | "memo"
          | "frequency"
          | "interval"
          | "startDate"
          | "endDate"
          | "nextDueDate"
        >
      >;
    }
  | { type: "DELETE_RECURRING"; ruleId: string }
  | { type: "SET_RECURRING_ACTIVE"; ruleId: string; active: boolean }
  | { type: "GENERATE_DUE_RECURRING"; asOf: string }
  | {
      type: "SET_BUDGET";
      categoryId: string;
      month: string;
      limitCents: number;
    }
  | { type: "DELETE_BUDGET"; categoryId: string; month: string }
  | {
      type: "COPY_BUDGETS_FROM_PREVIOUS_MONTH";
      fromMonth: string;
      toMonth: string;
    }
  | {
      type: "ADD_GOAL";
      name: string;
      targetCents: number;
      color: CategoryColor;
      targetDate: string | null;
    }
  | {
      type: "UPDATE_GOAL";
      goalId: string;
      patch: Partial<
        Pick<
          SavingsGoal,
          "name" | "targetCents" | "color" | "targetDate" | "archived"
        >
      >;
    }
  | { type: "DELETE_GOAL"; goalId: string }
  | {
      type: "ADD_GOAL_CONTRIBUTION";
      goalId: string;
      amountCents: number;
      date: string;
    }
  | { type: "DELETE_GOAL_CONTRIBUTION"; goalId: string; contributionId: string }
  | { type: "REPLACE_STATE"; state: BudgetState }
  | { type: "CLEAR_ALL" };

function nowIso(): string {
  return new Date().toISOString();
}

export function budgetReducer(
  state: BudgetState,
  action: BudgetAction,
): BudgetState {
  switch (action.type) {
    case "ADD_ACCOUNT": {
      const account = createAccount(
        action.name,
        action.accountType,
        action.startingBalanceCents,
      );
      return { ...state, accounts: [...state.accounts, account] };
    }

    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.accountId
            ? { ...a, ...action.patch, updatedAt: nowIso() }
            : a,
        ),
      };

    case "ARCHIVE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.accountId
            ? { ...a, archived: action.archived, updatedAt: nowIso() }
            : a,
        ),
      };

    case "DELETE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.accountId),
        transactions: state.transactions.filter(
          (tx) =>
            tx.accountId !== action.accountId &&
            tx.transferAccountId !== action.accountId,
        ),
        recurringRules: state.recurringRules.filter(
          (r) => r.accountId !== action.accountId,
        ),
      };

    case "ADD_CATEGORY": {
      const category = createCategory(action.name, action.kind, action.color);
      return { ...state, categories: [...state.categories, category] };
    }

    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.categoryId ? { ...c, ...action.patch } : c,
        ),
      };

    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.categoryId),
        transactions: state.transactions.map((tx) =>
          tx.categoryId === action.categoryId
            ? { ...tx, categoryId: null }
            : tx,
        ),
        recurringRules: state.recurringRules.map((r) =>
          r.categoryId === action.categoryId ? { ...r, categoryId: null } : r,
        ),
        budgets: state.budgets.filter(
          (b) => b.categoryId !== action.categoryId,
        ),
      };

    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [
          ...state.transactions,
          createTransaction(action.transaction),
        ],
      };

    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.transactionId
            ? { ...tx, ...action.patch, updatedAt: nowIso() }
            : tx,
        ),
      };

    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter(
          (tx) => tx.id !== action.transactionId,
        ),
      };

    case "IMPORT_TRANSACTIONS":
      return {
        ...state,
        transactions: [...state.transactions, ...action.transactions],
      };

    case "ADD_RECURRING":
      return {
        ...state,
        recurringRules: [
          ...state.recurringRules,
          createRecurringRule(action.rule),
        ],
      };

    case "UPDATE_RECURRING":
      return {
        ...state,
        recurringRules: state.recurringRules.map((r) =>
          r.id === action.ruleId ? { ...r, ...action.patch } : r,
        ),
      };

    case "DELETE_RECURRING":
      return {
        ...state,
        recurringRules: state.recurringRules.filter(
          (r) => r.id !== action.ruleId,
        ),
      };

    case "SET_RECURRING_ACTIVE":
      return {
        ...state,
        recurringRules: state.recurringRules.map((r) =>
          r.id === action.ruleId ? { ...r, active: action.active } : r,
        ),
      };

    case "GENERATE_DUE_RECURRING": {
      const { transactions, updatedRules } = generateDueTransactions(
        state.recurringRules,
        action.asOf,
      );
      if (transactions.length === 0) return state;
      return {
        ...state,
        transactions: [...state.transactions, ...transactions],
        recurringRules: updatedRules,
      };
    }

    case "SET_BUDGET": {
      const existing = state.budgets.find(
        (b) => b.categoryId === action.categoryId && b.month === action.month,
      );
      if (existing) {
        return {
          ...state,
          budgets: state.budgets.map((b) =>
            b.id === existing.id ? { ...b, limitCents: action.limitCents } : b,
          ),
        };
      }
      return {
        ...state,
        budgets: [
          ...state.budgets,
          createBudgetEntry(action.categoryId, action.month, action.limitCents),
        ],
      };
    }

    case "DELETE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.filter(
          (b) =>
            !(b.categoryId === action.categoryId && b.month === action.month),
        ),
      };

    case "COPY_BUDGETS_FROM_PREVIOUS_MONTH": {
      const source = state.budgets.filter((b) => b.month === action.fromMonth);
      const existingTargetCategoryIds = new Set(
        state.budgets
          .filter((b) => b.month === action.toMonth)
          .map((b) => b.categoryId),
      );
      const toCopy = source.filter(
        (b) => !existingTargetCategoryIds.has(b.categoryId),
      );
      if (toCopy.length === 0) return state;
      return {
        ...state,
        budgets: [
          ...state.budgets,
          ...toCopy.map((b) =>
            createBudgetEntry(b.categoryId, action.toMonth, b.limitCents),
          ),
        ],
      };
    }

    case "ADD_GOAL":
      return {
        ...state,
        goals: [
          ...state.goals,
          createSavingsGoal(
            action.name,
            action.targetCents,
            action.color,
            action.targetDate,
          ),
        ],
      };

    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId ? { ...g, ...action.patch } : g,
        ),
      };

    case "DELETE_GOAL":
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.goalId),
      };

    case "ADD_GOAL_CONTRIBUTION":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId
            ? {
                ...g,
                contributions: [
                  ...g.contributions,
                  createGoalContribution(action.amountCents, action.date),
                ],
              }
            : g,
        ),
      };

    case "DELETE_GOAL_CONTRIBUTION":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId
            ? {
                ...g,
                contributions: g.contributions.filter(
                  (c) => c.id !== action.contributionId,
                ),
              }
            : g,
        ),
      };

    case "REPLACE_STATE":
      return action.state;

    case "CLEAR_ALL":
      return createEmptyState();

    default:
      return state;
  }
}

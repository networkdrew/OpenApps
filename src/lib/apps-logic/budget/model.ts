import type { Frequency } from "./dates";
import { todayIso } from "./dates";

export type AccountType =
  "checking" | "savings" | "credit-card" | "cash" | "investment" | "other";

export const ACCOUNT_TYPES: AccountType[] = [
  "checking",
  "savings",
  "credit-card",
  "cash",
  "investment",
  "other",
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  "credit-card": "Credit card",
  cash: "Cash",
  investment: "Investment",
  other: "Other",
};

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** Balance before any tracked transaction, in integer cents. */
  startingBalanceCents: number;
  archived: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CategoryKind = "income" | "expense";

/** Fixed swatch keys, not raw CSS colors, so light/dark themes stay consistent (see kanban's LABEL_COLORS). */
export const CATEGORY_COLORS = [
  "blue",
  "orange",
  "aqua",
  "yellow",
  "magenta",
  "green",
  "violet",
  "red",
] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  color: CategoryColor;
  isDefault: boolean;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  /** Always a positive integer number of cents; sign is implied by `type`. */
  amountCents: number;
  date: string;
  categoryId: string | null;
  payee: string;
  memo: string;
  /** Only set when type is "transfer" — the other account in the transfer. */
  transferAccountId: string | null;
  cleared: boolean;
  /** Id of the recurring rule that generated this transaction, if any. */
  recurringId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringRule {
  id: string;
  name: string;
  accountId: string;
  type: "income" | "expense";
  amountCents: number;
  categoryId: string | null;
  payee: string;
  memo: string;
  frequency: Frequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  active: boolean;
  createdAt: string;
}

export interface BudgetEntry {
  id: string;
  categoryId: string;
  /** "YYYY-MM" */
  month: string;
  limitCents: number;
}

export interface GoalContribution {
  id: string;
  date: string;
  amountCents: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetCents: number;
  targetDate: string | null;
  color: CategoryColor;
  contributions: GoalContribution[];
  createdAt: string;
  archived: boolean;
}

export interface BudgetState {
  version: 1;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  budgets: BudgetEntry[];
  goals: SavingsGoal[];
}

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createAccount(
  name: string,
  type: AccountType,
  startingBalanceCents = 0,
): Account {
  const ts = nowIso();
  return {
    id: newId(),
    name,
    type,
    startingBalanceCents,
    archived: false,
    notes: "",
    createdAt: ts,
    updatedAt: ts,
  };
}

export function createCategory(
  name: string,
  kind: CategoryKind,
  color: CategoryColor,
  isDefault = false,
): Category {
  return { id: newId(), name, kind, color, isDefault };
}

export function createTransaction(
  input: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Transaction {
  const ts = nowIso();
  return { ...input, id: newId(), createdAt: ts, updatedAt: ts };
}

export function createRecurringRule(
  input: Omit<RecurringRule, "id" | "createdAt">,
): RecurringRule {
  return { ...input, id: newId(), createdAt: nowIso() };
}

export function createBudgetEntry(
  categoryId: string,
  month: string,
  limitCents: number,
): BudgetEntry {
  return { id: newId(), categoryId, month, limitCents };
}

export function createSavingsGoal(
  name: string,
  targetCents: number,
  color: CategoryColor,
  targetDate: string | null = null,
): SavingsGoal {
  return {
    id: newId(),
    name,
    targetCents,
    targetDate,
    color,
    contributions: [],
    createdAt: nowIso(),
    archived: false,
  };
}

export function createGoalContribution(
  amountCents: number,
  date = todayIso(),
): GoalContribution {
  return { id: newId(), date, amountCents };
}

/** Default categories seeded into every fresh budget — deletable/editable like any other category. */
const DEFAULT_INCOME_CATEGORIES: [string, CategoryColor][] = [
  ["Salary", "blue"],
  ["Freelance", "aqua"],
  ["Interest & Dividends", "green"],
  ["Gifts Received", "magenta"],
  ["Other Income", "violet"],
];

const DEFAULT_EXPENSE_CATEGORIES: [string, CategoryColor][] = [
  ["Housing", "blue"],
  ["Utilities", "aqua"],
  ["Groceries", "green"],
  ["Dining Out", "orange"],
  ["Transportation", "yellow"],
  ["Health Care", "red"],
  ["Insurance", "violet"],
  ["Entertainment", "magenta"],
  ["Shopping", "orange"],
  ["Subscriptions", "aqua"],
  ["Education", "blue"],
  ["Travel", "green"],
  ["Personal Care", "magenta"],
  ["Gifts & Donations", "violet"],
  ["Miscellaneous", "yellow"],
];

export function createDefaultCategories(): Category[] {
  return [
    ...DEFAULT_INCOME_CATEGORIES.map(([name, color]) =>
      createCategory(name, "income", color, true),
    ),
    ...DEFAULT_EXPENSE_CATEGORIES.map(([name, color]) =>
      createCategory(name, "expense", color, true),
    ),
  ];
}

export function createEmptyState(): BudgetState {
  return {
    version: 1,
    accounts: [],
    categories: createDefaultCategories(),
    transactions: [],
    recurringRules: [],
    budgets: [],
    goals: [],
  };
}

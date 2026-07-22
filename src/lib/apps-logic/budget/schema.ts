import { z } from "zod";
import { ACCOUNT_TYPES, CATEGORY_COLORS } from "./model";
import { FREQUENCIES } from "./dates";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const monthKeySchema = z.string().regex(/^\d{4}-\d{2}$/);
const cents = z.number().int();

const account = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES as [string, ...string[]]),
  startingBalanceCents: cents,
  archived: z.boolean(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const category = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["income", "expense"]),
  color: z.enum(CATEGORY_COLORS),
  isDefault: z.boolean(),
});

const transaction = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  type: z.enum(["income", "expense", "transfer"]),
  amountCents: cents.nonnegative(),
  date: isoDate,
  categoryId: z.string().nullable(),
  payee: z.string(),
  memo: z.string(),
  transferAccountId: z.string().nullable(),
  cleared: z.boolean(),
  recurringId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const recurringRule = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  accountId: z.string().min(1),
  type: z.enum(["income", "expense"]),
  amountCents: cents.nonnegative(),
  categoryId: z.string().nullable(),
  payee: z.string(),
  memo: z.string(),
  frequency: z.enum(FREQUENCIES as [string, ...string[]]),
  interval: z.number().int().positive(),
  startDate: isoDate,
  endDate: isoDate.nullable(),
  nextDueDate: isoDate,
  active: z.boolean(),
  createdAt: z.string(),
});

const budgetEntry = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  month: monthKeySchema,
  limitCents: cents.nonnegative(),
});

const goalContribution = z.object({
  id: z.string().min(1),
  date: isoDate,
  amountCents: cents,
});

const savingsGoal = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetCents: cents.nonnegative(),
  targetDate: isoDate.nullable(),
  color: z.enum(CATEGORY_COLORS),
  contributions: z.array(goalContribution),
  createdAt: z.string(),
  archived: z.boolean(),
});

/** Validates an imported/stored budget state at the current schema version (1). */
export const budgetStateSchemaV1 = z.object({
  version: z.literal(1),
  accounts: z.array(account),
  categories: z.array(category),
  transactions: z.array(transaction),
  recurringRules: z.array(recurringRule),
  budgets: z.array(budgetEntry),
  goals: z.array(savingsGoal),
});

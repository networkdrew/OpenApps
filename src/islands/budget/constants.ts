import type { CSSProperties } from "react";
import type { AccountType, CategoryColor } from "@/lib/apps-logic/budget/model";
import type { BudgetStatus } from "@/lib/apps-logic/budget/calculations";
import type { Frequency } from "@/lib/apps-logic/budget/dates";
import { FREQUENCY_LABELS, FREQUENCIES } from "@/lib/apps-logic/budget/dates";
import type { IconName } from "@/components/react/Icon";

/** CSS custom property backing each category color slot — see the `.budget-app` block in global.css. */
export function categoryColorVar(color: CategoryColor): string {
  return `var(--cat-${color})`;
}

export function categoryColorStyle(color: CategoryColor): CSSProperties {
  return { backgroundColor: categoryColorVar(color) };
}

export const CATEGORY_COLOR_LABELS: Record<CategoryColor, string> = {
  blue: "Blue",
  orange: "Orange",
  aqua: "Aqua",
  yellow: "Yellow",
  magenta: "Magenta",
  green: "Green",
  violet: "Violet",
  red: "Red",
};

export const ACCOUNT_TYPE_ICON: Record<AccountType, IconName> = {
  checking: "landmark",
  savings: "piggy-bank",
  "credit-card": "credit-card",
  cash: "wallet",
  investment: "trending-up",
  other: "briefcase",
};

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] =
  FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }));

export const BUDGET_STATUS_META: Record<
  BudgetStatus,
  { label: string; varName: string; icon: IconName }
> = {
  good: { label: "On track", varName: "--status-good", icon: "check" },
  warning: {
    label: "Near limit",
    varName: "--status-warning",
    icon: "triangle-alert",
  },
  critical: {
    label: "Over budget",
    varName: "--status-critical",
    icon: "triangle-alert",
  },
};

export type BudgetTabId =
  "dashboard" | "transactions" | "accounts" | "budgets" | "recurring" | "goals";

export const BUDGET_TABS: { id: BudgetTabId; label: string; icon: IconName }[] =
  [
    { id: "dashboard", label: "Dashboard", icon: "pie-chart" },
    { id: "transactions", label: "Transactions", icon: "receipt" },
    { id: "accounts", label: "Accounts", icon: "wallet" },
    { id: "budgets", label: "Budgets", icon: "target" },
    { id: "recurring", label: "Recurring", icon: "repeat" },
    { id: "goals", label: "Goals", icon: "piggy-bank" },
  ];

import type { Priority } from "@/lib/apps-logic/kanban/model";

export const LABEL_COLOR_SWATCHES: Record<string, string> = {
  red: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  orange:
    "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  amber:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  green:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  teal: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  purple:
    "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  pink: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; className: string }
> = {
  none: { label: "No priority", className: "text-text-muted" },
  low: { label: "Low priority", className: "text-blue-600 dark:text-blue-300" },
  medium: {
    label: "Medium priority",
    className: "text-amber-600 dark:text-amber-300",
  },
  high: { label: "High priority", className: "text-danger" },
};

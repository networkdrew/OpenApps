import type { CategoryColor } from "@/lib/apps-logic/budget/model";
import { formatCents } from "@/lib/apps-logic/budget/money";
import { categoryColorVar } from "../constants";

export interface CategoryBreakdownRow {
  id: string;
  name: string;
  color: CategoryColor | null;
  amountCents: number;
}

interface CategoryBreakdownChartProps {
  rows: CategoryBreakdownRow[];
  emptyMessage: string;
}

/**
 * Ranked horizontal bars for "part-to-whole, categories are the subject."
 * Each row carries its own color chip and direct value label, so no
 * separate legend box is needed — the row IS the legend entry.
 */
export function CategoryBreakdownChart({
  rows,
  emptyMessage,
}: CategoryBreakdownChartProps) {
  if (rows.length === 0) {
    return <p className="text-text-muted text-sm">{emptyMessage}</p>;
  }

  const maxValue = Math.max(...rows.map((r) => r.amountCents), 1);

  return (
    <div className="budget-app flex flex-col gap-2.5">
      {rows.map((row) => {
        const percent = Math.max(2, (row.amountCents / maxValue) * 100);
        return (
          <div key={row.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="text-text flex items-center gap-1.5 truncate font-medium">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: row.color
                      ? categoryColorVar(row.color)
                      : "var(--color-text-muted)",
                  }}
                />
                <span className="truncate">{row.name}</span>
              </span>
              <span className="text-text-muted shrink-0 tabular-nums">
                {formatCents(row.amountCents)}
              </span>
            </div>
            <div
              role="img"
              aria-label={`${row.name}: ${formatCents(row.amountCents)}`}
              className="bg-bg-sunken h-2 w-full overflow-hidden rounded-full"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${percent}%`,
                  backgroundColor: row.color
                    ? categoryColorVar(row.color)
                    : "var(--color-text-muted)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

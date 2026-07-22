import { useId, useState } from "react";
import type { MonthTotals } from "@/lib/apps-logic/budget/calculations";
import { formatMonthLabelShort } from "@/lib/apps-logic/budget/dates";
import { formatCents } from "@/lib/apps-logic/budget/money";

interface CashFlowChartProps {
  data: MonthTotals[];
}

const CHART_HEIGHT = 180;
const HALF_HEIGHT = CHART_HEIGHT / 2;
const BAR_MAX_WIDTH = 22;
const GAP = 2;

/**
 * Diverging grouped-column chart: income grows up from a zero baseline,
 * expense grows down, one column pair per month — income/expense read as
 * opposite poles (the diverging blue/red pair), not an arbitrary series
 * cycle. A legend covers the required 2-series identity channel; only the
 * most recent month gets a direct value label so the chart doesn't flood
 * with text.
 */
export function CashFlowChart({ data }: CashFlowChartProps) {
  const titleId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const maxValue = Math.max(
    1,
    ...data.map((d) => Math.max(d.incomeCents, d.expenseCents)),
  );
  const columnWidth = 100 / data.length;
  const barWidth = Math.min(BAR_MAX_WIDTH, columnWidth - GAP * 2);
  const highlighted = data[hoverIndex ?? data.length - 1];

  return (
    <div className="budget-app">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-text-muted flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--cat-blue)" }}
            />
            Income
          </span>
          <span className="text-text-muted flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--cat-red)" }}
            />
            Expenses
          </span>
        </div>
        {highlighted && (
          <span className="text-text-muted tabular-nums">
            {formatMonthLabelShort(highlighted.month)}:{" "}
            {formatCents(highlighted.incomeCents)} /{" "}
            {formatCents(highlighted.expenseCents)}
          </span>
        )}
      </div>
      <svg
        role="img"
        aria-labelledby={titleId}
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="h-44 w-full"
      >
        <title id={titleId}>Monthly income and expenses</title>
        <line
          x1="0"
          y1={HALF_HEIGHT}
          x2="100"
          y2={HALF_HEIGHT}
          stroke="var(--color-border-strong)"
          strokeWidth="0.5"
        />
        {data.map((month, i) => {
          const x = i * columnWidth + (columnWidth - barWidth) / 2;
          const incomeHeight =
            (month.incomeCents / maxValue) * (HALF_HEIGHT - 8);
          const expenseHeight =
            (month.expenseCents / maxValue) * (HALF_HEIGHT - 8);
          const isHovered = hoverIndex === i;
          return (
            <g
              key={month.month}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              tabIndex={0}
              role="img"
              aria-label={`${formatMonthLabelShort(month.month)}: income ${formatCents(month.incomeCents)}, expenses ${formatCents(month.expenseCents)}`}
            >
              <rect
                x={x}
                y={HALF_HEIGHT - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                rx="1"
                fill="var(--cat-blue)"
                opacity={isHovered ? 1 : 0.9}
              />
              <rect
                x={x}
                y={HALF_HEIGHT}
                width={barWidth}
                height={expenseHeight}
                rx="1"
                fill="var(--cat-red)"
                opacity={isHovered ? 1 : 0.9}
              />
            </g>
          );
        })}
      </svg>
      <div
        className="text-text-muted mt-1 grid text-center text-[10px]"
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
        }}
      >
        {data.map((month) => (
          <span key={month.month}>{formatMonthLabelShort(month.month)}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Monthly income and expenses</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Income</th>
            <th scope="col">Expenses</th>
            <th scope="col">Net</th>
          </tr>
        </thead>
        <tbody>
          {data.map((month) => (
            <tr key={month.month}>
              <th scope="row">{formatMonthLabelShort(month.month)}</th>
              <td>{formatCents(month.incomeCents)}</td>
              <td>{formatCents(month.expenseCents)}</td>
              <td>{formatCents(month.netCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

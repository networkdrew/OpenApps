import { useId } from "react";
import { formatMonthLabelShort } from "@/lib/apps-logic/budget/dates";
import { formatCents } from "@/lib/apps-logic/budget/money";

interface BalanceTrendChartProps {
  data: { month: string; balanceCents: number }[];
}

const WIDTH = 100;
const HEIGHT = 100;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 14;

/**
 * A single-series line/area trend — sequential accent hue, no legend needed
 * for one series. The end value is labeled in plain HTML rather than an
 * in-SVG `<text>` element: this chart intentionally stretches its viewBox
 * non-uniformly (`preserveAspectRatio="none"`) to fill any container width,
 * and SVG text stretches illegibly under a non-uniform scale.
 */
export function BalanceTrendChart({ data }: BalanceTrendChartProps) {
  const titleId = useId();
  if (data.length === 0) return null;

  const values = data.map((d) => d.balanceCents);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  function yFor(value: number): number {
    return PADDING_TOP + plotHeight - ((value - min) / range) * plotHeight;
  }

  const stepX = data.length > 1 ? WIDTH / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: data.length > 1 ? i * stepX : WIDTH / 2,
    y: yFor(d.balanceCents),
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${PADDING_TOP + plotHeight} L ${points[0]!.x} ${PADDING_TOP + plotHeight} Z`;

  const last = points[points.length - 1]!;
  const zeroY = yFor(0);

  return (
    <div className="budget-app">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-text-muted">Current balance</span>
        <span className="text-text font-semibold tabular-nums">
          {formatCents(last.balanceCents)}
        </span>
      </div>
      <svg
        role="img"
        aria-labelledby={titleId}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-40 w-full overflow-visible"
      >
        <title id={titleId}>Total balance over time</title>
        {min < 0 && (
          <line
            x1="0"
            y1={zeroY}
            x2={WIDTH}
            y2={zeroY}
            stroke="var(--color-border-strong)"
            strokeWidth="0.5"
          />
        )}
        <path
          d={areaPath}
          fill="var(--color-accent)"
          opacity="0.1"
          stroke="none"
        />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <circle
            key={p.month}
            cx={p.x}
            cy={p.y}
            r="1.6"
            fill="var(--color-accent)"
            stroke="var(--color-bg-elevated)"
            strokeWidth="0.8"
          >
            <title>
              {formatMonthLabelShort(p.month)}: {formatCents(p.balanceCents)}
            </title>
          </circle>
        ))}
      </svg>
      <div
        className="text-text-muted mt-1 grid text-center text-[10px]"
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
        }}
      >
        {data.map((d) => (
          <span key={d.month}>{formatMonthLabelShort(d.month)}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Total balance at the end of each month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{formatMonthLabelShort(d.month)}</th>
              <td>{formatCents(d.balanceCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

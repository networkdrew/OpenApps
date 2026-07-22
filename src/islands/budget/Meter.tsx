import type { BudgetStatus } from "@/lib/apps-logic/budget/calculations";
import { formatCents } from "@/lib/apps-logic/budget/money";
import { BUDGET_STATUS_META } from "./constants";
import Icon from "@/components/react/Icon";

interface MeterProps {
  label: string;
  valueCents: number;
  targetCents: number;
  /** Percent already computed by the caller (can exceed 100 for an over-budget meter). */
  percent: number;
  status?: BudgetStatus;
  valueSuffix?: string;
}

/**
 * A same-ramp track/fill meter for "one ratio against a limit" (budget
 * spent-vs-limit, goal saved-vs-target). Severity is carried by an icon +
 * label pairing, never by fill color alone, per the accessibility rule for
 * status colors.
 */
export function Meter({
  label,
  valueCents,
  targetCents,
  percent,
  status,
  valueSuffix,
}: MeterProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const meta = status ? BUDGET_STATUS_META[status] : undefined;
  const fillColor = meta ? `var(${meta.varName})` : "var(--color-accent)";

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-text font-medium">{label}</span>
        <span className="text-text-muted text-xs">
          {formatCents(valueCents)} of {formatCents(targetCents)}
          {valueSuffix ?? ""}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="bg-bg-sunken h-2 w-full overflow-hidden rounded-full"
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${clamped}%`, backgroundColor: fillColor }}
        />
      </div>
      {meta && status !== "good" && (
        <p
          className="mt-1 flex items-center gap-1 text-xs"
          style={{ color: `var(${meta.varName})` }}
        >
          <Icon name={meta.icon} className="h-3.5 w-3.5" />
          {meta.label}
        </p>
      )}
    </div>
  );
}

import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/react/Icon";

interface StatTileProps {
  label: string;
  value: string;
  icon: IconName;
  /** Signed delta text (e.g. "+$120 vs last month"); color communicates direction. */
  delta?: { text: string; tone: "good" | "bad" | "neutral" };
  children?: ReactNode;
}

const DELTA_CLASS: Record<NonNullable<StatTileProps["delta"]>["tone"], string> =
  {
    good: "text-success",
    bad: "text-danger",
    neutral: "text-text-muted",
  };

/** A single headline number the dashboard leads with — not a one-bar bar chart. */
export function StatTile({
  label,
  value,
  icon,
  delta,
  children,
}: StatTileProps) {
  return (
    <div className="border-border bg-bg-elevated flex flex-col gap-1 rounded-lg border p-4">
      <div className="text-text-muted flex items-center gap-1.5 text-xs font-medium">
        <Icon name={icon} className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-text text-2xl font-semibold text-balance">{value}</p>
      {delta && (
        <p className={`text-xs ${DELTA_CLASS[delta.tone]}`}>{delta.text}</p>
      )}
      {children}
    </div>
  );
}

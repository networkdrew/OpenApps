import type { AppMeta } from "@/lib/apps/schema";
import { getCategory } from "@/lib/apps/categories";
import Icon, { type IconName } from "./Icon";

export function appIconGradient(app: AppMeta): string {
  return (
    app.appearance?.gradient ??
    "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)"
  );
}

export function appIconName(app: AppMeta): IconName {
  return (app.appearance?.icon ??
    getCategory(app.categoryId)?.icon ??
    "layout-grid") as IconName;
}

interface Props {
  app: AppMeta;
  className?: string;
}

export default function AppIcon({ app, className = "h-12 w-12" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`os-app-icon flex shrink-0 items-center justify-center rounded-[22%] ${className}`}
      style={{ background: appIconGradient(app) }}
    >
      <Icon
        name={appIconName(app)}
        className="h-[55%] w-[55%] text-white drop-shadow-sm"
      />
    </span>
  );
}

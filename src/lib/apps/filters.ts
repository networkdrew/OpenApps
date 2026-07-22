import type { AppMeta, AppType, StorageMode } from "./schema";

export interface AppFilters {
  categoryId?: string;
  appType?: AppType;
  storageMode?: StorageMode;
  /** true = only apps that keep data entirely on-device; false = only apps that don't. */
  dataLeavesDevice?: boolean;
  offlineCapable?: boolean;
}

export function filterApps(
  list: readonly AppMeta[],
  filters: AppFilters,
): AppMeta[] {
  return list.filter((app) => {
    if (filters.categoryId && app.categoryId !== filters.categoryId)
      return false;
    if (filters.appType && app.appType !== filters.appType) return false;
    if (filters.storageMode && app.privacy.storageMode !== filters.storageMode)
      return false;
    if (
      filters.dataLeavesDevice !== undefined &&
      app.privacy.dataLeavesDevice !== filters.dataLeavesDevice
    )
      return false;
    if (
      filters.offlineCapable !== undefined &&
      app.offlineCapable !== filters.offlineCapable
    )
      return false;
    return true;
  });
}

export function hasActiveFilters(filters: AppFilters): boolean {
  return Object.values(filters).some((v) => v !== undefined);
}

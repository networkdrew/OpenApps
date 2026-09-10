import { useMemo, useState } from "react";
import { apps } from "@/lib/apps/registry";
import { categories, getCategory } from "@/lib/apps/categories";
import { isNewApp } from "@/lib/apps/registry";
import { searchApps, getSuggestions } from "@/lib/apps/search";
import {
  filterApps,
  hasActiveFilters,
  type AppFilters,
} from "@/lib/apps/filters";
import type { AppType } from "@/lib/apps/schema";
import { buttonGhost, textField } from "./styles";
import Icon from "./Icon";

type SortMode = "name" | "recent";

const APP_TYPE_LABELS: Record<AppType, string> = {
  workspace: "Workspace",
  utility: "Utility",
  generator: "Generator",
  game: "Game",
  reference: "Reference",
};

export function AppDirectory() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<AppFilters>({});
  const [sort, setSort] = useState<SortMode>("name");

  const searchResults = useMemo(
    () => (query.trim() ? searchApps(query, apps.length) : null),
    [query],
  );

  const base = searchResults ? searchResults.map((r) => r.app) : [...apps];
  const filtered = filterApps(base, filters);
  const sorted = [...filtered].sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : b.addedAt.localeCompare(a.addedAt),
  );

  const suggestions = filtered.length === 0 ? getSuggestions(query) : null;
  const activeFilters = hasActiveFilters(filters) || query.trim() !== "";

  function setFilter<K extends keyof AppFilters>(key: K, value: AppFilters[K]) {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label htmlFor="directory-search" className="sr-only">
          Search apps
        </label>
        <input
          id="directory-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, task, problem, or what it replaces…"
          className={`${textField} max-w-md`}
        />

        <div
          role="group"
          aria-label="Filter by category"
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={filters.categoryId === undefined}
            onClick={() => setFilters((f) => ({ ...f, categoryId: undefined }))}
            className={pillClass(filters.categoryId === undefined)}
          >
            All categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={filters.categoryId === category.id}
              onClick={() => setFilter("categoryId", category.id)}
              className={pillClass(filters.categoryId === category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="Filter by app type"
          className="flex flex-wrap gap-2"
        >
          {(Object.keys(APP_TYPE_LABELS) as AppType[]).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={filters.appType === type}
              onClick={() => setFilter("appType", type)}
              className={pillClass(filters.appType === type)}
            >
              {APP_TYPE_LABELS[type]}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={filters.dataLeavesDevice === false}
            onClick={() => setFilter("dataLeavesDevice", false)}
            className={pillClass(filters.dataLeavesDevice === false)}
          >
            Data never leaves device
          </button>
          <button
            type="button"
            aria-pressed={filters.offlineCapable === true}
            onClick={() => setFilter("offlineCapable", true)}
            className={pillClass(filters.offlineCapable === true)}
          >
            Works offline
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-text-muted text-sm" aria-live="polite">
            Showing {sorted.length} of {apps.length} apps
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">Sort</span>
            <button
              type="button"
              aria-pressed={sort === "name"}
              onClick={() => setSort("name")}
              className={pillClass(sort === "name")}
            >
              Name
            </button>
            <button
              type="button"
              aria-pressed={sort === "recent"}
              onClick={() => setSort("recent")}
              className={pillClass(sort === "recent")}
            >
              Recently added
            </button>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <Icon name="search-x" className="text-text-muted h-6 w-6" />
          <p className="text-text">
            {suggestions?.message ?? "No apps match your search."}
          </p>
          {suggestions && suggestions.apps.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {suggestions.apps.map((app) => (
                <li key={app.id}>
                  <a
                    href={`/${app.slug}/`}
                    className="text-accent text-sm hover:underline"
                  >
                    {app.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {activeFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilters({});
              }}
              className={buttonGhost}
            >
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((app) => {
            const category = getCategory(app.categoryId);
            return (
              <li key={app.id}>
                <a
                  href={`/${app.slug}/`}
                  className="border-border bg-bg-elevated hover:border-accent flex h-full flex-col gap-2 rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-muted text-xs font-medium">
                      {category?.name}
                    </span>
                    {isNewApp(app) && (
                      <span className="bg-accent/10 text-accent rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                        New
                      </span>
                    )}
                  </div>
                  <h3 className="text-text font-semibold">{app.name}</h3>
                  <p className="text-text-muted text-sm">
                    {app.shortDescription}
                  </p>
                  <div className="text-text-muted mt-auto flex items-center gap-1.5 pt-2 text-xs">
                    <Icon name="shield-check" className="h-3.5 w-3.5" />
                    {app.privacy.dataLeavesDevice
                      ? "Read privacy notes"
                      : "Data stays on your device"}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function pillClass(active: boolean): string {
  return active
    ? "rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast"
    : "rounded-full border border-border-strong bg-bg-elevated px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text";
}

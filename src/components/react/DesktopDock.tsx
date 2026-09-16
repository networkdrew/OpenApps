import { useEffect, useMemo, useRef, useState } from "react";
import { searchApps, getSuggestions } from "@/lib/apps/search";
import { getCategory } from "@/lib/apps/categories";
import type { AppMeta } from "@/lib/apps/schema";
import AppIcon from "./AppIcon";
import Icon from "./Icon";

const MAX_RESULTS = 8;

interface Props {
  apps: AppMeta[];
}

export function DesktopDock({ apps }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const results = useMemo(() => searchApps(query, MAX_RESULTS), [query]);
  const suggestions = useMemo(
    () => (results.length === 0 ? getSuggestions(query) : null),
    [results, query],
  );
  const displayApps = suggestions
    ? suggestions.apps
    : results.map((r) => r.app);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      optionRefs.current[0]?.focus();
    }
  }

  function onOptionKeyDown(
    e: React.KeyboardEvent<HTMLAnchorElement>,
    index: number,
  ) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      optionRefs.current[index + 1]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else optionRefs.current[index - 1]?.focus();
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-28">
          <button
            type="button"
            onClick={close}
            aria-label="Close app launcher"
            className="absolute inset-0 bg-black/30"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="App launcher"
            className="border-border bg-bg-elevated relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl"
          >
            <div className="border-border flex items-center gap-2 border-b p-3">
              <Icon
                name="search"
                className="text-text-muted h-4 w-4 shrink-0"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search apps…"
                aria-label="Search apps"
                className="text-text placeholder:text-text-muted w-full bg-transparent focus:outline-none"
              />
              <kbd className="border-border text-text-muted rounded border px-1.5 py-0.5 text-xs">
                Esc
              </kbd>
            </div>

            <div
              role="listbox"
              aria-label="Apps"
              className="max-h-96 overflow-y-auto p-2"
            >
              {suggestions && (
                <p className="text-text-muted flex items-start gap-2 p-3 text-sm">
                  <Icon name="search-x" className="mt-0.5 h-4 w-4 shrink-0" />
                  {suggestions.message}
                </p>
              )}
              {displayApps.map((app, index) => (
                <a
                  key={app.id}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  role="option"
                  aria-selected={false}
                  href={`/${app.slug}/`}
                  onKeyDown={(e) => onOptionKeyDown(e, index)}
                  className="hover:bg-bg-sunken focus:bg-bg-sunken flex items-center gap-3 rounded-xl p-2.5 text-sm focus:outline-none"
                >
                  <AppIcon app={app} className="h-10 w-10" />
                  <span className="min-w-0 flex-1">
                    <span className="text-text block font-medium">
                      {app.name}
                    </span>
                    <span className="text-text-muted block truncate">
                      {getCategory(app.categoryId)?.name} ·{" "}
                      {app.shortDescription}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <div className="border-border bg-bg-sunken flex items-center gap-2 border-t px-4 py-2.5 text-xs">
              <Icon
                name="shield-check"
                className="text-success h-4 w-4 shrink-0"
              />
              <span className="text-text-muted">
                Free, no accounts, no tracking — your data stays on your device.
              </span>
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Application dock"
        className="border-border bg-bg-elevated/80 pointer-events-auto fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-end gap-2 rounded-2xl border px-2 py-2 shadow-xl backdrop-blur-md"
      >
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Open app launcher"
          title="Open app launcher (Ctrl+K)"
          className="hover:bg-bg-sunken flex h-12 w-12 items-center justify-center rounded-xl transition-transform hover:-translate-y-1 hover:scale-110"
        >
          <Icon name="layout-grid" className="text-text h-6 w-6" />
        </button>

        <span
          className="border-border mx-1 h-8 w-px self-center"
          aria-hidden="true"
        />

        {apps.map((app) => (
          <a
            key={app.id}
            href={`/${app.slug}/`}
            aria-label={app.name}
            title={app.name}
            className="transition-transform duration-150 ease-out hover:-translate-y-2 hover:scale-125"
          >
            <AppIcon app={app} className="h-12 w-12" />
          </a>
        ))}
      </nav>
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { searchApps, getSuggestions } from "@/lib/apps/search";
import { getCategory } from "@/lib/apps/categories";
import Icon from "./Icon";

const MAX_RESULTS = 8;

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const results = useMemo(() => searchApps(query, MAX_RESULTS), [query]);
  const suggestions = useMemo(
    () => (results.length === 0 ? getSuggestions(query) : null),
    [results, query],
  );

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      optionRefs.current[0]?.focus();
    }
  }

  function handleOptionKeyDown(
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

  const displayApps = suggestions
    ? suggestions.apps
    : results.map((r) => r.app);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="border-border-strong bg-bg-elevated text-text-muted hover:border-accent flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors sm:w-64"
      >
        <Icon name="search" className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search apps…</span>
        <kbd className="border-border hidden rounded border px-1.5 py-0.5 text-xs sm:inline">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search apps"
            className="border-border bg-bg-elevated relative w-full max-w-lg rounded-lg border shadow-2xl"
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
                onKeyDown={handleInputKeyDown}
                placeholder="Try “free Trello alternative” or “track jobs through stages”…"
                aria-label="Search apps"
                className="text-text placeholder:text-text-muted w-full bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="text-text-muted hover:text-text"
              >
                Esc
              </button>
            </div>
            <div
              role="listbox"
              aria-label="Search results"
              className="max-h-96 overflow-y-auto p-2"
            >
              {suggestions && (
                <p className="text-text-muted flex items-start gap-2 p-3 text-sm">
                  <Icon name="search-x" className="mt-0.5 h-4 w-4 shrink-0" />
                  {suggestions.message}
                </p>
              )}
              {displayApps.map((app, index) => {
                const reasons = suggestions ? [] : results[index]?.reasons;
                return (
                  <a
                    key={app.id}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={false}
                    href={`/${app.slug}/`}
                    onKeyDown={(e) => handleOptionKeyDown(e, index)}
                    className="hover:bg-bg-sunken focus:bg-bg-sunken flex flex-col gap-0.5 rounded-md p-2 text-sm focus:outline-none"
                  >
                    <span className="text-text font-medium">{app.name}</span>
                    <span className="text-text-muted">
                      {getCategory(app.categoryId)?.name} ·{" "}
                      {app.shortDescription}
                    </span>
                    {reasons && reasons.length > 0 && (
                      <span className="text-accent mt-0.5 text-xs">
                        Matched: {reasons.map((r) => r.value).join(" · ")}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

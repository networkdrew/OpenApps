import { useEffect, useRef, useState, type ReactNode } from "react";
import { categories } from "@/lib/apps/categories";
import { SearchPalette } from "@/components/react/SearchPalette";
import { ThemeToggle } from "@/components/react/ThemeToggle";
import { iconButton, badge } from "@/components/react/styles";
import Icon, { type IconName } from "@/components/react/Icon";
import { Drawer } from "./Drawer";
import { useShellPreferences } from "./useShellPreferences";
import { useFullscreen } from "./useFullscreen";

/** Rendered by AppWorkspaceLayout.astro — the id the header's "About" control opens. */
export const APP_INFO_DIALOG_ID = "app-info-dialog";

export interface AppShellApp {
  name: string;
  categoryId: string;
  offlineCapable: boolean;
}

interface AppShellProps {
  app: AppShellApp;
  children: ReactNode;
}

const navLink =
  "text-text-muted hover:bg-bg-sunken hover:text-text flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors";

/**
 * Viewport-filling application shell every app page renders into. Owns
 * platform chrome only — identity, navigation, theme, focus mode,
 * fullscreen, and a route back to discovery. It intentionally has no
 * opinion about what's inside `children`: an app is free to lay out its own
 * toolbar, panes, and controls. Apps that want a true full-height, internally
 * scrolling workspace (like the Kanban board) should give their root element
 * `h-full min-h-0` and manage their own overflow; anything else just flows
 * and scrolls naturally inside the content region.
 */
export default function AppShell({ app, children }: AppShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { prefs, update } = useShellPreferences();
  const {
    supported: fullscreenSupported,
    isFullscreen,
    toggleFullscreen,
  } = useFullscreen(rootRef);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const focusMode = prefs.focusMode;
  const showSidebar = !focusMode;
  const category = categories.find((c) => c.id === app.categoryId);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Let a more specific open dialog/modal own this Escape press.
      if (document.querySelector('[aria-modal="true"], dialog[open]')) return;
      if (mobileNavOpen) {
        setMobileNavOpen(false);
        return;
      }
      if (focusMode) update({ focusMode: false });
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen, focusMode, update]);

  function openAbout() {
    const dialog = document.getElementById(
      APP_INFO_DIALOG_ID,
    ) as HTMLDialogElement | null;
    dialog?.showModal();
  }

  const navContent = (
    <nav className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <a href="/" className={navLink}>
          <Icon name="home" className="h-4 w-4" />
          Home
        </a>
        <a href="/apps/" className={navLink}>
          <Icon name="layout-grid" className="h-4 w-4" />
          All apps
        </a>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-text-muted px-2 text-xs font-semibold tracking-wide uppercase">
          Categories
        </p>
        {categories.map((c) => (
          <a
            key={c.id}
            href={`/categories/${c.id}/`}
            aria-current={c.id === app.categoryId ? "page" : undefined}
            className={`${navLink} ${c.id === app.categoryId ? "bg-bg-sunken text-text" : ""}`}
          >
            <Icon name={c.icon as IconName} className="h-4 w-4" />
            {c.name}
          </a>
        ))}
      </div>
    </nav>
  );

  return (
    <div ref={rootRef} className="bg-bg text-text flex h-full min-h-0 flex-col">
      <header className="border-border bg-bg flex h-14 shrink-0 items-center gap-1 border-b px-2 pt-[env(safe-area-inset-top)] sm:px-3">
        {!focusMode && (
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className={`${iconButton} md:hidden`}
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
        )}
        {!focusMode && (
          <button
            type="button"
            onClick={() =>
              update({ sidebarCollapsed: !prefs.sidebarCollapsed })
            }
            className={`${iconButton} hidden md:inline-flex`}
            aria-label={
              prefs.sidebarCollapsed ? "Show sidebar" : "Hide sidebar"
            }
            aria-pressed={!prefs.sidebarCollapsed}
          >
            <Icon
              name={
                prefs.sidebarCollapsed ? "panel-left-open" : "panel-left-close"
              }
              className="h-5 w-5"
            />
          </button>
        )}

        <div className="ml-1 flex min-w-0 items-center gap-2">
          {category && (
            <span
              className="bg-bg-sunken text-text-muted hidden h-7 w-7 shrink-0 items-center justify-center rounded-md sm:inline-flex"
              aria-hidden="true"
            >
              <Icon name={category.icon as IconName} className="h-4 w-4" />
            </span>
          )}
          <span className="truncate text-sm font-semibold sm:text-base">
            {app.name}
          </span>
          <span
            className={`${badge} bg-bg-sunken text-text-muted hidden sm:inline-flex`}
          >
            {app.offlineCapable ? "Offline ready" : "Online required"}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden sm:block">
            <SearchPalette />
          </div>
          <button
            type="button"
            onClick={openAbout}
            className={iconButton}
            aria-label={`About ${app.name}, privacy, and data`}
            aria-haspopup="dialog"
          >
            <Icon name="info" className="h-5 w-5" />
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => update({ focusMode: !focusMode })}
            className={iconButton}
            aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
            aria-pressed={focusMode}
          >
            <Icon name="focus" className="h-5 w-5" />
          </button>
          {fullscreenSupported && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`${iconButton} hidden sm:inline-flex`}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-pressed={isFullscreen}
            >
              <Icon
                name={isFullscreen ? "minimize" : "maximize"}
                className="h-5 w-5"
              />
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {showSidebar && (
          <aside
            className={`border-border bg-bg-elevated hidden shrink-0 overflow-hidden border-r transition-[width] duration-200 md:block ${
              prefs.sidebarCollapsed ? "w-0 border-r-0" : "w-56"
            }`}
            aria-label="App navigation"
          >
            <div className="flex h-full w-56 flex-col gap-1 overflow-y-auto p-3">
              {navContent}
            </div>
          </aside>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Navigation"
      >
        {navContent}
      </Drawer>
    </div>
  );
}

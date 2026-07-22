import { lazy, Suspense, type ComponentType } from "react";

/**
 * Astro decides what to hydrate on the client by statically analyzing the
 * imports in an `.astro` file — it cannot follow a dynamic `import()` stored
 * inside a plain data structure (like a registry entry) back to a real
 * module. This is the one component `[slug].astro` statically imports and
 * hydrates; internally it holds a small map from an app's componentId to
 * `React.lazy(() => import(...))`. Vite still code-splits each app into its
 * own chunk. AppIslandLoader.test.tsx asserts this map's keys exactly match
 * the registry's componentIds, so adding an app to one without the other
 * fails a test instead of silently 404-ing at runtime.
 *
 * Add an app here (see docs/adding-an-app.md) whenever you add one to the
 * registry.
 */
const componentLoaders: Record<
  string,
  ComponentType<Record<string, unknown>>
> = {
  "kanban-board": lazy(() => import("@/islands/kanban-board/KanbanBoardApp")),
  notes: lazy(() => import("@/islands/notes/NotesApp")),
  budget: lazy(() => import("@/islands/budget/BudgetApp")),
};

export function getAppIslandIds(): string[] {
  return Object.keys(componentLoaders);
}

interface AppIslandLoaderProps {
  componentId: string;
}

export default function AppIslandLoader({ componentId }: AppIslandLoaderProps) {
  const Component = componentLoaders[componentId];
  if (!Component) {
    return (
      <p className="text-danger text-sm" role="alert">
        This app's interface couldn't be loaded.
      </p>
    );
  }
  return (
    <Suspense fallback={<p className="text-text-muted text-sm">Loading…</p>}>
      <Component />
    </Suspense>
  );
}

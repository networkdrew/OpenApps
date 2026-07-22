/** React counterpart to components/astro/Icon.astro — same icon set, for use inside client islands. */
const icons = import.meta.glob<string>("/src/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type IconName =
  | "archive"
  | "archive-restore"
  | "arrow-down-right"
  | "arrow-up-right"
  | "banknote"
  | "bar-chart-3"
  | "bold"
  | "book-open"
  | "briefcase"
  | "building"
  | "calendar"
  | "car"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "circle-x"
  | "clock"
  | "code"
  | "copy"
  | "credit-card"
  | "database"
  | "dollar-sign"
  | "download"
  | "eye"
  | "file-spreadsheet"
  | "film"
  | "filter"
  | "flag"
  | "focus"
  | "folder"
  | "folder-plus"
  | "gift"
  | "graduation-cap"
  | "grip-vertical"
  | "hash"
  | "heading"
  | "heart-pulse"
  | "home"
  | "inbox"
  | "info"
  | "italic"
  | "kanban"
  | "landmark"
  | "layout-grid"
  | "layout-template"
  | "link-2"
  | "list"
  | "list-ordered"
  | "list-todo"
  | "lock"
  | "maximize"
  | "menu"
  | "minimize"
  | "moon"
  | "more-horizontal"
  | "notebook"
  | "panel-left-close"
  | "panel-left-open"
  | "pencil-line"
  | "pie-chart"
  | "piggy-bank"
  | "pin"
  | "plane"
  | "plus"
  | "quote"
  | "receipt"
  | "redo-2"
  | "repeat"
  | "rotate-ccw"
  | "save"
  | "scale"
  | "search"
  | "search-x"
  | "settings"
  | "shield-check"
  | "shopping-cart"
  | "star"
  | "sun"
  | "tag"
  | "target"
  | "trash-2"
  | "trending-down"
  | "trending-up"
  | "triangle-alert"
  | "undo-2"
  | "upload"
  | "utensils"
  | "wallet"
  | "x"
  | "zap";

interface IconProps {
  name: IconName;
  className?: string;
}

export default function Icon({ name, className }: IconProps) {
  const raw = icons[`/src/icons/${name}.svg`];
  if (!raw) return null;
  const svg = raw
    .replace("<svg", `<svg class="${className ?? ""}" aria-hidden="true"`)
    .replace(' width="24"', "")
    .replace(' height="24"', "");
  // Trusted, build-time-bundled SVG source, not user content.
  return (
    <span className="contents" dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

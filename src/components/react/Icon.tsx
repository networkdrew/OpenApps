/** React counterpart to components/astro/Icon.astro — same icon set, for use inside client islands. */
const icons = import.meta.glob<string>("/src/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type IconName =
  | "calendar"
  | "check"
  | "chevron-down"
  | "circle-x"
  | "clock"
  | "copy"
  | "database"
  | "download"
  | "flag"
  | "grip-vertical"
  | "inbox"
  | "info"
  | "kanban"
  | "layout-grid"
  | "lock"
  | "menu"
  | "moon"
  | "plus"
  | "redo-2"
  | "save"
  | "search"
  | "search-x"
  | "shield-check"
  | "sun"
  | "tag"
  | "trash-2"
  | "triangle-alert"
  | "undo-2"
  | "upload"
  | "x";

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

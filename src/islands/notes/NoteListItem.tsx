import type { Note } from "@/lib/apps-logic/notes/model";
import { iconButton } from "@/components/react/styles";
import Icon from "@/components/react/Icon";

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function firstLine(content: string): string {
  const line = content
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !/^#{1,6}\s/.test(l));
  return line ?? "";
}

interface NoteListItemProps {
  note: Note;
  active: boolean;
  snippet?: string;
  onSelect: () => void;
  onTogglePinned: () => void;
  onToggleFavorite: () => void;
}

export function NoteListItem({
  note,
  active,
  snippet,
  onSelect,
  onTogglePinned,
  onToggleFavorite,
}: NoteListItemProps) {
  const preview = snippet ?? firstLine(note.content);

  return (
    <li>
      <div
        className={`group border-border relative flex w-full flex-col gap-1 border-b px-3 py-2.5 text-left transition-colors ${
          active ? "bg-accent/10" : "hover:bg-bg-sunken"
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0"
          aria-current={active ? "true" : undefined}
        >
          <span className="sr-only">Open {note.title || "Untitled note"}</span>
        </button>
        <div className="pointer-events-none flex items-start justify-between gap-2">
          <span className="text-text truncate text-sm font-medium">
            {note.title.trim() || "Untitled note"}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {note.pinned && <Icon name="pin" className="text-accent h-3 w-3" />}
            {note.favorite && (
              <Icon
                name="star"
                className="h-3 w-3 fill-current text-amber-500"
              />
            )}
          </span>
        </div>
        {preview && (
          <p className="text-text-muted pointer-events-none line-clamp-2 text-xs">
            {preview}
          </p>
        )}
        <div className="pointer-events-none flex items-center justify-between gap-2">
          <span className="text-text-muted text-[11px]">
            {formatRelativeDate(note.updatedAt)}
          </span>
          {note.tags.length > 0 && (
            <span className="text-text-muted truncate text-[11px]">
              {note.tags.map((t) => `#${t}`).join(" ")}
            </span>
          )}
        </div>
        <div className="pointer-events-auto absolute top-2 right-2 hidden items-center gap-0.5 group-focus-within:flex group-hover:flex">
          <button
            type="button"
            onClick={onTogglePinned}
            aria-pressed={note.pinned}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            className={iconButton}
          >
            <Icon name="pin" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={note.favorite}
            aria-label={note.favorite ? "Unfavorite note" : "Favorite note"}
            className={iconButton}
          >
            <Icon name="star" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}

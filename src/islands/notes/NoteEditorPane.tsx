import { useEffect, useRef, useState } from "react";
import type { Note } from "@/lib/apps-logic/notes/model";
import {
  findNoteByTitle,
  computeBacklinks,
} from "@/lib/apps-logic/notes/links";
import { renderMarkdown } from "@/lib/apps-logic/notes/markdown";
import {
  buttonDanger,
  buttonSecondary,
  iconButton,
} from "@/components/react/styles";
import Icon, { type IconName } from "@/components/react/Icon";

export type EditorViewMode = "edit" | "split" | "preview";

const CONTENT_COMMIT_DEBOUNCE_MS = 500;

interface ToolbarAction {
  label: string;
  icon: IconName;
  shortcut?: string;
  apply: (ctx: { value: string; start: number; end: number }) => {
    value: string;
    selectionStart: number;
    selectionEnd: number;
  };
}

function wrapAction(
  marker: string,
  placeholder: string,
): ToolbarAction["apply"] {
  return ({ value, start, end }) => {
    const selected = value.slice(start, end) || placeholder;
    const next =
      value.slice(0, start) + marker + selected + marker + value.slice(end);
    return {
      value: next,
      selectionStart: start + marker.length,
      selectionEnd: start + marker.length + selected.length,
    };
  };
}

function linePrefixAction(prefix: string): ToolbarAction["apply"] {
  return ({ value, start, end }) => {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    return {
      value: next,
      selectionStart: start + prefix.length,
      selectionEnd: end + prefix.length,
    };
  };
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    label: "Bold",
    icon: "bold",
    shortcut: "Mod+B",
    apply: wrapAction("**", "bold text"),
  },
  {
    label: "Italic",
    icon: "italic",
    shortcut: "Mod+I",
    apply: wrapAction("*", "italic text"),
  },
  { label: "Heading", icon: "heading", apply: linePrefixAction("## ") },
  { label: "Bullet list", icon: "list", apply: linePrefixAction("- ") },
  {
    label: "Numbered list",
    icon: "list-ordered",
    apply: linePrefixAction("1. "),
  },
  { label: "Checklist", icon: "list-todo", apply: linePrefixAction("- [ ] ") },
  { label: "Quote", icon: "quote", apply: linePrefixAction("> ") },
  { label: "Inline code", icon: "code", apply: wrapAction("`", "code") },
  {
    label: "Link",
    icon: "link-2",
    apply: ({ value, start, end }) => {
      const selected = value.slice(start, end) || "link text";
      const insert = `[${selected}](https://)`;
      const next = value.slice(0, start) + insert + value.slice(end);
      const urlStart = start + selected.length + 3;
      return {
        value: next,
        selectionStart: urlStart,
        selectionEnd: urlStart + "https://".length,
      };
    },
  },
  {
    label: "Wiki link",
    icon: "hash",
    apply: ({ value, start, end }) => {
      const selected = value.slice(start, end);
      const insert = `[[${selected}]]`;
      const next = value.slice(0, start) + insert + value.slice(end);
      return {
        value: next,
        selectionStart: start + 2,
        selectionEnd: start + 2 + selected.length,
      };
    },
  },
];

interface NoteEditorPaneProps {
  note: Note | null;
  allNotes: Note[];
  viewMode: EditorViewMode;
  onViewModeChange: (mode: EditorViewMode) => void;
  onUpdate: (patch: { title?: string; content?: string }) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onTogglePinned: () => void;
  onToggleFavorite: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
  onExportMarkdown: () => void;
  onNavigateToNoteByTitle: (title: string) => void;
  onBack?: () => void;
}

export function NoteEditorPane({
  note,
  allNotes,
  viewMode,
  onViewModeChange,
  onUpdate,
  onAddTag,
  onRemoveTag,
  onTogglePinned,
  onToggleFavorite,
  onArchive,
  onUnarchive,
  onTrash,
  onRestore,
  onDeleteForever,
  onExportMarkdown,
  onNavigateToNoteByTitle,
  onBack,
}: NoteEditorPaneProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [tagInput, setTagInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const commitTimeoutRef = useRef<number | undefined>(undefined);
  const pendingRef = useRef<{ title: string; content: string } | null>(null);

  // Delegated (imperative, not JSX onClick) so keyboard activation of the
  // wiki-link <a> elements this renders into dangerouslySetInnerHTML works
  // exactly like any other link — no non-native click handling involved.
  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest<HTMLElement>("[data-wiki-link]");
      if (!link) return;
      e.preventDefault();
      const wikiTitle = link.dataset.wikiLink;
      if (wikiTitle) onNavigateToNoteByTitle(wikiTitle);
    }
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [onNavigateToNoteByTitle]);

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    pendingRef.current = null;
  }, [note?.id]);

  function flushCommit() {
    if (window.clearTimeout) window.clearTimeout(commitTimeoutRef.current);
    if (pendingRef.current) {
      onUpdate(pendingRef.current);
      pendingRef.current = null;
    }
  }

  useEffect(() => {
    return () => flushCommit();
  }, [note?.id]);

  function scheduleCommit(next: { title: string; content: string }) {
    pendingRef.current = next;
    window.clearTimeout(commitTimeoutRef.current);
    commitTimeoutRef.current = window.setTimeout(() => {
      flushCommit();
    }, CONTENT_COMMIT_DEBOUNCE_MS);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleCommit({ title: value, content });
  }

  function handleContentChange(value: string) {
    setContent(value);
    scheduleCommit({ title, content: value });
  }

  function applyToolbarAction(action: ToolbarAction) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const result = action.apply({ value: content, start, end });
    handleContentChange(result.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod) return;
    if (e.key.toLowerCase() === "b") {
      e.preventDefault();
      applyToolbarAction(TOOLBAR_ACTIONS[0]!);
    } else if (e.key.toLowerCase() === "i") {
      e.preventDefault();
      applyToolbarAction(TOOLBAR_ACTIONS[1]!);
    }
  }

  function addTagFromInput() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    onAddTag(trimmed);
    setTagInput("");
  }

  if (!note) {
    return (
      <div className="text-text-muted flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm">
        <Icon name="notebook" className="h-8 w-8" />
        <p>Select a note, or create a new one to get started.</p>
      </div>
    );
  }

  const backlinks = computeBacklinks(allNotes, note);
  const html = renderMarkdown(content, {
    noteExists: (t) => !!findNoteByTitle(allNotes, t),
  });
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex flex-wrap items-center gap-1 border-b px-3 py-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to note list"
            className={`${iconButton} md:hidden`}
          >
            <Icon name="chevron-left" className="h-4 w-4" />
          </button>
        )}
        {note.trashed ? (
          <>
            <span className="text-danger flex items-center gap-1.5 text-xs font-medium">
              <Icon name="trash-2" className="h-3.5 w-3.5" />
              In Trash
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={onRestore}
                className={buttonSecondary}
              >
                <Icon name="rotate-ccw" className="h-4 w-4" />
                Restore
              </button>
              <button
                type="button"
                onClick={onDeleteForever}
                className={buttonDanger}
              >
                <Icon name="trash-2" className="h-4 w-4" />
                Delete forever
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onTogglePinned}
              aria-pressed={note.pinned}
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              className={iconButton}
            >
              <Icon
                name="pin"
                className={`h-4 w-4 ${note.pinned ? "text-accent" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-pressed={note.favorite}
              aria-label={note.favorite ? "Unfavorite note" : "Favorite note"}
              className={iconButton}
            >
              <Icon
                name="star"
                className={`h-4 w-4 ${note.favorite ? "fill-current text-amber-500" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={note.archived ? onUnarchive : onArchive}
              aria-pressed={note.archived}
              aria-label={note.archived ? "Unarchive note" : "Archive note"}
              className={iconButton}
            >
              <Icon
                name={note.archived ? "archive-restore" : "archive"}
                className="h-4 w-4"
              />
            </button>

            <div className="ml-auto flex items-center gap-1">
              <div
                role="group"
                aria-label="Editor view"
                className="border-border-strong flex rounded-md border p-0.5"
              >
                {(["edit", "split", "preview"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onViewModeChange(mode)}
                    aria-pressed={viewMode === mode}
                    className={`rounded px-2 py-1 text-xs font-medium capitalize ${
                      viewMode === mode
                        ? "bg-accent text-accent-contrast"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onExportMarkdown}
                aria-label="Export this note as Markdown"
                title="Export as Markdown"
                className={iconButton}
              >
                <Icon name="download" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onTrash}
                aria-label="Move note to trash"
                title="Move to trash"
                className={iconButton}
              >
                <Icon name="trash-2" className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="border-border border-b px-3 py-2">
        <label htmlFor="note-title" className="sr-only">
          Note title
        </label>
        <input
          id="note-title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={flushCommit}
          disabled={note.trashed}
          placeholder="Untitled note"
          className="text-text w-full bg-transparent text-lg font-semibold placeholder:font-normal focus:outline-none"
        />
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="bg-bg-sunken text-text-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
            >
              #{tag}
              {!note.trashed && (
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="hover:text-text"
                >
                  <Icon name="x" className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
          {!note.trashed && (
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTagFromInput();
                }
              }}
              onBlur={addTagFromInput}
              placeholder="Add tag…"
              aria-label="Add tag"
              className="text-text-muted w-24 bg-transparent text-xs placeholder:text-xs focus:outline-none"
            />
          )}
        </div>
      </div>

      {!note.trashed && viewMode !== "preview" && (
        <div className="border-border flex flex-wrap items-center gap-0.5 border-b px-2 py-1">
          {TOOLBAR_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => applyToolbarAction(action)}
              aria-label={action.label}
              title={action.label}
              className={iconButton}
            >
              <Icon name={action.icon} className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {viewMode !== "preview" && !note.trashed && (
          <label htmlFor="note-content" className="sr-only">
            Note content (Markdown)
          </label>
        )}
        {viewMode !== "preview" && !note.trashed && (
          <textarea
            id="note-content"
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={flushCommit}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Write in Markdown… use [[Note Title]] to link another note."
            spellCheck
            className={`text-text placeholder:text-text-muted min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed focus:outline-none ${
              viewMode === "split" ? "border-border border-r" : ""
            }`}
          />
        )}
        {(viewMode !== "edit" || note.trashed) && (
          <div
            ref={previewRef}
            className="notes-preview min-h-0 flex-1 overflow-y-auto p-4 text-sm leading-relaxed"
            // Safe: renderMarkdown escapes all user content and only emits
            // the whitelisted tags/attributes it constructs itself.
            dangerouslySetInnerHTML={{ __html: html || "<p></p>" }}
          />
        )}
      </div>

      <div className="border-border flex flex-col gap-2 border-t px-3 py-2">
        {backlinks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-text-muted flex items-center gap-1 font-medium">
              <Icon name="link-2" className="h-3 w-3" />
              Linked mentions:
            </span>
            {backlinks.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onNavigateToNoteByTitle(b.title)}
                className="text-accent hover:underline"
              >
                {b.title.trim() || "Untitled note"}
              </button>
            ))}
          </div>
        )}
        <p className="text-text-muted text-[11px]">{wordCount} words</p>
      </div>
    </div>
  );
}

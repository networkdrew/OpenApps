import { useState, type RefObject } from "react";
import type { Note } from "@/lib/apps-logic/notes/model";
import type { SortOption } from "@/lib/apps-logic/notes/search";
import { SORT_OPTIONS } from "@/lib/apps-logic/notes/search";
import {
  buttonPrimary,
  iconButton,
  selectField,
  textField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import { NoteListItem } from "./NoteListItem";

export interface TemplateOption {
  id: string;
  name: string;
  content: string;
}

interface NoteListPaneProps {
  title: string;
  notes: Note[];
  snippets: Map<string, string>;
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onTogglePinned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  sortOption: SortOption;
  onSortOptionChange: (s: SortOption) => void;
  onNewNote: (content?: string) => void;
  templates: TemplateOption[];
  onBack?: () => void;
  emptyMessage: string;
}

export function NoteListPane({
  title,
  notes,
  snippets,
  activeNoteId,
  onSelectNote,
  onTogglePinned,
  onToggleFavorite,
  searchQuery,
  onSearchQueryChange,
  searchInputRef,
  sortOption,
  onSortOptionChange,
  onNewNote,
  templates,
  onBack,
  emptyMessage,
}: NoteListPaneProps) {
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-2 border-b px-3 py-2.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to notebooks"
            className={`${iconButton} md:hidden`}
          >
            <Icon name="chevron-left" className="h-4 w-4" />
          </button>
        )}
        <h2 className="text-text flex-1 truncate text-sm font-semibold">
          {title}
        </h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => onNewNote()}
            className={`${buttonPrimary} rounded-r-none px-2.5 py-1.5`}
            aria-label="New blank note"
            title="New blank note"
          >
            <Icon name="plus" className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplateMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={showTemplateMenu}
            aria-label="New note from template"
            title="New note from template"
            className={`${iconButton} border-border-strong border`}
          >
            <Icon name="chevron-down" className="h-4 w-4" />
          </button>
          {showTemplateMenu && (
            <div
              role="menu"
              className="border-border bg-bg-elevated absolute top-full right-0 z-20 mt-1 w-56 rounded-md border p-1 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onNewNote();
                  setShowTemplateMenu(false);
                }}
                className="hover:bg-bg-sunken flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
              >
                <Icon name="plus" className="h-4 w-4" />
                Blank note
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onNewNote(t.content);
                    setShowTemplateMenu(false);
                  }}
                  className="hover:bg-bg-sunken flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
                >
                  <Icon name="layout-template" className="h-4 w-4" />
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-border flex items-center gap-2 border-b p-2">
        <label htmlFor="note-search" className="sr-only">
          Search notes
        </label>
        <div className="relative flex-1">
          <Icon
            name="search"
            className="text-text-muted pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2"
          />
          <input
            id="note-search"
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search notes… (Ctrl/Cmd+F)"
            className={`${textField} py-1.5 pl-7 text-sm`}
          />
        </div>
        <label htmlFor="note-sort" className="sr-only">
          Sort notes
        </label>
        <select
          id="note-sort"
          value={sortOption}
          onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
          className={`${selectField} py-1.5 text-sm`}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {notes.length === 0 ? (
        <div className="text-text-muted flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm">
          <Icon name="notebook" className="h-6 w-6" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {notes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              active={note.id === activeNoteId}
              snippet={snippets.get(note.id)}
              onSelect={() => onSelectNote(note.id)}
              onTogglePinned={() => onTogglePinned(note.id)}
              onToggleFavorite={() => onToggleFavorite(note.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

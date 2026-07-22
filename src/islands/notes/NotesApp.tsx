import { useEffect, useMemo, useRef, useState } from "react";
import { useNotesController } from "./useNotesController";
import { NotesSidebar } from "./NotesSidebar";
import { NoteListPane, type TemplateOption } from "./NoteListPane";
import { NoteEditorPane, type EditorViewMode } from "./NoteEditorPane";
import { TemplatesDialog } from "./TemplatesDialog";
import { ConfirmDialog } from "@/components/react/ConfirmDialog";
import { StatusMessage } from "@/components/react/StatusMessage";
import { iconButton } from "@/components/react/styles";
import Icon from "@/components/react/Icon";
import {
  BUILT_IN_TEMPLATES,
  type ActiveView,
  type Note,
} from "@/lib/apps-logic/notes/model";
import { notesForView } from "@/lib/apps-logic/notes/filter";
import {
  searchNotes,
  sortNotes,
  type SortOption,
} from "@/lib/apps-logic/notes/search";
import { findNoteByTitle } from "@/lib/apps-logic/notes/links";
import {
  exportAllNotesAsMarkdown,
  exportNoteAsMarkdown,
  exportNotesState,
  importNotesState,
} from "@/lib/apps-logic/notes/persistence";

type MobilePane = "sidebar" | "list" | "editor";

type PendingConfirm =
  | { type: "delete-notebook"; notebookId: string; name: string }
  | { type: "delete-folder"; folderId: string; name: string }
  | { type: "delete-tag"; tag: string }
  | { type: "delete-note-forever"; noteId: string }
  | { type: "empty-trash" }
  | { type: "clear-all" }
  | null;

function viewTitle(
  view: ActiveView,
  notebooks: { id: string; name: string }[],
  folders: { id: string; name: string }[],
): string {
  switch (view.type) {
    case "all":
      return "All notes";
    case "favorites":
      return "Favorites";
    case "archive":
      return "Archive";
    case "trash":
      return "Trash";
    case "tag":
      return `#${view.tag}`;
    case "notebook":
      return (
        notebooks.find((nb) => nb.id === view.notebookId)?.name ?? "Notebook"
      );
    case "folder":
      return folders.find((f) => f.id === view.folderId)?.name ?? "Folder";
  }
}

function emptyMessageFor(view: ActiveView): string {
  switch (view.type) {
    case "all":
      return "No notes yet. Create your first note to get started.";
    case "favorites":
      return "No favorites yet. Star a note to pin it here.";
    case "archive":
      return "Nothing archived. Archived notes stay out of your way without being deleted.";
    case "trash":
      return "Trash is empty.";
    case "tag":
      return `No notes tagged #${view.tag}.`;
    case "notebook":
      return "No notes in this notebook yet.";
    case "folder":
      return "No notes in this folder yet.";
  }
}

export default function NotesApp() {
  const controller = useNotesController();
  const {
    state,
    dispatch,
    replaceState,
    undo,
    redo,
    canUndo,
    canRedo,
    autosave,
    autosaveError,
    loaded,
  } = controller;

  const [mobilePane, setMobilePane] = useState<MobilePane>("list");
  const [sortOption, setSortOption] = useState<SortOption>("updated-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [editorViewMode, setEditorViewMode] = useState<EditorViewMode>("edit");
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [importMessage, setImportMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allNotes = useMemo(() => Object.values(state.notes), [state.notes]);
  const activeNote: Note | null = state.activeNoteId
    ? (state.notes[state.activeNoteId] ?? null)
    : null;

  const searchResults = searchQuery.trim()
    ? searchNotes(allNotes, searchQuery)
    : null;
  const listNotes = searchResults
    ? searchResults.map((r) => r.note)
    : sortNotes(notesForView(allNotes, state.activeView), sortOption);
  const snippets = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of searchResults ?? []) {
      if (r.snippet) map.set(r.note.id, r.snippet);
    }
    return map;
  }, [searchResults]);

  const trashCount = allNotes.filter((n) => n.trashed).length;
  const archiveCount = allNotes.filter((n) => n.archived && !n.trashed).length;
  const favoritesCount = allNotes.filter(
    (n) => n.favorite && !n.trashed,
  ).length;

  const templateOptions: TemplateOption[] = [
    ...BUILT_IN_TEMPLATES.map((t) => ({
      id: `builtin:${t.name}`,
      name: t.name,
      content: t.content,
    })),
    ...state.templates.map((t) => ({
      id: t.id,
      name: t.name,
      content: t.content,
    })),
  ];

  function resolveTargetLocation(): {
    notebookId: string;
    folderId: string | null;
  } {
    const view = state.activeView;
    if (view.type === "notebook")
      return { notebookId: view.notebookId, folderId: null };
    if (view.type === "folder") {
      const folder = state.folders.find((f) => f.id === view.folderId);
      if (folder) return { notebookId: folder.notebookId, folderId: folder.id };
    }
    return { notebookId: state.notebooks[0]?.id ?? "", folderId: null };
  }

  function handleSelectView(view: ActiveView) {
    setSearchQuery("");
    dispatch({ type: "SET_ACTIVE_VIEW", view });
    setMobilePane("list");
  }

  function handleSelectNote(noteId: string) {
    dispatch({ type: "SET_ACTIVE_NOTE", noteId });
    setMobilePane("editor");
  }

  function handleNewNote(content = "") {
    const { notebookId, folderId } = resolveTargetLocation();
    if (!notebookId) return;
    dispatch({ type: "ADD_NOTE", notebookId, folderId, title: "", content });
    setEditorViewMode("edit");
    setMobilePane("editor");
  }

  function handleNavigateToNoteByTitle(title: string) {
    const existing = findNoteByTitle(allNotes, title);
    if (existing) {
      dispatch({ type: "SET_ACTIVE_NOTE", noteId: existing.id });
    } else {
      const { notebookId, folderId } = resolveTargetLocation();
      if (!notebookId) return;
      dispatch({ type: "ADD_NOTE", notebookId, folderId, title, content: "" });
    }
    setEditorViewMode("edit");
    setMobilePane("editor");
  }

  function handleExport() {
    exportNotesState(state);
  }

  function handleExportMarkdownAll() {
    exportAllNotesAsMarkdown(allNotes.filter((n) => !n.trashed));
  }

  async function handleImportFile(file: File) {
    const result = await importNotesState(file);
    if (result.ok) {
      replaceState(result.state);
      setImportMessage({ tone: "success", text: "Import complete." });
      setRefreshToken((t) => t + 1);
    } else {
      setImportMessage({ tone: "error", text: result.message });
    }
  }

  function handleClearAll() {
    dispatch({ type: "CLEAR_ALL" });
    setPendingConfirm(null);
    setRefreshToken((t) => t + 1);
  }

  function handleConfirm() {
    if (!pendingConfirm) return;
    switch (pendingConfirm.type) {
      case "delete-notebook":
        dispatch({
          type: "DELETE_NOTEBOOK",
          notebookId: pendingConfirm.notebookId,
        });
        break;
      case "delete-folder":
        dispatch({ type: "DELETE_FOLDER", folderId: pendingConfirm.folderId });
        break;
      case "delete-tag":
        dispatch({ type: "DELETE_TAG", tag: pendingConfirm.tag });
        break;
      case "delete-note-forever":
        dispatch({
          type: "DELETE_NOTE_FOREVER",
          noteId: pendingConfirm.noteId,
        });
        break;
      case "empty-trash":
        dispatch({ type: "EMPTY_TRASH" });
        break;
      case "clear-all":
        handleClearAll();
        return;
    }
    setPendingConfirm(null);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      const activeId = document.activeElement?.id;
      const inEditorField =
        activeId === "note-content" || activeId === "note-title";

      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewNote();
      } else if (e.key.toLowerCase() === "e" && activeNote) {
        e.preventDefault();
        setEditorViewMode((m) => (m === "preview" ? "edit" : "preview"));
      } else if (!inEditorField && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (!inEditorField && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // Re-subscribes on every state change so the handler never closes over a
    // stale activeView/activeNote — cheap for a single document listener.
  }, [state, activeNote, undo, redo]);

  if (!loaded) {
    return <p className="text-text-muted p-4 text-sm">Loading your notes…</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {importMessage && (
        <div className="px-3 pt-3">
          <StatusMessage tone={importMessage.tone}>
            {importMessage.text}
          </StatusMessage>
        </div>
      )}

      <div className="border-border flex items-center justify-end gap-1 border-b px-2 py-1 md:hidden">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo"
          className={iconButton}
        >
          <Icon name="undo-2" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo"
          className={iconButton}
        >
          <Icon name="redo-2" className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          className={`${mobilePane === "sidebar" ? "flex" : "hidden"} border-border w-full shrink-0 border-r md:flex md:w-56`}
        >
          <NotesSidebar
            notebooks={state.notebooks}
            folders={state.folders}
            notes={allNotes}
            activeView={state.activeView}
            onSelectView={handleSelectView}
            onAddNotebook={(name) => dispatch({ type: "ADD_NOTEBOOK", name })}
            onRenameNotebook={(notebookId, name) =>
              dispatch({ type: "RENAME_NOTEBOOK", notebookId, name })
            }
            onDeleteNotebook={(notebookId) => {
              const nb = state.notebooks.find((n) => n.id === notebookId);
              if (nb)
                setPendingConfirm({
                  type: "delete-notebook",
                  notebookId,
                  name: nb.name,
                });
            }}
            onAddFolder={(notebookId, parentFolderId, name) =>
              dispatch({ type: "ADD_FOLDER", notebookId, parentFolderId, name })
            }
            onRenameFolder={(folderId, name) =>
              dispatch({ type: "RENAME_FOLDER", folderId, name })
            }
            onDeleteFolder={(folderId) => {
              const folder = state.folders.find((f) => f.id === folderId);
              if (folder)
                setPendingConfirm({
                  type: "delete-folder",
                  folderId,
                  name: folder.name,
                });
            }}
            onRenameTag={(oldTag, newTag) =>
              dispatch({ type: "RENAME_TAG", oldTag, newTag })
            }
            onDeleteTag={(tag) =>
              setPendingConfirm({ type: "delete-tag", tag })
            }
            onManageTemplates={() => setTemplatesOpen(true)}
            onExport={handleExport}
            onExportMarkdown={handleExportMarkdownAll}
            onImportFile={handleImportFile}
            onClearAll={() => setPendingConfirm({ type: "clear-all" })}
            autosave={autosave}
            autosaveError={autosaveError}
            refreshToken={refreshToken}
            trashCount={trashCount}
            archiveCount={archiveCount}
            favoritesCount={favoritesCount}
          />
        </div>

        <div
          className={`${mobilePane === "list" ? "flex" : "hidden"} border-border w-full shrink-0 border-r md:flex md:w-80`}
        >
          <NoteListPane
            title={
              searchResults
                ? `Search: “${searchQuery}”`
                : viewTitle(state.activeView, state.notebooks, state.folders)
            }
            notes={listNotes}
            snippets={snippets}
            activeNoteId={state.activeNoteId}
            onSelectNote={handleSelectNote}
            onTogglePinned={(id) =>
              dispatch({ type: "TOGGLE_PINNED", noteId: id })
            }
            onToggleFavorite={(id) =>
              dispatch({ type: "TOGGLE_FAVORITE", noteId: id })
            }
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchInputRef={searchInputRef}
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
            onNewNote={handleNewNote}
            templates={templateOptions}
            onBack={() => setMobilePane("sidebar")}
            emptyMessage={
              searchResults
                ? "No notes match your search."
                : emptyMessageFor(state.activeView)
            }
          />
        </div>

        <div
          className={`${mobilePane === "editor" ? "flex" : "hidden"} min-h-0 w-full flex-1 md:flex`}
        >
          <NoteEditorPane
            note={activeNote}
            allNotes={allNotes}
            viewMode={editorViewMode}
            onViewModeChange={setEditorViewMode}
            onUpdate={(patch) => {
              if (activeNote)
                dispatch({ type: "UPDATE_NOTE", noteId: activeNote.id, patch });
            }}
            onAddTag={(tag) => {
              if (activeNote)
                dispatch({ type: "ADD_TAG", noteId: activeNote.id, tag });
            }}
            onRemoveTag={(tag) => {
              if (activeNote)
                dispatch({ type: "REMOVE_TAG", noteId: activeNote.id, tag });
            }}
            onTogglePinned={() => {
              if (activeNote)
                dispatch({ type: "TOGGLE_PINNED", noteId: activeNote.id });
            }}
            onToggleFavorite={() => {
              if (activeNote)
                dispatch({ type: "TOGGLE_FAVORITE", noteId: activeNote.id });
            }}
            onArchive={() => {
              if (activeNote)
                dispatch({ type: "ARCHIVE_NOTE", noteId: activeNote.id });
            }}
            onUnarchive={() => {
              if (activeNote)
                dispatch({ type: "UNARCHIVE_NOTE", noteId: activeNote.id });
            }}
            onTrash={() => {
              if (activeNote)
                dispatch({ type: "TRASH_NOTE", noteId: activeNote.id });
              setMobilePane("list");
            }}
            onRestore={() => {
              if (activeNote)
                dispatch({ type: "RESTORE_NOTE", noteId: activeNote.id });
            }}
            onDeleteForever={() => {
              if (activeNote)
                setPendingConfirm({
                  type: "delete-note-forever",
                  noteId: activeNote.id,
                });
            }}
            onExportMarkdown={() => {
              if (activeNote) exportNoteAsMarkdown(activeNote);
            }}
            onNavigateToNoteByTitle={handleNavigateToNoteByTitle}
            onBack={() => setMobilePane("list")}
          />
        </div>
      </div>

      {state.activeView.type === "trash" &&
        trashCount > 0 &&
        mobilePane !== "sidebar" && (
          <div className="border-border flex items-center justify-end border-t px-3 py-2">
            <button
              type="button"
              onClick={() => setPendingConfirm({ type: "empty-trash" })}
              className="text-danger inline-flex items-center gap-2 text-sm font-medium hover:underline"
            >
              <Icon name="trash-2" className="h-4 w-4" />
              Empty trash
            </button>
          </div>
        )}

      <TemplatesDialog
        open={templatesOpen}
        templates={state.templates}
        onAddTemplate={(name, content) =>
          dispatch({ type: "ADD_TEMPLATE", name, content })
        }
        onDeleteTemplate={(templateId) =>
          dispatch({ type: "DELETE_TEMPLATE", templateId })
        }
        onClose={() => setTemplatesOpen(false)}
      />

      <ConfirmDialog
        open={pendingConfirm?.type === "delete-notebook"}
        title="Delete this notebook?"
        description={
          pendingConfirm?.type === "delete-notebook"
            ? `"${pendingConfirm.name}" and its folders will be removed. Its notes will be moved to Trash, where you can recover them.`
            : ""
        }
        confirmLabel="Delete notebook"
        onConfirm={handleConfirm}
        onCancel={() => setPendingConfirm(null)}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "delete-folder"}
        title="Delete this folder?"
        description={
          pendingConfirm?.type === "delete-folder"
            ? `"${pendingConfirm.name}" and any subfolders will be removed. Notes inside will move to the notebook's root — they will not be deleted.`
            : ""
        }
        confirmLabel="Delete folder"
        onConfirm={handleConfirm}
        onCancel={() => setPendingConfirm(null)}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "delete-tag"}
        title="Delete this tag?"
        description={
          pendingConfirm?.type === "delete-tag"
            ? `#${pendingConfirm.tag} will be removed from every note that has it. The notes themselves are not affected.`
            : ""
        }
        confirmLabel="Delete tag"
        onConfirm={handleConfirm}
        onCancel={() => setPendingConfirm(null)}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "delete-note-forever"}
        title="Delete this note forever?"
        description="This permanently deletes the note. It can no longer be recovered from Trash."
        confirmLabel="Delete forever"
        onConfirm={handleConfirm}
        onCancel={() => setPendingConfirm(null)}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "empty-trash"}
        title="Empty trash?"
        description={`Every note in Trash (${trashCount}) will be permanently deleted.`}
        confirmLabel="Empty trash"
        onConfirm={handleConfirm}
        onCancel={() => setPendingConfirm(null)}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "clear-all"}
        title="Delete all local data?"
        description="Every notebook, folder, note, and template will be permanently deleted from this browser. Export a backup first if you might want this data later."
        confirmLabel="Delete everything"
        onConfirm={handleConfirm}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}

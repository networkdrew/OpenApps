import { useState } from "react";
import type {
  ActiveView,
  Note,
  NoteFolder,
  Notebook,
} from "@/lib/apps-logic/notes/model";
import {
  allTags,
  childFolders,
  folderNoteCount,
  notebookNoteCount,
} from "@/lib/apps-logic/notes/filter";
import { STORAGE_KEY } from "@/lib/apps-logic/notes/persistence";
import { buttonGhost, iconButton, textField } from "@/components/react/styles";
import {
  AutosaveIndicator,
  type AutosaveState,
} from "@/components/react/AutosaveIndicator";
import { StorageUsageIndicator } from "@/components/react/StorageUsageIndicator";
import { ImportExportControls } from "@/components/react/ImportExportControls";
import Icon from "@/components/react/Icon";

function viewsEqual(a: ActiveView, b: ActiveView): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "notebook" && b.type === "notebook")
    return a.notebookId === b.notebookId;
  if (a.type === "folder" && b.type === "folder")
    return a.folderId === b.folderId;
  if (a.type === "tag" && b.type === "tag")
    return a.tag.toLowerCase() === b.tag.toLowerCase();
  return true;
}

const navItem = (active: boolean) =>
  `flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
    active
      ? "bg-accent text-accent-contrast"
      : "text-text-muted hover:bg-bg-sunken hover:text-text"
  }`;

interface NotesSidebarProps {
  notebooks: Notebook[];
  folders: NoteFolder[];
  notes: Note[];
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onAddNotebook: (name: string) => void;
  onRenameNotebook: (notebookId: string, name: string) => void;
  onDeleteNotebook: (notebookId: string) => void;
  onAddFolder: (
    notebookId: string,
    parentFolderId: string | null,
    name: string,
  ) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameTag: (oldTag: string, newTag: string) => void;
  onDeleteTag: (tag: string) => void;
  onManageTemplates: () => void;
  onExport: () => void;
  onExportMarkdown: () => void;
  onImportFile: (file: File) => void;
  onClearAll: () => void;
  autosave: AutosaveState;
  autosaveError?: string;
  refreshToken: number;
  trashCount: number;
  archiveCount: number;
  favoritesCount: number;
}

export function NotesSidebar({
  notebooks,
  folders,
  notes,
  activeView,
  onSelectView,
  onAddNotebook,
  onRenameNotebook,
  onDeleteNotebook,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onRenameTag,
  onDeleteTag,
  onManageTemplates,
  onExport,
  onExportMarkdown,
  onImportFile,
  onClearAll,
  autosave,
  autosaveError,
  refreshToken,
  trashCount,
  archiveCount,
  favoritesCount,
}: NotesSidebarProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [newNotebookName, setNewNotebookName] = useState("");
  const [addingFolderTo, setAddingFolderTo] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingNotebookId, setRenamingNotebookId] = useState<string | null>(
    null,
  );
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showDataPanel, setShowDataPanel] = useState(false);

  const tags = allTags(notes);

  function toggleFolder(id: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderFolder(folder: NoteFolder, notebookId: string, depth: number) {
    const children = childFolders(folders, notebookId, folder.id);
    const collapsed = collapsedFolders.has(folder.id);
    const active = viewsEqual(activeView, {
      type: "folder",
      folderId: folder.id,
    });
    const isRenaming = renamingFolderId === folder.id;

    return (
      <li key={folder.id}>
        {isRenaming ? (
          <form
            className="flex items-center gap-1 py-0.5"
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = renameValue.trim();
              if (trimmed) onRenameFolder(folder.id, trimmed);
              setRenamingFolderId(null);
            }}
          >
            <input
              ref={(el) => el?.focus()}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => setRenamingFolderId(null)}
              aria-label="Folder name"
              className={`${textField} py-1 text-sm`}
            />
          </form>
        ) : (
          <div
            className="group flex items-center gap-0.5"
            style={{ paddingLeft: `${depth * 14}px` }}
          >
            {children.length > 0 ? (
              <button
                type="button"
                onClick={() => toggleFolder(folder.id)}
                aria-label={collapsed ? "Expand folder" : "Collapse folder"}
                aria-expanded={!collapsed}
                className="text-text-muted flex h-6 w-5 shrink-0 items-center justify-center"
              >
                <Icon
                  name={collapsed ? "chevron-right" : "chevron-down"}
                  className="h-3.5 w-3.5"
                />
              </button>
            ) : (
              <span className="w-5 shrink-0" aria-hidden="true" />
            )}
            <button
              type="button"
              onClick={() =>
                onSelectView({ type: "folder", folderId: folder.id })
              }
              className={navItem(active)}
            >
              <Icon name="folder" className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 truncate">{folder.name}</span>
              <span className="text-xs opacity-70">
                {folderNoteCount(notes, folder.id)}
              </span>
            </button>
            <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
              <button
                type="button"
                onClick={() => {
                  setRenamingFolderId(folder.id);
                  setRenameValue(folder.name);
                }}
                aria-label={`Rename ${folder.name}`}
                className={iconButton}
              >
                <Icon name="pencil-line" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteFolder(folder.id)}
                aria-label={`Delete ${folder.name}`}
                className={iconButton}
              >
                <Icon name="trash-2" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
        {!collapsed && children.length > 0 && (
          <ul>
            {children.map((child) =>
              renderFolder(child, notebookId, depth + 1),
            )}
          </ul>
        )}
        {addingFolderTo === folder.id && (
          <form
            style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
            className="flex items-center gap-1 py-1"
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = newFolderName.trim();
              if (trimmed) onAddFolder(notebookId, folder.id, trimmed);
              setNewFolderName("");
              setAddingFolderTo(null);
            }}
          >
            <input
              ref={(el) => el?.focus()}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => setAddingFolderTo(null)}
              placeholder="New folder name"
              aria-label="New folder name"
              className={`${textField} py-1 text-sm`}
            />
          </form>
        )}
      </li>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <nav aria-label="Note views" className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onSelectView({ type: "all" })}
          className={navItem(activeView.type === "all")}
        >
          <Icon name="notebook" className="h-4 w-4" />
          All notes
        </button>
        <button
          type="button"
          onClick={() => onSelectView({ type: "favorites" })}
          className={navItem(activeView.type === "favorites")}
        >
          <Icon name="star" className="h-4 w-4" />
          <span className="flex-1 text-left">Favorites</span>
          {favoritesCount > 0 && (
            <span className="text-xs opacity-70">{favoritesCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelectView({ type: "archive" })}
          className={navItem(activeView.type === "archive")}
        >
          <Icon name="archive" className="h-4 w-4" />
          <span className="flex-1 text-left">Archive</span>
          {archiveCount > 0 && (
            <span className="text-xs opacity-70">{archiveCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelectView({ type: "trash" })}
          className={navItem(activeView.type === "trash")}
        >
          <Icon name="trash-2" className="h-4 w-4" />
          <span className="flex-1 text-left">Trash</span>
          {trashCount > 0 && (
            <span className="text-xs opacity-70">{trashCount}</span>
          )}
        </button>
      </nav>

      <div>
        <div className="text-text-muted flex items-center justify-between px-2 text-xs font-semibold tracking-wide uppercase">
          <span>Notebooks</span>
        </div>
        <ul className="mt-1 flex flex-col gap-0.5">
          {notebooks.map((notebook) => {
            const active = viewsEqual(activeView, {
              type: "notebook",
              notebookId: notebook.id,
            });
            const topFolders = childFolders(folders, notebook.id, null);
            const isRenaming = renamingNotebookId === notebook.id;
            return (
              <li key={notebook.id}>
                {isRenaming ? (
                  <form
                    className="px-2 py-0.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const trimmed = renameValue.trim();
                      if (trimmed) onRenameNotebook(notebook.id, trimmed);
                      setRenamingNotebookId(null);
                    }}
                  >
                    <input
                      ref={(el) => el?.focus()}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => setRenamingNotebookId(null)}
                      aria-label="Notebook name"
                      className={`${textField} py-1 text-sm`}
                    />
                  </form>
                ) : (
                  <div className="group flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectView({
                          type: "notebook",
                          notebookId: notebook.id,
                        })
                      }
                      className={navItem(active)}
                    >
                      <Icon name="notebook" className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{notebook.name}</span>
                      <span className="text-xs opacity-70">
                        {notebookNoteCount(notes, notebook.id)}
                      </span>
                    </button>
                    <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                      <button
                        type="button"
                        onClick={() => setAddingFolderTo(`root:${notebook.id}`)}
                        aria-label={`New folder in ${notebook.name}`}
                        className={iconButton}
                      >
                        <Icon name="folder-plus" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingNotebookId(notebook.id);
                          setRenameValue(notebook.name);
                        }}
                        aria-label={`Rename ${notebook.name}`}
                        className={iconButton}
                      >
                        <Icon name="pencil-line" className="h-3.5 w-3.5" />
                      </button>
                      {notebooks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteNotebook(notebook.id)}
                          aria-label={`Delete ${notebook.name}`}
                          className={iconButton}
                        >
                          <Icon name="trash-2" className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <ul>
                  {topFolders.map((folder) =>
                    renderFolder(folder, notebook.id, 1),
                  )}
                </ul>
                {addingFolderTo === `root:${notebook.id}` && (
                  <form
                    className="flex items-center gap-1 py-1 pl-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const trimmed = newFolderName.trim();
                      if (trimmed) onAddFolder(notebook.id, null, trimmed);
                      setNewFolderName("");
                      setAddingFolderTo(null);
                    }}
                  >
                    <input
                      ref={(el) => el?.focus()}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={() => setAddingFolderTo(null)}
                      placeholder="New folder name"
                      aria-label="New folder name"
                      className={`${textField} py-1 text-sm`}
                    />
                  </form>
                )}
              </li>
            );
          })}
        </ul>
        <form
          className="mt-1 flex items-center gap-1 px-2"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = newNotebookName.trim();
            if (!trimmed) return;
            onAddNotebook(trimmed);
            setNewNotebookName("");
          }}
        >
          <label htmlFor="new-notebook-name" className="sr-only">
            New notebook name
          </label>
          <input
            id="new-notebook-name"
            value={newNotebookName}
            onChange={(e) => setNewNotebookName(e.target.value)}
            placeholder="New notebook…"
            className={`${textField} py-1 text-sm`}
          />
          <button
            type="submit"
            aria-label="Add notebook"
            className={iconButton}
          >
            <Icon name="plus" className="h-4 w-4" />
          </button>
        </form>
      </div>

      {tags.length > 0 && (
        <div>
          <div className="text-text-muted px-2 text-xs font-semibold tracking-wide uppercase">
            Tags
          </div>
          <ul className="mt-1 flex flex-col gap-0.5">
            {tags.map((tag) => {
              const active = viewsEqual(activeView, { type: "tag", tag });
              return (
                <li key={tag} className="group flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onSelectView({ type: "tag", tag })}
                    className={navItem(active)}
                  >
                    <Icon name="hash" className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{tag}</span>
                  </button>
                  <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                    <button
                      type="button"
                      onClick={() => {
                        const next = window.prompt(
                          `Rename tag "${tag}" to:`,
                          tag,
                        );
                        if (next?.trim()) onRenameTag(tag, next.trim());
                      }}
                      aria-label={`Rename tag ${tag}`}
                      className={iconButton}
                    >
                      <Icon name="pencil-line" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTag(tag)}
                      aria-label={`Delete tag ${tag}`}
                      className={iconButton}
                    >
                      <Icon name="trash-2" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onManageTemplates}
        className={`${buttonGhost} justify-start`}
      >
        <Icon name="layout-template" className="h-4 w-4" />
        Templates
      </button>

      <div className="border-border mt-auto flex flex-col gap-3 border-t pt-3">
        <AutosaveIndicator state={autosave} errorMessage={autosaveError} />
        <button
          type="button"
          onClick={() => setShowDataPanel((v) => !v)}
          className={buttonGhost}
          aria-expanded={showDataPanel}
        >
          <Icon name="database" className="h-4 w-4" />
          Data & privacy
        </button>
        {showDataPanel && (
          <div className="border-border bg-bg-sunken flex flex-col gap-3 rounded-md border p-3">
            <StorageUsageIndicator
              storageKey={STORAGE_KEY}
              refreshToken={refreshToken}
            />
            <ImportExportControls
              onExport={onExport}
              onImportFile={onImportFile}
              exportLabel="Export JSON backup"
              importLabel="Import JSON backup"
            />
            <button
              type="button"
              onClick={onExportMarkdown}
              className={buttonGhost}
            >
              <Icon name="download" className="h-4 w-4" />
              Export all as Markdown
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="text-danger inline-flex w-fit items-center gap-2 text-sm font-medium hover:underline"
            >
              <Icon name="trash-2" className="h-4 w-4" />
              Delete all local data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

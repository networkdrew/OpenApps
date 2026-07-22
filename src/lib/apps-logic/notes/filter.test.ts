import { describe, expect, it } from "vitest";
import { createFolder, createNote } from "./model";
import {
  allTags,
  childFolders,
  descendantFolderIds,
  folderNoteCount,
  foldersForNotebook,
  notebookNoteCount,
  notesForView,
} from "./filter";

describe("notesForView", () => {
  const nb1 = "nb-1";
  const nb2 = "nb-2";

  function makeNotes() {
    const plain = createNote(nb1, null, "Plain");
    const inFolder = { ...createNote(nb1, "folder-1", "In folder") };
    const favorite = { ...createNote(nb1, null, "Favorite"), favorite: true };
    const pinned = { ...createNote(nb1, null, "Pinned"), pinned: true };
    const archived = { ...createNote(nb1, null, "Archived"), archived: true };
    const trashed = {
      ...createNote(nb1, null, "Trashed"),
      trashed: true,
      trashedAt: new Date().toISOString(),
    };
    const tagged = { ...createNote(nb1, null, "Tagged"), tags: ["Work"] };
    const otherNotebook = createNote(nb2, null, "Other notebook");
    return {
      plain,
      inFolder,
      favorite,
      pinned,
      archived,
      trashed,
      tagged,
      otherNotebook,
      all: [
        plain,
        inFolder,
        favorite,
        pinned,
        archived,
        trashed,
        tagged,
        otherNotebook,
      ],
    };
  }

  it("'all' excludes archived and trashed notes", () => {
    const { all, plain, inFolder, favorite, pinned, tagged, otherNotebook } =
      makeNotes();
    const result = notesForView(all, { type: "all" });
    expect(result).toEqual(
      expect.arrayContaining([
        plain,
        inFolder,
        favorite,
        pinned,
        tagged,
        otherNotebook,
      ]),
    );
    expect(result.length).toBe(6);
  });

  it("'notebook' filters to that notebook, excluding archived/trashed", () => {
    const { all } = makeNotes();
    const result = notesForView(all, { type: "notebook", notebookId: nb2 });
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Other notebook");
  });

  it("'folder' filters to notes in that folder", () => {
    const { all, inFolder } = makeNotes();
    const result = notesForView(all, { type: "folder", folderId: "folder-1" });
    expect(result).toEqual([inFolder]);
  });

  it("'tag' matches case-insensitively", () => {
    const { all, tagged } = makeNotes();
    const result = notesForView(all, { type: "tag", tag: "work" });
    expect(result).toEqual([tagged]);
  });

  it("'favorites' includes only favorited, non-trashed notes", () => {
    const { all, favorite } = makeNotes();
    const result = notesForView(all, { type: "favorites" });
    expect(result).toEqual([favorite]);
  });

  it("'archive' includes only archived, non-trashed notes", () => {
    const { all, archived } = makeNotes();
    const result = notesForView(all, { type: "archive" });
    expect(result).toEqual([archived]);
  });

  it("'trash' includes only trashed notes", () => {
    const { all, trashed } = makeNotes();
    const result = notesForView(all, { type: "trash" });
    expect(result).toEqual([trashed]);
  });
});

describe("allTags", () => {
  it("dedupes case-insensitively, keeping first-seen casing", () => {
    const a = { ...createNote("nb", null, "A"), tags: ["Work"] };
    const b = { ...createNote("nb", null, "B"), tags: ["work", "Home"] };
    expect(allTags([a, b])).toEqual(["Home", "Work"]);
  });

  it("excludes tags from trashed notes", () => {
    const trashed = {
      ...createNote("nb", null, "A"),
      tags: ["Ghost"],
      trashed: true,
    };
    expect(allTags([trashed])).toEqual([]);
  });

  it("returns an empty array when there are no tags", () => {
    expect(allTags([createNote("nb", null, "A")])).toEqual([]);
  });
});

describe("folder helpers", () => {
  it("foldersForNotebook filters by notebook", () => {
    const f1 = createFolder("nb-1", null, "A");
    const f2 = createFolder("nb-2", null, "B");
    expect(foldersForNotebook([f1, f2], "nb-1")).toEqual([f1]);
  });

  it("childFolders filters by notebook and parent", () => {
    const root = createFolder("nb-1", null, "Root");
    const child = createFolder("nb-1", root.id, "Child");
    const other = createFolder("nb-1", null, "Other root");
    expect(childFolders([root, child, other], "nb-1", null)).toEqual([
      root,
      other,
    ]);
    expect(childFolders([root, child, other], "nb-1", root.id)).toEqual([
      child,
    ]);
  });

  it("descendantFolderIds finds nested descendants at any depth", () => {
    const root = createFolder("nb-1", null, "Root");
    const child = createFolder("nb-1", root.id, "Child");
    const grandchild = createFolder("nb-1", child.id, "Grandchild");
    const unrelated = createFolder("nb-1", null, "Unrelated");
    const ids = descendantFolderIds(
      [root, child, grandchild, unrelated],
      root.id,
    );
    expect(new Set(ids)).toEqual(new Set([child.id, grandchild.id]));
  });

  it("descendantFolderIds returns an empty array for a leaf folder", () => {
    const leaf = createFolder("nb-1", null, "Leaf");
    expect(descendantFolderIds([leaf], leaf.id)).toEqual([]);
  });
});

describe("count helpers", () => {
  it("notebookNoteCount excludes archived/trashed", () => {
    const nb = "nb-1";
    const plain = createNote(nb, null, "A");
    const archived = { ...createNote(nb, null, "B"), archived: true };
    expect(notebookNoteCount([plain, archived], nb)).toBe(1);
  });

  it("folderNoteCount excludes archived/trashed", () => {
    const folderId = "folder-1";
    const plain = createNote("nb", folderId, "A");
    const trashed = {
      ...createNote("nb", folderId, "B"),
      trashed: true,
      trashedAt: new Date().toISOString(),
    };
    expect(folderNoteCount([plain, trashed], folderId)).toBe(1);
  });
});

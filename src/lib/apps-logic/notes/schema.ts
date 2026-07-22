import { z } from "zod";

const notebookSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const folderSchema = z.object({
  id: z.string().min(1),
  notebookId: z.string().min(1),
  parentFolderId: z.string().nullable(),
  name: z.string().min(1),
  createdAt: z.string(),
});

const noteSchema = z.object({
  id: z.string().min(1),
  notebookId: z.string().min(1),
  folderId: z.string().nullable(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string().min(1)),
  favorite: z.boolean(),
  pinned: z.boolean(),
  archived: z.boolean(),
  trashed: z.boolean(),
  trashedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const templateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  content: z.string(),
  createdAt: z.string(),
});

const activeViewSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all") }),
  z.object({ type: z.literal("notebook"), notebookId: z.string().min(1) }),
  z.object({ type: z.literal("folder"), folderId: z.string().min(1) }),
  z.object({ type: z.literal("tag"), tag: z.string().min(1) }),
  z.object({ type: z.literal("favorites") }),
  z.object({ type: z.literal("archive") }),
  z.object({ type: z.literal("trash") }),
]);

/** Validates an imported/stored notes state at the current schema version (1). Reject anything that doesn't match rather than risk half-corrupt data landing in the UI. */
export const notesStateSchemaV1 = z.object({
  version: z.literal(1),
  notebooks: z.array(notebookSchema).min(1),
  folders: z.array(folderSchema),
  notes: z.record(z.string(), noteSchema),
  templates: z.array(templateSchema),
  activeView: activeViewSchema,
  activeNoteId: z.string().nullable(),
});

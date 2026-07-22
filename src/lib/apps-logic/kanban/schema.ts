import { z } from "zod";

const priority = z.enum(["none", "low", "medium", "high"]);

const label = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
});

const card = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  labelIds: z.array(z.string()),
  priority,
  dueDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const column = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  cardIds: z.array(z.string()),
});

const board = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  columns: z.array(column),
  cards: z.record(z.string(), card),
  labels: z.array(label),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Validates an imported/stored kanban state at the current schema version (1). Reject anything that doesn't match rather than risk half-corrupt data landing in the UI. */
export const kanbanStateSchemaV1 = z.object({
  version: z.literal(1),
  boards: z.array(board),
  activeBoardId: z.string().nullable(),
});

import {
  loadLocalStore,
  saveLocalStore,
  clearLocalStore,
  type SaveResult,
} from "@/lib/storage/localStore";
import { downloadJson, readJsonFile } from "@/lib/storage/jsonTransfer";
import { createEmptyState, type KanbanState } from "./model";
import { kanbanStateSchemaV1 } from "./schema";

export const STORAGE_KEY = "openapps:kanban-board:state";
export const SCHEMA_VERSION = 1;

export function loadKanbanState(): KanbanState {
  return loadLocalStore<KanbanState>({
    key: STORAGE_KEY,
    version: SCHEMA_VERSION,
    fallback: createEmptyState(),
    // No prior schema versions exist yet — a future v2 migration would read
    // `stored.data` here and return valid v2 `KanbanState`.
  });
}

export function saveKanbanState(state: KanbanState): SaveResult {
  return saveLocalStore(
    { key: STORAGE_KEY, version: SCHEMA_VERSION, fallback: state },
    state,
  );
}

export function clearKanbanState(): void {
  clearLocalStore(STORAGE_KEY);
}

export function exportKanbanState(state: KanbanState): void {
  const date = new Date().toISOString().slice(0, 10);
  downloadJson(`kanban-board-export-${date}.json`, state);
}

export type ImportResult =
  { ok: true; state: KanbanState } | { ok: false; message: string };

export async function importKanbanState(file: File): Promise<ImportResult> {
  const read = await readJsonFile(file);
  if (!read.ok) return { ok: false, message: read.message };

  const parsed = kanbanStateSchemaV1.safeParse(read.data);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        "That file doesn't look like a Kanban Board export — check it's the right file and try again.",
    };
  }
  return { ok: true, state: parsed.data };
}

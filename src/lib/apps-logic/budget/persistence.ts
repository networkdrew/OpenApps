import {
  loadLocalStore,
  saveLocalStore,
  clearLocalStore,
  type SaveResult,
} from "@/lib/storage/localStore";
import { downloadJson, readJsonFile } from "@/lib/storage/jsonTransfer";
import { createEmptyState, type BudgetState } from "./model";
import { budgetStateSchemaV1 } from "./schema";

export const STORAGE_KEY = "openapps:budget:state";
export const SCHEMA_VERSION = 1;

export function loadBudgetState(): BudgetState {
  return loadLocalStore<BudgetState>({
    key: STORAGE_KEY,
    version: SCHEMA_VERSION,
    fallback: createEmptyState(),
    // No prior schema versions exist yet — a future v2 migration would read
    // `stored.data` here and return valid v2 BudgetState.
  });
}

export function saveBudgetState(state: BudgetState): SaveResult {
  return saveLocalStore(
    { key: STORAGE_KEY, version: SCHEMA_VERSION, fallback: state },
    state,
  );
}

export function clearBudgetState(): void {
  clearLocalStore(STORAGE_KEY);
}

export function exportBudgetState(state: BudgetState): void {
  const date = new Date().toISOString().slice(0, 10);
  downloadJson(`openbudget-backup-${date}.json`, state);
}

export type ImportResult =
  { ok: true; state: BudgetState } | { ok: false; message: string };

export async function importBudgetState(file: File): Promise<ImportResult> {
  const read = await readJsonFile(file);
  if (!read.ok) return { ok: false, message: read.message };

  const parsed = budgetStateSchemaV1.safeParse(read.data);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        "That file doesn't look like an OpenBudget backup — check it's the right file and try again.",
    };
  }
  return { ok: true, state: parsed.data as BudgetState };
}

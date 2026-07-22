/**
 * Shared convention every local-first app should use for its persisted
 * state: a single JSON blob under one localStorage key, wrapped with an
 * explicit schema `version` so a later structural change can migrate old
 * data instead of silently discarding it. See docs/local-data-standard.md.
 */
export interface StoredEnvelope<T> {
  version: number;
  data: T;
}

export interface LocalStoreConfig<T> {
  /** localStorage key. Prefix with the app id, e.g. "kanban-board:state". */
  key: string;
  /** Current schema version this build of the app expects. */
  version: number;
  /** The value returned when nothing is stored yet, or storage is unavailable. */
  fallback: T;
  /**
   * Given whatever was actually stored (any past version) and its version
   * number, return valid current-version data. Called only when the stored
   * version doesn't match `version`; see migrations.ts for chaining several
   * version-to-version steps together.
   */
  migrate?: (stored: { version: number; data: unknown }) => T;
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadLocalStore<T>(config: LocalStoreConfig<T>): T {
  if (!hasLocalStorage()) return config.fallback;
  const raw = window.localStorage.getItem(config.key);
  if (!raw) return config.fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return config.fallback;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    !("data" in parsed)
  ) {
    return config.fallback;
  }

  const envelope = parsed as StoredEnvelope<unknown>;
  if (envelope.version === config.version) {
    return envelope.data as T;
  }
  if (config.migrate) {
    try {
      return config.migrate({ version: envelope.version, data: envelope.data });
    } catch {
      return config.fallback;
    }
  }
  return config.fallback;
}

export type SaveResult = { ok: true } | { ok: false; message: string };

export function saveLocalStore<T>(
  config: LocalStoreConfig<T>,
  data: T,
): SaveResult {
  if (!hasLocalStorage()) {
    return {
      ok: false,
      message: "Local storage isn't available in this browser.",
    };
  }
  const envelope: StoredEnvelope<T> = { version: config.version, data };
  try {
    window.localStorage.setItem(config.key, JSON.stringify(envelope));
    return { ok: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      return {
        ok: false,
        message:
          "Your browser's local storage is full. Export a backup and remove data you no longer need.",
      };
    }
    return { ok: false, message: "Couldn't save to local storage." };
  }
}

export function clearLocalStore(key: string): void {
  if (!hasLocalStorage()) return;
  window.localStorage.removeItem(key);
}

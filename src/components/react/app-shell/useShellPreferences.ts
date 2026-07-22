import { useEffect, useState } from "react";
import { loadLocalStore, saveLocalStore } from "@/lib/storage/localStore";

export interface ShellPreferences {
  sidebarCollapsed: boolean;
  focusMode: boolean;
}

const STORE_CONFIG = {
  key: "openapps:shell:preferences",
  version: 1,
  fallback: { sidebarCollapsed: false, focusMode: false } as ShellPreferences,
};

/**
 * Persisted, platform-wide app-shell UI preferences (sidebar + focus mode).
 * Reads happen in an effect, not during initial render, so server-rendered
 * and first-paint client markup match — see docs/local-data-standard.md.
 */
export function useShellPreferences() {
  const [prefs, setPrefs] = useState<ShellPreferences>(STORE_CONFIG.fallback);

  useEffect(() => {
    setPrefs(loadLocalStore(STORE_CONFIG));
  }, []);

  function update(patch: Partial<ShellPreferences>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveLocalStore(STORE_CONFIG, next);
      return next;
    });
  }

  return { prefs, update };
}

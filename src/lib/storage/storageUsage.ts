/** Rough byte estimate for a stored string, using UTF-16 code unit width (how browsers actually store localStorage values). */
export function estimateStringBytes(value: string): number {
  return value.length * 2;
}

export function estimateKeyBytes(key: string): number {
  if (typeof window === "undefined" || !window.localStorage) return 0;
  const raw = window.localStorage.getItem(key);
  return raw ? estimateStringBytes(raw) : 0;
}

export function estimateTotalLocalStorageBytes(): number {
  if (typeof window === "undefined" || !window.localStorage) return 0;
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    total += estimateStringBytes(key) + estimateKeyBytes(key);
  }
  return total;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

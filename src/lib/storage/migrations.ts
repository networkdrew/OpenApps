/**
 * Chains a series of single-step upgrade functions so `loadLocalStore`'s
 * `migrate` can turn "whatever version was actually stored" into "current
 * version" without every app hand-rolling its own version-jump logic.
 *
 * `steps[0]` upgrades version 1 -> 2, `steps[1]` upgrades 2 -> 3, and so on.
 * A store that has never needed a migration has an empty `steps` array.
 */
export function migrateThroughSteps(
  stored: { version: number; data: unknown },
  steps: Array<(data: unknown) => unknown>,
): unknown {
  let data = stored.data;
  let version = stored.version;
  while (version <= steps.length) {
    const step = steps[version - 1];
    if (!step) break;
    data = step(data);
    version += 1;
  }
  return data;
}

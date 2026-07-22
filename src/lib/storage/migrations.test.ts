import { describe, expect, it } from "vitest";
import { migrateThroughSteps } from "./migrations";

describe("migrateThroughSteps", () => {
  it("returns the data unchanged when already current and no steps needed", () => {
    const result = migrateThroughSteps({ version: 1, data: { n: 1 } }, []);
    expect(result).toEqual({ n: 1 });
  });

  it("applies a single step from v1 to v2", () => {
    const result = migrateThroughSteps({ version: 1, data: { n: 1 } }, [
      (d) => ({ n: (d as { n: number }).n + 1 }),
    ]);
    expect(result).toEqual({ n: 2 });
  });

  it("chains multiple steps from v1 to v3", () => {
    const result = migrateThroughSteps({ version: 1, data: { n: 1 } }, [
      (d) => ({ n: (d as { n: number }).n + 1 }), // v1 -> v2
      (d) => ({ n: (d as { n: number }).n * 10 }), // v2 -> v3
    ]);
    expect(result).toEqual({ n: 20 });
  });

  it("starts partway through the chain when stored version is already v2", () => {
    const result = migrateThroughSteps({ version: 2, data: { n: 2 } }, [
      (d) => ({ n: (d as { n: number }).n + 1 }), // v1 -> v2 (skipped)
      (d) => ({ n: (d as { n: number }).n * 10 }), // v2 -> v3
    ]);
    expect(result).toEqual({ n: 20 });
  });
});

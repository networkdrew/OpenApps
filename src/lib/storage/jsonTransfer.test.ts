import { describe, expect, it } from "vitest";
import { readJsonFile } from "./jsonTransfer";

describe("readJsonFile", () => {
  it("parses valid JSON from a File", async () => {
    const file = new File([JSON.stringify({ a: 1 })], "data.json", {
      type: "application/json",
    });
    const result = await readJsonFile(file);
    expect(result).toEqual({ ok: true, data: { a: 1 } });
  });

  it("reports an error for invalid JSON", async () => {
    const file = new File(["not json"], "data.json", {
      type: "application/json",
    });
    const result = await readJsonFile(file);
    expect(result.ok).toBe(false);
  });
});

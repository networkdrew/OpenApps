import { describe, expect, it, beforeEach } from "vitest";
import { clearLocalStore, loadLocalStore, saveLocalStore } from "./localStore";

describe("localStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the fallback when nothing is stored", () => {
    const result = loadLocalStore({
      key: "test:a",
      version: 1,
      fallback: { n: 0 },
    });
    expect(result).toEqual({ n: 0 });
  });

  it("round-trips data at the current version", () => {
    const config = { key: "test:b", version: 1, fallback: { n: 0 } };
    saveLocalStore(config, { n: 42 });
    expect(loadLocalStore(config)).toEqual({ n: 42 });
  });

  it("returns the fallback for corrupted JSON instead of throwing", () => {
    window.localStorage.setItem("test:c", "{not json");
    const result = loadLocalStore({
      key: "test:c",
      version: 1,
      fallback: { n: 0 },
    });
    expect(result).toEqual({ n: 0 });
  });

  it("returns the fallback for a well-formed but unenveloped value", () => {
    window.localStorage.setItem("test:d", JSON.stringify({ n: 99 }));
    const result = loadLocalStore({
      key: "test:d",
      version: 1,
      fallback: { n: 0 },
    });
    expect(result).toEqual({ n: 0 });
  });

  it("runs the migrate function when the stored version doesn't match", () => {
    window.localStorage.setItem(
      "test:e",
      JSON.stringify({ version: 1, data: { count: 5 } }),
    );
    const result = loadLocalStore<{ total: number }>({
      key: "test:e",
      version: 2,
      fallback: { total: 0 },
      migrate: (stored) => ({
        total: (stored.data as { count: number }).count,
      }),
    });
    expect(result).toEqual({ total: 5 });
  });

  it("falls back safely if migrate throws", () => {
    window.localStorage.setItem(
      "test:f",
      JSON.stringify({ version: 1, data: { count: 5 } }),
    );
    const result = loadLocalStore<{ total: number }>({
      key: "test:f",
      version: 2,
      fallback: { total: -1 },
      migrate: () => {
        throw new Error("boom");
      },
    });
    expect(result).toEqual({ total: -1 });
  });

  it("clears a stored key", () => {
    const config = { key: "test:g", version: 1, fallback: { n: 0 } };
    saveLocalStore(config, { n: 7 });
    clearLocalStore("test:g");
    expect(loadLocalStore(config)).toEqual({ n: 0 });
  });
});

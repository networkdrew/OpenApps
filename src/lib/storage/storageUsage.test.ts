import { describe, expect, it, beforeEach } from "vitest";
import {
  estimateKeyBytes,
  estimateStringBytes,
  estimateTotalLocalStorageBytes,
  formatBytes,
} from "./storageUsage";

describe("storageUsage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("estimates UTF-16 byte width", () => {
    expect(estimateStringBytes("ab")).toBe(4);
  });

  it("estimates bytes for a stored key", () => {
    window.localStorage.setItem("k", "abcd");
    expect(estimateKeyBytes("k")).toBe(8);
  });

  it("returns 0 for a missing key", () => {
    expect(estimateKeyBytes("missing")).toBe(0);
  });

  it("sums bytes across all stored keys", () => {
    window.localStorage.setItem("a", "ab");
    window.localStorage.setItem("b", "cd");
    expect(estimateTotalLocalStorageBytes()).toBeGreaterThan(0);
  });

  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

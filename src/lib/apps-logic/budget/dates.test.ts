import { describe, expect, it } from "vitest";
import {
  addDays,
  addInterval,
  addMonths,
  addMonthsToMonthKey,
  addYears,
  compareIsoDates,
  currentMonthKey,
  formatMonthLabel,
  formatMonthLabelShort,
  isBeforeOrEqual,
  isValidIsoDate,
  monthKey,
  monthKeyOf,
  recentMonthKeys,
  todayIso,
} from "./dates";

describe("isValidIsoDate", () => {
  it("accepts real calendar dates", () => {
    expect(isValidIsoDate("2026-07-22")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true);
  });

  it("rejects malformed or impossible dates", () => {
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2025-02-29")).toBe(false);
    expect(isValidIsoDate("not-a-date")).toBe(false);
    expect(isValidIsoDate("2026-7-2")).toBe(false);
  });
});

describe("addDays", () => {
  it("adds days within a month", () => {
    expect(addDays("2026-07-01", 5)).toBe("2026-07-06");
  });

  it("rolls over a month boundary", () => {
    expect(addDays("2026-07-30", 3)).toBe("2026-08-02");
  });

  it("rolls over a year boundary", () => {
    expect(addDays("2026-12-30", 5)).toBe("2027-01-04");
  });

  it("supports negative days", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
  });
});

describe("addMonths", () => {
  it("adds whole months", () => {
    expect(addMonths("2026-01-15", 2)).toBe("2026-03-15");
  });

  it("clamps to the shorter target month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
  });

  it("rolls over a year boundary", () => {
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
  });

  it("supports negative months", () => {
    expect(addMonths("2026-03-15", -4)).toBe("2025-11-15");
  });
});

describe("addYears", () => {
  it("adds whole years", () => {
    expect(addYears("2026-07-22", 2)).toBe("2028-07-22");
  });

  it("clamps Feb 29 on a non-leap target", () => {
    expect(addYears("2024-02-29", 1)).toBe("2025-02-28");
  });
});

describe("addInterval", () => {
  it("advances daily", () => {
    expect(addInterval("2026-07-22", "daily", 1)).toBe("2026-07-23");
  });
  it("advances weekly", () => {
    expect(addInterval("2026-07-22", "weekly", 1)).toBe("2026-07-29");
  });
  it("advances biweekly", () => {
    expect(addInterval("2026-07-22", "biweekly", 1)).toBe("2026-08-05");
  });
  it("advances monthly", () => {
    expect(addInterval("2026-07-22", "monthly", 1)).toBe("2026-08-22");
  });
  it("advances yearly", () => {
    expect(addInterval("2026-07-22", "yearly", 1)).toBe("2027-07-22");
  });
  it("honors an interval greater than 1", () => {
    expect(addInterval("2026-07-22", "monthly", 3)).toBe("2026-10-22");
  });
  it("treats a zero or negative interval as 1 to avoid an infinite loop upstream", () => {
    expect(addInterval("2026-07-22", "daily", 0)).toBe("2026-07-23");
    expect(addInterval("2026-07-22", "daily", -5)).toBe("2026-07-23");
  });
});

describe("month keys", () => {
  it("derives a month key from a date", () => {
    expect(monthKey("2026-07-22")).toBe("2026-07");
  });

  it("builds a month key from year/month", () => {
    expect(monthKeyOf(2026, 0)).toBe("2026-01");
    expect(monthKeyOf(2026, 11)).toBe("2026-12");
  });

  it("shifts a month key forward and backward across a year boundary", () => {
    expect(addMonthsToMonthKey("2026-01", -1)).toBe("2025-12");
    expect(addMonthsToMonthKey("2026-12", 1)).toBe("2027-01");
  });

  it("lists recent month keys oldest-first, inclusive of the end key", () => {
    expect(recentMonthKeys(3, "2026-03")).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
  });

  it("computes the current month key from a given date", () => {
    expect(currentMonthKey(new Date(2026, 6, 22))).toBe("2026-07");
  });
});

describe("comparisons", () => {
  it("orders ISO date strings lexicographically", () => {
    expect(compareIsoDates("2026-07-01", "2026-08-01")).toBeLessThan(0);
    expect(compareIsoDates("2026-08-01", "2026-07-01")).toBeGreaterThan(0);
    expect(compareIsoDates("2026-07-01", "2026-07-01")).toBe(0);
  });

  it("isBeforeOrEqual is inclusive", () => {
    expect(isBeforeOrEqual("2026-07-01", "2026-07-01")).toBe(true);
    expect(isBeforeOrEqual("2026-07-01", "2026-07-02")).toBe(true);
    expect(isBeforeOrEqual("2026-07-02", "2026-07-01")).toBe(false);
  });
});

describe("formatting", () => {
  it("formats a month label", () => {
    expect(formatMonthLabel("2026-07")).toBe("Jul 2026");
  });
  it("formats a short month label", () => {
    expect(formatMonthLabelShort("2026-07")).toBe("Jul");
  });
});

describe("todayIso", () => {
  it("returns a valid ISO date matching the given local date", () => {
    const iso = todayIso(new Date(2026, 6, 22, 23, 59));
    expect(iso).toBe("2026-07-22");
    expect(isValidIsoDate(iso)).toBe(true);
  });
});

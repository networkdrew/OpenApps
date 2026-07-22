import { describe, expect, it } from "vitest";
import {
  centsToDollars,
  dollarsToCents,
  formatCents,
  formatCentsSigned,
  parseAmountToCents,
} from "./money";

describe("dollarsToCents / centsToDollars", () => {
  it("round-trips exactly, avoiding float drift", () => {
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
    expect(centsToDollars(1999)).toBe(19.99);
  });

  it("rounds fractional cents", () => {
    expect(dollarsToCents(1.004)).toBe(100);
    expect(dollarsToCents(1.006)).toBe(101);
  });
});

describe("parseAmountToCents", () => {
  it("parses a plain number", () => {
    expect(parseAmountToCents("12.5")).toBe(1250);
  });

  it("parses a currency-formatted string", () => {
    expect(parseAmountToCents("$1,234.56")).toBe(123456);
  });

  it("parses a negative amount", () => {
    expect(parseAmountToCents("-3")).toBe(-300);
  });

  it("parses a whole number with no decimal", () => {
    expect(parseAmountToCents("40")).toBe(4000);
  });

  it("rejects empty input", () => {
    expect(parseAmountToCents("")).toBeNull();
    expect(parseAmountToCents("   ")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(parseAmountToCents("abc")).toBeNull();
    expect(parseAmountToCents("12.34.56")).toBeNull();
    expect(parseAmountToCents("abc123")).toBeNull();
  });

  it("rejects more than two decimal places", () => {
    expect(parseAmountToCents("1.999")).toBeNull();
  });
});

describe("formatCents", () => {
  it("formats a positive amount as USD", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
  });
  it("formats zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });
  it("formats a negative amount", () => {
    expect(formatCents(-500)).toBe("-$5.00");
  });
});

describe("formatCentsSigned", () => {
  it("prefixes a positive amount with +", () => {
    expect(formatCentsSigned(12000)).toBe("+$120.00");
  });
  it("prefixes a negative amount with -", () => {
    expect(formatCentsSigned(-4550)).toBe("-$45.50");
  });
  it("has no sign for zero", () => {
    expect(formatCentsSigned(0)).toBe("$0.00");
  });
});

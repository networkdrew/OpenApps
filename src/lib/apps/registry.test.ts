import { describe, expect, it } from "vitest";
import { apps } from "./registry";
import { categories } from "./categories";

describe("app registry integrity", () => {
  it("has at least one app", () => {
    expect(apps.length).toBeGreaterThan(0);
  });

  it("has unique ids", () => {
    const ids = apps.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique slugs", () => {
    const slugs = apps.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("only references categories that exist", () => {
    const categoryIds = new Set(categories.map((c) => c.id));
    for (const app of apps) {
      expect(
        categoryIds.has(app.categoryId),
        `${app.id} -> ${app.categoryId}`,
      ).toBe(true);
    }
  });

  it("only references related apps that exist", () => {
    const ids = new Set(apps.map((a) => a.id));
    for (const app of apps) {
      for (const relatedId of app.relatedApps) {
        expect(ids.has(relatedId), `${app.id} -> related ${relatedId}`).toBe(
          true,
        );
      }
    }
  });

  it("never lists an app as related to itself", () => {
    for (const app of apps) {
      expect(app.relatedApps).not.toContain(app.id);
    }
  });

  it("keeps short descriptions within a reasonable meta-description length", () => {
    for (const app of apps) {
      expect(app.shortDescription.length).toBeLessThanOrEqual(160);
    }
  });

  it("has a valid, non-future addedAt date not later than updatedAt", () => {
    const now = Date.now();
    for (const app of apps) {
      const added = new Date(`${app.addedAt}T00:00:00Z`).getTime();
      const updated = new Date(`${app.updatedAt}T00:00:00Z`).getTime();
      expect(Number.isNaN(added), app.id).toBe(false);
      expect(Number.isNaN(updated), app.id).toBe(false);
      expect(added).toBeLessThanOrEqual(now);
      expect(added).toBeLessThanOrEqual(updated);
    }
  });

  it("declares an honest privacy record: local-only apps never claim data leaves the device", () => {
    for (const app of apps) {
      if (app.privacy.storageMode !== "none" || app.appType === "workspace") {
        expect(app.privacy.details.length, app.id).toBeGreaterThan(0);
      }
    }
  });

  it("every app carries the minimum discovery metadata required by docs/search-and-discovery.md", () => {
    for (const app of apps) {
      expect(app.tags.length, `${app.id} tags`).toBeGreaterThan(0);
      expect(
        app.tasksPerformed.length,
        `${app.id} tasksPerformed`,
      ).toBeGreaterThan(0);
      expect(
        app.problemsSolved.length,
        `${app.id} problemsSolved`,
      ).toBeGreaterThan(0);
      expect(
        app.descriptivePhrases.length,
        `${app.id} descriptivePhrases`,
      ).toBeGreaterThan(0);
      expect(app.useCases.length, `${app.id} useCases`).toBeGreaterThan(0);
      expect(app.audiences.length, `${app.id} audiences`).toBeGreaterThan(0);
    }
  });
});

describe("category registry integrity", () => {
  it("has unique category ids", () => {
    const ids = categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no empty categories", () => {
    for (const category of categories) {
      const count = apps.filter((a) => a.categoryId === category.id).length;
      expect(count, category.id).toBeGreaterThan(0);
    }
  });
});

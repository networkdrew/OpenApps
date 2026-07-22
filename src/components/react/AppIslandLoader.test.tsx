import { describe, expect, it } from "vitest";
import { apps, getComponentId } from "@/lib/apps/registry";
import { getAppIslandIds } from "./AppIslandLoader";

describe("AppIslandLoader", () => {
  it("has exactly one component loader per registry app", () => {
    const registryIds = apps.map((a) => getComponentId(a)).sort();
    const loaderIds = getAppIslandIds().sort();
    expect(loaderIds).toEqual(registryIds);
  });
});

import { describe, it, expect } from "vitest";
import { generateId, provisionInstance, createPot, onboardNewHost } from "@/lib/provisioning";

/**
 * Provisioning tests — multi-tenant id + slug generation. Ids double as share-link
 * slugs, so they must be URL-safe, prefixed, and collision-resistant.
 */
describe("generateId", () => {
  it("is prefixed and URL-safe", () => {
    expect(generateId("pot")).toMatch(/^pot_[a-z0-9]+$/);
    expect(generateId("inst")).toMatch(/^inst_[a-z0-9]+$/);
  });
  it("is collision-resistant across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId("x")));
    expect(ids.size).toBe(1000);
  });
});

describe("createPot", () => {
  it("derives a slug from the pot id and preserves the inputs", () => {
    const pot = createPot({ instanceId: "inst_1", ownerId: "u1", title: "Big Holiday", goalValue: 5000 }, 1234);
    expect(pot.potId).toMatch(/^pot_/);
    expect(pot.slug).toBe(pot.potId.split("_")[1]);
    expect(pot.instanceId).toBe("inst_1");
    expect(pot.ownerId).toBe("u1");
    expect(pot.title).toBe("Big Holiday");
    expect(pot.goalValue).toBe(5000);
    expect(pot.createdAt).toBe(1234);
  });
});

describe("provisionInstance", () => {
  it("mints a tenant instance for an owner", () => {
    const inst = provisionInstance("u9", 42);
    expect(inst.instanceId).toMatch(/^inst_/);
    expect(inst.ownerId).toBe("u9");
    expect(inst.createdAt).toBe(42);
  });
});

describe("onboardNewHost", () => {
  it("provisions an instance and its first pot in the same tenant", () => {
    const { instance, pot } = onboardNewHost("u1", { title: "New Car", goalValue: 12000 }, 777);
    expect(instance.ownerId).toBe("u1");
    expect(pot.instanceId).toBe(instance.instanceId); // pot lands inside the new tenant
    expect(pot.ownerId).toBe("u1");
    expect(pot.title).toBe("New Car");
    expect(pot.createdAt).toBe(777);
  });
});

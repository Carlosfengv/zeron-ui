import { describe, expect, it } from "vitest";
import registered from "../docs/agent-data/item-identities.json";
import { createItemIdentityRegistry, validateItemIdentityEvolution } from "../lib/agent-catalog/schema";

const record = { id: "component:original", type: "registry", key: "original", aliases: ["original"], status: "active", retirementReason: null };
const input = (items: unknown[]) => ({ schemaVersion: 1, items });

describe("persisted catalog identity", () => {
  it("keeps the original ID across a renamed source and preserves its old alias", () => {
    const registry = createItemIdentityRegistry(input([{ ...record, key: "renamed", aliases: ["original", "renamed", "new-doc-slug"] }]));
    expect(registry.resolve("registry", "renamed", ["renamed", "new-doc-slug"])).toMatchObject({ id: "component:original", aliases: ["original", "renamed", "new-doc-slug"] });
    registry.assertComplete();
    expect(() => createItemIdentityRegistry(input([{ ...record, key: "renamed", aliases: ["renamed"] }]))).toThrow("original registered name");
  });
  it("does not derive identity from current classification", () => {
    const registry = createItemIdentityRegistry(input([record]));
    // The same registered source can be rendered as a block or a component.
    const before = { kind: "component", ...registry.resolve("registry", "original") };
    const after = { kind: "block", ...registry.resolve("registry", "original") };
    expect(after.id).toBe(before.id);
  });
  it("rejects unregistered sources, missing current aliases and silent removals", () => {
    const registry = createItemIdentityRegistry(input([record]));
    expect(() => registry.resolve("registry", "new")).toThrow("Missing active identity");
    expect(() => registry.resolve("registry", "original", ["changed-doc-slug"])).toThrow("missing changed-doc-slug");
    expect(() => registry.assertComplete()).toThrow("retire it explicitly");
  });
  it("requires a retirement reason and forbids reuse of a retired ID", () => {
    expect(() => createItemIdentityRegistry(input([{ ...record, status: "retired" }]))).toThrow("Retirement requires");
    const retired = { ...record, status: "retired", retirementReason: "Replaced by the new documented composition" };
    const registry = createItemIdentityRegistry(input([retired]));
    registry.assertComplete();
    expect(() => registry.resolve("registry", "original")).toThrow("Missing active identity");
    expect(() => createItemIdentityRegistry(input([retired, { ...record, key: "other" }]))).toThrow("Duplicate registered ID");
  });
  it("rejects duplicate current sources but permits explicit ambiguous aliases", () => {
    expect(() => createItemIdentityRegistry(input([record, { ...record, id: "block:other" }]))).toThrow("Duplicate active source");
    expect(() => createItemIdentityRegistry(input([record, { ...record, id: "block:other", key: "other", aliases: ["other", "original"] }]))).not.toThrow();
  });
  it("validates every maintained entry without changing its source identity", () => {
    const registry = createItemIdentityRegistry(registered);
    for (const item of registry.identities.items) {
      if (item.status === "active") expect(registry.resolve(item.type, item.key).id).toBe(item.id);
    }
    registry.assertComplete();
  });
  it("preserves previously published IDs and intermediate aliases across later releases", () => {
    const previous = input([{ ...record, key: "renamed", aliases: ["original", "renamed"] }]);
    const latest = input([{ ...record, key: "latest", aliases: ["original", "renamed", "latest"] }]);
    expect(validateItemIdentityEvolution(previous, latest).items[0].id).toBe(record.id);
    expect(() => validateItemIdentityEvolution(previous, input([{ ...record, key: "latest", aliases: ["original", "latest"] }]))).toThrow("previously published aliases");
    expect(() => validateItemIdentityEvolution(previous, input([]))).toThrow("retire it explicitly");
    const retired = input([{ ...record, status: "retired", retirementReason: "No longer provided" }]);
    expect(() => validateItemIdentityEvolution(retired, input([record]))).toThrow("cannot be assigned again");
  });
});

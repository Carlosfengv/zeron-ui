import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { consumerRegistryExpectations } from "../scripts/lib/consumer-registry-expectations.mjs";

const registry = fileURLToPath(new URL("../public/r/", import.meta.url));
describe("consumer assertions follow the Registry closure", () => {
  it.each(["control-size", "springs", "icon-context"])("does not require unrelated theme assets for %s", async (name) => {
    expect(await consumerRegistryExpectations(registry, name)).toEqual({ animation: false, tokens: [], mergeTokens: false });
  });
  it("checks surfaces theme without requiring the unrelated merge helper", async () => {
    expect(await consumerRegistryExpectations(registry, "surfaces")).toEqual({
      animation: true, tokens: ["border-width-hairline", "transition-duration-fast"], mergeTokens: false,
    });
  });
  it("checks a utility-only closure without requiring theme CSS", async () => {
    expect(await consumerRegistryExpectations(registry, "utils")).toEqual({ animation: false, tokens: [], mergeTokens: true });
  });
  it("retains the complete transitive checks for styled components", async () => {
    expect(await consumerRegistryExpectations(registry, "button")).toEqual({
      animation: true, tokens: ["border-width-hairline", "transition-duration-fast"], mergeTokens: true,
    });
  });
});

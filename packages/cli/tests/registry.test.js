import assert from "node:assert/strict";
import test from "node:test";
import {
  componentUrl,
  fetchCatalog,
  normalizeRegistryUrl,
  validateComponentName,
} from "../src/registry.js";

test("normalizes Registry URLs", () => {
  assert.equal(normalizeRegistryUrl("https://example.com/r/"), "https://example.com/r");
  assert.equal(normalizeRegistryUrl("http://localhost:3000/r"), "http://localhost:3000/r");
  assert.throws(() => normalizeRegistryUrl("http://example.com/r"), /must use HTTPS/);
});

test("validates and resolves component names", () => {
  assert.equal(validateComponentName("data-grid"), "data-grid");
  assert.equal(componentUrl("button", "https://example.com/r/"), "https://example.com/r/button.json");
  assert.throws(() => validateComponentName("../button"), /invalid component name/);
  assert.throws(() => validateComponentName("Button"), /invalid component name/);
});

test("fetches a Registry catalog", async () => {
  const catalog = await fetchCatalog("https://example.com/r", async (url) => ({
    ok: true,
    json: async () => ({ items: [{ name: "button" }], url }),
  }));

  assert.deepEqual(catalog.items, [{ name: "button" }]);
});

test("rejects malformed Registry catalogs", async () => {
  await assert.rejects(
    fetchCatalog("https://example.com/r", async () => ({
      ok: true,
      json: async () => ({}),
    })),
    /missing an items array/,
  );
});

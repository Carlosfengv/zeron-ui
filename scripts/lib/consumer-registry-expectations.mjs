import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { createHash } from "node:crypto";

/** Freeze postprocessed Registry bytes before a potentially long consumer run. */
export async function snapshotConsumerRegistry(registryDirectory) {
  const files = (await readdir(registryDirectory)).filter((file) => file.endsWith(".json"));
  return new Map(await Promise.all(files.map(async (file) => [
    file, await readFile(join(registryDirectory, file), "utf8"),
  ])));
}

/** Fingerprint only the exact recursive files that an item installs. */
export function consumerRegistryClosureHash(snapshot, component) {
  const seen = new Map();
  function visit(name) {
    if (seen.has(name)) return;
    const source = snapshot.get(`${name}.json`);
    if (!source) throw new Error(`Registry snapshot is missing ${name}`);
    seen.set(name, source);
    for (const dependency of JSON.parse(source).registryDependencies ?? []) {
      visit(dependency.startsWith("http") ? basename(new URL(dependency).pathname, ".json") : dependency);
    }
  }
  visit(component);
  return createHash("sha256").update([...seen].sort(([a], [b]) => a.localeCompare(b)).map(([name, source]) => `${name}\0${source}`).join("\0")).digest("hex");
}

/** Derive assertions from the actual recursive installation, including foundations. */
export async function consumerRegistryExpectations(registryDirectory, component) {
  const items = [];
  const seen = new Set();
  async function visit(name) {
    if (seen.has(name)) return;
    seen.add(name);
    const source = registryDirectory instanceof Map
      ? registryDirectory.get(`${name}.json`)
      : await readFile(join(registryDirectory, `${name}.json`), "utf8");
    if (!source) throw new Error(`Registry snapshot is missing ${name}`);
    const item = JSON.parse(source);
    items.push(item);
    for (const dependency of item.registryDependencies ?? []) {
      const name = dependency.startsWith("http")
        ? basename(new URL(dependency).pathname, ".json")
        : dependency;
      await visit(name);
    }
  }
  await visit(component);
  return {
    animation: items.some((item) => (item.dependencies ?? []).some((dependency) => /^tw-animate-css(?:@|$)/.test(dependency))),
    tokens: ["border-width-hairline", "transition-duration-fast"].filter((token) =>
      items.some((item) => Object.values(item.cssVars ?? {}).some((group) => Object.hasOwn(group, token)))),
    mergeTokens: items.some((item) => (item.files ?? []).some((file) => file.target === "lib/tailwind-merge-tokens.ts")),
  };
}

import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";

/** Derive assertions from the actual recursive installation, including foundations. */
export async function consumerRegistryExpectations(registryDirectory, component) {
  const items = [];
  const seen = new Set();
  async function visit(name) {
    if (seen.has(name)) return;
    seen.add(name);
    const item = JSON.parse(await readFile(join(registryDirectory, `${name}.json`), "utf8"));
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

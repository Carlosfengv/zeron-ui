import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { expect, it } from "vitest";

function dependencyClosure(root: string) {
  const items = new Map<string, string[]>();
  function visit(name: string) {
    if (items.has(name)) return;
    const path = new URL(`../public/r/${name}.json`, import.meta.url);
    const { dependencies = [], registryDependencies = [] } = JSON.parse(readFileSync(path, "utf8")) as {
      dependencies?: string[];
      registryDependencies?: string[];
    };
    items.set(name, dependencies);
    for (const dependency of registryDependencies) {
      visit(dependency.startsWith("http") ? basename(new URL(dependency).pathname, ".json") : dependency);
    }
  }
  visit(root);
  return items;
}

const recharts = /^recharts(?:@|$)/;

it.each([
  "ai-gateway-overview-01", "resource-cost-01", "personal-settings-01", "resource-status-all-01", "project-monitor-01", "chart-summary",
])("%s only installs the native chart entry", name => {
  const items = dependencyClosure(name);
  expect(items.has("chart-summary")).toBe(true);
  expect(items.has("chart")).toBe(false);
  for (const [item, dependencies] of items) {
    expect(dependencies.some(dependency => recharts.test(dependency)), item).toBe(false);
  }
});

it.each(["chart", "agent-queue-01"])("%s retains the installed Recharts compatibility entry", name => {
  const items = dependencyClosure(name);
  expect(items.get("chart")?.some(dependency => recharts.test(dependency))).toBe(true);
  expect(items.has("chart-summary")).toBe(true);
});

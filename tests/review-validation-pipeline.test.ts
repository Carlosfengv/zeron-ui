import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import unit from "../vitest.config.mjs";
import production from "../vitest.production.config.mjs";

describe("validation pipeline", () => {
  it("separates build-dependent production suites from unit tests", () => {
    expect(unit.test?.exclude).toContain("tests/*production*.test.ts");
    expect(production.test?.include).toEqual(["tests/*production*.test.ts"]);
    expect(production.test?.exclude).toEqual([]);
  });

  it("keeps production tests after the CI build and retains project typechecking", () => {
    const workflow = parse(readFileSync(".github/workflows/ci.yml", "utf8"));
    const commands = workflow.jobs.e2e.steps.map((step: { run?: string }) => step.run);
    expect(commands.indexOf("pnpm test:production")).toBeGreaterThan(commands.indexOf("pnpm test:e2e:build"));
    expect(commands).toContain("pnpm test:e2e:build");
    expect(workflow.jobs.quality.steps.some((step: { run?: string }) => step.run === "pnpm typecheck")).toBe(true);
  });
});

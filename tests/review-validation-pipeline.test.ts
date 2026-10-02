import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import unit from "../vitest.config.mjs";
import production from "../vitest.production.config.mjs";

describe("validation pipeline", () => {
  it("separates build-dependent production suites from unit tests", () => {
    expect(unit.test?.exclude).toContain("tests/*production*.test.ts");
    expect(production.test?.include).toEqual(["tests/*production*.test.ts"]);
    expect(production.test?.exclude).toEqual([]);
  });

  it("keeps production tests after the CI build and retains project typechecking", () => {
    const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
    expect(workflow.indexOf("run: pnpm test:production")).toBeGreaterThan(workflow.indexOf("run: pnpm build"));
    expect(workflow).toContain("run: pnpm typecheck");
  });
});

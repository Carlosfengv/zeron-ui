import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/blocks/src/application/agent-session-detail-01/agent-session-detail.tsx"),
  "utf8"
);

describe("Agent Session Detail 1 block contract", () => {
  it("allows the active agent group to be collapsed", () => {
    expect(source).toContain("const open = openAgentNames.includes(group.agent);");
    expect(source).not.toContain(
      "const open = containsActiveSession || openAgentNames.includes(group.agent);"
    );
  });
});

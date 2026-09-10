import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildInstallPlan } from "../packages/cli/src/install-plan.js";

const ROOT = resolve(import.meta.dirname, "..");
const CONSUMER = resolve(
  ROOT,
  "packages/cli/tests/fixtures/next-tailwind"
);
const REGISTRY = resolve(ROOT, "public/r");

describe("Resource Detail Page Registry installation", () => {
  it("resolves the complete consumer closure and rewrites source aliases", async () => {
    const plan = await buildInstallPlan({
      baseUrl: "https://registry.example.test/r",
      cwd: CONSUMER,
      names: ["resource-detail-page-01"],
      fetchImpl: async (input: string | URL | Request) => {
        const filename = basename(new URL(String(input)).pathname);

        try {
          const content = await readFile(resolve(REGISTRY, filename), "utf8");
          return {
            json: async () => JSON.parse(content),
            ok: true,
            status: 200,
          } as Response;
        } catch {
          return {
            json: async () => ({}),
            ok: false,
            status: 404,
          } as Response;
        }
      },
    });

    expect(plan.resolvedItems).toEqual(
      expect.arrayContaining([
        "resource-detail-page-01",
        "resource-detail-layout",
        "resource-workspace-shell-01",
        "sidebar",
        "tabs",
      ])
    );

    const targets = plan.files.map((file) => file.targetPath);
    expect(targets).toEqual(
      expect.arrayContaining([
        resolve(
          CONSUMER,
          "components/blocks/resource-detail-page-01/resource-detail-page.tsx"
        ),
        resolve(
          CONSUMER,
          "components/blocks/resource-detail-page-01/resource-detail-page-data.ts"
        ),
        resolve(
          CONSUMER,
          "components/blocks/resource-detail-page-01/feishu.svg"
        ),
        resolve(
          CONSUMER,
          "components/blocks/resource-workspace-shell-01/resource-workspace-shell.tsx"
        ),
        resolve(CONSUMER, "components/ui/resource-detail-layout.tsx"),
      ])
    );

    const detailFile = plan.files.find((file) =>
      file.targetPath.endsWith("resource-detail-page.tsx")
    );
    expect(detailFile?.expectedContent).toContain(
      'from "@/components/ui/resource-detail-layout"'
    );
    expect(detailFile?.expectedContent).toContain(
      'from "@/lib/icon-context"'
    );
    expect(detailFile?.expectedContent).toContain(
      'from "../resource-workspace-shell-01"'
    );
  });
});

// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ResourceListLayout } from "@zeron/ui/resource-list-layout";

afterEach(cleanup);

const ROOT = process.cwd();

describe("ResourceListLayout", () => {
  it("renders the default list page structure with a single title", () => {
    render(
      <ResourceListLayout
        title="Resources"
        description="Review connected resources."
        actions={<button type="button">Create resource</button>}
        toolbar={<label>Search <input /></label>}
        summary={<p>12 resources</p>}
        pagination={<button type="button">Next page</button>}
      >
        <section aria-label="Resource results">Results</section>
      </ResourceListLayout>
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Resources" })).toBeTruthy();

    const content = document.querySelector('[data-slot="page-content"]');
    const body = document.querySelector('[data-slot="page-body"]');
    const summary = document.querySelector('[data-slot="resource-list-summary"]');
    const pagination = document.querySelector('[data-slot="resource-list-pagination"]');

    expect(content).not.toBeNull();
    expect(body).not.toBeNull();
    expect(summary?.parentElement).toBe(body);
    expect(body?.contains(screen.getByRole("region", { name: "Resource results" }))).toBe(true);
    expect(pagination?.parentElement).toBe(content);
    expect(pagination?.className).toContain("shrink-0");
    expect(body?.className).toContain("overflow-y-auto");
    expect(body?.className).toContain("max-w-[1620px]");
  });

  it("omits every optional region without leaving empty containers", () => {
    render(
      <ResourceListLayout title="Resources">
        <p>Results</p>
      </ResourceListLayout>
    );

    const header = document.querySelector('[data-slot="page-header"]');
    const content = document.querySelector('[data-slot="page-content"]');

    expect(header?.querySelector('[data-slot="page-actions"]')).toBeNull();
    expect(content?.querySelector('[data-slot="page-content-header"]')).toBeNull();
    expect(content?.querySelector('[data-slot="resource-list-summary"]')).toBeNull();
    expect(content?.querySelector('[data-slot="resource-list-pagination"]')).toBeNull();
    expect(screen.queryByText("Review connected resources.")).toBeNull();
  });

  it("forwards root properties and its ref while preserving default size and gutter", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ResourceListLayout
        ref={ref}
        title="Resources"
        aria-label="Resource workspace"
        className="host-layout"
      >
        <p>Results</p>
      </ResourceListLayout>
    );

    const layout = screen.getByLabelText("Resource workspace");

    expect(ref.current).toBe(layout);
    expect(layout.className).toContain("host-layout");
    expect(layout.className).toContain("max-w-none");
    expect(layout.className).toContain("p-3");
    expect(within(layout).getByText("Results")).toBeTruthy();
  });

  it("allows callers to override the root width and gutter presets", () => {
    render(
      <ResourceListLayout title="Resources" size="lg" gutter="none">
        <p>Results</p>
      </ResourceListLayout>
    );

    const layout = document.querySelector('[data-slot="page-layout"]');
    expect(layout?.className).toContain("max-w-[75rem]");
    expect(layout?.className).toContain("p-0");
  });

  it("is publicly exported and installable with the normalized base dependencies", () => {
    const packageJson = JSON.parse(
      readFileSync(join(ROOT, "packages/ui/package.json"), "utf8")
    );
    const registry = JSON.parse(
      readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8")
    );

    expect(packageJson.exports["./resource-list-layout"]).toBe(
      "./src/components/resource-list-layout.tsx"
    );
    expect(
      registry.items.find(
        (entry: { name: string }) => entry.name === "resource-list-layout"
      )
    ).toMatchObject({
      type: "registry:ui",
      dependencies: ["tw-animate-css"],
      registryDependencies: ["surfaces", "page-layout"],
      files: [
        {
          path: "packages/ui/src/components/resource-list-layout.tsx",
          target: "components/ui/resource-list-layout.tsx",
        },
      ],
    });

    expect(
      registry.items.find(
        (entry: { name: string }) => entry.name === "icon-context"
      ).files
    ).toContainEqual(
      expect.objectContaining({
        path: "types/hugeicons.d.ts",
        target: "lib/hugeicons.d.ts",
      })
    );
  });
});

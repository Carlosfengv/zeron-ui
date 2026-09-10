// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResourceListPage } from "../packages/blocks/src/application/resource-list-page-01/resource-list-page";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }))
  );
});

const sharedResource = {
  description: "Shared identifier in separate workspaces",
  failurePolicy: "Continue",
  id: "resource-1",
  status: "enabled" as const,
  type: "Check",
  version: "1.0.0",
};

describe("ResourceListPage workspace isolation", () => {
  it("clears table selection when the controlled workspace changes", () => {
    const workspaces = [
      { id: "workspace-a", name: "Workspace A" },
      { id: "workspace-b", name: "Workspace B" },
    ];
    const { rerender } = render(
      <ResourceListPage
        renderBulkActions={() => <span>Bulk action</span>}
        resources={[{ ...sharedResource, name: "Alpha" }]}
        tableProps={{ showCreateAction: false, showRefreshAction: false }}
        workspaceId="workspace-a"
        workspaces={workspaces}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "选择Alpha" }));
    expect(screen.getByText("Bulk action")).toBeTruthy();

    rerender(
      <ResourceListPage
        renderBulkActions={() => <span>Bulk action</span>}
        resources={[{ ...sharedResource, name: "Beta" }]}
        tableProps={{ showCreateAction: false, showRefreshAction: false }}
        workspaceId="workspace-b"
        workspaces={workspaces}
      />
    );

    expect(screen.getByRole("checkbox", { name: "选择Beta" })).toBeTruthy();
    expect(screen.queryByText("Bulk action")).toBeNull();
  });
});

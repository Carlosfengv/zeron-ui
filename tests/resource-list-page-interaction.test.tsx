// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

describe("ResourceListPage MCP views", () => {
  it("shows MCP mock data and switches to category management", () => {
    const onSectionChange = vi.fn();
    render(<ResourceListPage onSectionChange={onSectionChange} />);
    const tabList = screen.getByRole("tablist");

    expect(
      screen.getByRole("tab", { name: "MCP 列表" }).getAttribute("aria-selected")
    ).toBe("true");
    expect(screen.getByText("飞书套件")).toBeTruthy();
    expect(screen.getByText("Web Access（浏览器自动化）")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "分类管理" }));

    expect(onSectionChange).toHaveBeenCalledWith("categories");
    expect(
      screen.getByRole("tab", { name: "分类管理" }).getAttribute("aria-selected")
    ).toBe("true");
    expect(screen.getByRole("tablist")).toBe(tabList);
    expect(screen.getByRole("region", { name: "MCP 分类列表" })).toBeTruthy();
    expect(screen.getByText("销售")).toBeTruthy();
    expect(screen.getByRole("row", { name: /办公协同 7/ })).toBeTruthy();
    expect(screen.getByRole("row", { name: /代码开发 6/ })).toBeTruthy();
    expect(screen.getByRole("row", { name: /创意设计 5/ })).toBeTruthy();
    expect(screen.getByRole("row", { name: /销售 5/ })).toBeTruthy();
    expect(screen.getByRole("region", { name: "办公协同分类详情" })).toBeTruthy();
    expect(screen.getByText("Slack")).toBeTruthy();
    expect(screen.getByText("Notion")).toBeTruthy();
    expect(screen.getByText("Zoom")).toBeTruthy();
    expect(screen.getAllByText("Confluence").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("代码开发"));

    expect(screen.getByRole("region", { name: "代码开发分类详情" })).toBeTruthy();
    expect(screen.getByText("Web Access（浏览器自动化）")).toBeTruthy();
    expect(screen.getAllByText("GitLab").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GitHub").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jira").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Linear").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Google Cloud").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("创意设计"));

    expect(screen.getByRole("region", { name: "创意设计分类详情" })).toBeTruthy();
    expect(screen.getAllByText("Figma").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Canva").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("销售"));

    expect(screen.getByRole("region", { name: "销售分类详情" })).toBeTruthy();
    expect(screen.getAllByText("Salesforce").length).toBeGreaterThan(0);
    expect(screen.getAllByText("HubSpot").length).toBeGreaterThan(0);
  });

  it("keeps controlled mode free of bundled demo records", () => {
    render(<ResourceListPage dataMode="controlled" />);

    expect(screen.queryByText("飞书套件")).toBeNull();
    expect(screen.getByText("暂无 MCP 应用")).toBeTruthy();
  });

  it("relates client-side MCP data through a stable category id", async () => {
    const onCategoryOpen = vi.fn();
    const category = {
      description: "Renamed category",
      id: "developer-tools",
      itemCount: 99,
      name: "研发工具（已重命名）",
      status: "enabled" as const,
    };
    const application = {
      category: "旧分类名称",
      categoryId: category.id,
      description: "Browser automation",
      id: "web-access",
      name: "Web Access",
      status: "enabled" as const,
    };

    render(
      <ResourceListPage
        categoryResources={[category]}
        dataMode="controlled"
        defaultSection="categories"
        onCategoryOpen={onCategoryOpen}
        resources={[application]}
      />
    );

    expect(
      screen.getByRole("row", { name: /研发工具（已重命名） 1/ })
    ).toBeTruthy();
    expect(screen.getByText("Web Access")).toBeTruthy();
    await waitFor(() =>
      expect(onCategoryOpen).toHaveBeenCalledWith(
        expect.objectContaining({ id: category.id, itemCount: 1 })
      )
    );
  });

  it("preserves remote category totals and reports remove failures", async () => {
    const category = {
      description: "Remote category",
      id: "collaboration",
      itemCount: 128,
      name: "办公协同",
      status: "enabled" as const,
    };
    const application = {
      category: category.name,
      categoryId: category.id,
      description: "Remote MCP",
      id: "slack",
      name: "Slack",
      status: "enabled" as const,
    };

    render(
      <ResourceListPage
        categoryApplications={{ [category.id]: [application] }}
        categoryDataMode="remote"
        categoryResources={[category]}
        dataMode="controlled"
        defaultSection="categories"
        onRemoveCategoryApplication={() =>
          Promise.reject(new Error("Request failed"))
        }
        resources={[]}
      />
    );

    expect(screen.getByRole("row", { name: /办公协同 128/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "移除" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "未能移除 Slack，请重试。"
      )
    );
    expect(screen.getByText("Slack")).toBeTruthy();
    expect(screen.getByRole("button", { name: "移除" })).toBeTruthy();
  });

  it("resets category selection when the workspace changes", () => {
    const categories = [
      {
        description: "First category",
        id: "first",
        name: "第一分类",
        status: "enabled" as const,
      },
      {
        description: "Second category",
        id: "second",
        name: "第二分类",
        status: "enabled" as const,
      },
    ];
    const resources = categories.map((category) => ({
      category: category.name,
      categoryId: category.id,
      description: `${category.name} MCP`,
      id: `${category.id}-mcp`,
      name: `${category.name}应用`,
      status: "enabled" as const,
    }));
    const workspaces = [
      { id: "workspace-a", name: "Workspace A" },
      { id: "workspace-b", name: "Workspace B" },
    ];
    const { rerender } = render(
      <ResourceListPage
        categoryResources={categories}
        dataMode="controlled"
        defaultSection="categories"
        resources={resources}
        workspaceId="workspace-a"
        workspaces={workspaces}
      />
    );

    fireEvent.click(screen.getByText("第二分类"));
    expect(screen.getByRole("region", { name: "第二分类分类详情" })).toBeTruthy();

    rerender(
      <ResourceListPage
        categoryResources={categories}
        dataMode="controlled"
        defaultSection="categories"
        resources={resources}
        workspaceId="workspace-b"
        workspaces={workspaces}
      />
    );

    expect(screen.getByRole("region", { name: "第一分类分类详情" })).toBeTruthy();
  });

  it("exposes remote detail errors, retry, and read-only permissions", () => {
    const onRetry = vi.fn();
    const category = {
      description: "Remote category",
      id: "sales",
      itemCount: 5,
      name: "销售",
      status: "enabled" as const,
    };

    render(
      <ResourceListPage
        canCreateCategory={false}
        canRemoveCategoryApplication={false}
        categoryDataMode="remote"
        categoryDetailsState={{
          categoryId: category.id,
          error: "分类应用加载失败",
        }}
        categoryResources={[category]}
        dataMode="controlled"
        defaultSection="categories"
        onRemoveCategoryApplication={vi.fn()}
        onRetryCategoryApplications={onRetry}
        resources={[]}
      />
    );

    expect(screen.getByRole("alert").textContent).toContain("分类应用加载失败");
    expect(screen.queryByRole("button", { name: "添加分类" })).toBeNull();
    expect(screen.queryByRole("button", { name: "移除" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "sales" }));
  });
});

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResourceListTable } from "../packages/blocks/src/application/resource-list-table-01/resource-list-table";

afterEach(cleanup);

describe("ResourceListTable integration states", () => {
  it("renders a real empty state instead of example resources by default", () => {
    render(
      <ResourceListTable
        showCreateAction={false}
        showRefreshAction={false}
      />
    );

    expect(screen.getByText("暂无资源")).toBeTruthy();
    expect(screen.queryByText("平台基础信息")).toBeNull();
  });

  it("forwards server-side search changes and resets the page index", () => {
    const onQueryStateChange = vi.fn();

    render(
      <ResourceListTable
        onQueryStateChange={onQueryStateChange}
        queryState={{
          pageIndex: 3,
          pageSize: 10,
          search: "",
          statuses: [],
        }}
        resources={[]}
        showCreateAction={false}
        showRefreshAction={false}
        totalRowCount={42}
      />
    );

    fireEvent.change(screen.getByRole("textbox", { name: "搜索" }), {
      target: { value: "database" },
    });

    expect(onQueryStateChange).toHaveBeenCalledWith({
      categoryIds: [],
      pageIndex: 0,
      pageSize: 10,
      search: "database",
      statuses: [],
    });
  });

  it("forwards category filters in server-side MCP mode", () => {
    const onQueryStateChange = vi.fn();

    render(
      <ResourceListTable
        onQueryStateChange={onQueryStateChange}
        preset="mcp"
        queryState={{
          categoryIds: [],
          pageIndex: 2,
          pageSize: 10,
          search: "",
          sorting: [],
          statuses: [],
        }}
        resources={[
          {
            category: "代码开发",
            categoryId: "developer-tools",
            description: "浏览器自动化",
            id: "web-access",
            name: "Web Access",
            status: "enabled",
          },
        ]}
        showCreateAction={false}
        showRefreshAction={false}
        totalRowCount={42}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "分类" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /代码开发/ }));

    expect(onQueryStateChange).toHaveBeenCalledWith({
      categoryIds: ["developer-tools"],
      pageIndex: 0,
      pageSize: 10,
      search: "",
      sorting: [],
      statuses: [],
    });
  });
});

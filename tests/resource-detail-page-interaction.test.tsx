// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResourceDetailPage } from "../packages/blocks/src/application/resource-detail-page-01/resource-detail-page";
import { defaultResourceDetailPageData } from "../packages/blocks/src/application/resource-detail-page-01/resource-detail-page-data";

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

describe("ResourceDetailPage", () => {
  it("uses the agent session workspace switch pattern and switches workspaces", () => {
    const onWorkspaceChange = vi.fn();

    render(
      <ResourceDetailPage
        data={defaultResourceDetailPageData}
        onWorkspaceChange={onWorkspaceChange}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Carlos’s workspace/ })
    );
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Design workspace" }));

    expect(onWorkspaceChange).toHaveBeenCalledWith("design");
    expect(
      screen.getByRole("button", { name: /Design workspace/ })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "收起管理后台导航" })
    ).toBeTruthy();
  });

  it("uses the component-owned trailing icons for category and security controls", () => {
    render(<ResourceDetailPage data={defaultResourceDetailPageData} />);

    const categoryTrigger = screen.getByRole("button", {
      name: "编辑 MCP 分类",
    });
    const categoryContent = categoryTrigger.querySelector(
      '[data-slot="button-content"]'
    );
    const categoryIcon = categoryTrigger.querySelector(
      '[data-slot="button-trailing-icon"]'
    );
    const securityTrigger = screen.getByRole("combobox", {
      name: "安全级别",
    });

    expect(categoryIcon?.parentElement).toBe(categoryContent);
    expect(
      securityTrigger.querySelector('[data-slot="select-trigger-icon"]')
        ?.parentElement
    ).toBe(securityTrigger);
  });

  it("orders record navigation like the Figma control row", () => {
    render(<ResourceDetailPage data={defaultResourceDetailPageData} />);

    const close = screen.getByRole("button", { name: "关闭详情" });
    const previous = screen.getByRole("button", { name: "上一个 MCP 服务" });
    const next = screen.getByRole("button", { name: "下一个 MCP 服务" });
    const count = screen.getByText("12 / 32 个 MCP 服务");

    expect(
      close.compareDocumentPosition(previous) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      previous.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      next.compareDocumentPosition(count) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("disables default actions until the caller connects their behavior", () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    const { rerender } = render(
      <ResourceDetailPage data={defaultResourceDetailPageData} />
    );

    expect(
      screen.getByRole("button", { name: "编辑 MCP" }).hasAttribute("disabled")
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "关闭详情" }).hasAttribute("disabled")
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "上一个 MCP 服务" })
        .hasAttribute("disabled")
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "下一个 MCP 服务" })
        .hasAttribute("disabled")
    ).toBe(true);

    rerender(
      <ResourceDetailPage
        data={defaultResourceDetailPageData}
        onClose={onClose}
        onEdit={onEdit}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑 MCP" }));
    fireEvent.click(screen.getByRole("button", { name: "关闭详情" }));
    fireEvent.click(screen.getByRole("button", { name: "上一个 MCP 服务" }));
    fireEvent.click(screen.getByRole("button", { name: "下一个 MCP 服务" }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("switches caller-owned detail sections", () => {
    const onSectionChange = vi.fn();

    render(
      <ResourceDetailPage
        data={defaultResourceDetailPageData}
        onSectionChange={onSectionChange}
        sectionContent={{ tools: <p>Tool inventory</p> }}
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: /工具/ }));

    expect(onSectionChange).toHaveBeenCalledWith("tools");
    expect(screen.getByText("Tool inventory")).toBeTruthy();
    expect(screen.getByText("12 / 32 个 MCP 服务")).toBeTruthy();
    expect(
      screen.queryByRole("complementary", { name: "MCP 服务属性" })
    ).toBeNull();

    const columns = document.querySelector('[data-slot="page-columns"]');
    expect(columns?.children).toHaveLength(1);
    expect(columns?.className).not.toContain("xl:grid-rows-[minmax(0,1fr)]");
  });

  it("keeps overview metadata and content in independently scrolling columns", () => {
    render(<ResourceDetailPage data={defaultResourceDetailPageData} />);

    const body = document.querySelector('[data-slot="page-body"]');
    const primary = document.querySelector('[data-slot="page-primary"]');
    const aside = screen.getByRole("complementary", {
      name: "MCP 服务属性",
    });

    expect(body?.className).toContain("xl:overflow-hidden");
    expect(primary?.className).toContain("xl:overflow-y-auto");
    expect(aside.className).toContain("xl:overflow-y-auto");
  });

  it("updates the published state and reports it to the caller", () => {
    const onPublishedChange = vi.fn();
    const onResourceChange = vi.fn();

    render(
      <ResourceDetailPage
        data={defaultResourceDetailPageData}
        onPublishedChange={onPublishedChange}
        onResourceChange={onResourceChange}
      />
    );

    fireEvent.click(screen.getByRole("switch", { name: "发布 MCP 服务" }));

    expect(onPublishedChange).toHaveBeenCalledWith(false);
    expect(onResourceChange).toHaveBeenCalledWith({
      type: "published",
      value: false,
    });
    expect(screen.getByText("未发布")).toBeTruthy();
  });

  it("adapts generic resource labels and page regions without editing the block", () => {
    render(
      <ResourceDetailPage
        data={defaultResourceDetailPageData}
        detailActions={<button type="button">模型操作</button>}
        labels={{
          aside: "模型属性",
          navigationLabel: "模型服务路径",
          nextAction: "下一个模型",
          previousAction: "上一个模型",
          recordUnit: "个模型",
          rootPath: "模型服务",
          tabs: "模型详情",
          sections: { overview: "模型信息" },
        }}
        overviewAside={({ data }) => <p>{data.name} 模型属性</p>}
        resourceIcon={<span>R</span>}
        sourceIcon={<span>S</span>}
      />
    );

    expect(screen.getByRole("navigation", { name: "模型服务路径" })).toBeTruthy();
    expect(screen.getByText("12 / 32 个模型")).toBeTruthy();
    expect(screen.getByRole("button", { name: "上一个模型" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "下一个模型" })).toBeTruthy();
    expect(screen.getByRole("tablist", { name: "模型详情" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "模型信息" })).toBeTruthy();
    expect(screen.getByText("飞书套件 模型属性")).toBeTruthy();
    expect(screen.getByRole("button", { name: "模型操作" })).toBeTruthy();
  });

  it("lets a custom overview rail update the block through its render context", () => {
    const onResourceChange = vi.fn();

    render(
      <ResourceDetailPage
        data={defaultResourceDetailPageData}
        labels={{
          basicProperties: "模型属性",
          securityLevel: "安全等级",
        }}
        onResourceChange={onResourceChange}
        overviewAside={({ onPublishedChange, published }) => (
          <button onClick={() => onPublishedChange(!published)} type="button">
            切换发布状态
          </button>
        )}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "切换发布状态" }));

    expect(onResourceChange).toHaveBeenCalledWith({
      type: "published",
      value: false,
    });
    expect(screen.getByText("未发布")).toBeTruthy();
  });

  it("allows default metadata labels to be adapted without replacing the rail", () => {
    render(
      <ResourceDetailPage
        data={defaultResourceDetailPageData}
        labels={{
          basicProperties: "模型属性",
          endpoint: "API 地址",
          securityLevel: "安全等级",
        }}
      />
    );

    expect(screen.getByText("模型属性")).toBeTruthy();
    expect(screen.getByText("API 地址")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "安全等级" })).toBeTruthy();
  });
});

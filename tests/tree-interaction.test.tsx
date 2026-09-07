// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Tree } from "../packages/ui/src/components/tree";
import type { TreeNode } from "../packages/ui/src/components/tree";

Object.defineProperty(window, "requestAnimationFrame", {
  writable: true,
  value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0),
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
});

const items: readonly TreeNode[] = [
  {
    key: "product", label: "Product", selectable: false,
    children: [{ key: "lin", label: "Lin" }, { key: "zhou", label: "Zhou" }],
  },
];

describe("Tree interaction", () => {
  it("uses the shared Button for the expansion affordance", () => {
    const onSelectionChange = vi.fn();
    const onNodeAction = vi.fn();
    render(
      <Tree
        aria-label="Expandable tree"
        items={[{ key: "branch", label: "Branch", children: [{ key: "leaf", label: "Leaf" }] }]}
        selectionMode="single"
        onSelectionChange={onSelectionChange}
        onNodeAction={onNodeAction}
      />,
    );

    const expand = screen.getByRole("button", { name: "Expand Branch" });
    expect(expand.getAttribute("data-slot")).toBe("button");
    expect(expand.getAttribute("tabindex")).toBe("-1");
    fireEvent.click(expand);

    const collapse = screen.getByRole("button", { name: "Collapse Branch" });
    expect(collapse.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("treeitem", { name: "Leaf" })).toBeTruthy();
    expect(onSelectionChange).not.toHaveBeenCalled();

    fireEvent.doubleClick(collapse);
    expect(onNodeAction).not.toHaveBeenCalled();
  });

  it("keeps an expanded parent separate from the selected member collection", () => {
    const onSelectionChange = vi.fn();
    render(
      <Tree
        aria-label="Members"
        items={items}
        selectionMode="multiple"
        selectionIndicator="checkbox"
        checkStrategy="cascade"
        selectionScope="leaf"
        defaultExpandedKeys={["product"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole("treeitem", { name: "Product" }));
    expect(onSelectionChange).toHaveBeenCalledWith(
      ["lin", "zhou"],
      expect.objectContaining({ triggerKey: "product", addedKeys: ["lin", "zhou"] }),
    );
    expect(screen.getByRole("treeitem", { name: "Lin" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("treeitem", { name: "Product" }).getAttribute("aria-checked")).toBe("true");
  });

  it("uses arrows for navigation and keeps selection unchanged", () => {
    render(
      <Tree
        aria-label="Project tree"
        items={items}
        selectionMode="single"
        defaultExpandedKeys={["product"]}
      />,
    );
    const product = screen.getByRole("treeitem", { name: "Product" });
    product.focus();
    fireEvent.keyDown(product, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("treeitem", { name: "Lin" }));
    expect(screen.getByRole("treeitem", { name: "Lin" }).getAttribute("aria-selected")).toBe("false");
  });

  it("preserves selection through a no-result query", () => {
    const { rerender } = render(
      <Tree
        aria-label="Project tree"
        items={items}
        selectionMode="single"
        defaultSelectedKeys={["lin"]}
        defaultExpandedKeys={["product"]}
      />,
    );
    rerender(
      <Tree
        aria-label="Project tree"
        items={items}
        selectionMode="single"
        defaultSelectedKeys={["lin"]}
        defaultExpandedKeys={["product"]}
        query="missing"
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("No matching items");
    rerender(
      <Tree
        aria-label="Project tree"
        items={items}
        selectionMode="single"
        defaultSelectedKeys={["lin"]}
        defaultExpandedKeys={["product"]}
      />,
    );
    expect(screen.getByRole("treeitem", { name: "Lin" }).getAttribute("aria-selected")).toBe("true");
  });

  it("restores focus to a collapsed ancestor and supports typeahead", () => {
    render(
      <Tree
        aria-label="Project tree"
        items={items}
        selectionMode="multiple"
        defaultExpandedKeys={["product"]}
      />,
    );
    const product = screen.getByRole("treeitem", { name: "Product" });
    const lin = screen.getByRole("treeitem", { name: "Lin" });
    lin.focus();
    fireEvent.keyDown(lin, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(product);
    fireEvent.keyDown(product, { key: "ArrowRight" });
    fireEvent.keyDown(product, { key: "z" });
    expect(document.activeElement).toBe(screen.getByRole("treeitem", { name: "Zhou" }));
  });

  it("keeps existing data visible while error or loading locks selection", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <Tree aria-label="Project tree" items={items} selectionMode="single" defaultExpandedKeys={["product"]} error="Refreshing failed" onSelectionChange={onSelectionChange} />,
    );
    expect(screen.getByRole("status").textContent).toContain("Refreshing failed");
    expect(screen.getByRole("treeitem", { name: "Lin" })).toBeTruthy();
    fireEvent.click(screen.getByRole("treeitem", { name: "Lin" }));
    expect(onSelectionChange).not.toHaveBeenCalled();
    rerender(<Tree aria-label="Project tree" items={items} selectionMode="single" defaultExpandedKeys={["product"]} loading onSelectionChange={onSelectionChange} />);
    fireEvent.click(screen.getByRole("treeitem", { name: "Lin" }));
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("treeitem", { name: "Product" }).querySelector("[data-tree-toggle]")!);
    expect(screen.queryByRole("treeitem", { name: "Lin" })).toBeNull();
  });

  it("treats a double click as one selection and one node action", () => {
    const onSelectionChange = vi.fn();
    const onNodeAction = vi.fn();
    render(<Tree aria-label="Project tree" items={items} selectionMode="single" defaultExpandedKeys={["product"]} onSelectionChange={onSelectionChange} onNodeAction={onNodeAction} />);
    const lin = screen.getByRole("treeitem", { name: "Lin" });
    fireEvent.click(lin, { detail: 1 });
    fireEvent.click(lin, { detail: 2 });
    fireEvent.doubleClick(lin, { detail: 2 });
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onNodeAction).toHaveBeenCalledTimes(1);
  });

  it("keeps interactive row actions separate from selection and node activation", () => {
    const onSelectionChange = vi.fn();
    const onNodeAction = vi.fn();
    const onAction = vi.fn();
    render(
      <Tree
        aria-label="Project tree"
        items={items}
        selectionMode="single"
        defaultExpandedKeys={["product"]}
        onSelectionChange={onSelectionChange}
        onNodeAction={onNodeAction}
        renderActions={({ node }) => (
          <button type="button" aria-label={`${node.label} options`} onClick={onAction}>
            More
          </button>
        )}
      />,
    );

    const action = screen.getByRole("button", { name: "Lin options" });
    fireEvent.click(action);
    fireEvent.doubleClick(action);
    action.focus();
    fireEvent.keyDown(action, { key: "Enter" });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onNodeAction).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(action);
  });

  it("keeps a named tree focus stop when a search has no result", () => {
    render(<Tree aria-label="Project tree" items={items} query="none" />);
    const tree = screen.getByRole("tree", { name: "Project tree" });
    expect(tree.getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("status").textContent).toContain("No matching items");
  });

  it("reports invalid JavaScript configuration instead of silently changing it", () => {
    render(
      <Tree
        aria-label="Project tree"
        items={items}
        selectionMode="single"
        selectedKeys={["lin", "zhou"]}
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("at most one selected key");
  });

  it("uses a valid generated description id when a node key contains spaces", () => {
    render(
      <Tree
        aria-label="Project tree"
        items={[{ key: "team east", label: "East team", disabled: true, disabledReason: "You do not have access" }]}
      />,
    );

    const item = screen.getByRole("treeitem", { name: "East team" });
    const descriptionId = item.getAttribute("aria-describedby");
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId!)?.textContent).toContain("You do not have access");
  });

  it("moves focus to a surviving ancestor when externally removed data contained it", () => {
    const { rerender } = render(<Tree aria-label="Project tree" items={items} defaultExpandedKeys={["product"]} />);
    const lin = screen.getByRole("treeitem", { name: "Lin" });
    lin.focus();
    rerender(<Tree aria-label="Project tree" items={[{ key: "product", label: "Product", selectable: false, children: [{ key: "zhou", label: "Zhou" }] }]} defaultExpandedKeys={["product"]} />);
    expect(document.activeElement).toBe(screen.getByRole("treeitem", { name: "Product" }));
  });

  it("does not select newly introduced descendants during a data refresh", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <Tree aria-label="Project tree" items={items} selectionMode="multiple" selectionIndicator="checkbox" checkStrategy="cascade" selectionScope="leaf" defaultExpandedKeys={["product"]} defaultSelectedKeys={["lin"]} onSelectionChange={onSelectionChange} />,
    );
    rerender(
      <Tree aria-label="Project tree" items={[{ key: "product", label: "Product", selectable: false, children: [{ key: "lin", label: "Lin" }, { key: "new", label: "New" }] }]} selectionMode="multiple" selectionIndicator="checkbox" checkStrategy="cascade" selectionScope="leaf" defaultExpandedKeys={["product"]} defaultSelectedKeys={["lin"]} onSelectionChange={onSelectionChange} />,
    );
    expect(screen.getByRole("treeitem", { name: "Product" }).getAttribute("aria-checked")).toBe("mixed");
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("mirrors branch direction keys in an RTL tree", () => {
    render(
      <div dir="rtl">
        <Tree aria-label="RTL project tree" items={items} />
      </div>,
    );
    const product = screen.getByRole("treeitem", { name: "Product" });
    product.focus();
    fireEvent.keyDown(product, { key: "ArrowLeft" });
    expect(screen.getByRole("treeitem", { name: "Lin" })).toBeTruthy();
    fireEvent.keyDown(product, { key: "ArrowRight" });
    expect(screen.queryByRole("treeitem", { name: "Lin" })).toBeNull();
  });
});

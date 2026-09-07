// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemberTree, type OrganizationNode } from "../packages/ui/src/components/member-tree";
import { FileTree, type FileNode } from "../packages/ui/src/components/file-tree";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Tree scenario adapters", () => {
  it("selects only member entities when a department toggles member cascade", () => {
    const onSelectionChange = vi.fn();
    const items: readonly OrganizationNode[] = [{
      key: "department:product", type: "department", departmentId: "product", label: "Product",
      children: [
        { key: "member:lin", type: "member", memberId: "lin", label: "Lin" },
        { key: "member:zhou", type: "member", memberId: "zhou", label: "Zhou" },
      ],
    }];
    render(
      <MemberTree
        aria-label="Members"
        items={items}
        defaultExpandedKeys={["department:product"]}
        selectionMode="multiple"
        selectionIndicator="checkbox"
        checkStrategy="cascade"
        selectableTypes={["member"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole("treeitem", { name: "Product" }));
    expect(onSelectionChange.mock.calls[0][0]).toEqual(["member:lin", "member:zhou"]);
    expect(onSelectionChange.mock.calls[0][0]).not.toContain("department:product");
  });

  it("keeps disallowed file types visible but unavailable for selection", () => {
    const onSelectionChange = vi.fn();
    const items: readonly FileNode[] = [{
      key: "folder:project", type: "folder", label: "Project",
      children: [
        { key: "file:brief", type: "file", label: "Brief.pdf", extension: "pdf" },
        { key: "file:budget", type: "file", label: "Budget.xlsx", extension: "xlsx" },
      ],
    }];
    render(
      <FileTree
        aria-label="Files"
        items={items}
        defaultExpandedKeys={["folder:project"]}
        selectableTypes={["file"]}
        allowedExtensions={["pdf"]}
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      />,
    );

    const budget = screen.getByRole("treeitem", { name: /Budget\.xlsx/ });
    expect(budget.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(budget);
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("treeitem", { name: "Brief.pdf" }));
    expect(onSelectionChange.mock.calls[0][0]).toEqual(["file:brief"]);
  });

  it("rejects ambiguous cascade modes and duplicate organization entities", () => {
    const mixed: readonly OrganizationNode[] = [{
      key: "department:product", type: "department", departmentId: "product", label: "Product",
      children: [{ key: "member:lin", type: "member", memberId: "lin", label: "Lin" }],
    }];
    expect(() => render(<MemberTree aria-label="Members" items={mixed} selectableTypes={["department", "member"]} selectionMode="multiple" selectionIndicator="checkbox" checkStrategy="cascade" />))
      .toThrow("cascade selection only supports");
    const duplicate: readonly OrganizationNode[] = [
      { key: "member:one", type: "member", memberId: "lin", label: "Lin" },
      { key: "member:two", type: "member", memberId: "lin", label: "Lin again" },
    ];
    expect(() => render(<MemberTree aria-label="Members" items={duplicate} />)).toThrow("memberId \"lin\" is duplicated");
  });

  it("normalizes extension matching and lets a folder remain selectable as an entity", () => {
    const onSelectionChange = vi.fn();
    const items: readonly FileNode[] = [{
      key: "folder:empty", type: "folder", label: "Empty folder",
    }, {
      key: "file:readme", type: "file", label: "README.PDF",
    }];
    render(<FileTree aria-label="Files" items={items} selectableTypes={["folder"]} allowedExtensions={[".pdf"]} onSelectionChange={onSelectionChange} />);
    fireEvent.click(screen.getByRole("treeitem", { name: "Empty folder" }));
    expect(onSelectionChange.mock.calls[0][0]).toEqual(["folder:empty"]);
    expect(screen.getByRole("treeitem", { name: "README.PDF" }).getAttribute("aria-disabled")).toBeNull();
  });

  it("makes an empty allowed extension list visibly unavailable", () => {
    const items: readonly FileNode[] = [{ key: "file:brief", type: "file", label: "Brief.pdf" }];
    render(<FileTree aria-label="Files" items={items} allowedExtensions={[]} />);
    expect(screen.getByRole("treeitem", { name: /Brief\.pdf/ }).getAttribute("aria-disabled")).toBe("true");
  });
});

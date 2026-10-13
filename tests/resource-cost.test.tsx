// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResourceCost } from "../packages/blocks/src/application/resource-cost-01/resource-cost";
import { calculateResourceCosts, filterResourceCosts, getResourceCostTotal, resourceCostExpansion } from "../packages/blocks/src/application/resource-cost-01/resource-cost-data";
import { resourceCostDemoItems } from "../packages/blocks/src/application/resource-cost-01/resource-cost-demo-data";
import type { ResourceCostItem } from "../packages/blocks/src/application/resource-cost-01/resource-cost-types";

// Browser checks cover ring geometry; these tests exercise the real table and controls.
vi.mock("@zeron/ui/chart", () => ({ DonutSummary: (props: { "aria-label"?: string }) => <span role="img" aria-label={props["aria-label"]} /> }));

afterEach(cleanup);

describe("resource cost calculations and tree filtering", () => {
  it("aggregates leaves exactly once and counts only leaf risks", () => {
    const rows = calculateResourceCosts(resourceCostDemoItems);
    expect(rows.reduce((sum, row) => sum + row.totalCost, 0)).toBe(164840);
    expect(rows[0]).toMatchObject({ totalCost: 114200, leafCount: 4, riskCount: 2, readyInDays: 7, availability: "limited" });
    expect(rows.reduce((sum, row) => sum + row.leafCount, 0)).toBe(12);
  });
  it("keeps matching paths and full costs while pruning unrelated children", () => {
    const rows = calculateResourceCosts(resourceCostDemoItems);
    const found = filterResourceCosts(rows, "GPU-111", "all");
    expect(found).toHaveLength(1);
    expect(found[0].children?.[0].children?.map((row) => row.id)).toEqual(["h100-sxm"]);
    expect(found[0].totalCost).toBe(114200);
    expect(filterResourceCosts(rows, "H100 GPU Pool", "all")[0].children?.[0].children).toHaveLength(2);
    expect(filterResourceCosts(rows, "", "provisioning")[0].children?.map((row) => row.id)).toEqual(["training-network"]);
    expect(filterResourceCosts(rows, "absent", "all")).toEqual([]);
    expect(rows[0].children?.[0].children).toHaveLength(2);
  });
  it("supports deep expansion and currency rounding without losing free resources", () => {
    const leaf: ResourceCostItem = { id: "leaf", name: "Free", code: "FREE", kind: "compute", quantity: 1, unitCost: 0 };
    const tree: ResourceCostItem[] = [{ ...leaf, id: "root", children: [{ ...leaf, id: "middle", children: [{ ...leaf, id: "inner", children: [leaf] }] }] }];
    const rows = calculateResourceCosts(tree);
    expect(resourceCostExpansion(rows, 2)).toEqual({ root: true, middle: true });
    expect(resourceCostExpansion(rows, "all")).toBe(true);
    expect(resourceCostExpansion(rows, 0)).toEqual({});
    expect(rows[0].totalCost).toBe(0);
    expect(filterResourceCosts(rows, "free", "all")[0].leafCount).toBe(1);
    expect(calculateResourceCosts([{ ...leaf, unitCost: 12.6 }], 0)[0].totalCost).toBe(13);
    expect(calculateResourceCosts([{ ...leaf, unitCost: 0.1234 }], 3)[0].totalCost).toBe(0.123);
  });
  it("rejects duplicate IDs and invalid values instead of presenting zero costs", () => {
    const leaf: ResourceCostItem = { id: "same", name: "GPU", code: "GPU", kind: "gpu", quantity: 1, unitCost: 10 };
    expect(() => calculateResourceCosts([leaf, leaf])).toThrow();
    expect(() => calculateResourceCosts([{ ...leaf, unitCost: undefined }])).toThrow();
    expect(() => calculateResourceCosts([{ ...leaf, unitCost: Infinity }])).toThrow();
    expect(() => calculateResourceCosts([{ ...leaf, quantity: -1 }])).toThrow();
  });
  it("rounds decimal ties with HALF_UP and aggregates in minor currency units", () => {
    const leaf: ResourceCostItem = { id: "a", name: "GPU", code: "GPU", kind: "gpu", quantity: 1, unitCost: 1.005 };
    expect(calculateResourceCosts([leaf])[0].totalCost).toBe(1.01);
    expect(calculateResourceCosts([{ ...leaf, quantity: 3, unitCost: 0.335 }])[0].totalCost).toBe(1.01);
    const rows = calculateResourceCosts([{ ...leaf, unitCost: 0.1 }, { ...leaf, id: "b", unitCost: 0.2 }]);
    expect(getResourceCostTotal(rows)).toBe(0.3);
    expect(calculateResourceCosts([{ ...leaf, unitCost: 1e-7, quantity: 1e7 }])[0].totalCost).toBe(1);
  });
  it("rejects unsupported metadata, precision and totals exceeding the forest's safe range", () => {
    const leaf: ResourceCostItem = { id: "a", name: "GPU", code: "GPU", kind: "gpu", quantity: 1, unitCost: 5e13 };
    expect(() => calculateResourceCosts([leaf, { ...leaf, id: "b" }])).toThrow("precision");
    expect(() => calculateResourceCosts([leaf], -1)).toThrow("precision");
    expect(() => calculateResourceCosts([leaf], 1.5)).toThrow("precision");
    expect(() => calculateResourceCosts([{ ...leaf, kind: "unknown" } as unknown as ResourceCostItem])).toThrow("type");
    expect(() => calculateResourceCosts([{ ...leaf, availability: "unknown" } as unknown as ResourceCostItem])).toThrow("availability");
  });
});

describe("resource cost interactions", () => {
  it("shows the unit-price precision used by the calculation", () => {
    render(<ResourceCost items={[{ id: "a", name: "GPU", code: "GPU", kind: "gpu", quantity: 3, unitCost: 0.335 }]} />);
    expect(screen.getByText("¥0.335")).toBeTruthy();
    expect(screen.getAllByText("¥1.01").length).toBeGreaterThan(0);
  });
  it("expands arbitrary depths without pagination and keeps totals during search", () => {
    const { container } = render(<ResourceCost items={resourceCostDemoItems} defaultExpanded={{ training: true, "h100-pool": true }} />);
    const footer = container.querySelector("footer")!;
    const total = footer.textContent;
    expect(screen.getByText("NVIDIA H100 · 80 GB")).toBeTruthy();
    expect(screen.queryByText("NVIDIA L40S · 48 GB")).toBeNull();
    expect(container.querySelector('[data-slot="data-table-pagination"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "收起" }));
    expect(screen.queryByText("NVIDIA H100 · 80 GB")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "展开 Inference Cluster" }));
    fireEvent.click(screen.getByRole("button", { name: "展开 L40S GPU Pool" }));
    expect(screen.getByText("NVIDIA L40S · 48 GB")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "全部" }));
    expect(screen.getByText("Snapshot Backup · 5 TB")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "GPU-111" } });
    expect(screen.getByText("LLM Training Cluster")).toBeTruthy();
    expect(screen.getByText("H100 GPU Pool")).toBeTruthy();
    expect(screen.queryByText("Training Host · 128 vCPU")).toBeNull();
    expect(footer.textContent).toContain(total);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "no-such-resource" } });
    expect(screen.getByText("没有匹配的资源")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByText("NVIDIA H100 · 80 GB")).toBeTruthy();
  });
  it("exports the complete tree even when matching one leaf", () => {
    const onExport = vi.fn(); render(<ResourceCost items={resourceCostDemoItems} onExport={onExport} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "GPU-111" } });
    fireEvent.click(screen.getByRole("button", { name: "导出" }));
    expect(onExport.mock.calls[0][0]).toHaveLength(5);
    expect(onExport.mock.calls[0][0][0].children[0].children).toHaveLength(2);
  });
  it("keeps a selected depth preset when refreshed data introduces different resource IDs", () => {
    const { rerender } = render(<ResourceCost items={resourceCostDemoItems} defaultExpanded={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(screen.getByText("H100 GPU Pool")).toBeTruthy();
    rerender(<ResourceCost items={resourceCostDemoItems.map((item) => ({ ...item, id: `refreshed-${item.id}` }))} defaultExpanded={{}} />);
    expect(screen.getByRole("button", { name: "1" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("H100 GPU Pool")).toBeTruthy();
    expect(screen.queryByText("NVIDIA H100 · 80 GB")).toBeNull();
  });
  it("renders configuration errors safely and prioritizes loading over invalid placeholder data", () => {
    const onExport = vi.fn();
    const { rerender } = render(<ResourceCost items={resourceCostDemoItems} currency="INVALID-CURRENCY" onExport={onExport} />);
    expect(screen.getByRole("alert").textContent).toContain("资源配置无效");
    expect(screen.getByRole("button", { name: "导出" }).hasAttribute("disabled")).toBe(true);
    rerender(<ResourceCost items={resourceCostDemoItems} locale="not a locale" />);
    expect(screen.getByRole("alert").textContent).toContain("资源配置无效");
    const invalid = [{ ...resourceCostDemoItems[0], quantity: -1 }];
    rerender(<ResourceCost items={invalid} state="loading" />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("正在加载资源");
    rerender(<ResourceCost items={invalid} />);
    expect(screen.getByRole("alert").textContent).toContain("资源配置无效");
  });
  it("hides omitted actions and announces empty, loading and error states", () => {
    const onRetry = vi.fn();
    const { rerender, container } = render(<ResourceCost items={[]} />);
    expect(screen.getByText("暂无资源")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "导出" })).toBeNull();
    rerender(<ResourceCost items={resourceCostDemoItems} state="loading" />);
    expect(screen.getByRole("status").textContent).toBe("正在加载资源…");
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText("NVIDIA H100 · 80 GB")).toBeNull();
    rerender(<ResourceCost items={resourceCostDemoItems} state="error" onRetry={onRetry} />);
    expect(within(screen.getByRole("alert")).getByText("资源加载失败")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

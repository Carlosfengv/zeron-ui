// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FleetHealth, createFleetHealthDemoData, fleetHealthDemoClusters, fleetHealthZhLabels } from "@zeron/blocks/fleet-health-01";
import { fleetMetricValue, fleetNodeAverage } from "../packages/blocks/src/application/fleet-health-01/fleet-health-data";

// Streaming renderer gets its layout/motion coverage in the browser, not jsdom.
vi.mock("@zeron/ui/live-line-chart", () => ({ LiveLineChart: () => <div data-slot="live-line-chart" />, LiveLine: () => null }));
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const fixture = () => createFleetHealthDemoData();
const defaults = { clusterId: "kestrel-iad-3", clusters: fleetHealthDemoClusters };

describe("FleetHealth", () => {
  it("retains unknowns, real zero, invalid memory capacity and offline averages", () => {
    const gpu = fixture().nodes[0].gpus[0];
    expect(fleetMetricValue({ ...gpu, utilization: 0 }, "utilization")).toBe(0);
    expect(fleetMetricValue({ ...gpu, utilization: null }, "utilization")).toBeNull();
    expect(fleetMetricValue({ ...gpu, utilization: 101 }, "utilization")).toBeNull();
    expect(fleetMetricValue({ ...gpu, memoryTotalGb: 0 }, "memory")).toBeNull();
    expect(fleetMetricValue({ ...gpu, memoryUsedGb: 90, memoryTotalGb: 80 }, "memory")).toBeNull();
    expect(fleetMetricValue({ ...gpu, memoryTotalGb: Infinity }, "memory")).toBeNull();
    expect(fleetMetricValue({ ...gpu, memoryUsedGb: Infinity, memoryTotalGb: Infinity }, "memory")).toBeNull();
    expect(fleetNodeAverage([{ ...gpu, utilization: 80 }, { ...gpu, status: "offline", utilization: 0 }], "utilization")).toBe(80);
    expect(fleetNodeAverage([{ ...gpu, utilization: 80 }, { ...gpu, utilization: null }], "utilization")).toBeNull();
    expect(fleetNodeAverage([], "temperature")).toBeNull();
  });

  it("renders all device identities and preserves the snapshot", () => {
    const data = fixture(); const before = JSON.stringify(data);
    const { getByRole, container } = render(<FleetHealth {...defaults} data={data} />);
    expect(getByRole("region", { name: "Fleet health" })).toBeTruthy();
    expect(getByRole("table", { name: "GPU telemetry" })).toBeTruthy();
    expect(container.querySelectorAll("[data-gpu]")).toHaveLength(64);
    expect(container.querySelectorAll('[data-gpu][tabindex="0"]')).toHaveLength(1);
    expect(getByRole("button", { name: /ks-a03 · GPU 8.*running hot/ })).toBeTruthy();
    expect(JSON.stringify(data)).toBe(before);
  });

  it("switches color metric without changing independent thermal warnings", async () => {
    const onMetricChange = vi.fn();
    const { getByRole, container } = render(<FleetHealth {...defaults} data={fixture()} onMetricChange={onMetricChange} />);
    const cell = container.querySelector<HTMLButtonElement>("[data-gpu]")!;
    const initial = cell.style.backgroundColor;
    fireEvent.click(getByRole("tab", { name: "Memory" }));
    await waitFor(() => expect(onMetricChange).toHaveBeenCalledWith("memory"));
    expect(container.querySelector<HTMLButtonElement>("[data-gpu]")!.style.backgroundColor).not.toBe(initial);
    expect(getByRole("button", { name: /ks-a03 · GPU 8.*running hot/ })).toBeTruthy();
    fireEvent.click(getByRole("tab", { name: "Temp" }));
    await waitFor(() => expect(onMetricChange).toHaveBeenCalledWith("temperature"));
    expect(getByRole("button", { name: /ks-a01 · GPU 1 · Temp:.*°C/ })).toBeTruthy();
  });

  it("focuses rows, clears focus and ignores removed controlled identities", () => {
    const onNodeSelect = vi.fn(); const data = fixture();
    const { getByRole, container, rerender } = render(<FleetHealth {...defaults} data={data} onNodeSelect={onNodeSelect} />);
    fireEvent.click(getByRole("button", { name: "Focus node ks-a01" }));
    expect(onNodeSelect).toHaveBeenLastCalledWith(data.nodes[0].id);
    expect(container.querySelectorAll("tr.opacity-35")).toHaveLength(7);
    fireEvent.click(getByRole("button", { name: "Clear node focus" }));
    expect(onNodeSelect).toHaveBeenLastCalledWith(null);
    rerender(<FleetHealth {...defaults} data={data} selectedNodeId="removed-node" />);
    expect(container.querySelectorAll("tr.opacity-35")).toHaveLength(0);
  });

  it("moves keyboard focus across rows with stable identity and a single tab stop", () => {
    const { container } = render(<FleetHealth {...defaults} data={fixture()} />);
    const cells = () => Array.from(container.querySelectorAll<HTMLButtonElement>("[data-gpu]"));
    fireEvent.focus(cells()[0]);
    fireEvent.keyDown(cells()[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(cells()[8]);
    fireEvent.keyDown(cells()[8], { key: "End", ctrlKey: true });
    expect(document.activeElement).toBe(cells()[63]);
    fireEvent.keyDown(cells()[63], { key: "Home", ctrlKey: true });
    expect(document.activeElement).toBe(cells()[0]);
    expect(container.querySelectorAll('[data-gpu][tabindex="0"]')).toHaveLength(1);
  });

  it("skips empty nodes during keyboard navigation and aligns uneven GPU rows", () => {
    const data = fixture(); const [first, second] = data.nodes;
    data.nodes = [
      { ...first, id: "empty-first", gpus: [] },
      { ...first, gpus: first.gpus.slice(0, 2) },
      { ...first, id: "empty-middle", gpus: [] },
      { ...second, gpus: second.gpus.slice(0, 1) },
      { ...first, id: "empty-last", gpus: [] },
    ];
    const { container } = render(<FleetHealth {...defaults} data={data} />);
    const cells = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-gpu]"));
    cells[1].focus();
    fireEvent.keyDown(cells[1], { key: "ArrowDown" });
    expect(document.activeElement).toBe(cells[2]);
    fireEvent.keyDown(cells[2], { key: "Home", ctrlKey: true });
    expect(document.activeElement).toBe(cells[0]);
    fireEvent.keyDown(cells[0], { key: "End", ctrlKey: true });
    expect(document.activeElement).toBe(cells[2]);
    fireEvent.keyDown(cells[2], { key: "ArrowUp" });
    expect(document.activeElement).toBe(cells[0]);
    for (const row of container.querySelectorAll("tr")) {
      const columns = Array.from(row.children).reduce((sum, cell) => sum + (cell as HTMLTableCellElement).colSpan, 0);
      expect(columns).toBe(4);
    }
  });

  it("does not claim healthy temperatures or count invalid observations as hot", () => {
    const data = fixture(); const node = data.nodes[0];
    data.nodes = [{ ...node, gpus: [
      { ...node.gpus[0], temperatureC: null },
      { ...node.gpus[1], temperatureC: Infinity },
    ] }];
    const { getByText, queryByRole } = render(<FleetHealth {...defaults} data={data} />);
    expect(getByText("1 nodes · Unknown")).toBeTruthy();
    expect(queryByRole("button", { name: /running hot/ })).toBeNull();
  });

  it("ends demo history at the current throughput value and timestamp", () => {
    for (const cluster of fleetHealthDemoClusters) {
      const data = createFleetHealthDemoData(7, 1000, cluster.id);
      expect(data.throughput.at(-1)).toEqual({ time: 1000, value: data.tokensPerSecond });
    }
  });

  it("keeps metric and node focus controlled until the host accepts changes", async () => {
    const data = fixture(); const onNodeSelect = vi.fn(); const onMetricChange = vi.fn();
    const { getByRole, container } = render(<FleetHealth {...defaults} data={data} metric="utilization" selectedNodeId={null} onNodeSelect={onNodeSelect} onMetricChange={onMetricChange} />);
    fireEvent.click(getByRole("button", { name: "Focus node ks-a01" }));
    expect(onNodeSelect).toHaveBeenCalledWith(data.nodes[0].id);
    expect(container.querySelectorAll("tr.opacity-35")).toHaveLength(0);
    fireEvent.click(getByRole("tab", { name: "Memory" }));
    await waitFor(() => expect(onMetricChange).toHaveBeenCalledWith("memory"));
    expect(getByRole("tab", { name: "Fleet util" }).getAttribute("aria-selected")).toBe("true");
  });

  it("does not invent unavailable actions and localizes the empty state", () => {
    const { getByRole, queryByRole } = render(<FleetHealth {...defaults} data={{ ...fixture(), nodes: [], tokensPerSecond: null, utilization: null, throughput: [] }} labels={fleetHealthZhLabels} locale="zh-CN" />);
    expect(getByRole("region", { name: "集群健康" })).toBeTruthy();
    expect(getByRole("status").textContent).toBe("此集群暂无 GPU 节点");
    expect(queryByRole("button", { name: "重新均衡" })).toBeNull();
    expect(queryByRole("button", { name: "集群设置" })).toBeNull();
    expect(getByRole("combobox").hasAttribute("disabled")).toBe(true);
  });

  it("routes host actions and prevents rebalance while pending", () => {
    const onRebalance = vi.fn(); const onSettings = vi.fn();
    const { getByRole, rerender } = render(<FleetHealth {...defaults} data={fixture()} onRebalance={onRebalance} onSettings={onSettings} />);
    fireEvent.click(getByRole("button", { name: "Rebalance" }));
    fireEvent.click(getByRole("button", { name: "Fleet settings" }));
    expect(onRebalance).toHaveBeenCalledOnce(); expect(onSettings).toHaveBeenCalledOnce();
    rerender(<FleetHealth {...defaults} data={fixture()} rebalancing onRebalance={onRebalance} />);
    fireEvent.click(getByRole("button", { name: /Rebalancing/ }));
    expect(onRebalance).toHaveBeenCalledOnce();
  });
});

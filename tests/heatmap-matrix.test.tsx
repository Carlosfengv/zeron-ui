// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeatmapMatrix, HeatmapCells, HeatmapChart, HeatmapTooltip, useHeatmap } from "@zeron/ui/heatmap-chart";

beforeEach(() => {
  vi.useFakeTimers();
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 600, height: 300 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    unobserve() {} disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function settle() { await act(async () => { vi.advanceTimersByTime(200); }); }
const start = Date.UTC(2026, 9, 1);
const data = [
  { bin: 0, bins: [{ bin: 0, date: new Date(start), count: 0 }, { bin: 1, date: new Date(start + 3_600_000), count: NaN }] },
  { bin: 1, bins: [{ bin: 0, date: new Date(start + 86_400_000), count: 4 }, { bin: 1, date: new Date(start + 90_000_000), count: 8 }] },
];

describe("HeatmapMatrix", () => {
  it("aligns supplied axes, incidents, locks and profile without changing observations", async () => {
    const view = render(<HeatmapMatrix ariaLabel="Resource activity" data={data}
      columns={[{ id: "thu", label: "Thu", groupLabel: "Oct 1", locked: 2 }, { id: "fri", label: "Fri" }]}
      rowLabels={["00:00", "01:00"]} lockedLabel="Locked" points={[{ column: 1, row: 0, label: "Reached limit" }, { column: 20, row: 0 }]}
      lockedCells={[{ column: 1, row: 1 }, { column: -1, row: 0 }]}
      profile={{ title: "Daily profile", content: <div>Host profile</div>, footer: <><span>0</span><span>8</span></> }} />);
    await settle();
    expect(view.getByRole("region", { name: "Resource activity" })).toBeTruthy();
    expect(view.getByText("Oct 1")).toBeTruthy();
    expect(view.getByText("01:00")).toBeTruthy();
    expect(view.getByText("Host profile")).toBeTruthy();
    expect(view.container.querySelectorAll('[data-slot="heatmap-matrix-point"]')).toHaveLength(1);
    expect(view.container.querySelectorAll('[data-slot="heatmap-matrix-lock"]')).toHaveLength(1);
    expect(view.container.querySelectorAll('[data-slot="heatmap-matrix-column-lock"]')).toHaveLength(2);
    // Missing bins stay absent; zero is a real inspectable cell.
    expect(view.container.querySelectorAll('[data-slot="heatmap-cell"]')).toHaveLength(6);
    expect(view.container.querySelector('[data-slot="chart-source-data"]')?.textContent).toContain("count: NaN");
  });

  it("keeps keyboard inspection, host tooltip headers and original-bin selection", async () => {
    const select = vi.fn();
    const view = render(<HeatmapMatrix ariaLabel="Activity" data={data} onCellSelect={select}
      formatHeader={() => "Host reporting day"} formatLabel={(value) => `${value} resources active`} />);
    await settle();
    const group = view.getByRole("group");
    fireEvent.keyDown(group, { key: "Home" });
    await settle();
    expect(view.getByText("Host reporting day")).toBeTruthy();
    expect(view.getByText("0 resources active")).toBeTruthy();
    fireEvent.keyDown(group, { key: "Enter" });
    expect(select).toHaveBeenLastCalledWith(data[0].bins[0]);
    fireEvent.keyDown(group, { key: "End" });
    fireEvent.keyDown(group, { key: " " });
    expect(select).toHaveBeenLastCalledWith(data[1].bins[1]);
  });

  it("reports mismatched labels, ragged columns, invalid scales and duplicate IDs", async () => {
    const view = render(<HeatmapMatrix ariaLabel="Activity" data={data} rowLabels={["One"]} invalidContent="Check matrix" />);
    expect(view.getByRole("alert").textContent).toBe("Check matrix");
    view.rerender(<HeatmapMatrix ariaLabel="Activity" data={[data[0], { ...data[1], bins: [] }]} />);
    expect(view.getByRole("alert")).toBeTruthy();
    view.rerender(<HeatmapMatrix ariaLabel="Activity" data={data} max={0} />);
    expect(view.getByRole("alert")).toBeTruthy();
    view.rerender(<HeatmapMatrix ariaLabel="Activity" data={data} columns={[{ id: "a", label: "A" }, { id: "a", label: "B" }]} />);
    expect(view.getByRole("alert")).toBeTruthy();
    view.rerender(<HeatmapMatrix ariaLabel="Activity" data={[]} emptyContent="No observations" />);
    expect(view.getByRole("status").textContent).toBe("No observations");
    await settle();
  });
});

const HOUR = 3_600_000, DAY = 24 * HOUR;

function Geometry() { const { binWidth, binHeight } = useHeatmap(); return <text data-testid="geometry">{`${binWidth},${binHeight}`}</text>; }
const cells = [{ bin: 0, bins: [{ bin: 0, date: new Date(start), count: 2 }, { bin: 1, date: new Date(start + HOUR), count: 4 }] }, { bin: 1, bins: [{ bin: 0, date: new Date(start + DAY), count: 0 }, { bin: 1, date: new Date(start + DAY + HOUR), count: 3 }] }];
describe("rectangular heatmap public API", () => {
  it("fills width and height independently only when requested, retaining fixed-size precedence", async () => {
    const props = { data: cells, layout: "fill" as const, margin: { top: 0, right: 0, bottom: 0, left: 0 }, animate: false };
    const view = render(<HeatmapChart {...props}><HeatmapCells /><Geometry /></HeatmapChart>);
    await settle();
    expect(view.getByTestId("geometry").textContent).toBe("150,150");
    view.rerender(<HeatmapChart {...props} stretchCells><HeatmapCells /><Geometry /></HeatmapChart>);
    await settle();
    expect(view.getByTestId("geometry").textContent).toBe("300,150");
    view.rerender(<HeatmapChart {...props} stretchCells binSize={20}><HeatmapCells /><Geometry /></HeatmapChart>);
    await settle();
    expect(view.getByTestId("geometry").textContent).toBe("20,20");
  });
  it("renders custom scale fills and categorical tooltip headers with keyboard inspection", async () => {
    const view = render(<HeatmapChart data={cells} animate={false} colorScale={() => "var(--fg-subtle)"}><HeatmapCells /><HeatmapTooltip instant formatHeader={() => "Account A"} formatLabel={(value) => `${value} active`} /></HeatmapChart>);
    await settle();
    expect(view.container.querySelector('rect[data-slot="heatmap-cell"][fill="var(--fg-subtle)"]')).toBeTruthy();
    fireEvent.keyDown(view.getByRole("group"), { key: "Home" });
    await settle();
    expect(view.getByText("Account A")).toBeTruthy();
    expect(view.getByText("2 active")).toBeTruthy();
  });
});

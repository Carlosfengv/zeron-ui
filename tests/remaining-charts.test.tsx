// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LineChart, Line, LineSeriesTerminalMarker } from "@zeron/ui/line-chart";
import { BarChart, Bar, BarDepthBack, BarDepthFront } from "@zeron/ui/bar-chart";
import { PieChart, PieSlice, PieCenter } from "@zeron/ui/pie-chart";
import { HeatmapChart, HeatmapCells, HeatmapTooltip, type HeatmapColumn } from "@zeron/ui/heatmap-chart";
import { LiveLineChart, LiveLine } from "@zeron/ui/live-line-chart";
import { useChart, useChartStable, ChartTooltip } from "@zeron/ui/chart-core";
import { ChartStatFlow } from "../packages/ui/src/components/charts/chart-stat-flow";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { usePieStable } from "../packages/ui/src/components/charts/pie-context";

vi.mock("motion/react", async original => ({...await original<typeof import("motion/react")>(),useReducedMotion:()=>true}));
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-08T00:00:00Z"));
  window.matchMedia = () => ({matches:true,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{target, contentRect:{width:600,height:300}} as unknown as ResizeObserverEntry],this as unknown as ResizeObserver); }
    unobserve(){} disconnect(){}
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function Probe() { const context = useChartStable(); return <text data-testid="probe">{JSON.stringify({domain:context.yScale.domain(),series:context.lines.map(line=>line.dataKey),data:context.data})}</text>; }
function PieProbe() { const {totalValue,arcs}=usePieStable(); return <text data-testid="pie-probe">{JSON.stringify({totalValue,values:arcs.map(arc=>arc.value)})}</text>; }
function TooltipProbe() { const {tooltipData}=useChart(); return <text data-testid="tooltip-probe">{JSON.stringify(tooltipData)}</text>; }
async function settle(ms=120) { await act(async () => {vi.advanceTimersByTime(ms);}); }
const dates=[{date:"2026-10-01",value:10},{date:"2026-10-02",value:20},{date:"2026-10-03",value:null},{date:"2026-10-04",value:30},{date:"2026-10-05",value:40}];
const heatmap: HeatmapColumn[] = [{bin:0,bins:[{bin:0,date:new Date("2026-10-04"),count:1},{bin:1,date:new Date("2026-10-05"),count:2}]}];

describe("remaining reference charts", () => {
  it.each([false, true])("keeps fragment-wrapped pie content in its correct layer when scrubbing is %s", async geometryScrubbing => {
    const consoleError = vi.spyOn(console, "error");
    const data = [{ label: "First", value: 60 }, { label: "Second", value: 40 }];
    const view = render(<PieChart data={data} size={180} innerRadius={58} geometryScrubbing={geometryScrubbing}><><PieSlice index={0} /><><PieSlice index={1} /><PieCenter>{() => <span data-testid="fragment-center">Total</span>}</PieCenter></></></PieChart>);
    await settle();
    expect(view.getByTestId("fragment-center").closest("svg")).toBeNull();
    expect(view.container.querySelectorAll('path[fill]:not([fill="transparent"])')).toHaveLength(2);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
  it("renders a custom donut center before inspection and restores it after Escape", async () => {
    const data = [
      { label: "Allocated", value: 92, color: "var(--chart-1)" },
      { label: "Unassigned", value: 8, color: "var(--muted)" },
    ];
    const center = vi.fn(({ value, label, isHovered, data: item }) => (
      <span data-testid="allocation-center">{isHovered ? value : 92}: {label}: {item.value}</span>
    ));
    const view = render(<PieChart data={data} innerRadius={88}><PieSlice index={0} /><PieSlice index={1} /><PieCenter defaultLabel="Allocated / 100">{center}</PieCenter><PieProbe /></PieChart>);
    await settle();
    expect(view.getByTestId("allocation-center").textContent).toBe("92: Allocated / 100: 100");
    expect(JSON.parse(view.getByTestId("pie-probe").textContent!).values).toEqual([92, 8]);
    expect(center).toHaveBeenLastCalledWith({ value: 100, label: "Allocated / 100", isHovered: false, data: { label: "Allocated / 100", value: 100 } });
    fireEvent.keyDown(view.getByRole("group"), { key: "End" });
    expect(view.getByTestId("allocation-center").textContent).toBe("8: Unassigned: 8");
    fireEvent.keyDown(view.getByRole("group"), { key: "Escape" });
    expect(view.getByTestId("allocation-center").textContent).toBe("92: Allocated / 100: 100");
  });
  it("hydrates the pie number with identical initial server and client content", async () => {
    const container=document.createElement("div");
    document.body.append(container);
    const content=<ChartStatFlow value={1234} label="Total" />;
    container.innerHTML=renderToString(content);
    const recovered=vi.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async()=>{root=hydrateRoot(container,content,{onRecoverableError:recovered});});
    expect(recovered).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Total");
    await act(async()=>root!.unmount());
    container.remove();
  });
  it("positions grouped tooltip dots at the actual centers for custom gaps", async () => {
    const view=render(<BarChart data={[{name:"one",a:10,b:20}]}><Bar dataKey="a" groupGap={12}/><Bar dataKey="b" groupGap={12}/><TooltipProbe/></BarChart>);
    await settle();
    await settle();
    expect(view.getByRole("group").tabIndex).toBe(0);
    fireEvent.keyDown(view.getByRole("group"),{key:"Home"});await settle();
    const tooltip=JSON.parse(view.getByTestId("tooltip-probe").textContent!);
    const bars=[...view.container.querySelectorAll('rect[fill="var(--chart-1)"]')];
    expect(bars).toHaveLength(2);
    for(const [i,key] of ["a","b"].entries())expect(tooltip.xPositions[key]).toBeCloseTo(Number(bars[i].getAttribute("x"))+Number(bars[i].getAttribute("width"))/2);
  });
  it("keeps terminal markers out of the series and Y-domain registry", async () => {
    const view=render(<LineChart data={dates}><Line dataKey="value" /><LineSeriesTerminalMarker dataKey="value" /><Probe /></LineChart>);
    await settle();
    expect(JSON.parse(view.getByTestId("probe").textContent!).series).toEqual(["value"]);
  });
  it("renders line gaps and supports keyboard inspection after loading", async () => {
    const view=render(<LineChart data={dates}><Line dataKey="value" /><ChartTooltip /><Probe /></LineChart>);
    await settle();
    expect([...view.container.querySelectorAll("path")].some(path => (path.getAttribute("d")?.match(/M/g)??[]).length===2)).toBe(true);
    const root=view.container.querySelector('[tabindex="0"]')!;
    fireEvent.keyDown(root,{key:"End"}); await settle();
    expect(view.container.querySelector('[role="status"]')?.textContent).toContain("40");
    fireEvent.keyDown(root,{key:"Escape"}); await settle();
    expect(view.container.querySelector('[role="status"]')?.textContent).toBe("");
  });
  it("excludes invalid bar values and depth layers from domains and series registration", async () => {
    const data=[{name:"valid",value:10},{name:"negative",value:-5},{name:"infinite",value:Infinity},{name:"nan",value:NaN}];
    const view=render(<BarChart data={data}><BarDepthBack dataKey="value" /><Bar dataKey="value" /><BarDepthFront dataKey="value" /><Probe /></BarChart>);
    await settle();
    const probe=JSON.parse(view.getByTestId("probe").textContent!);
    expect(probe.series).toEqual(["value"]);
    expect(probe.domain.every(Number.isFinite)).toBe(true);
    expect(view.container.querySelector('[data-slot="chart-source-data"]')?.textContent).toContain("Infinity");
    expect([...view.container.querySelectorAll("rect")].some(rect => /NaN|Infinity|-/.test(rect.getAttribute("height")??""))).toBe(false);
  });
  it("reports loading and ready without allowing loading interactions", async () => {
    const phase=vi.fn();
    const view=render(<BarChart data={[]} status="loading" onPhaseChange={phase} />);
    await settle();
    expect(phase).toHaveBeenLastCalledWith("loading");
    expect(view.container.querySelector('[tabindex="0"]')).toBeNull();
    view.rerender(<BarChart data={[{name:"ready",value:10}]} onPhaseChange={phase}><Bar dataKey="value" /></BarChart>);
    await settle();
    expect(phase).toHaveBeenLastCalledWith("ready");
    expect(view.container.querySelector('[tabindex="0"]')).not.toBeNull();
  });
  it("preserves pie indices and computes a finite total with invalid input", async () => {
    const data=[{label:"valid",value:10},{label:"negative",value:-5},{label:"infinite",value:Infinity},{label:"nan",value:NaN}];
    const changed=vi.fn();
    const view=render(<PieChart data={data} innerRadius={40} onHoverChange={changed}><PieSlice index={0} /><PieSlice index={1} /><PieCenter /><PieProbe /></PieChart>);
    await settle();
    expect(JSON.parse(view.getByTestId("pie-probe").textContent!)).toEqual({totalValue:10,values:[10,0,0,0]});
    fireEvent.keyDown(view.getByRole("group"),{key:"Home"});
    expect(changed).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(view.getByRole("group"),{key:"Escape"});
    expect(changed).toHaveBeenLastCalledWith(null);
    expect([...view.container.querySelectorAll("path")].map(path=>path.getAttribute("d")).join(" ")).not.toMatch(/NaN|Infinity/);
  });
  it("isolates textures across heatmap instances and inspects rotated dates", async () => {
    const colors = ["var(--muted)","var(--chart-1)","var(--chart-2)","var(--chart-3)","var(--chart-4)"] as const;
    const styles=colors.map(color=>({color,fillMode:"pattern" as const,pattern:"diagonal" as const})) as unknown as import("@zeron/ui/heatmap-chart").HeatmapLevelStyles;
    const view=render(<><HeatmapChart data={heatmap} levelStyles={styles} weekStartDay={1}><HeatmapCells /><HeatmapTooltip instant /></HeatmapChart><HeatmapChart data={heatmap} levelStyles={styles}><HeatmapCells /></HeatmapChart></>);
    await settle();
    const ids=[...view.container.querySelectorAll("[id]")].map(node=>node.id);
    expect(new Set(ids).size).toBe(ids.length);
    const root=view.getAllByRole("group")[0];
    fireEvent.keyDown(root,{key:"Home"}); await settle();
    expect(view.container.querySelector('[role="status"]')?.textContent).toContain("2026-10-05");
  });
  it("respects heatmap cell interaction settings for keyboard inspection", async () => {
    const view=render(<HeatmapChart data={heatmap}><HeatmapCells interactive={false}/></HeatmapChart>);
    await settle();
    expect(view.getByRole("group").tabIndex).toBe(-1);
    fireEvent.keyDown(view.getByRole("group"),{key:"Home"});
    expect(view.getByRole("status").textContent).toBe("");
  });
  it("clears heatmap inspection and disables its keyboard entry while loading", async () => {
    const view=render(<HeatmapChart data={heatmap}><HeatmapCells/></HeatmapChart>);
    await settle();await settle();
    fireEvent.keyDown(view.getByRole("group"),{key:"Home"});
    expect(view.getByRole("status").textContent).not.toBe("");
    view.rerender(<HeatmapChart data={heatmap} status="loading"><HeatmapCells/></HeatmapChart>);
    await settle();
    expect(view.getByRole("group").tabIndex).toBe(-1);
    expect(view.getByRole("status").textContent).toBe("");
  });
  it("clears stale heatmap inspection after the displayed data changes", async () => {
    const selected = vi.fn();
    const view = render(<HeatmapChart data={heatmap} onCellSelect={selected} animate={false}><HeatmapCells /></HeatmapChart>);
    await settle();
    fireEvent.keyDown(view.getByRole("group"), { key: "Home" });
    expect(view.getByRole("status").textContent).toContain("2026-10-04");
    const updated = [{ bin: 0, bins: [{ bin: 0, date: new Date("2026-11-01"), count: 9 }] }];
    view.rerender(<HeatmapChart data={updated} onCellSelect={selected} animate={false}><HeatmapCells /></HeatmapChart>);
    await settle();
    expect(view.getByRole("status").textContent).toBe("");
    fireEvent.keyDown(view.getByRole("group"), { key: "Enter" });
    expect(selected).not.toHaveBeenCalled();
    fireEvent.keyDown(view.getByRole("group"), { key: "Home" });
    expect(view.getByRole("status").textContent).toContain("2026-11-01");
    fireEvent.keyDown(view.getByRole("group"), { key: "Enter" });
    expect(selected).toHaveBeenLastCalledWith(updated[0].bins[0]);
  });
  it("protects live domains from illegal parameters and cancels its loop on unmount", async () => {
    const cancel=vi.spyOn(globalThis,"cancelAnimationFrame");
    const view=render(<LiveLineChart data={[{time:NaN,value:Infinity}]} value={400} window={0} numXTicks={1} lerpSpeed={Infinity}><LiveLine dataKey="value" /><Probe /></LiveLineChart>);
    await settle(64);
    await settle(64);
    const domain=JSON.parse(view.getByTestId("probe").textContent!).domain;
    expect(domain.every(Number.isFinite)).toBe(true);
    expect(domain[1]).toBeGreaterThanOrEqual(400);
    const before=cancel.mock.calls.length;
    view.unmount();
    expect(cancel.mock.calls.length).toBeGreaterThan(before);
  });
  it("announces live keyboard selections without repeating every animation frame", async () => {
    const view=render(<LiveLineChart data={[]} value={100} paused><LiveLine dataKey="value" /></LiveLineChart>);
    await settle(64);await settle(64);
    fireEvent.keyDown(view.getByRole("group"),{key:"Home"});await settle(64);
    const announcement=view.getByRole("status").textContent;
    expect(announcement).toContain("100");
    view.rerender(<LiveLineChart data={[]} value={150} paused><LiveLine dataKey="value" /></LiveLineChart>);
    await settle(128);
    expect(view.getByRole("status").textContent).toBe(announcement);
    fireEvent.keyDown(view.getByRole("group"),{key:"Escape"});
    expect(view.getByRole("status").textContent).toBe("");
  });
});

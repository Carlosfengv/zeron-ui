// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartLegend, SegmentedBar, chartSeriesColor, chartStatusColors, createChartNumberFormatter, createChartTimeFormatter, visualizationLayout } from "@zeron/ui/chart-primitives";
import { ChartContainer, TimeSeriesChart } from "@zeron/ui/chart";
import { ResourceStatusAll } from "@zeron/blocks/resource-status-all-01";
import { ResourceMetricList, defaultResourceMetrics } from "@zeron/blocks/resource-metric-list-01";
import { ProviderCostDonut } from "../packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-charts";
import { ServiceDistribution } from "../packages/blocks/src/application/project-monitor-01/project-monitor-charts";
import { projectMonitorDemoData } from "../packages/blocks/src/application/project-monitor-01/project-monitor-demo-data";
import { projectMonitorLabels, summarizeWindow } from "../packages/blocks/src/application/project-monitor-01/project-monitor-data";
import { SecurityScore } from "../packages/blocks/src/application/security-overview-01/security-overview-charts";
import { securityOverviewLabels } from "../packages/blocks/src/application/security-overview-01/security-overview-data";
import { securityOverviewDemoData } from "../packages/blocks/src/application/security-overview-01/security-overview-demo-data";
import { readFileSync } from "node:fs";

afterEach(cleanup);

describe("共享调色与格式契约", () => {
  it("保留数字及中文系列键和显式图表 ID 的配色兼容", () => {
    const { container } = render(<ChartContainer id="请求图" config={{ "1": { color: "var(--brand)" }, 请求: { color: "var(--fg-info)" } }}><div /></ChartContainer>);
    expect(container.querySelector('[data-chart="chart-请求图"]')).toBeTruthy();
    expect(container.querySelector("style")!.textContent).toContain("--color-1: var(--brand)");
    expect(container.querySelector("style")!.textContent).toContain("--color-请求: var(--fg-info)");
  });
  it("重排、筛选后恢复和刷新仍按相同 ID 分配颜色", () => {
    const ids = ["gateway", "functions", "provider/a", "服务二"];
    const colors = Object.fromEntries(ids.map((id) => [id, chartSeriesColor(id)]));
    for (const set of [[...ids].reverse(), ids.slice(1), ids]) for (const id of set) expect(chartSeriesColor(id)).toBe(colors[id]);
    expect(chartStatusColors.success).toBe("var(--fg-success)");
    expect(Object.values(colors)).not.toContain(chartStatusColors.success);
  });

  it("比例、金额、Token 和毫秒没有隐式单位转换，未知保持未知", () => {
    expect(createChartNumberFormatter("en", { style: "percent" })(0.15)).toBe("15%");
    expect(createChartNumberFormatter("en", { style: "currency", currency: "USD" })(1.23)).toBe("$1.23");
    expect(createChartNumberFormatter("en")(12000)).toBe("12,000");
    expect(createChartNumberFormatter("en", { maximumFractionDigits: 1 })(12.5)).toBe("12.5");
    for (const value of [null, undefined, NaN, Infinity, "12"]) expect(createChartNumberFormatter("en")(value)).toBe("—");
    expect(createChartNumberFormatter("en")(-5)).toBe("-5");
  });

  it("时区真实影响时间，不把非法日期显示成有效值", () => {
    const at = Date.UTC(2026, 9, 5, 1);
    const utc = createChartTimeFormatter("en-GB", "UTC");
    const shanghai = createChartTimeFormatter("en-GB", "Asia/Shanghai");
    expect(utc(at)).toBe("01:00");
    expect(shanghai(at)).toBe("09:00");
    expect(utc("invalid")).toBe("—");
  });
});

describe("容量和分布的共同绘制", () => {
  const known = [{ id: "a", label: "A", value: 80 }];
  it.each([{ segments: [] }, { segments: [{ id: "a", label: "A", value: 0 }] }])("空和全零无无效比例：%j", ({ segments }) => {
    expect(visualizationLayout(segments).denominator).toBe(0);
    const { container } = render(<SegmentedBar mode="capacity" total={0} segments={segments} valueText="0 / 0" />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });

  it("未覆盖总量保留灰色，不归为正常", () => {
    expect(visualizationLayout(known, 100)).toMatchObject({ assigned: 80, denominator: 100, remainder: 20 });
    const { container } = render(<SegmentedBar mode="distribution" total={100} segments={known} valueText="A 80，未覆盖 20" />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("未覆盖 20");
    expect(Number((container.querySelector('[data-slot="segmented-bar-remainder"]') as HTMLElement).style.flexGrow)).toBe(.2);
  });

  it("超额保留 150 的真实值，绘图分母放大到150", () => {
    const { container } = render(<SegmentedBar mode="capacity" total={100} segments={[{ id: "a", label: "A", value: 150 }]} valueText="150 / 100 · 150%" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("150");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe("150");
    expect(container.querySelector('[data-overflow="true"]')).toBeTruthy();
    expect(Number((container.querySelector('[data-series="a"]') as HTMLElement).style.flexGrow)).toBe(1);
  });

  it("部分未知且没有总量不伪造完整分布，有总量时保留未分配", () => {
    const partial = [...known, { id: "b", label: "B", value: null }];
    expect(visualizationLayout(partial)).toMatchObject({ complete: false, denominator: 0 });
    expect(visualizationLayout(partial, 100)).toMatchObject({ complete: false, remainder: 20 });
    expect(visualizationLayout([{ id: "bad", label: "bad", value: Infinity }])).toMatchObject({ complete: false, assigned: 0, denominator: 0 });
  });
  it.each([null, NaN, Infinity, -1])("显式未知或非法总量 %s 不从已知分类推断完整总量", total => {
    expect(visualizationLayout(known, total)).toMatchObject({ complete: false, assigned: 80, denominator: 0, remainder: 0 });
    const { container } = render(<SegmentedBar mode="distribution" total={total} segments={known} valueText="已知 80，总量未知" />);
    expect(container.querySelector('[data-complete="false"]')).toBeTruthy();
    expect(Number((container.querySelector('[data-series="a"]') as HTMLElement).style.flexGrow)).toBe(0);
  });
  it("容量未知时不向辅助技术宣称已用零或部分已知值是完整进度", () => {
    const { rerender } = render(<SegmentedBar mode="capacity" total={100} segments={[...known, { id: "unknown", label: "Unknown", value: null }]} valueText="至少已用 80，部分用量未知" />);
    expect(screen.getByRole("progressbar").hasAttribute("aria-valuenow")).toBe(false);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toContain("未知");
    rerender(<SegmentedBar mode="capacity" total={NaN} segments={known} valueText="已用 80，容量未知" />);
    expect(screen.getByRole("progressbar").hasAttribute("aria-valuenow")).toBe(false);
  });
  it("有效超大数相加超出数字范围时保持未知绘图，不输出无穷进度", () => {
    const segments = [{ id: "a", label: "A", value: Number.MAX_VALUE }, { id: "b", label: "B", value: Number.MAX_VALUE }];
    expect(visualizationLayout(segments, 100)).toMatchObject({ complete: false, denominator: 0, remainder: 0 });
    const { container } = render(<SegmentedBar mode="capacity" total={100} segments={segments} valueText="总用量超出可计算范围" />);
    expect(screen.getByRole("progressbar").hasAttribute("aria-valuenow")).toBe(false);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("图例完整名称与值可读；显式操作只向宿主发出 ID", () => {
    const select = vi.fn();
    const items = [{ id: "a", label: "完整的很长分类名称", value: "80 GB" }];
    const { rerender } = render(<ChartLegend items={items} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("listitem").textContent).toContain("完整的很长分类名称");
    rerender(<ChartLegend items={items} onSelect={select} />);
    fireEvent.click(screen.getByRole("button"));
    expect(select).toHaveBeenCalledExactlyOnceWith("a");
  });
});

describe("真实消费者的数据边界", () => {
  it("趋势数据表保留零、单点、缺失和实际时区窗口", () => {
    const at = Date.UTC(2026, 9, 5, 1);
    const { rerender } = render(<TimeSeriesChart data={[{ timestamp: at, values: { requests: 0 } }]} series={[{ id: "requests", label: "请求" }]} locale="en-GB" timeZone="UTC" label="请求趋势" />);
    expect(screen.getByRole("table", { hidden: true }).textContent).toContain("01:00");
    expect(screen.getByRole("cell", { hidden: true }).textContent).toBe("0");
    rerender(<TimeSeriesChart data={[{ timestamp: at, values: { requests: null } }, { timestamp: at + 3600000, values: { requests: 12 } }]} series={[{ id: "requests", label: "请求" }]} locale="en-GB" timeZone="Asia/Shanghai" domain={[at, at + 7200000]} label="请求趋势" />);
    expect(screen.getByRole("table", { hidden: true }).textContent).toContain("09:00");
    expect(screen.getAllByRole("cell", { hidden: true }).map((cell) => cell.textContent)).toEqual(["—", "12"]);
    rerender(<TimeSeriesChart data={[]} series={[{ id: "requests", label: "请求" }]} locale="en" timeZone="UTC" label="请求趋势" />);
    expect(screen.getByText("暂无数据 / No data")).toBeTruthy();
    rerender(<TimeSeriesChart data={[{ timestamp: NaN, values: { requests: 12 } }]} series={[{ id: "requests", label: "请求" }]} locale="en" timeZone="UTC" label="请求趋势" />);
    expect(screen.getByText("部分时间无效，请查看数据 / Invalid timestamps; view data")).toBeTruthy();
    expect(screen.getByRole("cell", { hidden: true }).textContent).toBe("12");
  });

  it("资源状态真实采用共享圆环、图例和覆盖汇总", () => {
    const { container, rerender } = render(<ResourceStatusAll total={100} statuses={[{ tone: "normal", label: "正常", value: 80 }]} />);
    expect(container.querySelector('[data-slot="donut-summary"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="chart-legend"]')).toBeTruthy();
    expect(screen.getByText("未覆盖 20")).toBeTruthy();
    expect(screen.getByText("80 / 100 · 80.0%")).toBeTruthy();
    rerender(<ResourceStatusAll total={10} statuses={[{ tone: "normal", label: "正常", value: 15 }]} />);
    expect(screen.getByText("分类计数超过资源总数，请核对统计范围。")).toBeTruthy();
  });

  it("资源分类未覆盖不会被归一化成完整正常状态", () => {
    render(<ResourceMetricList items={[{ ...defaultResourceMetrics[0], value: 10, segments: [{ value: 6, tone: "brand", label: "正常" }] }]} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("未覆盖 4");
  });

  it("费用圆环按业务 micros 总数绘制，保留分类身份", () => {
    const { container, rerender } = render(<ProviderCostDonut data={[{ id: "p", name: "Provider", costMicros: 1230000, requestCount: 9 }]} formatCost={(value) => `$${(value / 1000000).toFixed(2)}`} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("$1.23");
    expect(container.querySelector('[data-slot="donut-summary"]')!.textContent).toContain("$1.23");
    rerender(<ProviderCostDonut data={[{ id: "p", name: "Provider", costMicros: 1230000, requestCount: 9 }]} total={2000000} formatCost={(value) => `$${(value / 1000000).toFixed(2)}`} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("Unassigned $0.77");
    expect(container.querySelector('[data-slot="donut-summary"]')!.textContent).toContain("$2.00");
  });

  it("服务分布与业务请求汇总一致，缺失来源明确告知", () => {
    const window = projectMonitorDemoData.windows[0];
    const total = summarizeWindow(window).total!;
    const { container, rerender } = render(<ServiceDistribution window={window} labels={projectMonitorLabels} locale="zh-CN" />);
    expect(container.querySelector('[data-slot="donut-summary"]')!.textContent).toContain(total.toLocaleString("zh-CN"));
    const partial = { ...window, services: window.services.map((service, index) => index ? service : { ...service, buckets: [null, ...service.buckets.slice(1)] }) };
    rerender(<ServiceDistribution window={partial} labels={projectMonitorLabels} locale="zh-CN" />);
    expect(screen.getByText(projectMonitorLabels.incomplete)).toBeTruthy();
    expect(container.querySelector('[data-slot="donut-summary"]')!.getAttribute("data-complete")).toBe("false");
  });

  it("评分和扫描进度分开，扫描完成等待快照时仍标记旧快照", () => {
    const data = securityOverviewDemoData;
    const { container, rerender } = render(<SecurityScore data={data} scan={{ status: "running", jobId: "job", completed: 1, total: 100 }} labels={securityOverviewLabels} locale="zh-CN" />);
    const label = screen.getByRole("img").getAttribute("aria-label");
    expect(label).toContain(securityOverviewLabels.previousSnapshot);
    expect(label).toContain(String(data.score));
    rerender(<SecurityScore data={data} scan={{ status: "succeeded", jobId: "job", snapshotId: "new", newFindingCount: 0 }} labels={securityOverviewLabels} locale="zh-CN" />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain(securityOverviewLabels.previousSnapshot);
    expect(container.querySelector('[data-slot="donut-summary"]')).toBeTruthy();
  });

  it("公共依赖按需，状态和分段条不会拉入图表引擎", () => {
    const registry = JSON.parse(readFileSync("packages/ui/registry.json", "utf8"));
    const closure = (name: string, seen = new Set<string>()) => {
      if (seen.has(name)) return [];
      seen.add(name);
      const item = registry.items.find((entry: { name: string }) => entry.name === name);
      return [...(item?.dependencies ?? []), ...(item?.registryDependencies ?? []).flatMap((id: string) => closure(id, seen))];
    };
    for (const name of ["chart-primitives", "badge", "alert"]) expect(closure(name)).not.toContain("recharts");
    expect(closure("chart")).toContain("recharts");
  });
});

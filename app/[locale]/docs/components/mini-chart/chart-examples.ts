import type { ChartColorIndex } from "@zeron/ui/chart-primitives";
import type { MiniCartesianSpec, MiniChartSpec, MiniDatum, MiniPart, MiniSeries } from "@zeron/ui/mini-chart";
import type { AppLocale } from "@/app/_i18n/routing";
import { advancedChartExamples } from "./chart-advanced-examples";

export type GalleryCategory = "cloud" | "inference" | "reliability" | "cost";

export interface ChartExample {
  id: string;
  category: GalleryCategory;
  title: string;
  name: string;
  value: number;
  unit: string;
  chartUnit?: string;
  context: string;
  spec: MiniChartSpec;
}

type Labels = [english: string, chinese: string];
type TrendKind = "line" | "area" | "bar";
type TrendOptions = Omit<MiniCartesianSpec, "kind" | "data">;

const sampleTime = Date.UTC(2026, 10, 25, 12);
const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

export function chartExamples(locale: AppLocale): ChartExample[] {
  const t = (en: string, zh: string) => locale === "en" ? en : zh;
  const lastHour = t("Last hour", "近 1 小时");
  const lastDay = t("Last 24 hours", "近 24 小时");
  const lastWeek = t("Last 7 days", "近 7 天");
  const currentMonth = t("This month", "本月");
  const current = t("Current snapshot", "当前快照");
  const percent = (value: number) => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value / 100);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Shanghai" });
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "Asia/Shanghai" });

  function timelineBetween(values: (number | null)[], startMs: number, endMs: number, compare?: (number | null)[], other?: (number | null)[]): MiniDatum[] {
    const hours = (endMs - startMs) / 3_600_000;
    const format = hours > 24 ? date : time;
    return values.map((value, index) => {
      const x = startMs + (endMs - startMs) * index / Math.max(1, values.length - 1);
      return {
        label: format.format(x),
        x,
        value,
        ...(compare ? { compare: compare[index] } : {}),
        ...(other ? { other: other[index] } : {}),
      };
    });
  }

  function timeline(values: (number | null)[], hours: number, compare?: number[], other?: number[]): MiniDatum[] {
    return timelineBetween(values, sampleTime - hours * 3_600_000, sampleTime, compare, other);
  }

  function trend(kind: TrendKind, values: (number | null)[], options: TrendOptions = {}, hours = 24, compare?: number[], other?: number[]): MiniCartesianSpec {
    return { kind, data: timeline(values, hours, compare, other), ...options };
  }

  function series(first: Labels, second: Labels, third?: Labels): MiniSeries[] {
    return [
      { key: "value", label: t(...first) },
      { key: "compare", label: t(...second) },
      ...(third ? [{ key: "other" as const, label: t(...third) }] : []),
    ];
  }

  const part = (name: Labels, value: number, color?: ChartColorIndex): MiniPart => ({ label: t(...name), value, color });
  const item = (id: string, category: GalleryCategory, name: Labels, value: number, unit: string, context: string, spec: MiniChartSpec, chartUnit?: string): ChartExample =>
    ({ id, category, title: t(...name), name: name[0], value, unit, ...(chartUnit ? { chartUnit } : {}), context, spec });
  const meter = (mode: Extract<MiniChartSpec, { kind: "meter" }>["mode"], value: number, max: number, color: ChartColorIndex = 1, target?: number, min?: number, reverseZones?: boolean): MiniChartSpec =>
    ({ kind: "meter", mode, value, max, color, target, min, ...(reverseZones ? { reverseZones } : {}) });
  const cells = (columns: number, rows: number, seed: number, max: number) => Array.from({ length: columns * rows }, (_, index) =>
    (index * index * 11 + index * seed + Math.floor(index / columns) * 7) % (max + 1));
  const capacity = (name: Labels, value: number, max: number, color: ChartColorIndex) => ({ label: t(...name), total: max, parts: [part(name, value, color)] });
  const colors = { blue: 1, teal: 2, amber: 3, green: 4, purple: 5, neutral: 6, danger: 7 } as const;

  const gpuTemp = [53, 54, 51, 58, 57, 62, 59, 58, 66, 63, 71, 67, 69, 72, 68, 74, 71, 72.4];
  const throughput = [720, 860, 835, 1100, 1010, 1430, 1230, 1560, 1780, 1590, 2050, 2320, 2120, 2600, 2450, 2780, 2620, 2840];
  const requests = [465, 680, 540, 790, 635, 920, 1030, 820, 760, 870, 1210, 1090, 1380, 1640, 1430, 1840];
  const allocateTrain = [18, 20, 18, 23, 26, 22, 20, 25, 25, 26, 24, 26];
  const allocateInference = [20, 21, 23, 21, 19, 24, 25, 22, 25, 26, 28, 27];
  const unallocated = allocateTrain.map((value, index) => 64 - value - allocateInference[index]);
  const cloudParts = [part(["Compute", "计算"], 10720), part(["Storage", "存储"], 5150, colors.purple), part(["Network", "网络"], 2780, colors.teal), part(["Other", "其他"], 1250, colors.amber)];
  const ttftBins = [72, 88, 114, 172, 255, 218, 154, 82, 52, 27, 12, 6];
  const denseCpu = [24, 30, 25, 39, 36, 46, 38, 41, 35, 40, 46, 50, 54, 59, 54, 56, 65, 61, 55, 61, 59, 64, 57, 63];
  const trainingCells = cells(16, 7, 3, 4);
  const scanCells = cells(12, 7, 5, 3);
  const batchCompletions = [16, 24, 23, 31, 20, 28, 27, 32, 36, 29, 25, 27];
  const gpuSlotDots = Array.from({ length: 64 }, (_, index) => (index < 46 || (index >= 48 && index < 54)) ? 1 : 0);
  const scatterSamples = Array.from({ length: 32 }, (_, index) => {
    const x = 70 + index * 76 + (index % 7) * 90;
    return { x, label: `#${index + 1}`, value: Math.round(42 + x * 0.055 + (index * 17 % 80)) };
  });
  const sortedScatterValues = scatterSamples.map((point) => point.value).sort((a, b) => a - b);
  const scatterMedian = Math.round((sortedScatterValues[15] + sortedScatterValues[16]) / 2);

  const examples = [
    item("daily-charge-credits", "cost", ["Daily charges and credits", "每日费用与抵扣"], 431.32, "USD", t("Net today · $97.68 credits", "今日净额 · 抵扣 $97.68"),
      trend("bar", [385, 412, 375, 449, 478, 501, 529], { stacked: true, reference: 0, series: [{ key: "value", label: t("Charges", "费用"), color: 1 }, { key: "compare", label: t("Credits", "抵扣"), color: 2 }] }, 168, [-66, -52, -95, -88, -43, -80, -97.68])),
    item("gateway-volume", "inference", ["Gateway requests", "网关请求量"], total(requests), t("req", "次"), t("Last 80 min · 5-min buckets", "近 80 分钟 · 每 5 分钟分桶"),
      trend("bar", requests, { color: colors.purple }, 1.25)),
    item("gpu-hotspot", "cloud", ["GPU hotspot temperature", "GPU 热点温度"], gpuTemp.at(-1)!, "°C", lastHour,
      trend("line", gpuTemp, { reference: 80, domain: [46, 86], color: colors.blue }, 1)),
    item("token-throughput", "inference", ["Output throughput", "输出 Token 吞吐"], throughput.at(-1)!, "tok/s", lastHour,
      trend("area", throughput, { color: colors.teal }, 1)),
    item("accepted-vs-completed", "inference", ["Received vs completed", "接收与完成请求"], 410, "req/s", lastHour,
      trend("line", [234, 280, 259, 320, 270, 298, 332, 305, 370, 361, 402, 410], { series: series(["Received", "接收"], ["Completed", "完成"]) }, 1, [209, 249, 237, 279, 251, 281, 301, 288, 329, 340, 374, 388])),
    item("gpu-allocation", "cloud", ["GPU fleet allocation", "GPU 池分配"], 53, t("/ 64 GPUs", "/ 64 张"), t("Allocated now", "当前已分配"),
      trend("bar", allocateTrain, { stacked: true, domain: [0, 64], series: [{ key: "value", label: t("Training", "训练"), color: 1 }, { key: "compare", label: t("Inference", "推理"), color: 5 }, { key: "other", label: t("Unallocated", "空闲"), color: 6 }] }, 24, allocateInference, unallocated)),
    item("cloud-cost-mix", "cost", ["Cloud cost breakdown", "云账单构成"], total(cloudParts.map((entry) => entry.value)), "USD", currentMonth,
      { kind: "radial", mode: "donut", parts: cloudParts, center: percent(10720 / 19900 * 100) }),
    item("batch-size-ttft", "inference", ["TTFT by batch size", "批大小与首 Token 延迟"], 186, "ms", t("P95 at batch 32", "批大小 32 的 P95"),
      { kind: "line", curve: "linear", color: colors.amber, data: [1, 2, 4, 8, 16, 32].map((batch, index) => ({ label: t(`Batch ${batch}`, `批大小 ${batch}`), value: [55, 58, 68, 86, 124, 186][index] })) }),
    item("namespace-gpu-rank", "cloud", ["GPU hours by namespace", "命名空间 GPU 工时"], 548, "GPU·h", lastWeek,
      { kind: "bar", layout: "horizontal", color: colors.blue, data: [{ label: "prod", value: 548 }, { label: "train", value: 403 }, { label: "eval", value: 269 }, { label: "dev", value: 156 }] }),
    item("ingress-bandwidth", "cloud", ["Ingress bandwidth", "入口带宽"], 476, "MiB/s", lastDay,
      trend("area", [131, 115, 195, 161, 284, 239, 336, 245, 278, 191, 350, 298, 386, 329, 442, 419, 476], { curve: "linear", color: colors.teal })),
    item("inference-spend", "cost", ["Inference spend today", "今日推理费用"], 348, "USD", t("Today highlighted · last 7 days", "今日实况 · 近 7 天按日对比"),
      trend("bar", [226, 198, 273, 254, 281, 326, 348], { emphasizeLast: true, color: colors.purple }, 144)),
    item("weight-prewarm", "inference", ["Weight prewarm", "权重预热进度"], 18, "/ 24", t("Target replicas", "目标副本"),
      { kind: "radial", mode: "donut", parts: [part(["Ready", "已预热"], 18, colors.purple)], total: 24, center: percent(75) }),
    item("log-storage-tiers", "cost", ["Log storage tiers", "日志存储分层费用"], 92, "USD", t("Latest day · 7-day breakdown", "最近账单日 · 近 7 天分层"),
      trend("bar", [38, 41, 40, 43, 48, 46, 51], { stacked: true, series: series(["Hot", "热存储"], ["Cold", "冷存储"], ["Archive", "归档"]) }, 144, [18, 24, 25, 21, 23, 29, 28], [8, 9, 11, 10, 11, 11, 13])),
    item("cpu-quotas", "cloud", ["CPU quota by namespace", "命名空间 CPU 配额"], 147, "vCPU", t("Allocated across namespaces", "命名空间已分配总量"),
      { kind: "segments", rows: [capacity(["prod", "prod"], 82, 100, 1), capacity(["train", "train"], 42, 64, 5), capacity(["dev", "dev"], 23, 32, 2)] }),
    item("forecast-spend", "cost", ["Projected inference spend", "推理支出预测"], 3660, "USD", t("Nov 30 month-end estimate", "11 月末预测总额"),
      { kind: "line", series: [{ key: "value", label: t("Actual", "实测") }, { key: "compare", label: t("Forecast", "预测"), color: 5, dashed: true }],
        data: timelineBetween(
          [860, 1190, 1440, 1780, 2070, 2260, null, null, null],
          Date.UTC(2026, 10, 1, 0),
          Date.UTC(2026, 10, 30, 0),
          [null, null, null, null, null, 2260, 2690, 3140, 3660],
        ) }),
    item("revenue-cost", "cost", ["Billed vs provider cost", "计费收入与供应商成本"], 8140, "USD", t("Latest week · 8-week trend", "本周计费收入 · 近 8 周"),
      trend("area", [4220, 4510, 4140, 5520, 5750, 6400, 6250, 8140], { series: series(["Billed", "计费收入"], ["Provider cost", "供应商成本"]) }, 1176, [2630, 2450, 2710, 2980, 3850, 3710, 4120, 4480])),
    item("accelerator-share", "cloud", ["Accelerator mix", "加速器机型份额"], 53, t("GPUs", "张"), t("Allocated GPUs · H100 54.7%", "已分配设备 · H100 占 54.7%"),
      { kind: "radial", mode: "donut", parts: [part(["H100", "H100"], 29, 1), part(["A100", "A100"], 16, 5), part(["L40S", "L40S"], 8, 2)], center: percent(29 / 53 * 100) }),
    item("request-outcomes", "inference", ["Request outcomes", "请求结果分布"], 96.4, "%", t("Successful requests", "成功请求占比"),
      { kind: "radial", mode: "pie", parts: [part(["Succeeded", "成功"], 964, 1), part(["Throttled", "限流"], 24, 3), part(["Failed", "失败"], 12, 7)] }),
    item("quota-rings", "cloud", ["Resource quota usage", "资源配额使用率"], 83, "%", t("Highest quota usage", "最高配额使用率"),
      { kind: "radial", mode: "rings", parts: [part(["CPU", "CPU"], 72), part(["GPU", "GPU"], 83, 5), part(["VRAM", "显存"], 67, 2)] }),
    item("training-activity", "cloud", ["Training activity", "训练作业活跃度"], total(trainingCells), t("jobs", "个"), t("Last 16 weeks", "近 16 周"),
      { kind: "matrix", columns: 16, cells: trainingCells, color: colors.blue, max: 4 }),
    item("concurrency-quota", "inference", ["Endpoint concurrency", "推理并发配额"], 768, "/ 1,024", current,
      { kind: "radial", mode: "donut", parts: [part(["Used slots", "已用槽位"], 768, 5)], total: 1024, center: percent(75) }),
    item("network-rtt", "reliability", ["Cross-region RTT", "跨区网络往返延迟"], 43, "ms", t("P99 over the last day", "近一天 P99"),
      trend("line", [28, 31, 34, 29, 32, 63, 38, 35, 33, 37, 42, 37, 41, 45, 38, 43], { reference: 55, color: colors.amber })),
    item("batch-jobs", "inference", ["Batch inference jobs", "批推理任务完成量"], total(batchCompletions), t("jobs", "个"), t("Last 24 hours · 2-hour buckets", "近 24 小时 · 每 2 小时分桶"),
      trend("bar", batchCompletions, { color: colors.green })),
    item("windowed-latency", "inference", ["P95 request latency", "请求延迟 P95"], 142, "ms", t("6-hour window", "6 小时时间窗"),
      trend("line", [106, 113, 121, 106, 101, 138, 155, 123, 115, 133, 146, 142], { band: [110, 150], color: colors.purple }, 6)),
    item("cost-per-token", "cost", ["Cost per million tokens", "每百万输出 Token 成本"], 0.72, "USD", lastWeek,
      trend("line", [1.03, 0.87, 0.9, 0.82, 0.81, 0.75, 0.72], { color: colors.teal, curve: "linear" }, 144)),
    item("gpu-temp-range", "cloud", ["GPU temperature envelope", "GPU 温度波动"], 76, "°C", t("Latest 5-minute high", "最新 5 分钟峰值"),
      { kind: "range", color: 3, series: [{ key: "value", label: t("Warming", "升温"), color: 3 }, { key: "compare", label: t("Cooling", "降温"), color: 2 }],
        data: timeline([52, 56, 59, 55, 61, 64, 62, 66, 69, 70], 0.75).map((point, index) => {
          const last = point.value!;
          const first = last + (index % 3 === 0 ? 3 : -3);
          return { ...point, first, last, range: [Math.min(first, last) - 4, Math.max(first, last) + (index === 9 ? 3 : 4)] };
        }) }),
    item("gpu-occupancy-layers", "cloud", ["GPU occupancy by pool", "GPU 分区占用"], 70, t("GPUs", "张"), lastDay,
      trend("area", [18, 20, 15, 21, 25, 24, 30, 34, 31, 36], { stacked: true, series: series(["Pool A", "资源池 A"], ["Pool B", "资源池 B"], ["Pool C", "资源池 C"]) }, 24, [17, 9, 11, 16, 19, 18, 22, 23, 25, 22], [7, 8, 8, 10, 10, 13, 12, 15, 12, 12])),
    item("regional-log-volume", "cloud", ["Regional log volume", "区域日志流量"], 486, "GiB", t("Last 24 h · East 46.9%", "近 24 小时 · 东区占 46.9%"),
      { kind: "radial", mode: "half", parts: [part(["East", "东区"], 228), part(["West", "西区"], 157, 2), part(["Europe", "欧洲"], 101, 5)], center: percent(228 / 486 * 100) }),
    item("gpu-reservations", "cloud", ["Reserved vs assigned GPUs", "GPU 预约与分配"], 318, "GPU·h", t("Assigned on latest day", "最近一天分配量"),
      trend("bar", [250, 281, 257, 312, 338], { series: series(["Reserved", "预约"], ["Assigned", "分配"]) }, 96, [217, 253, 192, 284, 318])),
    item("capacity-staircase", "inference", ["Concurrency throughput", "各并发档位吞吐"], 640, "req/s", t("Accepted at concurrency 64", "64 并发档位可接纳吞吐"),
      { kind: "area", curve: "stepAfter", series: series(["Accepted", "已接纳"], ["Queued", "排队等待"]),
        data: [1, 4, 8, 16, 32, 64].map((level, index) => ({ label: t(`c=${level}`, `并发 ${level}`), value: [95, 240, 390, 520, 610, 640][index], compare: [0, 5, 18, 46, 92, 148][index] })) }),
    item("provider-ttft", "inference", ["TTFT by provider", "供应商首 Token 延迟"], 68, "ms", t("Fastest current P95", "当前最快 P95"),
      trend("line", [87, 86, 82, 72, 80, 77, 81, 75, 68], { series: series(["Provider A", "供应商 A"], ["Provider B", "供应商 B"], ["Provider C", "供应商 C"]) }, 24, [100, 98, 91, 94, 88, 96, 88, 90, 83], [123, 118, 125, 124, 103, 110, 105, 118, 106])),
    item("image-scans", "reliability", ["Image scan calendar", "镜像扫描日历"], total(scanCells), t("scans", "次"), t("Last 12 weeks", "近 12 周"),
      { kind: "matrix", columns: 12, cells: scanCells, dots: true, color: colors.purple, max: 3 }),
    item("maintenance-traffic", "reliability", ["Traffic during maintenance", "维护窗口请求流量"], 264, "req/s", t("02:00–03:00 UTC+8", "02:00–03:00 UTC+8"),
      { kind: "area", reference: 230, color: colors.blue,
        data: timelineBetween(
          [271, 283, 279, 264, 201, 130, 156, 208, 260, 269, 267, 264],
          Date.UTC(2026, 10, 24, 18, 0),
          Date.UTC(2026, 10, 24, 19, 0),
        ) }),
    item("rack-temp-band", "reliability", ["Rack inlet temperature", "机柜进风温度"], 24.6, "°C", t("Target band 19–27 °C", "目标区间 19–27 °C"),
      trend("line", [20, 21, 20.5, 22, 23, 25, 26, 28.4, 27, 26.1, 24.8, 24.6], { band: [19, 27], domain: [16, 32], color: colors.green })),
    item("backup-streak", "reliability", ["Backup success streak", "备份连续成功"], 19, t("days", "天"), t("Current streak · 29/30 last 30d", "当前连续成功 · 近 30 天达成 29/30"),
      { kind: "segments", rows: [capacity(["This week", "本周"], 7, 7, 4), capacity(["Last 30d", "近 30 天"], 29, 30, 2)] }),
    item("latency-baseline", "reliability", ["Latency vs baseline", "延迟与历史基准"], 107, "ms", t("P95 compared with yesterday", "P95 与昨日同期对比"),
      trend("line", [92, 115, 102, 127, 108, 95, 105, 113, 112, 97, 109, 107], { series: [{ key: "value", label: t("Today", "今天"), color: 5 }, { key: "compare", label: t("Yesterday", "昨天"), color: 6, dashed: true }] }, 24, [91, 101, 96, 102, 101, 93, 89, 102, 95, 96, 98, 102])),
    item("gpu-dot-count", "cloud", ["GPU slot occupancy", "GPU 占用点阵"], 52, t("/ 64 GPUs", "/ 64 张"), t("Each dot is one GPU · 81% active", "每点代表一张 GPU · 占用率 81%"),
      { kind: "matrix", columns: 16, cells: gpuSlotDots, dots: true, color: colors.teal, max: 1,
        legend: [{ label: t("Active", "占用中"), color: colors.teal }, { label: t("Idle", "空闲") }] }),
    item("remaining-budget", "cost", ["Remaining GPU budget", "GPU 月预算余额"], 5240, "USD", t("Of $15,000 · alert below $3,000", "总额 $15,000 · 低于 $3,000 告警"),
      trend("line", [14120, 12840, 11360, 9680, 7950, 6480, 5240], { reference: 3000, domain: [0, 15500], color: colors.amber }, 576)),
    item("image-rollout", "inference", ["Model image rollout", "模型镜像分发"], 6, "/ 8", t("6 of 8 target regions synced", "8 个目标区域已同步 6 个"),
      meter("loop", 6, 8, colors.purple)),
    item("queue-pressure", "inference", ["Queue pressure", "调度队列压力"], 68, "%", t("Target under 80%", "目标低于 80%"),
      meter("ticks", 68, 100, colors.amber, 80)),
    item("memory-history-range", "cloud", ["Peak VRAM in range", "显存峰值历史区间"], 51, "GiB", t("30-day low and high", "近 30 天最低及最高"),
      meter("range", 51, 79, colors.blue, undefined, 29)),
    item("memory-headroom", "cloud", ["VRAM usage", "显存用量与软限"], 48, "GiB", t("Of 80 GiB · soft limit 64 GiB", "上限 80 GiB · 软限 64 GiB"),
      meter("ruler", 48, 80, colors.blue, 64)),
    item("regional-readiness", "reliability", ["Replica readiness by region", "区域副本就绪率"], 91.5, "%", t("Average across four regions", "四个区域平均值"),
      { kind: "radial", mode: "radial-row", parts: [part(["East", "东区"], 100), part(["West", "西区"], 96, 5), part(["Europe", "欧洲"], 88, 2), part(["Asia", "亚太"], 82, 3)] }),
    item("reserved-savings", "cost", ["Reserved instance savings", "预留实例节省额"], 3240, "USD", t("Toward a $5,000 target", "节省目标 $5,000"),
      meter("slope", 3240, 5000, colors.green)),
    item("gpu-hours-quota", "cost", ["GPU hour allowance", "GPU 时长配额"], 68, "GPU·h", t("10 GPU hours per segment", "每格代表 10 GPU·h"),
      meter("pills", 68, 100, colors.purple)),
    item("node-health-score", "reliability", ["Node health score", "节点健康度"], 84, "/ 100", t("Healthy ≥ 80 · current score", "健康线 80 · 当前评分"),
      meter("zones", 84, 100, colors.green, 80, undefined, true)),
    item("scheduler-outcomes", "reliability", ["Scheduler outcomes", "调度任务结果"], 94, t("jobs", "个"), t("Completed in the last hour", "近 1 小时完成量"),
      { kind: "radial", mode: "radial-row", parts: [part(["Completed", "完成"], 94, 4), part(["Waiting", "等待"], 21, 3), part(["Failed", "失败"], 5, 7)], total: 120 }),
    item("drill-checks", "reliability", ["Recovery drill checks", "故障演练检查项"], 16, "/ 21", t("Passed checks", "已通过检查项"),
      meter("arc", 16, 21, colors.teal)),
    item("checkpoint-shards", "inference", ["Checkpoint shards written", "检查点已写入分片"], 64, "/ 80", t("64 written · 3 retrying · 13 pending", "已写 64 · 重试 3 · 待写 13"),
      { kind: "matrix", columns: 20, cells: Array.from({ length: 80 }, (_, index) => index < 64 ? 1 : index < 67 ? 2 : 0), dots: true, color: colors.teal, max: 1, states: true,
        legend: [{ label: t("Written", "已写"), color: colors.teal }, { label: t("Retrying", "重试"), color: colors.danger }, { label: t("Pending", "待写") }] }),
    item("endpoint-risk", "reliability", ["Endpoint error rate", "推理端点错误率"], 1.2, "%", t("Threshold 2%", "告警阈值 2%"),
      meter("zones", 1.2, 3, colors.amber, 2)),
    item("cpu-recent-buckets", "cloud", ["CPU utilization", "CPU 使用率"], 63, "%", t("Last 8 hours · 20 minute buckets", "近 8 小时 · 20 分钟分桶"),
      trend("bar", denseCpu, { reference: total(denseCpu) / denseCpu.length, color: colors.blue, emphasizeLast: true }, 23 / 3)),
    item("ttft-percentiles", "inference", ["TTFT percentile range", "首 Token 延迟分位区间"], 231, "ms", t("Latest P95 · P50–P95 range", "最新 P95 · P50–P95 区间"),
      { kind: "range", color: 5, data: timeline([148, 166, 176, 155, 188, 203, 194, 207, 218, 204, 233, 231], 0.9167).map((point, index) => ({ ...point, range: [point.value! - (42 + index * 2), point.value!] })) }),
    item("vram-breakdown", "cloud", ["VRAM composition", "GPU 显存分配"], 62, "GiB", t("Used of 80 GiB", "已用 / 80 GiB"),
      { kind: "segments", rows: [{ total: 80, parts: [part(["Weights", "权重"], 38), part(["KV cache", "KV 缓存"], 17, 5), part(["Runtime", "运行时"], 7, 2)] }] }),
    item("maintenance-window", "reliability", ["Maintenance window", "维护窗口"], 65, "min", t("Planned work", "已计划作业"),
      { kind: "timeline", start: 0, end: 120, now: 76, windows: [{ start: 21, end: 51, label: t("Drain traffic", "摘除流量"), color: 2 }, { start: 51, end: 86, label: t("Rolling update", "滚动更新"), color: 1 }] }),
    item("checkpoint-upload", "inference", ["Checkpoint uploads", "模型检查点上传"], 38, "GiB", t("Transferred across 3 jobs", "3 项任务已传总量"),
      { kind: "segments", rows: [capacity(["Model A", "模型 A"], 16, 16, 4), capacity(["Model B", "模型 B"], 14, 22, 1), capacity(["Model C", "模型 C"], 8, 20, 3)] }),
    item("node-health-matrix", "reliability", ["Node health matrix", "节点健康度点阵"], 12, t("nodes", "台"), t("12 nodes × last 4 hours", "12 台节点 × 近 4 小时巡检"),
      { kind: "matrix", columns: 12, cells: cells(12, 4, 11, 9).map((value) => value === 9 ? 2 : value === 0 ? 0 : 1), dots: true, color: colors.green, max: 1, states: true,
        legend: [{ label: t("Healthy", "正常"), color: colors.green }, { label: t("Alert", "异常"), color: colors.danger }, { label: t("Maint.", "维护") }] }),
    item("ttft-histogram", "inference", ["TTFT distribution", "首 Token 延迟分布"], 178, "ms", t("P50 · 1,252 samples · 40 ms", "中位数 · 1,252 次 · 40 ms 分桶"),
      { kind: "bar", color: 5, data: ttftBins.map((value, index) => ({ label: `${index * 40}–${(index + 1) * 40} ms`, value })) }, t("samples", "次")),
    item("token-latency-scatter", "inference", ["Input tokens vs TTFT", "输入 Token 与首 Token 延迟"], scatterMedian, "ms", t("Median across 32 sampled requests", "32 次请求采样的中位延迟"),
      { kind: "scatter", color: 2, xLabel: t("Input tokens", "输入 Token"), data: scatterSamples }),
    item("billing-waterfall", "cost", ["Month-over-month cost change", "月度账单增减"], 380, "USD", t("Net delta · $2,630 → $3,010", "净变动 · $2,630 → $3,010"),
      { kind: "range", rangeMode: "waterfall", color: 3, domain: [0, 3400], data: [
        { label: t("Prior", "上月"), value: 2630, range: [0, 2630] },
        { label: t("Comp.", "计算"), value: 420, range: [2630, 3050] },
        { label: t("Stor.", "存储"), value: 170, range: [3050, 3220] },
        { label: t("Net.", "网络"), value: 65, range: [3220, 3285] },
        { label: t("Disc.", "折扣"), value: -275, range: [3010, 3285] },
        { label: t("Curr.", "本月"), value: 3010, range: [0, 3010] },
      ] }),
    item("deployment-funnel", "inference", ["Replica deployment funnel", "推理副本部署漏斗"], 24, t("ready", "个就绪"), t("24 of 36 scheduled replicas live", "本批次 36 个副本已就绪 24 个"),
      { kind: "funnel", color: 5, stages: [part(["Scheduled", "已调度"], 36), part(["Allocated", "资源就绪"], 31), part(["Prewarmed", "镜像预热"], 27), part(["Serving", "服务就绪"], 24)] }),
  ];

  const allExamples = [...examples, ...advancedChartExamples(locale)];
  const featured = [
    "gpu-hotspot", "inference-route-sankey", "region-spend-treemap", "token-throughput",
    "ttft-box", "gpu-target-bullet", "model-profile-radar", "inference-request-trace",
    "release-latency-dumbbell", "model-volume-rank", "gateway-volume", "cloud-cost-mix",
    "training-activity", "queue-pressure", "gpu-allocation", "ttft-percentiles",
  ];
  const byId = new Map(allExamples.map((example) => [example.id, example]));
  return [...featured.map((id) => byId.get(id)!), ...allExamples.filter((example) => !featured.includes(example.id))];
}

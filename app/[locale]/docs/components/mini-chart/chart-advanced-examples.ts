import type { AppLocale } from "@/app/_i18n/routing";
import type { MiniChartSpec } from "@zeron/ui/mini-chart";
import type { ChartExample, GalleryCategory } from "./chart-examples";

type Labels = [english: string, chinese: string];

export function advancedChartExamples(locale: AppLocale): ChartExample[] {
  const t = (en: string, zh: string) => locale === "en" ? en : zh;
  const example = (id: string, category: GalleryCategory, name: Labels, value: number, unit: string, context: Labels, spec: MiniChartSpec): ChartExample =>
    ({ id, category, title: t(...name), name: name[0], value, unit, context: t(...context), spec });
  const rankPeriods = [21, 22, 23, 24, 25].map((day) => t(`Nov ${day}`, `11/${day}`));

  return [
    example("ttft-box", "inference", ["TTFT by model", "各模型首 Token 延迟"], 83, "ms", ["Model A median · last 24 h", "模型 A 中位数 · 近 24 小时"], {
      kind: "box", domain: [0, 240], rows: [
        { label: t("Model A", "模型 A"), statistics: [39, 59, 83, 109, 154], color: 5 },
        { label: t("Model B", "模型 B"), statistics: [37, 72, 102, 128, 187], color: 2 },
        { label: t("Model C", "模型 C"), statistics: [56, 96, 127, 154, 225], color: 1 },
        { label: t("Model D", "模型 D"), statistics: [33, 64, 91, 125, 203], color: 3 },
      ],
    }),
    example("disk-latency-box", "cloud", ["Volume write latency", "存储卷写入延迟"], 7.2, "ms", ["SSD median · four volume classes", "SSD 中位数 · 四种卷类型"], {
      kind: "box", domain: [0, 40], rows: [
        { label: "NVMe", statistics: [0.4, 1.3, 2.7, 4, 11], color: 1 },
        { label: "SSD", statistics: [1, 3, 7.2, 11, 20], color: 2 },
        { label: "HDD", statistics: [3, 7, 12, 18, 37], color: 3 },
        { label: t("Archive", "归档盘"), statistics: [4, 10, 17, 25, 38], color: 5 },
      ],
    }),
    example("gpu-target-bullet", "cloud", ["GPU utilization targets", "GPU 池利用率目标"], 72, "%", ["Pool A utilization · target 80%", "资源池 A 使用率 · 目标 80%"], {
      kind: "bullet", max: 100, bands: [50, 80], rows: [
        { label: t("Pool A", "资源池 A"), value: 72, target: 80, color: 1 },
        { label: t("Pool B", "资源池 B"), value: 84, target: 80, color: 5 },
        { label: t("Pool C", "资源池 C"), value: 52, target: 75, color: 2 },
      ],
    }),
    example("namespace-budget-bullet", "cost", ["Namespace budget targets", "命名空间预算目标"], 74, "%", ["Production spend · target 85%", "生产环境执行率 · 目标 85%"], {
      kind: "bullet", max: 100, bands: [70, 90], rows: [
        { label: t("Production", "生产环境"), value: 74, target: 85, color: 1 },
        { label: t("Training", "训练环境"), value: 92, target: 90, color: 3 },
        { label: t("Research", "实验环境"), value: 56, target: 80, color: 2 },
      ],
    }),
    example("release-latency-dumbbell", "reliability", ["Latency before and after release", "版本升级前后延迟"], 133, "ms", ["Chat endpoint P95 after release", "升级后的对话接口 P95"], {
      kind: "dumbbell", domain: [40, 220], beforeLabel: t("Before", "升级前"), afterLabel: t("After", "升级后"), lowerIsBetter: true,
      rows: [
        { label: t("Chat", "对话"), before: 176, after: 133 },
        { label: t("Embedding", "向量"), before: 88, after: 62 },
        { label: t("Rerank", "重排"), before: 111, after: 104 },
        { label: t("Vision", "视觉"), before: 146, after: 163 },
      ],
    }),
    example("cache-hit-dumbbell", "cloud", ["Cache hit rate before and after", "缓存命中率前后对比"], 93, "%", ["East region after rollout", "东区 · 调整后"], {
      kind: "dumbbell", domain: [45, 100], beforeLabel: t("Baseline", "基线"), afterLabel: t("Current", "当前"), lowerIsBetter: false,
      rows: [
        { label: t("East", "东区"), before: 82, after: 93, color: 2 },
        { label: t("West", "西区"), before: 73, after: 84, color: 2 },
        { label: t("Europe", "欧洲"), before: 61, after: 77, color: 2 },
      ],
    }),
    example("inference-request-trace", "inference", ["Inference request trace", "推理请求调用链"], 327, "ms", ["One request · elapsed time", "单次请求 · 端到端耗时"], {
      kind: "trace", duration: 327, spans: [
        { label: t("Gateway", "入口"), start: 0, end: 24, color: 1 },
        { label: t("Queue", "排队"), start: 24, end: 57, color: 3 },
        { label: t("Prefill", "预填充"), start: 57, end: 124, color: 5 },
        { label: t("Decode", "解码"), start: 124, end: 327, color: 2 },
      ],
    }),
    example("replication-trace", "reliability", ["Cross-region write trace", "跨区写入调用链"], 202, "ms", ["One write with overlapping spans", "单次写入 · 含并行阶段"], {
      kind: "trace", duration: 202, spans: [
        { label: t("Accept", "接收"), start: 0, end: 16, color: 1 },
        { label: t("Local write", "本地写入"), start: 16, end: 73, color: 5 },
        { label: t("Replicate", "跨区复制"), start: 30, end: 181, color: 2 },
        { label: t("Commit", "提交"), start: 181, end: 202, color: 3 },
      ],
    }),
    example("model-profile-radar", "inference", ["Model serving profile", "模型推理能力对比"], 88, "/ 100", ["Model A quality score · normalized", "模型 A 质量得分 · 统一量表"], {
      kind: "radar", metrics: [
        { key: "quality", label: t("Quality", "质量") },
        { key: "speed", label: t("Speed", "速度") },
        { key: "stability", label: t("Uptime", "稳定") },
        { key: "efficiency", label: t("Efficiency", "能效") },
        { key: "capacity", label: t("Capacity", "容量") },
      ], series: [
        { label: t("Model A", "模型 A"), values: { quality: 88, speed: 82, stability: 94, efficiency: 62, capacity: 86 }, color: 5 },
        { label: t("Model B", "模型 B"), values: { quality: 75, speed: 94, stability: 78, efficiency: 92, capacity: 61 }, color: 2 },
      ],
    }),
    example("region-readiness-radar", "reliability", ["Region readiness profile", "区域就绪度对比"], 94, "/ 100", ["East resiliency score · normalized", "东区韧性得分 · 统一量表"], {
      kind: "radar", metrics: [
        { key: "capacity", label: t("Capacity", "容量") },
        { key: "network", label: t("Network", "网络") },
        { key: "failover", label: t("Failover", "韧性") },
        { key: "backup", label: t("Backup", "备份") },
      ], series: [
        { label: t("East", "东区"), values: { capacity: 80, network: 86, failover: 94, backup: 74 }, color: 1 },
        { label: t("West", "西区"), values: { capacity: 90, network: 62, failover: 74, backup: 93 }, color: 3 },
      ],
    }),
    example("region-spend-treemap", "cost", ["Infrastructure spend by region", "各区域基础设施费用"], 18240, "USD", ["This month · tile area is spend", "本月 · 面积代表费用"], {
      kind: "treemap", parts: [
        { label: t("East", "东区"), value: 7440, color: 1 },
        { label: t("West", "西区"), value: 4650, color: 5 },
        { label: t("Europe", "欧洲"), value: 3570, color: 2 },
        { label: t("Asia", "亚太"), value: 2580, color: 3 },
      ],
    }),
    example("cache-space-treemap", "cloud", ["Cache footprint", "缓存空间构成"], 640, "GiB", ["Physical bytes by cache purpose", "按用途统计实际占用"], {
      kind: "treemap", parts: [
        { label: t("Weights", "权重"), value: 276, color: 5 },
        { label: "KV cache", value: 168, color: 1 },
        { label: t("Images", "镜像"), value: 99, color: 2 },
        { label: t("Artifacts", "制品"), value: 65, color: 3 },
        { label: t("Other", "其他"), value: 32, color: 6 },
      ],
    }),
    example("inference-route-sankey", "inference", ["Inference traffic routing", "推理流量路由"], 12000, t("requests", "次"), ["Gateway to provider and outcome", "从网关分流到提供商和结果"], {
      kind: "sankey", nodes: [
        { label: t("Gateway", "网关"), color: 1 },
        { label: t("Primary", "主路由"), color: 5 },
        { label: t("Fallback", "备用"), color: 2 },
        { label: t("Success", "成功"), color: 4 },
        { label: t("Timeout", "超时"), color: 3 },
        { label: t("Limited", "限流"), color: 7 },
      ], links: [
        { source: 0, target: 1, value: 8900 }, { source: 0, target: 2, value: 2200 }, { source: 0, target: 5, value: 900 },
        { source: 1, target: 3, value: 8300 }, { source: 1, target: 4, value: 600 },
        { source: 2, target: 3, value: 2000 }, { source: 2, target: 4, value: 200 },
      ],
    }),
    example("observability-flow-sankey", "reliability", ["Telemetry processing flow", "遥测处理流向"], 900, "GiB", ["Ingested during the last day", "近 24 小时采集量"], {
      kind: "sankey", nodes: [
        { label: t("Logs", "日志"), color: 1 },
        { label: t("Traces", "链路"), color: 5 },
        { label: t("Pipeline", "处理"), color: 2 },
        { label: t("Live", "实时"), color: 4 },
        { label: t("Archive", "归档"), color: 3 },
      ], links: [
        { source: 0, target: 2, value: 630 }, { source: 1, target: 2, value: 270 },
        { source: 2, target: 3, value: 360 }, { source: 2, target: 4, value: 540 },
      ],
    }),
    example("model-volume-rank", "inference", ["Model request volume rank", "模型调用量排名趋势"], 1, t("rank", "名"), ["Model A · latest daily ranking", "模型 A · 最新日排名"], {
      kind: "rank", periods: rankPeriods, series: [
        { label: t("Model A", "模型 A"), ranks: [3, 2, 2, 1, 1], color: 1 },
        { label: t("Model B", "模型 B"), ranks: [1, 1, 1, 2, 3], color: 5 },
        { label: t("Model C", "模型 C"), ranks: [2, 3, 4, 3, 2], color: 2 },
        { label: t("Model D", "模型 D"), ranks: [4, 4, 3, 4, 4], color: 3 },
      ],
    }),
    example("gpu-region-rank", "cloud", ["Regional GPU demand rank", "区域 GPU 需求排名"], 2, t("rank", "名"), ["East region · latest daily ranking", "东区 · 最新日排名"], {
      kind: "rank", periods: rankPeriods, series: [
        { label: t("East", "东区"), ranks: [1, 1, 2, 3, 2], color: 5 },
        { label: t("West", "西区"), ranks: [2, 2, 1, 1, 1], color: 1 },
        { label: t("Europe", "欧洲"), ranks: [3, 4, 3, 2, 3], color: 2 },
        { label: t("Asia", "亚太"), ranks: [4, 3, 4, 4, 4], color: 3 },
      ],
    }),
  ];
}

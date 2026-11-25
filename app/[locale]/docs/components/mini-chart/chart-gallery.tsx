"use client";

import { memo, useDeferredValue, useMemo, useRef, useState } from "react";
import { useIcon } from "@zeron/icons/context";
import { Button } from "@zeron/ui/button";
import { Card } from "@zeron/ui/card";
import { ChartDataTable, type ChartColorIndex } from "@zeron/ui/chart-primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@zeron/ui/dialog";
import { Input } from "@zeron/ui/input";
import { MiniChart, type MiniChartSpec } from "@zeron/ui/mini-chart";
import { PageBody, PageContent, PageDescription, PageHeader, PageHeaderContent, PageLayout, PageTitle } from "@zeron/ui/page-layout";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import type { AppLocale } from "@/app/_i18n/routing";
import { chartExamples, type ChartExample, type GalleryCategory } from "./chart-examples";
import styles from "./chart-gallery.module.css";

const categoryLabels: Record<GalleryCategory, string> = {
  cloud: "Cloud 云资源", inference: "AI inference 推理", reliability: "Reliability 可靠性 运维", cost: "Cost FinOps 成本 配额",
};

const shapes: { id: MiniChartSpec["kind"] | "all"; en: string; zh: string }[] = [
  { id: "all", en: "All forms", zh: "全部图形" },
  { id: "line", en: "Line", zh: "折线" },
  { id: "area", en: "Area", zh: "面积" },
  { id: "bar", en: "Bar", zh: "柱形" },
  { id: "range", en: "Range", zh: "区间柱" },
  { id: "radial", en: "Radial", zh: "环形与饼图" },
  { id: "meter", en: "Meter", zh: "进度与标尺" },
  { id: "matrix", en: "Matrix", zh: "热图与点阵" },
  { id: "segments", en: "Segments", zh: "分段条" },
  { id: "timeline", en: "Timeline", zh: "时间轨" },
  { id: "scatter", en: "Scatter", zh: "散点" },
  { id: "funnel", en: "Funnel", zh: "漏斗" },
  { id: "box", en: "Box plot", zh: "箱线图" },
  { id: "bullet", en: "Bullet chart", zh: "子弹图" },
  { id: "dumbbell", en: "Dumbbell", zh: "哑铃图" },
  { id: "trace", en: "Trace waterfall", zh: "调用链瀑布图" },
  { id: "radar", en: "Radar", zh: "雷达图" },
  { id: "treemap", en: "Treemap", zh: "矩形树图" },
  { id: "sankey", en: "Sankey", zh: "桑基图" },
  { id: "rank", en: "Rank trend", zh: "排名变化图" },
];

const shapeKeywords = new Map(shapes.map(({ id, en, zh }) => [id, `${en} ${zh}`]));

const palettes: { id: string; en: string; zh: string; color?: ChartColorIndex }[] = [
  { id: "default", en: "Series color", zh: "系列色" },
  { id: "blue", en: "Blue", zh: "蓝色", color: 1 },
  { id: "teal", en: "Cyan", zh: "青色", color: 2 },
  { id: "violet", en: "Violet", zh: "紫色", color: 5 },
  { id: "amber", en: "Amber", zh: "琥珀色", color: 3 },
];

function asSource(example: ChartExample, locale: AppLocale, color?: ChartColorIndex) {
  const unit = example.chartUnit ?? example.unit;
  return [
    '"use client";',
    'import { MiniChart, type MiniChartSpec } from "@zeron/ui/mini-chart";',
    "",
    `const spec: MiniChartSpec = ${JSON.stringify(example.spec, null, 2)};`,
    "",
    "export default function Example() {",
    "  return (",
    "    <MiniChart",
    "      spec={spec}",
    `      label=${JSON.stringify(example.title)}`,
    `      unit=${JSON.stringify(unit)}`,
    `      locale="${locale}"${color ? `\n      colorIndex={${color}}` : ""}`,
    "    />",
    "  );",
    "}",
  ].join("\n");
}

function rawReadings(spec: MiniChartSpec): { label: string; value: string }[] {
  if ("data" in spec) return spec.data.map((point) => ({
    label: spec.kind === "scatter" ? `${point.label} · ${point.x}` : point.label,
    value: point.range ? `${point.range.join("–")}${point.first !== undefined && point.last !== undefined ? ` · ${point.first} → ${point.last}` : ""}${spec.rangeMode === "waterfall" ? ` · ${point.value}` : ""}`
      : (spec.series ?? [{ key: "value" as const }]).map((entry) => point[entry.key] ?? "—").join(" / "),
  }));
  if (spec.kind === "radial") return spec.parts.map((part) => ({ label: part.label, value: spec.total ? `${part.value} / ${spec.total}` : String(part.value) }));
  if (spec.kind === "segments") return spec.rows.flatMap((row) => row.parts.map((part) =>
    ({ label: row.label ?? part.label, value: row.total === undefined ? String(part.value) : `${part.value} / ${row.total}` })));
  if (spec.kind === "matrix") {
    return Array.from({ length: Math.ceil(spec.cells.length / spec.columns) }, (_, index) => ({
      label: String(index + 1),
      value: spec.cells.slice(index * spec.columns, (index + 1) * spec.columns).map((cell) => cell ?? "—").join(" · "),
    }));
  }
  if (spec.kind === "timeline") return spec.windows.map((window) => ({ label: window.label, value: `${window.start}–${window.end} min` }));
  if (spec.kind === "funnel") return spec.stages.map((stage) => ({ label: stage.label, value: String(stage.value) }));
  if (spec.kind === "meter") return [{ label: `${spec.min ?? 0}–${spec.max}`, value: String(spec.value) }];
  switch (spec.kind) {
    case "box": return spec.rows.map(({ label, statistics: [min, q1, median, q3, max] }) => ({
      label, value: `Min ${min} · Q1 ${q1} · P50 ${median} · Q3 ${q3} · Max ${max}`,
    }));
    case "bullet": return spec.rows.map(({ label, value, target }) => ({ label, value: `${value} / ${target}` }));
    case "dumbbell": return spec.rows.map(({ label, before, after }) => ({ label, value: `${spec.beforeLabel} ${before} → ${spec.afterLabel} ${after}` }));
    case "trace": return spec.spans.map(({ label, start, end }) => ({ label, value: `${start}–${end} · Δ ${end - start}` }));
    case "radar": return spec.metrics.map(({ key, label }) => ({
      label, value: spec.series.map((series) => `${series.label} ${series.values[key] ?? "—"}`).join(" · "),
    }));
    case "treemap": return spec.parts.map(({ label, value }) => ({ label, value: String(value) }));
    case "sankey": return spec.links.map(({ source, target, value }) => ({
      label: `${spec.nodes[source]?.label ?? "—"} → ${spec.nodes[target]?.label ?? "—"}`, value: String(value),
    }));
    case "rank": return spec.periods.map((label, index) => ({
      label, value: spec.series.map((series) => `${series.label} #${series.ranks[index] ?? "—"}`).join(" · "),
    }));
  }
}

function ExampleSource({ example, locale, color }: { example: ChartExample; locale: AppLocale; color?: ChartColorIndex }) {
  const en = locale === "en";
  const Copy = useIcon("copy");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const source = asSource(example, locale, color);
  const readings = rawReadings(example.spec);
  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle>{example.title}</DialogTitle>
        <DialogDescription>{example.context}</DialogDescription>
      </DialogHeader>
      <pre className={styles.source} tabIndex={0} aria-label="TSX"><code>{source}</code></pre>
      <ChartDataTable
        caption={example.title}
        summary={en ? "View source data" : "查看原始数据"}
        columns={[en ? "Sample" : "样本", example.chartUnit || example.unit || (en ? "Value" : "数值")]}
        rows={readings.map((reading, index) => ({ id: String(index), label: reading.label, values: [reading.value] }))}
      />
      <DialogFooter>
        <span aria-live="polite" className="mr-auto text-label text-fg-muted">
          {copyState === "copied" ? (en ? "Copied" : "已复制") : copyState === "error" ? (en ? "Select the code to copy it." : "可在代码框中选取并复制。") : ""}
        </span>
        <Button size="sm" variant="neutral" leadingIcon={Copy} onClick={copy}>{en ? "Copy TSX" : "复制 TSX"}</Button>
      </DialogFooter>
    </>
  );
}

const GalleryCard = memo(function GalleryCard({ example, locale, color }: { example: ChartExample; locale: AppLocale; color?: ChartColorIndex }) {
  const Code = useIcon("file-text");
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const en = locale === "en";
  return (
    <Card className={styles.card} data-chart-card={example.id}>
      <h2 className={styles.cardTitle} title={example.title}>{example.title}</h2>
      <p className={styles.metric}>
        <span className={styles.metricValue}>{number.format(example.value)}</span>
        <span className={styles.metricUnit}>{example.unit}</span>
      </p>
      <div className={styles.plot} data-chart-preview>
        <MiniChart spec={example.spec} label={example.title} locale={locale} unit={example.chartUnit ?? example.unit} colorIndex={color} className="h-full" />
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.context} title={example.context}>{example.context}</span>
        <Dialog>
          <DialogTrigger render={<Button variant="ghost" size="sm" leadingIcon={Code} aria-label={en ? `View TSX for ${example.title}` : `查看 ${example.title} 的 TSX`} />}>
            {en ? "Code" : "代码"}
          </DialogTrigger>
          <DialogContent size="lg">
            <ExampleSource example={example} locale={locale} color={color} />
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
});

export function MiniChartGallery({ locale }: { locale: AppLocale }) {
  const en = locale === "en";
  const t = (english: string, chinese: string) => en ? english : chinese;
  const examples = useMemo(() => chartExamples(locale), [locale]);
  const Replay = useIcon("rotate-ccw");
  const [shape, setShape] = useState("all");
  const [input, setInput] = useState("");
  const [palette, setPalette] = useState("default");
  const [speed, setSpeed] = useState("1");
  const gallery = useRef<HTMLDivElement>(null);
  const normalizedQuery = useDeferredValue(input.trim().toLocaleLowerCase(locale));
  const primaryColor = palettes.find((option) => option.id === palette)?.color;
  const displayed = examples.filter((example) =>
    (shape === "all" || shape === example.spec.kind)
    && (!normalizedQuery || `${example.title} ${example.name} ${example.context} ${example.unit} ${categoryLabels[example.category]} ${shapeKeywords.get(example.spec.kind)}`.toLocaleLowerCase(locale).includes(normalizedQuery)));
  const formCount = new Set(displayed.map((example) => example.spec.kind)).size;
  const resultCount = t(`${displayed.length} examples`, `${displayed.length} 个示例`);

  function replayPreviews() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gallery.current?.querySelectorAll<HTMLElement>("[data-chart-preview]").forEach((plot) => {
      const bounds = plot.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      plot.getAnimations().forEach((animation) => animation.cancel());
      plot.animate([{ clipPath: "inset(0 100% 0 0)", opacity: 0.45 }, { clipPath: "inset(0)", opacity: 1 }], {
        duration: 680 / Number(speed),
        easing: "cubic-bezier(.22,.61,.36,1)",
      });
    });
  }

  function clearFilters() {
    setInput("");
    setShape("all");
  }

  return (
    <PageLayout size="full" gutter="none" className={styles.frame}>
      <PageHeader className={styles.hero}>
        <PageHeaderContent>
          <div className="min-w-0">
            <PageTitle className={styles.title}>{t("Mini charts", "迷你图表")}</PageTitle>
            <PageDescription className={styles.description}>
              {t("Compact charts for cloud infrastructure, AI inference, and operations.", "适用于云资源、AI 推理和运维的紧凑图表。")}
            </PageDescription>
          </div>
        </PageHeaderContent>
      </PageHeader>
      <PageContent className={styles.pageContent}>
        <PageBody className={styles.body}>
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              <div className={styles.search}>
                <Input type="search" variant="outline" size="sm" value={input} onChange={(event) => setInput(event.currentTarget.value)} aria-label={t("Search charts", "搜索图表")} placeholder={t("Search charts…", "搜索图表…")} />
              </div>
              <Select value={shape} onValueChange={setShape} size="sm">
                <SelectTrigger aria-label={t("Chart form", "图形类型")} />
                <SelectContent>{shapes.map((option) => <SelectItem key={option.id} value={option.id}>{en ? option.en : option.zh}</SelectItem>)}</SelectContent>
              </Select>
              <span className={styles.count} aria-live="polite">
                {formCount > 1 ? t(`${formCount} forms · ${resultCount}`, `${formCount} 种图形 · ${resultCount}`) : resultCount}
              </span>
            </div>
            <div className={styles.previewControls}>
              <Select value={palette} onValueChange={setPalette} size="sm">
                <SelectTrigger aria-label={t("Series color", "系列颜色")} />
                <SelectContent>{palettes.map((option) => <SelectItem key={option.id} value={option.id}>{en ? option.en : option.zh}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="tertiary" size="sm" onClick={() => setSpeed(speed === "1" ? "2" : speed === "2" ? "0.5" : "1")}
                title={t("Cycle playback speed", "切换播放速度")} aria-label={t(`Playback speed ${speed}×. Change speed`, `播放速度 ${speed}×，点按切换`)}>
                {speed}×
              </Button>
              <Button variant="tertiary" size="sm" leadingIcon={Replay} onClick={replayPreviews} disabled={!displayed.length}>
                {t("Replay", "重播")}
              </Button>
            </div>
          </div>
          <div className={styles.gallery} ref={gallery}>
            {displayed.map((example) => <GalleryCard key={example.id} example={example} locale={locale} color={primaryColor} />)}
          </div>
          {!displayed.length && (
            <div className={styles.empty}>
              <p>{t("No matching charts", "没有符合条件的图表")}</p>
              <Button variant="secondary" size="sm" onClick={clearFilters}>{t("Clear filters", "清除筛选")}</Button>
            </div>
          )}
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}

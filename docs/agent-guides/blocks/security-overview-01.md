---
schema_version: 1
name: security-overview-01
kind: block
status: stable
summary: 安全评分、四级风险趋势、六维态势与受影响资产的嵌入式概览。
registry_import: "@/components/blocks/security-overview-01"
source: packages/blocks/src/application/security-overview-01/security-overview.tsx
types: packages/blocks/src/application/security-overview-01/security-overview-types.ts
registry: packages/blocks/registry.json
related: [project-monitor-01, metric-card, chart, tabs, badge]
---

# 安全概览

嵌入式 React 数据 block，不创建应用外壳。默认宽度上限 576px，按容器宽度将四指标切成两列、雷达图与数值列表切成上下排列。默认中文，可用 labels、locale、timeZone 覆盖；默认时区 Asia/Shanghai。

```tsx
import { useState } from "react";
import { SecurityOverview, createSecurityOverviewDemoData, type SecurityOverviewRange } from "@/components/blocks/security-overview-01";

export function SecurityPreview() {
  const [range, setRange] = useState<SecurityOverviewRange>("30d");
  return <SecurityOverview scopeId="northwind" data={createSecurityOverviewDemoData(range)} range={range} onRangeChange={setRange} />;
}
```

## 数据口径

data.scopeId 必须匹配 scopeId，data.range 必须匹配 range。旧范围窗口指标进入加载状态，不能在新范围标签下显示旧曲线。宿主使用请求序号或 AbortController 防止过期响应覆盖；block 不发起查询。当前评分/未解决数/扫描资产为当前快照；前期比较、解决数、新资产、修复耗时、趋势和历史态势随窗口变化。

评分和等级由宿主给定，不从漏洞数量推断。score 范围 0–100、finding.score 范围 0–10；null 是未知，零是真实值。时间为 UTC 毫秒；medianFixTimeHours 是服务端聚合的中位数。四级互斥风险计数求和得到未解决数；affectedAssetCount 与 scannedAssetCount 独立于列表预览长度。

趋势时间严格递增、处于 window 内；非法时间窗口不绘图，缺失/非法计数保留断点。面积堆叠表达合计，Tooltip 显示原始单级值。雷达固定 0–100；缺失数据不补零；旁置数值列表提供可读替代。风险预览按评分降序、发现时间降序、ID 排序，宿主传预览子集时也应保证它是正确的全局子集。

## 状态与动作

range/onRangeChange 为受控查询；view/defaultView/onViewChange 支持受控或非受控视图。scope 切换重置本地视图。state 为 ready/loading/stale/error；stale 保留快照，error 隐藏指标并可通过 actions.onRetry 重试。

scan 由宿主控制：idle → starting → running → refreshing → succeeded，失败为 failed。onRunScan 触发时宿主立即设置 starting，再处理异步任务；jobId 归属 scope，进度未知时不伪造百分比。扫描期间保留旧评分，环形图显示扫描进度，文本说明旧快照。完成 snapshotId 未对应 data.id 时仍等待结果。任务/范围切换后由宿主刷新当前窗口，防止过期任务写入其他 scope。

onExport 触发时宿主立即设置 exportState=pending；回调收到 scopeId/snapshotId/range，绑定点击时的快照。失败用 exportState=error/exportError，允许重试。没有有效当前范围快照时禁用导出；有旧快照的扫描过程中可导出该快照。没有回调的扫描/关闭/导出/查看全部入口隐藏，详情行只在提供回调时可点击。关闭只通知宿主，不自动取消服务器任务。

## 演示与组件

createSecurityOverviewDemoData 提供固定示例。文档 demo 实际执行模拟扫描、失败重试、详情 Dialog、完整集合查看、关闭/重新打开和 JSON 下载。定时器在卸载时清理；不连接真实目标。Toast 仅由 demo 宿主拥有，block 自身没有全局 Toaster。

外层使用 Container，顶部/底部使用 ContainerHeader / ContainerFooter，评分区和各 Tab 内容使用 ContainerBody，保持 raised / floating 表面层级。顶部标题为 text-body / font-medium，与嵌入式面板一致。组合 MetricCard、Tabs、Select、Button、Badge、Chart、Tooltip、Skeleton、Empty、InlineNotice。四级分类映射复用 badgeColors 的 red/orange/amber/gray，操作和评分采用语义颜色；无新增全局 CSS。图表不播放逐点增长动画，趋势提供可展开的数值表，所有图文按钮使用公开图标槽。

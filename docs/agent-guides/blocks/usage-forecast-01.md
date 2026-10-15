---
schema_version: 1
name: usage-forecast-01
kind: block
status: stable
summary: 多账户额度预测，包含分段时间轴、可排序表格、耗尽区间和账户详情图表。
registry_import: "@/components/blocks/usage-forecast-01"
source: packages/blocks/src/application/usage-forecast-01/usage-forecast.tsx
types: packages/blocks/src/application/usage-forecast-01/usage-forecast-types.ts
registry: packages/blocks/registry.json
related: [card, tabs, table, status-overview, line-chart, bar-chart, chart-core]
---

# 账户用量预测

React data-block，不创建应用外壳。复用 Card、Tabs、Table、LineChart、Area、BarChart、ReferenceArea 和现有语义变量。

表格的已用列复用 StatusOverview（StatusBarChart）的 chart 模式，通过公开 railHeight={20} 和 label={null} 展示 20px 高的胶囊条，精确百分比在左侧同排显示。nodes 由 25 个等宽额度刻度组成，每格代表 4%，高亮格数四舍五入。operational / unknown 仅用作已用和剩余的配色槽位，不表示服务健康；chartColors 将已用映射到 chart-1，剩余映射到 chart-6 的 35% 透明度，确保选中行仍能看到剩余额度。保留周期平均速度标记，使用原生胶囊几何、悬停提示与键盘浏览，不覆盖内部样式。

图表优先使用现有 chart 槽位：主用量、时间轴和额度内柱形使用 chart-1（回退 brand），当前速度投影使用 chart-2，平均速度与额度参考线使用 chart-6，耗尽标记与停用斜纹使用 chart-7，超额柱形使用 chart-3。图例和 tooltip 与对应系列保持一致；坐标、文字、网格和表面仍使用原有语义变量，不新增调色板。

常规文字、表头、数据、图例和 tooltip 使用 text-body（默认 14px），描述与操作提示可使用 text-label（默认 12px），标题保留 heading / title 层级。图表轴通过公开 labelClassName="text-body" 设置字号，SVG 标注使用 var(--font-size-body)，不写死像素字号。

```tsx
import { UsageForecast, usageForecastDemoAccounts, usageForecastDemoNow } from "@/components/blocks/usage-forecast-01";

export function AccountForecast() {
  return <UsageForecast accounts={usageForecastDemoAccounts} now={usageForecastDemoNow} timeZone="Asia/Shanghai" />;
}
```

accounts 使用稳定唯一 id；usedPercent 为 0–100 有限数；windowStart / resetsAt / now 为 epoch 毫秒，当前窗口满足 windowStart <= now < resetsAt。dailyRate 为非负的近期每日百分点消耗，省略时使用已用额度 / 已经过天数；零值表示暂停使用，不代表未知。pace 是 dailyRate 与整周期均摊额度的比值；allowed 是剩余额度 / 剩余天数。达到 100% 的时刻严格早于重置才算提前耗尽；从该时刻到重置之间显示停用斜纹，不预测新周期。history 为可选的真实历史采样，缺失时不伪造曲线；recentUsage 提供每日独立消耗点及显示标签，不要求与当前周期累计值相加一致。status=new / disconnected 始终保持未知，不从旧数据推断。

recentUsage 的 id 在账户内必须非空且唯一，显示标签可重复。已用 100% 的 ready 账户即使周期刚开始也显示已耗尽，此时没有采样速度就保持 dailyRate / pace 未知。包含未知账户且没有已知耗尽风险时，顶部使用普通预测标题和可选 pendingSummary 文案，不宣称所有账户正常。少于一小时的剩余或停用时间显示 `<1 h`（单位按 labels.hours 本地化）。每日柱图的 yDomain 同时包含真实消耗与每日可用额度，确保额度线可见；时间轴的“现在”标签仅在两端日期之间有足够空间时显示，当前用量标记与键盘查看仍保留。

view / selectedAccountId / sort 分别支持受控状态与对应回调，defaultView / defaultSelectedAccountId / defaultSort 设置非受控初值。排序未知值始终置底。选择失效时回退到最早耗尽账户或首个账户。onAccountSelect 返回完整输入账户。labels 可替换所有业务文案；提供英文默认值和 usageForecastZhLabels，日期按 locale / timeZone 格式化。示例 logo 使用已有 @lobehub/icons；logo 可自定义，未知提供商回退到公开图标 provider。

state 支持 ready / loading / error，空 accounts 显示空态；错误可提供 errorMessage / onRetry。无效 ID、百分比、周期或消耗数据显示校验错误。宽屏预测模式使用左侧时间轴及右侧详情；表格模式详情位于底部，双栏通过 subgrid 共享标题、用量摘要、图表和图例行，统一绘图区底线与横轴标签位置。近期用量、每日消耗单位和每日可用额度合为同一段文字，与左侧已用摘要对齐；窄容器允许自然换行并改为纵向布局，横向滚动只属于时间轴或表格。键盘通过 Tabs、账户按钮和排序按钮操作，图表保留原生键盘查看能力。

宿主负责真实查询、快照更新、账户连接及权限。demo 数据固定在 2026-10-15，未接入真实服务。

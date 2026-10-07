---
schema_version: 1
name: sales-conversion-funnel-01
kind: block
status: stable
locale: zh-CN
summary: 包含成交数、转化率、阶段标签和团队真实堆叠面积的销售漏斗容器。
package_import: "@zeron/blocks/sales-conversion-funnel-01"
registry_import: "@/components/blocks/sales-conversion-funnel-01"
source: packages/blocks/src/application/sales-conversion-funnel-01/sales-conversion-funnel.tsx
registry: packages/blocks/registry.json
typecheck_examples: true
related: [container, funnel-chart, icon-context, utils]
---

# Sales Conversion Funnel 01

安装 `npx zeron-ui add sales-conversion-funnel-01`。可嵌入现有页面，保留宿主布局。以下示例使用工作区导入；Registry 消费项目使用 `@/components/blocks/sales-conversion-funnel-01`。

```tsx
import { SalesConversionFunnel, salesFunnelDemoStages, salesFunnelDemoTeams } from "@zeron/blocks/sales-conversion-funnel-01";

export function SalesFunnelPreview() {
  return <SalesConversionFunnel stages={salesFunnelDemoStages} teams={salesFunnelDemoTeams} />;
}
```

`stages` 按业务顺序传入唯一 id、label 和 values；`teams` 使用 FunnelSeries 的 key、label、color，key 唯一且非空。每个阶段必须提供所有团队的非负有限绝对数量，零值有效，缺失不补零。总量由团队求和。成交数为最后阶段总量，转化率及各阶段比例以首阶段总量为分母。空数据不伪造零成交；全零数据显示零成交、未知转化率及空态；数据无效不绘图。

图形复用 FunnelChart 的可选 series 模式，团队按数组顺序从下向上堆叠，公共边界平滑衔接，末段收尖仅表示流程结束，不增加一个零值业务阶段。高度遵循数据比例；不照搬参考图的等步长示意高度。示例拆分不是生产销售数据。

复用 Container、ContainerHeader、ContainerBody、useIcon 和现有主题变量。Header 放标题及右侧操作；成交数、转化率、阶段标签、图表和团队图例均放在同一个 Body 中。`actions` 是宿主拥有的 ReactNode，未传则无操作入口；不伪造刷新或业务菜单。`title`、`labels` 和 `locale` 支持本地化，`className` 用于外部布局。默认示例颜色以 brand 为主，通过 brand/surface-floating 的 65% 和 35% 混合形成三档层次，图例与面积同步跟随品牌色及明暗主题；生产团队颜色可使用 chart-* 变量。

窄容器只在阶段和图表区域横向滚动，标题、指标及图例可换行。单一键盘焦点沿用 FunnelChart，左右方向键、Home/End、Escape 操作阶段高亮，屏幕阅读器获得完整阶段及团队数据。尊重减少动画偏好。

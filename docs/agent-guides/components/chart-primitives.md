---
schema_version: 1
name: chart-primitives
kind: component
status: stable
locale: zh-CN
summary: 无 Recharts 依赖的图例、分段条、数据表与调色格式工具。
package_import: "@zeron/ui/chart-primitives"
registry_import: "@/components/ui/chart-primitives"
source: packages/ui/src/components/chart-primitives.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [chart, badge]
---

# Chart Primitives

- `ChartColorIndex` 为 1–5；`chartColor(index)` 返回全局 `var(--chart-N)`，非法运行时索引回到槽位 1。五槽位采用 Panel 体系，当前顺序为主题蓝、青、琥珀、绿、紫，默认系列不含中性色，独立于 Badge 和品牌 Token。旧 gray 分类输入适配到默认槽位 1；中性色只用于结构。主系列显式用槽位 1，多系列固定映射。
- `chartSeriesColor(id)` 按稳定 ID 取五槽位，不随重排、筛选和刷新变化，但允许碰撞。可选第二参数 `{ colorIndex, color }` 按有效索引 → 旧 Badge 分类色适配 → ID 兜底解析。`chartLegacyColor(color)` 仅供旧分类输入兼容，未知色名返回 undefined；不是危险状态映射。`chartStatusColors` 独立提供语义色。
- 图形、图例和关联控件共用同一变量引用，亮暗切换和全局覆盖自动生效。超过五项保留完整标签与数值，不能自动删减实体；必要时通过线型区分。
- `createChartNumberFormatter(locale, options)` 保留未知为 —；percent 的输入为比例 0.15，而非百分数 15。金额的 micros/minor-unit 换算由业务层承担。`createChartTimeFormatter(locale, timeZone, options)` 显式指定时区，非法时间保持未知。
- `ChartLegend` items 含 id/label/color/value/ratio，可选 pressed 提供真实显隐状态；默认静态，不创建隐式显隐状态。onSelect(id) 只执行宿主明确操作；需要显隐时由宿主维护 pressed 并将其应用到图表，组件不会修改数据。长名称换行，不依赖标题提示。占比不完整时由消费者传入 —。
- `SegmentedBar` 共用绘制但 mode 明确区分 capacity 和 distribution。capacity 必传 total，valueText 提供容量和实际用量；distribution 可传明确总量保留未覆盖段。数值不因超额被改小；图形按 max(total, assigned) 缩放。只有省略 total 且分类完整时才派生总量；显式 null 或非法总量保持未知，不绘制完整分布。容量或用量不完整时不提供 aria-valuenow，由 valueText 说明未知部分。容量和分类均仅接受非负值，未知用 null。完整业务说明仍由消费者提供。
- 横向分段条的容器、数据段和剩余轨道均使用 `rounded-sm`，可见段间使用 `gap-0.5`（默认 2px），间隙透出宿主表面。扣除间距后按原始数值比例分配宽度；零值、未知或非法段隐藏且不占间距；全空时保留 muted 轨道。业务消费者不覆盖为 rounded-none / rounded-xs / rounded-full。
- `ChartDataTable` 提供 details/summary/table 的键盘等价入口；原生表格用于展示数据，不负责排序或编辑。

```tsx
import { ChartLegend, SegmentedBar, chartColor } from "@zeron/ui/chart-primitives";
const segments = [{ id: "files", label: "文件", value: 80, color: chartColor(1) }];
export function StorageBar() {
  return <div><SegmentedBar mode="capacity" total={100} segments={segments} valueText="已用 80 / 100 GB" /><ChartLegend items={[{ id: "files", label: "文件", color: segments[0].color, value: "80 GB" }]} /></div>;
}
```

安装 `npx zeron-ui add chart-primitives` 不引入 Recharts。Badge/Alert 的依赖路径也不包含图表引擎。

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

- `chartSeriesColor(id)` 使用稳定 ID 映射分类颜色，不随重排、筛选和刷新变化。有限调色板允许碰撞；需要唯一配色时显式传入已有分类色。`chartStatusColors` 独立提供语义色。
- `createChartNumberFormatter(locale, options)` 保留未知为 —；percent 的输入为比例 0.15，而非百分数 15。金额的 micros/minor-unit 换算由业务层承担。`createChartTimeFormatter(locale, timeZone, options)` 显式指定时区，非法时间保持未知。
- `ChartLegend` items 含 id/label/color/value/ratio，可选 pressed 提供真实显隐状态；默认静态，不创建隐式显隐状态。onSelect(id) 只执行宿主明确操作；需要显隐时由宿主维护 pressed 并将其应用到图表，组件不会修改数据。长名称换行，不依赖标题提示。占比不完整时由消费者传入 —。
- `SegmentedBar` 共用绘制但 mode 明确区分 capacity 和 distribution。capacity 必传 total，valueText 提供容量和实际用量；distribution 可传明确总量保留未覆盖段。数值不因超额被改小；图形按 max(total, assigned) 缩放。只有省略 total 且分类完整时才派生总量；显式 null 或非法总量保持未知，不绘制完整分布。容量或用量不完整时不提供 aria-valuenow，由 valueText 说明未知部分。容量和分类均仅接受非负值，未知用 null。完整业务说明仍由消费者提供。
- `ChartDataTable` 提供 details/summary/table 的键盘等价入口；原生表格用于展示数据，不负责排序或编辑。

```tsx
import { ChartLegend, SegmentedBar } from "@zeron/ui/chart-primitives";
const segments = [{ id: "files", label: "文件", value: 80 }];
export function StorageBar() {
  return <div><SegmentedBar mode="capacity" total={100} segments={segments} valueText="已用 80 / 100 GB" /><ChartLegend items={[{ id: "files", label: "文件", value: "80 GB" }]} /></div>;
}
```

安装 `npx zeron-ui add chart-primitives` 不引入 Recharts。Badge/Alert 的依赖路径也不包含图表引擎。

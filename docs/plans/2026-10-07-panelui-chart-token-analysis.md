# PanelUI Chart 色彩 Token 分析

调查日期：2026-10-07

范围：公开 Charts / Colors / Theming 文档及源码；整理参考设计，不修改 Zeron 组件和当前色盘建议。

源码快照：`079907b7ced4226edfccc8b45b1f829962e3ee5b`。

PanelUI 把图表色彩定义为 **5 个系列位置 Token**，由主题赋值、组件按索引读取。它没有把这些 Token 命名为蓝 / 橙 / 绿，也没有把它们当作由浅到深的数值色阶。文档中的 ramp 在这里表示有顺序的系列色盘，顺序承载关注优先级。来源：[Charts](https://panelui.dev/docs/customization/charts)。

## 1. 对外颜色契约

| Token | 角色 | Panel 浅色 | Panel 深色 |
| --- | --- | --- | --- |
| `--color-chart-1` | 默认主系列 / 最重要的系列 | `#262626` | `#FAFAFA` |
| `--color-chart-2` | 第二系列 | `#3B82F6` | `#60A5FA` |
| `--color-chart-3` | 第三系列 | `#10B981` | `#34D399` |
| `--color-chart-4` | 第四系列 | `#F59E0B` | `#FBBF24` |
| `--color-chart-5` | 第五系列 | `#8B5CF6` | `#A78BFA` |

默认 Panel 的主系列用中性色；单系列图因此不会默认增加一个强烈彩色块。Panel 深色的 `chart-1` 是 `#FAFAFA`，而 `primary` 是 `#F5F5F5`，二者并非所有主题都严格相等。

分类与状态分别命名。即便某些色值相同，`chart-3` 的绿色仍用于系列身份，`success` 才用于成功状态。网格、坐标轴、文字等结构也不从五色盘中取色。来源：[Charts](https://panelui.dev/docs/customization/charts)、[Colors](https://panelui.dev/docs/customization/colors)、[theme.css](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/theme.css)。

## 2. 六套主题的实际色值

以下值来自主题文件，不是按某个固定公式推导出来的建议色盘。

| 主题 | chart-1 | chart-2 | chart-3 | chart-4 | chart-5 |
| --- | --- | --- | --- | --- | --- |
| Panel light | `#262626` | `#3B82F6` | `#10B981` | `#F59E0B` | `#8B5CF6` |
| Panel dark | `#FAFAFA` | `#60A5FA` | `#34D399` | `#FBBF24` | `#A78BFA` |
| Moon light | `#5E6AD2` | `#4EA7FC` | `#27A644` | `#F2C94C` | `#7A7FAD` |
| Moon dark | `#5E6AD2` | `#4EA7FC` | `#27A644` | `#F2C94C` | `#7A7FAD` |
| Grass light | `#24B47E` | `#1F2937` | `#2563EB` | `#F59E0B` | `#DB2777` |
| Grass dark | `#3ECF8E` | `#EDEDED` | `#60A5FA` | `#FBBF24` | `#F472B6` |

可观察到的规则：

- 同一个 slot 的颜色随主题家族变化，例如 chart-1 分别是中性、紫、绿。
- Panel 和 Grass 的浅深配对多数会调整色值；Moon 的五个系列色在两种模式下完全相同。
- 源码直接写出各主题 HEX，没有一套用于全部 Chart Token 的 OKLCH 明度 / 色度生成公式。
- 此处没有默认红色系列；是否使用某个色相与图表系列的业务含义分别处理。

来源：[主题源码](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/theme.css#L281)、[Theming](https://panelui.dev/docs/customization/theming)。

## 3. 定义与运行时读取

主题文件先在 `@theme` 中声明五个变量为 `unset`，随后在 `@layer theme` → `:root` → 各个 `@variant` 中填入静态色值。用户覆盖相同五个变量，就能改变所有遵守该契约的图表。

Uniwind 在原生组件中通过 `useCSSVariable` 读取当前主题的已解析颜色字符串。共享内部函数 `useSeriesColor` 的优先级为：

```text
显式 color → 当前主题的 --color-chart-N → 对应位置的 fallback HEX
```

五个 fallback 依次为 `#3B82F6`、`#10B981`、`#F59E0B`、`#8B5CF6`、`#EC4899`。它们与默认 Panel 色盘并不相同，只用于 Token 未解析成功时兜底，不应作为正常主题配色依据。

来源：[theme.css](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/theme.css#L145)、[useSeriesColor](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/src/utils/chart.ts#L18)。

## 4. 系列如何选色

| 情况 | 实际读取方式 | 注意事项 |
| --- | --- | --- |
| Line / Area / Bar | `colorIndex` 指定 1–5；显式 `color` 优先 | 已核对的三个组件默认 `colorIndex = 1` |
| 多个 Line 或 Bar | 每个系列显式指定 `colorIndex` | 不能假定第二个子组件会自动变为 chart-2 |
| Pie / Hex | datum.color 优先，否则按数据索引循环五色盘 | 超过五项重复；重排可能换色 |
| 图例 | Line / Bar 注册已解析的系列颜色；Pie / Hex 使用同一个 colors 数组 | 图例与实际绘制复用颜色 |
| 独立 SVG / 原生绘图 | 使用 `useCSSVariable` 获取颜色字符串 | Token 未读取时需要兜底 |

业务实体与颜色要长期绑定时，宿主需要维护实体到索引或颜色的映射。PanelUI 的这些默认机制没有 Zeron 当前的稳定 ID 哈希功能。

文档概述存在“后续系列继续取下一色”的表述，但当前 Line / Area / Bar 源码的默认值都是 1；实现应按源码显式配置索引。

来源：[LineChart](https://panelui.dev/docs/charts/line-chart)、[Line 源码](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/src/components/line-chart/index.tsx#L607)、[Bar 源码](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/src/components/bar-chart/index.tsx#L603)、[Pie 源码](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/src/components/pie-chart/index.tsx#L318)、[Hex 源码](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/src/components/hex-chart/index.tsx#L438)。

## 5. 填充、线条与辅助结构

PanelUI 公开的 Chart 系列 Token 只有上述五个。Line 与 Area 都调用同一个 `useSeriesColor`，没有每个系列各一组 fill / stroke Token。LineChart.Area 使用系列色作渐变，其 `opacity` 默认 0.18，并向下渐变至 0。线宽、填充透明度、交互弱化、线型分别控制视觉份量。

辅助结构读取自己的语义色：网格使用 `--color-border`，标签使用 muted foreground，Tooltip 的文字、结构或标记按各自组件角色解析；这些不应整体替换成分类色。

因此，“系列身份”与“绘制强调度”是两组独立决定。仅为了让面积更柔和，不需要在每个业务组件中另造一个 HEX。

来源：[LineChart.Area 源码](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/src/components/line-chart/index.tsx#L704)、[Charts 的结构与绘制参数](https://panelui.dev/docs/customization/charts#the-furniture)。

## 6. 原生平台边界与例外

- PanelUI 是 React Native / Uniwind 方案。主题覆盖采用 `@variant`；它的文档明确限制普通 Web 的 `.dark` 覆盖方式，并要求每个主题定义相同变量。
- 主题色值使用预计算 HEX / rgba。原生运行时不能照搬 Web 的 `color-mix()`，`light-dark()` 也不适用于它的主题解析。
- 普通 Chart 的 `color` 接受可绘制的颜色字符串，不直接解析 `--color-chart-3` 这样的 Token 名字。若要跟随主题，改全局 Token 或读取已解析值。
- Heatmap 的 `color` / `emptyColor` 是例外：可接受 Token 名。它按一个基色与不同透明度表达数值强弱，也支持显式 `levelColors`，不使用五个类别色代表五档数值。
- Candlestick 使用 success / destructive 表达涨跌，这是状态编码，不是两条分类系列。

来源：[Colors](https://panelui.dev/docs/customization/colors)、[Theming](https://panelui.dev/docs/customization/theming)、[Heatmap 源码](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/src/components/heatmap-chart/index.tsx#L415)、[Charts](https://panelui.dev/docs/customization/charts)。

## 7. 对 Zeron 的启发（建议，非 PanelUI 原有功能）

| 维度 | PanelUI | 当前 Zeron |
| --- | --- | --- |
| 公共系列入口 | 五个全局系列位置 Token | 默认八色数组来自 Badge dot；业务 Block 显式传 Badge 色名 |
| 默认分配 | 组件索引或数据顺序 | `chartSeriesColor(id)` 的稳定 ID 哈希 |
| 主题控制 | 每个主题给五个 Token 独立赋值 | ChartConfig 可配 light / dark；默认分类 HEX 不随主题变化 |
| 状态 | 独立语义 Token | 已有独立 `chartStatusColors` |
| 面积 / 线条 | 同一系列色配合绘制参数 | 当前 TimeSeriesChart 同色填充和描边；上一份方案提出两阶扩展 |

建议借鉴其 **系列位置 Token → 主题赋值 → 统一读取** 的结构，同时保留 Zeron 的稳定业务 ID 映射。

1. 为 Chart 建立全局系列入口，例如 `--chart-1` 到 `--chart-6`；五或六是产品选择，不是必须复制 PanelUI 的限制。
2. 在当前手工 Token 源定义 light / dark，交由现有生成流程发布。Zeron 是 Web 项目，可以继续使用已有 `light-dark()` 或 `.dark` 机制，无须搬入 Uniwind。
3. 由宿主维护同一业务实体的 ID → slot 映射；哈希仅作允许碰撞的兜底。筛选与重排不重新按数组下标分配。
4. Badge、Slider、Recharts、Router SVG 读取同一个分类映射，减少业务模块各自选色。
5. 保持状态和图表结构颜色独立。若采用前一份浅色色盘的面积 / 标记两阶，两阶都从统一 slot 映射取值；它属于 Zeron 的扩展，不能表述为 PanelUI 的做法。

上述是基于两个项目现状的设计建议；PanelUI 的结构不会自动解决任意品牌蓝与其他颜色的视觉协调，实际色值仍需在目标图表、承载面和浅深主题中验证。

本地依据：[chart-primitives.tsx](../../packages/ui/src/components/chart-primitives.tsx)、[chart.tsx](../../packages/ui/src/components/chart.tsx)、[当前色盘建议](./2026-10-06-chart-palette-proposal.md)。

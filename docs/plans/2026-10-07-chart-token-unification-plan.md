# Zeron Chart Token 统一实施方案

日期：2026-10-07

状态：本轮实施完成（阶段 0–4；后续色盘设计另行推进）

适用范围：公共 Chart 组件、业务 Block、文档示例和 Registry 分发

实施结果与验证证据见 [Chart Token 统一实施记录](./2026-10-07-chart-token-unification-implementation.md)。

先将当前项目的普通图表系列统一到 5 个全局颜色 Token，采用 PanelUI 的五槽位体系；根据实施期间确认的要求，第一槽位采用项目主题蓝，中性色不参与默认系列色盘，第二槽位采用青色，后三项沿用 Panel 的绿、琥珀、紫。完成全部取色入口迁移后，再集中调整 Zeron 的最终色盘。第一阶段交付的是统一的颜色契约和可验证的引用链路，视觉配色会发生预期变化，但数据、布局和交互保持现有契约。

本方案确定本轮的实施选择。此前的 [色盘探索](./2026-10-06-chart-palette-proposal.md) 保留为后续设计参考，其中的扩展色数和 fill / stroke 两阶方案暂不实施。[PanelUI 分析](./2026-10-07-panelui-chart-token-analysis.md) 提供参考项目的定义和平台差异。

## 1 全局系列 Token 与初始配色

PanelUI 将普通系列颜色放在 `--color-chart-1` 至 `--color-chart-5`，与状态色和图表辅助结构色分开。Zeron 采用相同的五槽位体系，并使用当前项目的 Token 命名与生成方式。第一槽位按项目要求调整为主题蓝，第二槽位使用青色，默认系列色盘不含中性色；后续更换颜色仍保留槽位名称。来源：[PanelUI Charts](https://panelui.dev/docs/customization/charts)。

| 系列槽位 | Zeron 基础变量 | Tailwind 颜色入口 | Light | Dark |
| --- | --- | --- | --- | --- |
| 1 | `--chart-1` | `--color-chart-1` | `#0060D2` | `#1483FD` |
| 2 | `--chart-2` | `--color-chart-2` | `#06B6D4` | `#22D3EE` |
| 3 | `--chart-3` | `--color-chart-3` | `#F59E0B` | `#FBBF24` |
| 4 | `--chart-4` | `--color-chart-4` | `#10B981` | `#34D399` |
| 5 | `--chart-5` | `--color-chart-5` | `#8B5CF6` | `#A78BFA` |

Panel 基础色值依据：[Panel 主题源码](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/theme.css#L281)，固定版本 `079907b7ced4226edfccc8b45b1f829962e3ee5b`。实施修订：槽位 1 采用项目当前 `brand` 的亮暗初始值，但仍独立定义；槽位 2 使用独立青色值，默认色盘移除 Panel 中性色，原 Panel 蓝色不再占用另一个槽位，以免两组近似蓝色重复。槽位 3–5 沿用琥珀、绿、紫的亮暗色值；为避免青与绿相邻，顺序调整为蓝、青、琥珀、绿、紫。

槽位表达系列位置，不绑定蓝、橙等色名，也不代表从低到高的数值梯度。Panel 原版第一色是中性色；当前项目要求第一顺位为主题蓝，默认系列不使用中性色。项目自有单系列普通图表显式使用槽位 1，活动热图也采用槽位 1；多系列视图由业务层配置固定映射。面积和描边复用同一个系列 Token，通过现有透明度、渐变和线宽控制强调度。

本轮不将 Chart Token 绑定到 `--brand`、`--fg-brand`、`--fg-success` 或 Badge 色盘。即便初始色值相同，也保留独立定义，使后续换色盘不会改变按钮、链接和状态表达。PanelUI 的未解析颜色 fallback 与默认 Panel 色盘不同，本轮不复制该 fallback。来源：[PanelUI 取色函数](https://github.com/panel-ui/PanelUI/blob/079907b7ced4226edfccc8b45b1f829962e3ee5b/packages/panelui/src/utils/chart.ts#L18)。

## 2 Token 的定义和分发

### 2.1 使用现有语义 Token 源

将下面五项加入 `packages/ui/src/tokens/semantic-tokens.mjs` 的 `componentColorTokens`。该分组已有 light / dark、CSS、Registry 和文档生成支持，本轮无需新增 Token 分类、生成器分支或 `@zeron/tokens` 顶层导出。

```js
{ name: "chart-1", light: "#0060D2", dark: "#1483FD", usage: "普通图表系列槽位 1；默认主系列采用主题蓝，独立于品牌和状态 Token" },
{ name: "chart-2", light: "#06B6D4", dark: "#22D3EE", usage: "普通图表系列槽位 2；不表达状态" },
{ name: "chart-3", light: "#F59E0B", dark: "#FBBF24", usage: "普通图表系列槽位 3；不表达状态" },
{ name: "chart-4", light: "#10B981", dark: "#34D399", usage: "普通图表系列槽位 4；不表达状态" },
{ name: "chart-5", light: "#8B5CF6", dark: "#A78BFA", usage: "普通图表系列槽位 5；不表达状态" },
```

现有 `classify` 会为这些项生成 component 分组的元数据；系列含义由名称和 usage 说明，不扩大状态枚举。五项也会进入现有 `semanticTokens.componentColors` 和 `@zeron/tokens` 的 `componentColorTokens`。

生成后的取色关系如下。此处是目标结构示意，实际 CSS 由生成器产生。

```css
:root, .light, .dark {
  --chart-1: light-dark(#0060D2, #1483FD);
  /* chart-2 至 chart-5 同样定义 */
}

@theme inline {
  --color-chart-1: var(--chart-1);
  /* chart-2 至 chart-5 同样映射 */
}
```

Recharts、SVG 和内联样式直接引用 `var(--chart-N)`；Tailwind 使用 `bg-chart-1`、`stroke-chart-2` 等入口。不要依赖 Tailwind 是否保留某个未使用的 theme 别名作为运行时取色依据。亮暗模式继续沿用项目的 `light-dark()`、系统模式和 `.light` / `.dark` 机制，无需引入 PanelUI 的原生主题运行时。

### 2.2 生成产物必须一起更新

| 文件或入口 | 处理方式 |
| --- | --- |
| `packages/ui/src/tokens/semantic-tokens.mjs` | 五个色值的唯一手工定义处 |
| `app/globals.css` | `pnpm tokens:build` 更新生成区块 |
| `packages/tokens/tokens.css`、`packages/tokens/index.mjs` | 同命令生成，用于 Token 包消费者 |
| `packages/ui/registry.json` 的 `surfaces` 项 | 同命令生成 `theme`、`light`、`dark` 变量 |
| `packages/blocks/registry.json` | 为新增共享工具导入维护 Block 的依赖声明 |
| `SEMANTIC-TOKENS.md` | 同命令更新 Token 表 |
| `public/r/` | `pnpm registry:build` 更新可安装组件及依赖产物 |

`chart-primitives` 当前已依赖 Registry 的 `surfaces`，`chart` 依赖 `chart-primitives`。保持这条依赖链，确保独立安装也能获得五个变量。仅修改文档站全局 CSS，不能算完成。保留其他既有 Registry 依赖；兼容旧色名所需的 Badge 类型依赖不等于使用 Badge 色盘。

`model-router-01` 当前没有声明 `chart-primitives`，迁移时必须在 `packages/blocks/registry.json` 补上该依赖。Cost 和通用日志直方图新增直接导入时也补充相应声明，不依靠文档站的工作区别名掩盖安装缺件。

## 3 公共取色和兼容规则

### 3.1 共享工具

在 `packages/ui/src/components/chart-primitives.tsx` 内完成下列调整，继续通过现有 `@zeron/ui/chart-primitives` 入口导出。

| API | 目标契约 |
| --- | --- |
| `ChartColorIndex` | 新增类型 `1 \| 2 \| 3 \| 4 \| 5` |
| `chartColor(index)` | 新增工具，返回 `var(--chart-N)`；运行时非法索引返回槽位 1 |
| `chartCategoricalColors` | 保留名称，数组改为按顺序排列的五个变量引用 |
| `chartSeriesColor(id, options?)` | 保留现有 ID 哈希算法，改为在五个变量引用中取色；可选 `{ colorIndex, color }` 统一旧业务输入的优先级，原单参数调用继续有效 |
| `chartLegacyColor(color)` | 新增兼容适配器，将旧 Badge 色名转换成全局槽位；非法色名返回 `undefined`，由调用方按 ID 兜底；标记为兼容用途 |
| `chartStatusColors` | 保留现有独立状态色契约 |

默认色盘移除对 `badgeColors` 色值的读取。共享工具返回变量引用，不在首次渲染时读取并缓存 HEX；切换主题或修改父级 Token 后，图形应由 CSS 自动更新。SVG 路径、渐变 stop 和图例标记均遵守这一点。

`chartSeriesColor(id)` 保证同一 ID 在重排、筛选和刷新后稳定，不保证不同 ID 一定不同色。八色改五色会改变部分历史默认颜色，这是本轮明确接受的视觉变化。固定的多系列视图应显式分配槽位，避免哈希碰撞；动态实体使用稳定业务 ID，不能使用翻译后的显示名或当前列表下标。

### 3.2 保留现有组件 API

`ChartConfig.color`、`ChartConfig.theme`、`TimeSeriesChart.series[].color`、`DonutSummary.segments[].color`、`ChartLegend.items[].color` 和 `VisualizationSegment.color` 继续接受现有颜色字符串。项目内普通系列传入 `chartColor(N)` 或 `chartSeriesColor(id)`，本轮不为这些公共组件额外增加 `colorIndex` 属性。

`ChartStyle` 继续生成图表实例内的 `--color-系列键`。例如 `--color-ingest: var(--chart-1)`；它是全局槽位的局部引用，不是另建一套色盘。保留当前 `theme[mode] ?? color` 的选择逻辑，以及数字、中文系列键和实例 ID 的兼容性。

共享组件的优先级仍为“显式颜色 → ID 默认颜色”。外部消费者的显式品牌色覆盖继续生效；项目自有普通系列必须使用全局 Token。明确编码状态的颜色见第 6 节。

### 3.3 旧业务色名的适配

以下公共数据类型各新增可选 `colorIndex?: ChartColorIndex`，保留原来必填的 `color: BadgeColor`，标记其为兼容字段：

- `CreditUsageModel`
- `ModelRouterRoute`
- `StorageUsageItem`
- `ProjectMonitorService` 和 `ProjectMonitorData.storage.categories[]`

不在本轮将必填 `color` 改成可选，以免现有消费者读取该字段时出现类型变化。第一阶段示例数据同时保留旧字段并提供 `colorIndex`；以后删除旧字段需要独立的 API 迁移，不与色值调整混在一起。

这些业务实体按“有效 `colorIndex` → 旧色名适配 → 稳定 ID 兜底”解析一次，再把结果传给图形及图例。对非 TypeScript 输入的非法索引忽略该索引，继续走后续分支；非法旧色名同样退回 ID 兜底。

`chartLegacyColor` 的固定适配表如下，所有结果仍是 `var(--chart-N)`，不保留旧 HEX。

| 旧分类色名 | 槽位 |
| --- | --- |
| gray、blue | 1 |
| cyan | 2 |
| lime、green、emerald、teal | 4 |
| red、orange、amber、yellow、rose | 3 |
| indigo、violet、purple、fuchsia、pink | 5 |

该表用于接受既有分类输入，不保证恢复旧色相或维持唯一颜色。旧 gray 分类输入回到默认槽位 1，不输出中性色。尤其 red 在这里仅作为旧分类色名；危险状态必须走状态色。项目自己的示例和固定系列全部显式配置槽位，不长期依靠此适配表选色。

## 4 三个试点 Block 的具体迁移

### 4.1 固定槽位

下表是本轮确定的示例数据映射。槽位固定在实体上，不能随排序、占比大小、周期或路由策略重新分配。

| Block | 实体 ID | 槽位 |
| --- | --- | --- |
| credit-usage-01 | pixels-ui | 1 |
| credit-usage-01 | claude-opus | 2 |
| credit-usage-01 | gpt-sol | 3 |
| credit-usage-01 | claude-sonnet | 4 |
| credit-usage-01 | gemini-flash | 5 |
| cost-estimate-01 | ingest、storage、queries、seats | 分别为 1、2、3、4 |
| model-router-01 | opus、gpt、haiku、qwen | 分别为 2、3、5、4 |

Credit 与 Router 中 Opus / GPT 的两个 ID 是示例数据内明确对应的模型，因此分别共用槽位 2 / 3。其他模型在不同视图复用有限槽位是允许的。生产数据如需跨视图同色，由业务层配置同一实体映射，不通过显示名称猜测，也不在 UI 库内内置模型品牌字典。

### 4.2 文件与验证点

| Block | 源文件调整 | 完成条件 |
| --- | --- | --- |
| credit-usage-01 | `credit-usage-types.ts` 增加可选索引；`credit-usage-demo-data.ts` 的两个周期按同一 ID 填索引；`credit-usage.tsx` 的 CreditBar 使用解析后的系列色 | 切换周期后同一模型不换槽位；容量剩余段仍为轨道色；模型 Logo 保留品牌表达 |
| cost-estimate-01 | `cost-estimate-data.ts` 将内部 `costEstimateColors` 替换为 typed `costEstimateColorIndices`；summary 和 usage 两个文件共同读取映射 | 堆叠条、费用项圆点、用量标签圆点、Slider 填充完全同色；最低消费补差不冒充用量分类 |
| model-router-01 | `model-router-types.ts` 增加可选索引；demo 按表赋值；`router-flow.tsx`、`model-router.tsx` 共用实体解析结果 | SVG 主线、光点、列表圆点和 share 条同色；策略切换、暂停、重排不改变模型颜色 |

Cost 的 Badge 使用现有自定义颜色入口，例如 `color={{ base: chartColor(index), onStrong: "var(--fg-default)" }}` 配合 `variant="dot"`。该示例限定为 dot 变体，`onStrong` 不作为 strong 变体的对比度承诺。普通 Badge 全局色盘无需修改。

取色示例为实施后的目标用法：

```tsx
import { chartColor, type ChartColorIndex } from "@zeron/ui/chart-primitives";

const costEstimateColorIndices = {
  ingest: 1, storage: 2, queries: 3, seats: 4,
} as const satisfies Record<CostEstimateCategory, ChartColorIndex>;

const segments = costEstimateCategories.map((key) => ({
  id: key, label: labels[key], value: result.amountsMinor[key],
  color: chartColor(costEstimateColorIndices[key]),
}));

// 费用条使用 SegmentedBar mode="distribution"：rounded-sm，gap-0.5。
// 圆点和 Slider 同样读取 chartColor(costEstimateColorIndices[key])。
```

不改变费用计算、整数精度、比例分母、Slider 范围、信用额度归一化或 Router 部署流程。Router 已有描边透明度和动画参数在本轮保留。

## 5 其余消费者的迁移台账

路径以 `packages/blocks/src/application/` 为起点，另有说明的除外。实施时复查新增消费者，并给新增条目补上处理结论。

| 消费者或文件 | 本轮处理 |
| --- | --- |
| `storage-usage-01/storage-usage.tsx` | 容量条与图例共用解析结果；示例 contacts / tasks / deals / emails / companies 为 1–5，other 为 1；六个分类完整保留 |
| `project-monitor-01/project-monitor-charts.tsx` | 非状态的单系列趋势和容量环为 1；Gateway / Auth / Function / Storage 为 1–4；P50 / P95 / P99 为 1–3；不继续用哈希配置固定分位数 |
| `project-monitor-01/project-monitor-types.ts`、demo、`project-monitor-views.tsx` | 给服务和存储分类增加、赋值并透传索引；存储 images / documents / backups / other 为 1–4；透传到 StorageUsage 时不丢失索引 |
| `ai-gateway-overview-01/ai-gateway-overview-charts.tsx` | 普通单系列为 1；inputTokens / outputTokens 为 1 / 2；分位数标记为 1–3；Provider 分布使用稳定 ID；error rate 保留 danger |
| `availability-monitor-01/availability-monitor.tsx` | routed / direct 固定为 1 / 2；线条与可切换图例共用配置 |
| `model-detail-02/model-detail-02.tsx` | prompt / completion / reasoning 和 hermes / codex / other 各为 1 / 2 / 3；已知 Provider 采用固定 ID 映射（openai 5、openai-flex 3、openai-fast 1、azure 2、azure-us 4）避免同图碰撞，未知 Provider 仍按稳定 ID 兜底；Pricing 与性能共用映射 |
| `support-analytics-01/support-analytics-charts.tsx` | TicketTrend 和普通 MetricTrend 为 1；均值线、标记气泡继续使用辅助结构色 |
| `security-overview-01/security-overview-charts.tsx` | Radar 当前 / 上次系列为 1 / 2；风险等级趋势与评分状态按第 6 节保留业务映射 |
| `personal-settings-01/personal-settings.tsx` | 消费趋势和普通排名条为 1；计费归属按稳定身份取色；model / mcp 直方图为 1 / 2；活动热图按蓝色首位修订以槽位 1 为单一基色，保留 30% / 60% / 100% 强度与空格样式 |
| `infinite-log-table-01/infinite-log-generic-table-view.tsx` | 通用动态 counts 系列按业务 key 取色，移除按数组位置使用 brand / warning / danger / info 的分类色数组 |
| `infinite-log-table-01/infinite-log-table-view.tsx` | success / warning / error 为真实结果状态，保留领域状态色与图例一致性 |
| `packages/ui/src/components/time-range-histogram.tsx` | 保留显式 `series.color` API；迁移内部示例和调用方的分类色；选择范围、手柄和边界仍使用交互色 |
| `docs/pages/components/chart/page.tsx`、`chart-primitives/page.tsx`、`time-range-histogram/page.tsx` | 普通示例使用全局槽位，单系列显式为 1；预览与可复制代码保持同一取色方式；known / uncovered 不借用 success 表达普通容量；实际结果状态示例保留状态色 |
| `docs/pages/components/semantic-tokens/page.tsx` | 补充五个 Chart Token 的亮暗预览和引用说明；该页当前没有自动展示整个 componentColorTokens 分组 |
| `resource-status-all-01`、`resource-metric-list-01` | 按追加要求接入全局 Chart 色盘；正常为 1、告警为 3、严重／异常为 5、未知为 2；圆环、图例与分段条共用类别映射，保留状态字段、数据和覆盖计算 |
| `file-upload-01` | 保留现有文件操作进度语义，列为已核对的保留项 |

五槽位不意味着只能展示五个实体。超过五项时允许重复，但保持完整标签、数值、图例和已有数据表；不同实体不能因为颜色数量不足而被删除或自动合并为 Other。Storage 的六分类是必验用例。重叠的多条曲线如发生同色，优先固定槽位并利用已有线型或标签区分；不能声称五色可保证任意数量系列仅凭颜色区分，也不能临时增加 `chart-6` 或局部 HEX。

## 6 状态和辅助结构的边界

| 颜色角色 | 引用规则 |
| --- | --- |
| 普通系列、类别和构成 | 五个 Chart Token |
| 健康、错误、警告、真实执行结果 | 两个资源分布图以外，沿用现有 `chartStatusColors` 或领域状态映射 |
| 风险等级 critical / high / medium / low | 保留 `securitySeverityColors` 与其 Badge 一致的现有领域映射；这是本轮明确保留的 Badge 色值读取例外 |
| 安全评分中的已有 health tone | 保留原有状态表现，包括已有品牌色的正常状态表达 |
| ResourceStatusAll / ResourceMetricList 的状态构成 | 按用户追加范围使用 Chart 槽位 1 / 3 / 5 / 2；状态身份不变，未知类别不使用中性色 |
| 网格、轴、文本、Tooltip、参考均值 | 现有 boundary / foreground / surface / inverse Token |
| 未使用容量、未分配总量、无数据格 | 现有 muted / surface 轨道，不伪装为普通分类或正常状态 |
| 文件上传进度、时间范围选择和拖动手柄 | 现有操作及选择色 |
| 模型或服务 Logo | 保留品牌素材，不能随 Chart 槽位变色 |

判断以信息含义及用户确定的范围为准，不以是否使用 Recharts 或 SegmentedBar 为准。两个资源分布图按追加要求纳入普通五色盘；其余严重度、健康状态和操作进度保留独立取色。这里的资源映射是消费者的类别配置，不改变全局 `chartStatusColors`。保留项仍需要主题及取色一致性检查。

## 7 实施顺序与交付文件

| 阶段 | 工作内容 | 进入下一阶段的条件 |
| --- | --- | --- |
| 0 冻结基线 | 核对台账；记录三试点及代表图表的 Light / Dark 展示、数据和交互；区分工作区已有改动 | 所有取色点被归为普通系列、状态、结构或操作 |
| 1 建立全局入口 | 添加五 Token；修改共享数组和取色工具；补充索引类型、旧色名适配；生成 Token 与 Registry | 本地和独立安装均能解析五个变量；默认共享图表随主题变化 |
| 2 完成三个试点 | 按第 4 节迁移 Credit、Cost、Router 的类型、示例、图形及关联控件 | 三块亮暗模式、颜色一致性、旧输入兼容和原有交互通过 |
| 3 覆盖所有消费者 | 按第 5 节逐项迁移；核对第 6 节保留项；处理固定系列碰撞 | 普通系列无 Badge 色值和未说明的品牌色依赖；台账无遗漏 |
| 4 完成分发和指南 | 更新文档、示例、Agent 指南、Registry 和独立消费者证据 | 第 8 节验收全部完成，才标记本轮实施完成 |
| 5 后续调整色盘 | 在五个槽位上设计最终 Light / Dark 颜色，重新生成并复验 | 只修改中央色值即可覆盖普通图表及关联控件 |

阶段 1 和试点阶段均需更新安装产物，避免只在文档站成立。按阶段组织可回退的变更；业务数据和领域规则不随配色迁移重写。回退时还原对应源文件并重新生成产物，不单独覆盖 `public/r`，不重置工作区其他改动。

文档同步范围包括：`docs/agent-guides/components/chart.md`、`chart-primitives.md`，受影响的 Block 指南，以及 `docs/content/en/components/`、`docs/content/zh-CN/components/` 的相关说明。补充目前缺少的 `docs/agent-guides/components/time-range-histogram.md`，说明分类系列与结果状态的取色差异。按实际改动更新预览源、指南加载器和 Agent 目录。所有说明统一采用五槽位契约，不再建议普通图表从 Badge 选色。

## 8 验证和验收

### 8.1 有意义的自动验证

扩展现有 `tests/semantic-tokens.test.mjs` 和 `tests/chart-unification.test.tsx`：验证五个固定亮暗值、基础变量与 Tailwind / Registry 别名、包导出、稳定 ID、非法索引、旧色名适配、显式覆盖和固定系列无碰撞。颜色一致性以图形和图例最终引用相同 Token 为准。

继续运行 Credit、Cost、Router、Storage 现有行为测试。`tests/credit-usage-contract.test.ts` 目前直接要求源文件包含 `badgeColors[model.color]`，实施时应将此过时断言改成真正的取色契约验证；不要通过保留无用表达式让测试通过。不要把预期颜色变化当作数据回归，也不要只靠源码包含某个字符串证明视觉正确。

生成与检查命令按顺序执行：

```sh
pnpm tokens:build
pnpm registry:build
pnpm docs:sources:build
pnpm agents:guides:build
pnpm agents:build

pnpm tokens:check
pnpm registry:check
pnpm code-engine:check
pnpm docs:sources:check
pnpm agents:guides:check
pnpm agents:check
pnpm agents:guides:examples:check
pnpm typecheck
```

针对性行为测试：

```sh
pnpm test:unit tests/semantic-tokens.test.mjs tests/chart-unification.test.tsx tests/credit-usage-contract.test.ts tests/credit-usage-interaction.test.tsx tests/cost-estimate-data.test.ts tests/cost-estimate-interaction.test.tsx tests/model-router-flow.test.tsx tests/model-router-interaction.test.tsx tests/storage-usage.test.tsx
```

独立消费者最低覆盖共享组件和三个试点，使用当前安装脚本支持的筛选入口：

```sh
ZERON_CONSUMER_COMPONENTS=chart,chart-primitives,credit-usage-01,cost-estimate-01,model-router-01 ZERON_VITE_CONSUMER_COMPONENTS=chart,chart-primitives,credit-usage-01,cost-estimate-01,model-router-01 pnpm test:consumer:smoke
```

其余改动 Block 也加入本轮安装验证范围。安装成功与视觉验收分别记录；上一轮 unification 安装矩阵不能覆盖本次变化，且其原有条目列表不包含 CostEstimate，不能直接用它替代三试点验证。为新的独立消费者增加浏览器断言：检查五个变量的实际计算结果、Light / Dark 切换、图形与图例同色、单槽位覆盖联动和无未解析变量。沿用现有消费者证据机制记录实际范围与结果。

### 8.2 视觉和交互验收

- [x] 五个 Light / Dark 初始值与第 1 节一致，主题切换无需重新配置 ChartConfig。
- [x] 单独覆盖一个 `--chart-N` 后，引用该槽位的线、面积、柱、圆环、SVG、图例和关联 Slider 一起变化。
- [x] 三试点在两种模式下同一实体颜色一致，周期、策略、过滤和重排不重新分配槽位。
- [x] 各固定多系列视图在五项以内无颜色碰撞；动态和六分类视图保留完整文字与数值解释。
- [x] 所有普通系列取色最终指向五个全局变量；剩余 `badgeColors`、品牌色和显式覆盖均有第 6 节的业务理由。
- [x] 状态含义、Logo、图表辅助结构和交互选择色正确；图例及 Tooltip 文本仍使用可读的前景色。
- [x] 零、null、空数据、超额、未覆盖总量、时间窗口、时区、单位和精度保持现有行为；图例控制与 Router 操作可用。
- [x] 检查普通卡片和实际页面承载面、窄屏及长标签；记录当前五槽位色盘在这些背景上的可辨识性，不宣称其自动满足所有背景的对比度要求。
- [x] Token 包、Registry 安装、文档展示和指南中的取色契约一致，安装消费者无需手工补颜色变量。

## 9 后续更换统一色盘

本轮完成后，最终色盘调整的输入是 `chart-1` 至 `chart-5` 的十个 Light / Dark 值。色彩设计在 Credit、Cost、Router、线图、面积图、圆环和热图的真实承载面上比较，再修改语义源并重新生成；系列 ID、槽位映射和业务组件不需要再次改造。

现有面积透明度和线宽继续作为独立绘制参数。若后续验证确实需要新增槽位或 fill / stroke 两阶，另行扩展公共契约、分发和消费者；不要把这些扩展提前混入本轮。此前低饱和度方案是否保留、如何与品牌蓝协调，属于该阶段的色值设计决策。

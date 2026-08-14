# Resource Status All 01 实施计划

## 1. 目标

根据 [Figma 节点 386:576](https://www.figma.com/design/7AEKZXoo7YNq2wAhMJcOc4/ZAIops?node-id=386-576&t=6x9mLsj09ADKkQFP-4)，新增一个可安装、可复用、可文档化的 `resource-status-all-01` Block。

本轮只定义实施方案，不修改业务组件。后续实现必须满足：

- 复现 Figma 的信息层级、尺寸、间距、圆角和状态表达；
- 只复用当前仓库的组件、语义色、字体、间距和圆角能力；
- 不引入新图标包、新颜色 token 或 Block 专用全局样式；环图使用 `recharts` 的 `PieChart` / `Pie` 实现；
- 数据可替换，默认数据与设计稿一致；
- 同时完成 Block 导出、Registry、文档、预览和测试接入。

## 2. 设计基线

Figma 节点的自然尺寸为 `701 × 249 px`，结构如下：

1. 外层为 `12px` 圆角、`0.5px` 边框的卡片。
2. 左侧区域宽约 `248px`，四周 `28px`，包含 `192 × 192px` 环图。
3. 环图中央显示资源总数 `1501` 和说明“资源总数”。
4. 右侧内容区使用 `20px` 内边距，包含：
   - 标题“报告资源总数”；
   - 品牌色总数 `1501`；
   - 四个状态：正常 `1390`、告警 `73`、严重 `10`、未知 `28`；
   - 底部覆盖率“1473 / 1501 · 98.1%”。
5. 字号基线为 `24px` 主数值、`14px` 正文、`12px` 环图说明。

## 3. 现有项目能力映射

| Figma 表达 | 项目实现 | 说明 |
| --- | --- | --- |
| 外层卡片 | `Card` + `CardContent` | 使用现有 Card 组合，不新增 Surface/Card 组件 |
| 类名合并 | `cn` | 复用 `@zeron/ui/system/utils` |
| 卡片背景 | `bg-surface-floating` | 对应项目浮动内容承载面，并自动适配暗色模式 |
| 外框 | `border-[0.5px] border-border` | 使用现有边界语义 token |
| 圆角 | `rounded-xl` | 对应设计稿 `12px` |
| 主要文字 | `text-fg-default` | 标题、中央总数 |
| 次要文字 | `text-fg-muted` | 右侧标签和状态值 |
| 弱化文字 | `text-fg-subtle` | 环图说明、覆盖率 |
| 正常状态 | `bg-brand` / `var(--brand)` | 与现有 `resource-metric-list-01` 一致 |
| 告警状态 | `bg-warning` / `var(--warning)` | 使用告警语义填充，不复用边界色 |
| 严重状态 | `bg-destructive` / `var(--destructive)` | 与现有状态分布条一致 |
| 未知状态 | `bg-neutral` / `var(--neutral)` | 使用未知状态语义填充，不复用边界色 |
| 主数值排版 | `text-heading`、`font-bold`、`tabular-nums` | 使用现有 24px typography token |
| 正文排版 | `text-body` | 使用现有 14/20 typography token |
| 环图说明 | `text-label` | 使用现有 12/16 typography token |

Figma 没有提供可直接对应的 Code Connect 映射。环图也没有对应的项目组件，因此它会在 Block 内部使用 `recharts` 的 `PieChart` / `Pie` 呈现；颜色全部引用现有 CSS 变量，不新增公共图表抽象。

## 4. 组件 API 与数据模型

Block 对外导出：

- `ResourceStatusAll`
- `ResourceStatusAllProps`
- `ResourceStatusItem`
- `ResourceStatusTone`
- `defaultResourceStatuses`

建议的数据模型：

```ts
type ResourceStatusTone = "normal" | "warning" | "critical" | "unknown";

interface ResourceStatusItem {
  label: string;
  value: number;
  tone: ResourceStatusTone;
  countsTowardCoverage?: boolean;
}

interface ResourceStatusAllProps {
  className?: string;
  title?: string;
  totalLabel?: string;
  coverageLabel?: string;
  total?: number;
  statuses?: readonly ResourceStatusItem[];
  formatValue?: (value: number) => string;
}
```

数据规则：

- `total` 未传入时，由所有状态值求和；
- 默认只有 `unknown` 不计入可判断覆盖率，调用方可通过 `countsTowardCoverage` 覆盖；
- 覆盖率由同一份状态数据计算，避免环图、图例和底部摘要出现三套数据；
- 非有限值和负值按 `0` 参与可视化计算，零总数显示 `0 / 0 · 0%`；
- 默认 `formatValue` 保持设计稿的无分组数字展示，业务需要时可注入本地化格式。

## 5. 组件结构

```text
ResourceStatusAll
└─ Card
   └─ CardContent
      ├─ ResourceStatusDonut（Block 内部私有）
      │  ├─ PieChart 环形分段
      │  └─ 中央总数与标签
      └─ 右侧内容
         ├─ 标题与总数
         ├─ ResourceStatusLegend（Block 内部私有）
         │  └─ 4 个状态项
         └─ 覆盖率摘要
```

内部私有组件不会加入 `@zeron/ui`，避免为了单一 Block 创建过早的公共抽象。

## 6. 布局与响应式方案

桌面态以 Figma 为准：

- Block 使用 `w-full max-w-[701px] min-h-[249px]`；
- 主布局为两列，左侧固定约 `248px`，右侧自适应；
- 左侧 `28px` 内边距，右侧 `20px` 内边距；
- 环图固定 `192px`；
- 状态区域为两列两行，列间和行间均为 `8px`；
- 所有数字使用 `tabular-nums`，避免位数变化引起对齐跳动。

窄屏态不缩放文字和点击/阅读区域：

- 在小屏改为上下布局；
- 环图居中，右侧内容占满宽度；
- 状态网格在极窄宽度下切为单列；
- 保持 12px 圆角和语义色，不使用固定截图缩放。

## 7. 环图实现决定

环图使用一个可访问的 `PieChart`：

- 通过 `Pie` 数据项计算状态占比；
- 从 12 点方向开始，按传入状态顺序顺时针绘制，并关闭动画保证首屏稳定；
- 每段颜色由 tone 映射到 `var(--brand)`、`var(--warning)`、`var(--destructive)`、`var(--neutral)`；
- 不下载或提交 Figma 的环形 SVG，因为其中包含硬编码颜色，且无法随数据、主题变化；
- 环图本身用 `role="img"` 和汇总 `aria-label`，中央文字仍保留为可读文本。

设计稿存在一个需要明确记录的差异：Figma 环图素材只显示大约 82% 品牌色和 18% 告警色，但右侧数值对应约 92.6% 正常、4.9% 告警、0.7% 严重、1.9% 未知。实施默认以数据一致性为准，让环图按右侧四项真实比例绘制；这是相对截图唯一预期的视觉差异。如果后续确认必须逐像素复刻静态环形几何，则改为固定装饰环，但不建议让它表达与数值不一致的数据。

## 8. 无障碍与边界状态

- Card 提供明确的 `aria-label`，但不伪装成按钮或链接；
- 状态明细使用 `dl / dt / dd`，颜色不是唯一信息来源；
- 环图提供包含总数及各状态数量的文本替代；
- 总数、状态值、覆盖率始终可被屏幕阅读器读取；
- 长标题允许换行，数值不换行；
- 0 值状态仍保留在文字明细中，PieChart 中不绘制无长度扇区；
- 空数组和总数为 0 时显示空轨道，不产生除零或无效图表数据；
- 亮色模式匹配 Figma，暗色模式由项目 token 自动适配。

## 9. 文件落点

### Block 源码

- `packages/blocks/src/application/resource-status-all-01/resource-status-all.tsx`
- `packages/blocks/src/application/resource-status-all-01/index.ts`
- `packages/blocks/src/catalog.ts`
- `packages/blocks/package.json`
- `packages/blocks/registry.json`

Registry 声明 `card`、`utils` 与 `recharts` 依赖，不需要图片资产。

### 文档与预览

- `docs/pages/blocks/resource-status-all-01/page.tsx`
- `docs/pages/blocks/resource-status-all-01/ResourceStatusAllBlockDocClient.tsx`
- `docs/content/en/blocks/resource-status-all-01.json`
- `docs/content/zh-CN/blocks/resource-status-all-01.json`
- `docs/components/blocks/BlockPreview.tsx`
- `docs/manifest.ts`
- `docs/content/en/common.json`
- `docs/content/zh-CN/common.json`
- `docs/generated/page-loaders.generated.ts`
- `docs/i18n/content-loaders.generated.ts`

### 生成产物与测试

- `tests/resource-status-all-contract.test.ts`
- `public/r/resource-status-all-01.json`
- `public/r/registry.json`

生成产物通过项目 Registry 构建流程更新，不手写生成后的组件源码。

## 10. 实施顺序

1. 创建 Block 与类型，放入默认状态数据和覆盖率计算。
2. 使用 `Card` / `CardContent` 完成外框和响应式布局。
3. 实现 Block 私有 PieChart 环图与状态明细，接入全部语义 token。
4. 添加 package export、Block catalog 和 Registry 条目。
5. 添加中英文文档、详情预览和目录卡片预览。
6. 添加契约测试，覆盖注册、API、语义 token、无障碍文本和 `recharts` 依赖。
7. 运行 Registry 构建，更新公开安装产物。
8. 完成类型、Lint、测试、构建和视觉对照。

## 11. 验收标准

- 默认数据完整显示 `1501 / 1390 / 73 / 10 / 28 / 98.1%`；
- 桌面预览在 `701 × 249px` 基线上与 Figma 的结构、间距、排版、边框、圆角一致；
- 除已记录的环图比例差异外，不存在未说明的视觉偏差；
- 所有颜色均来自现有语义 token，源码中不出现 Figma 原始十六进制色；
- 使用现有 `Card`、`CardContent` 和 `cn`，不新增公共 UI 组件；
- 除 `recharts` 外，不新增 npm 依赖、图片资产、全局 CSS 或设计 token；
- 自定义 `statuses` / `total` 后，环图、图例和覆盖率同步更新；
- 320px 级窄屏不横向溢出，状态内容仍可读；
- 亮色和暗色主题均可辨识；
- `pnpm --filter @zeron/blocks typecheck`、相关 Vitest、`pnpm lint`、`pnpm registry:build` 和 `pnpm build` 通过。

## 12. 非目标

- 本次不提供动画、Tooltip、点击筛选或下钻行为；
- 不抽象通用 Chart/Donut 组件；
- 不修改现有 `resource-metric-list-01`；
- 不新增或调整全局设计 token；
- 不把文案接入 Block 内部运行时 i18n，文案通过 props 由使用方替换。

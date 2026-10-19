# Usage Forecast 02 review 与 commit 计划

日期：2026-10-19。Review 基准 HEAD：`b1436268`。范围：`usage-forecast-02`、所需的 Button 高度修复和 AreaChart 原始观测支持，以及文档、预览和 Registry 接入。执行提交前重新核对 HEAD 与工作区。

本轮修复已在工作区完成，未执行暂存、commit 或 push。保留此前确认的 pill / default 指标 Tabs、MetricCard 字号层级、可切换告警按钮、三组固定 mock、原生图表和双语文案。

## Review 结果

| 级别 | 问题 | 已完成处理 |
| --- | --- | --- |
| P2 | 告警状态与回调依赖当前选中项；保留挂载的其他面板可能误读或更改另一指标。`constructor`、`__proto__`、`toString` 等合法 ID 还会读到对象原型，导致渲染异常 | 每个面板按自己的 ID 读取和更新设置；仅接受偏好对象自身的属性。保留面板与三个特殊 ID 均有回归测试。 |
| P2 | 存储历史曾超预算、当前已回落时，仍显示“已超额”；恰好达到预算与不足 1% 超额都可能显示“超出 0%” | 主结论根据当前值和未来交点确定；历史日期保留在告警项。分别表达预算内、恰好达到及不足 1% 超额。 |
| P2 | 第一条观测已高于阈值时被当作新交点；席位图在曲线之外显示虚假的 80% 标记，稀疏历史还会推断错误的预算达到日期 | 仅计算已知的上穿交点；初始恰好等于阈值仍保留。无已知交点的超额历史使用“从该日起已达到或超过”标题，未知交点不画标记。 |
| P2 | 预测下界始终未触及预算时，强行用周期末替代最晚日期；当前区间已横跨预算时，上界风险可能丢失；跨日内采样的提前天数与标题日期不一致 | 开放区间明确说明下界可能保持预算内；保留当前上界风险；天数按 UTC 日历日计算，区间日期不超出周期。 |
| P2 | 报价被取整，292.49 显示为 292，24.5 显示为 25，小于一美分的费率可能显示为零 | 保留报价小数与微小单位费率。mock 中的整数报价、$0.20 展示及独立报价契约继续保留。 |
| P2 | 校验用大数组展开调用 Math.min / Math.max，密集历史会超过参数数量限制；不完整 domain 和不可表示的百分比也可能通过校验 | 采用线性扫描求范围，校验 domain 长度、跨度、比例和自动范围的有限性。20 万条历史的纯数据校验通过。 |
| P2 | 席位图的绘图原点偏移使隐藏原始观测也出现 46 等内部值，而真实数据是 186 seats | AreaChart 增加可选 `accessibleData`，默认仍使用 data；block 传入本地化原始记录。曲线、Tooltip、键盘控制和原始表格保持各自真实值。 |
| P2 | 长告警文案换行后仍重叠；Button 的 contentSized 与 link 同时输出固定控制高度和 h-auto，实际固定高度优先 | 内容驱动模式不再输出固定高度；block 通过公开 contentSized 与标签内容换行。复测中按钮从 32px 修正为 110px，包含 102px 内容；默认五档高度保持 24 / 28 / 32 / 36 / 40px。 |
| P3 | 画廊采用 1160×780 画布，放入 16:9 裁切区域后底部告警不可见 | 仅将本 block 画布调整为 1600×900。在 320px 宽画廊中，告警底边由 928.38px 改为 876.23px，位于裁切底边 900px 内。 |
| P3 | 告警切换会重复创建数值、日期、货币格式器和投影；原始表格与可访问数据也重复格式化 | 缓存格式器、投影、范围、表格与可访问观测，图表标注复用同一投影。将多层结论表达式整理为明确分支。 |

在本轮已检查范围内，没有尚未处理的 P1/P2 发现。没有新增依赖、主题 token、全局样式或 lint 例外。辅助技术检查覆盖 DOM 原始观测与键盘 Tooltip，未覆盖实际屏幕阅读器矩阵。

## 建议拆成三笔 commit

block 尚未提交，因此本轮针对 block 的修复直接进入最终功能提交，不另做针对未提交代码的 fix commit。

| 顺序 | Commit 标题 | 边界与依赖 |
| --- | --- | --- |
| 1 | `fix(button): honor content-sized and link heights` | 修复已有公开 Button 行为，默认尺寸与 buttonVariants 导出保持原样。可独立提交。 |
| 2 | `feat(area-chart): support original accessible observations` | 增加可选原始观测输入、默认兼容性测试与组件文档。可独立于第 1 笔提交。 |
| 3 | `feat(blocks): add usage budget forecast block` | 完整 block、mock、review 修复、测试、文档、预览、发现及安装入口；依赖前两笔。 |

### Commit 1：Button 内容高度

- `packages/ui/src/components/button.tsx`：仅内容驱动模式移除固定高度，不依赖自定义高度类与 h-auto 的 CSS 顺序；保留图标插槽、padding、状态和标准尺寸配方。
- 在仅包含该笔输入的候选 checkout 重新生成 `public/r/button.json`，纳入实际相关的其他生成结果。
- 验收：既有 Button tone / control-size 测试；浏览器验证五档默认高度、多行 contentSized 与 link。复测多行示例为 48px，link 为 20px。
- 不包含 `usage-forecast-02` 或 AreaChart 的源文件和注册信息。

### Commit 2：AreaChart 原始观测

- `packages/ui/src/components/charts/area-chart.tsx`：`accessibleData?: readonly Record<string, unknown>[]` 仅替换隐藏原始观测，默认等于 data；绘图与 Tooltip 仍使用 data。
- `tests/area-chart.test.tsx`：验证 186 的原始观测与 46 的绘图坐标分离、绘图域不受原始说明影响，以及省略属性后回到原行为。
- `docs/pages/components/area-chart/page.tsx`：增加公开属性说明。
- `docs/content/{en,zh-CN}/components/area-chart.json`、`docs/agent-guides/components/area-chart.md`：双语属性及使用边界。
- 在候选 checkout 重新生成 `public/r/area-chart.json`、相关指南／agent 产物及实际变化的文档导出。
- 验收：AreaChart、Area stack、类型、双语文案与 Registry 检查。

### Commit 3：预算用量预测 block

实现与测试：

- `packages/blocks/src/application/usage-forecast-02/` 全部 7 个文件：公共导出、类型、数据逻辑、固定 mock、双语标签、图表、主组件。
- `tests/usage-budget-forecast.test.tsx`：数据边界、三种结论、回落／恰好达到／微小超额、开放区间、报价精度、密集历史、特殊 ID、受控与非受控告警及指标状态。
- `tests/usage-budget-forecast-charts.test.tsx`：原始单位、实际键盘 Tooltip、初始已达阈值与稀疏历史标注。
- 保留此前确定的视觉及交互：pill / default Tabs；数值 24px、单位与标签 14px、标题与结论 14px、说明 12px；tertiary 告警切换按钮。

包与安装：

- `packages/blocks/package.json`：只纳入 `./usage-forecast-02` 导出。
- `packages/blocks/src/catalog.ts`、`packages/blocks/block-capabilities.json`、`packages/blocks/registry.json`：只纳入 02 条目。
- 依赖 area-chart、button、chart-core、chart-primitives、container、icon-context、inline-notice、line-chart、tabs、utils 与已有的 @visx/curve；不再直接依赖 Checkbox。
- `scripts/test-consumer-installs.mjs`：只取 02 的 Next / Vite 示例。

文档与发现：

- `docs/components/blocks/UsageBudgetForecastDemo.tsx`。
- `docs/pages/blocks/usage-forecast-02/`、`docs/content/{en,zh-CN}/blocks/usage-forecast-02.json`、`docs/agent-guides/blocks/usage-forecast-02.md`。
- `docs/manifest.ts`、`docs/catalog/artifacts.ts`、`docs/components/blocks/{BlockPreview,StandaloneBlockDemo}.tsx`、`standalone-blocks.ts`：只取 02 的条目、import、case、slug、1600×900 预览 loader。
- `docs/agent-data/{components,guide-routes,item-identities}.json`、`scripts/preview-source-allowlist.mjs`：只取 02 登记。
- `tests/docs-artifact-catalog.test.ts`、`tests/i18n-document-manifest.test.ts`：只纳入 02 的目录断言与候选 checkout 对应的总数。
- 本 review 与 commit 计划随该笔提交。

在该笔候选 checkout 中重新生成 `app/[locale]/docs/blocks/(detail)/usage-forecast-02/page.tsx`、文档 loaders、i18n loaders、guide loader、preview source/hash、`public/r/usage-forecast-02.json`、Registry index、llms、agent 产物及实际变化的其他文件。

## 混合工作区的暂存策略

1. 不使用 `git add .`。Button 与 AreaChart 源码是本轮独立改动；其他共享文件按本 block 条目或 hunk 选择。
2. 当前还有 Context Window 02、Model Selector、Pull Request、Capacity Index Chart、Component Canvas 等工作。它们的源文件、导出、注册、路由、测试和生成片段均不纳入本计划。
3. 不纳入现有的 UI package / registry 配置、组件封面脚本、通用导航、中间件、tsconfig 等无关改动。只提交本轮上述支持性 UI 源码及其对应产物。
4. 每笔在“该笔输入＋已接受前序提交”的独立候选 checkout 生成并验证产物。不整份复制混合工作区中的生成文件，不手改 hash，不照搬混合目录的总数。
5. `.zeron/reports/`、`output/`、`app/test/usage-budget-review/` 是本地验证材料，遵循现有忽略规则，不纳入 commit。
6. 当前没有实际暂存内容。本计划描述提交边界；执行时需重新检查候选 diff，确认没有带入其他任务。

相关生成顺序：先 `docs:loaders:build`，再 `docs:routes:build`；source / guide / Registry 生成完成后再运行 `agents:build`。对干净 checkout 缺少的分发产物，先按项目脚本生成。只运行该笔实际需要的生成器。

Registry 重写期间不要并行运行读取其 JSON 的一致性测试；本轮曾遇到中间产物导致的两项瞬时失败，生成结束后串行复测全部通过。

## 验证结果与边界

- 最终相关测试：12 个文件、112 项通过；包含 block、真实图表、AreaChart／stack、Button／control-size、Registry、目录、双语及独立预览。新增 19 项回归用例；修复前失败日志另外保留。
- 全仓与 blocks 包类型检查、受影响文件普通 ESLint、完整 design lint、`git diff --check` 通过。
- Registry 检查 178 项；routes / loaders / preview sources / guide loaders / agent catalog 一致性检查通过。指南示例检查 46 篇、49 个 TSX 示例通过。
- 最终源码的 Next/npm 与 Vite/npm 独立安装、类型检查和生产构建通过。Vite 对依赖中的 `use client` 指令产生构建警告，构建成功。
- 浏览器验证：明暗主题，1200 / 360 / 320px，正常／回落／开放区间／稀疏历史，长文案换行、设置隔离与回调、键盘 Tooltip、原始观测、五档默认按钮、多行按钮、link 和画廊完整性。
- 320px 页面中 block 内容宽度／滚动宽度均为 271px；密集历史测试仅验证 20 万条记录的纯数据校验，不宣称同等规模的 DOM 渲染性能。
- 未运行完整文档站生产构建、真实预测／计费／通知服务、所有浏览器或实际屏幕阅读器矩阵。mock 的费用是独立输入，不从已舍入用量反推。
- 每笔最终候选版本仍需按其输入重新生成和验收；当前混合工作区通过不代替单笔提交验证。

证据：`output/usage-budget-review/` 的最终测试、消费安装、浏览器日志，以及 `output/playwright/usage-budget-review-*.png`。本地验证页面不属于交付代码。

## 组件与样式统计

本轮可比较的主范围为 6 个源码文件：28 种来源／导出组合、36 处 JSX 使用，静态检查 0 错误、0 警告。Button 另有独立的一文件修改前／修改后报告，识别 3 种内部／外部辅助、5 处使用；两份统计不直接相加。基线是本轮 review 前的快照，不是整个新 block 的新增前基线。

| 组合 | 职责 |
| --- | --- |
| Container、Tabs、Button、InlineNotice | 表面、指标选择、告警开关及业务反馈 |
| AreaChart、Area、Line、Grid、坐标轴、Tooltip | 浮动区间、预算交点、原始单位与键盘查看 |
| ChartDataTable 与 accessibleData | 保留真实观测的表格与辅助技术说明 |
| 语义 dl、公开图标插槽与 useChartStable | 指标排版、选中勾号和少量业务标注 |

详细库存和基线比较：`.zeron/reports/usage-budget-forecast/review-after.json`、`review-button-after.json`。共享文档入口的其他组件未计入主范围。没有新增主题变量或绕过组件内部样式。

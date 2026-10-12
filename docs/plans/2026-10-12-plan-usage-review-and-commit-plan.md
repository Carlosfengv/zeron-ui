# Plan Usage 整理、Review 与 Commit 计划

日期：2026-10-12。检查基线：`5486147c`。范围为新增 `plan-usage-01`，包含本轮整理和之前确认的视觉调整。

## Review 结果与优化

| 问题 | 最终处理 | 验证 |
| --- | --- | --- |
| 超额用量时，容量条扩大了分母，阈值黑线与纹理仍按原比例定位 | 复用公开的 `visualizationLayout`；4,000 点额度、5,000 点用量、80% 提醒对应色条 64% 位置；100% 提醒仍显示额度之外的红色纹理 | 回归测试覆盖超额、0 额度和 100% 阈值 |
| 演示切换套餐只更新名称和价格，周期额度仍为 Pro 的 4,000 点 | 同时更新 Free/Pro/Max 的额度和每日参考额度；其他套餐不沿用 Pro 的耗尽日期示例 | 单测和浏览器确认 Max 为 12,000 点，剩余 10,295 点 |
| 中文演示的套餐介绍、权益和账单描述仍为英文 | 在演示层本地化业务字符串，保持 block 的调用方数据契约 | 中文演示测试及浏览器复核 |

另外整理了套餐区域缩进；缓存随语言、币种变化的 Intl 格式器和随日期数据变化的图表数据，减少拖动 slider 时的重复工作。每日用量标题调整为所属区域的下级标题，账单展开按钮关联表格，演示付款输入框使用实例唯一 ID。

此前确认的样式完整保留：七个 Card 使用 `border-hairline border-border`；区域标题使用 `px-2 font-semibold text-fg-default`；每日图表、提醒 slider、账单状态使用主题变量；阈值右侧使用现有 diagonal 纹理和 danger 变量。

本轮审查范围内没有剩余的组件 API 或样式变量违规。未修改共享 UI 实现、创建新控件或新增样式变量。黑线和纹理属于容量图的领域标注，分别复用既有布局计算和纹理 API。

## 组件与样式检查

9 个实现及文档源文件识别到 37 种组件、72 次 JSX 使用；其中公开 UI 组件 29 种、62 次使用。来源解析完整，静态报告 0 错误、0 警告；完整项目设计检查另外通过。

| 组成 | 复用内容 |
| --- | --- |
| 内容载体 | Card、CardContent、Table 及表格子组件 |
| 图表 | SegmentedBar、ChartLegend、BarChart、Bar、ReferenceLine、ChartTooltip；公开辅助函数 `chartColor`、`visualizationLayout`、`renderPatternPreset` |
| 控件与反馈 | Button、Badge、Slider、Switch、InlineNotice |
| 演示确认 | Dialog 及子组件、Field、FieldLabel、Input |
| 业务组合 | PlanUsage、PlanUsageChart、文档展示组件；图标沿用项目 Hugeicons 和 `useIcon` |

详细统计为本地 `output/plan-usage/usage-report.json`，其中组件种类按导出计数，不等于 Registry 条目数。报告的“未启用检查”汇总无法替代实际完整设计检查，最终结论同时依据 `pnpm lint:design`、公开 API 核对及运行时复核。

## 验证记录

- 4 个相关测试文件、37 项测试通过：交互、双语消息、文档清单、Agent 目录。
- 根项目 TypeScript、相关文件常规 ESLint、完整设计检查、差异空白检查通过。
- Registry 完整性通过：164 项；Agent 目录一致性通过：173 项、72 篇指南。
- 51 个预览资源、136 个文档加载器一致性通过；资源由最终源码重新生成。
- 最终 Registry 在独立 pnpm 消费者中完成安装、TypeScript 和 Next.js/Vite 生产构建。Vite 输出第三方 Base UI 的模块指令提示，构建退出码为 0。
- 浏览器检查覆盖桌面和 390px 浅色视口：七个 Card 的 0.5px 边框、五个区域标题的 8px 内边距、主题图表与 slider、手机套餐纵向排列和卡片内账单滚动；页面无横向溢出。
- 浏览器确认“查看套餐”移动焦点，Max 切换同步额度，真实 slider 的 0% 纹理覆盖全条、100% 在未超额时没有纹理。

本轮没有重跑深色及另一品牌的视觉检查，也没有执行整个文档站的生产构建。真实计费、付款和账单服务由调用方接入；演示仅修改本地状态并下载示例 JSON。

复核截图和构建日志保存在本地 `output/plan-usage/`，不纳入提交。

## Commit 方案

建议一个完整提交，同步组件、接入目录、文档、测试和生成产物，避免中间提交出现目录条目与文件不一致。

标题：`feat(blocks): add themed plan and usage block`

建议正文：

```text
Add a controlled subscription block using existing Zeron components and tokens.
Use hairline Cards, brand-colored usage controls and invoice statuses.
Keep alert annotations aligned with capacity during overage.
Add localized demos, interaction coverage and registry/docs integration.
```

## 提交范围

功能范围共 39 条文件路径；本计划作为第 40 条路径一并提交。完整候选清单在本地 `output/plan-usage/commit-files.json`。

| 分组 | 路径与内容 |
| --- | --- |
| Block 实现 | `packages/blocks/src/application/plan-usage-01/` 的 6 个文件：入口、类型、标签、示例数据、图表和主体 |
| 包与 Registry 注册 | `packages/blocks/package.json`、`block-capabilities.json`、`registry.json`、`src/catalog.ts` |
| 文档与演示 | `docs/components/blocks/PlanUsageDemo.tsx`、`docs/pages/blocks/plan-usage-01/`、两种语言的 `docs/content/*/blocks/plan-usage-01.json`、Agent 指南和生成的详情页路由 |
| 展示目录 | `docs/catalog/artifacts.ts`、`docs/manifest.ts`、BlockPreview、StandaloneBlockDemo、standalone-blocks |
| 测试与生成输入 | 两个相关测试文件、`scripts/preview-source-allowlist.mjs`、`scripts/lib/unification-consumer-examples.mjs` |
| 生成产物 | 三个 `docs/agent-data/` 文件、三个 `docs/generated/` 加载器、i18n 加载器、`public/llms*.txt`、两个相关 Registry JSON、预览源码清单及当前 hash 资源 |

`docs/lib/block-preview-sources.generated.ts` 是混合文件，只暂存新增 `plan-usage-01` 条目；保留 fleet-health-01 和 personal-settings-01 的地址变更给原有任务。当前本 block 的预览资源为 `public/docs-source/0794194fd1cb1a3cb63db94bbaf7b865b2d2faa4abcd8a6c9cdc68222ac038d4.txt`。

以下已有改动不属于此次提交：fleet-health-01 和 personal-settings-01 的组件源码、各自 Registry JSON、两组旧预览资源删除及新资源添加。不要整批暂存工作区。

整理期间工作区还出现了其他任务的 CI workflow/action、消费者与验证脚本、维护文档及对应测试修改，这些也排除在候选补丁之外。候选范围以明确的 40 条路径为准，不从整个 dirty tree 自动扩大。

## 执行顺序

1. 检查 HEAD 和相关工作区是否变化；若有新修改，刷新清单、生成资源及候选补丁。
2. 查看候选补丁的 40 条路径，重点核对混合预览清单仅新增 plan-usage-01；源码、Registry 内嵌源码和 hash 资源须一致。
3. 提交前在独立副本应用补丁，重跑相关测试、TypeScript、Registry 与预览一致性检查。计划阶段的验证来自工作区和独立消费者安装；之后补做的隔离副本验证见下一节。
4. 按候选范围暂存，检查 staged diff，再执行上述 commit 标题。
5. 核对提交文件及剩余工作区，确保其他两个 block 的改动完整保留。

计划阶段生成候选补丁 `output/plan-usage/plan-usage.commit.patch`，只使用独立临时 index；真实暂存区未改变，未执行 commit 或 push。

## 提交前隔离验证

用户随后授权提交到 GitHub main。远程 main 与 `5486147c` 基线一致；将候选补丁应用到基线导出的独立副本，仅复用已安装的第三方依赖。`@zeron/blocks` 与 `@zeron/ui` 均确认指向副本内源码，其他 block 和 CI 改动没有进入副本。

- 4 个相关测试文件、37 项测试通过。
- 根项目 TypeScript 和完整设计检查通过。
- Registry 检查通过（164 项），51 个预览资源和 136 个文档加载器一致性通过。
- 从副本重建 Skill 分发及 Agent 目录后，一致性检查通过（173 项、72 篇指南）。
- 生成与检查后，候选文件内容保持一致；提交范围仍为 40 条路径，混合预览清单只增加 plan-usage-01。

此前针对最终 Registry 的 Next.js/Vite 独立消费者生产构建结果仍有效；本次隔离验证没有执行整个文档站的生产构建。

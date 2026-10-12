# File Type 审查、优化与提交计划

日期：2026-10-12

本轮审查基线：`1be034f8`，分支：`main`。session 起点为 `e121ba55`；期间已独立提交的 Avatar 文档不进入本计划。

状态：审查和优化已完成；尚未暂存、commit 或 push。

范围以 [38 个唯一文件的提交清单](./2026-10-12-file-type-commit-files.json) 为准。建议按依赖顺序拆成三笔：共享分类色修复、FileType 组件与文档、File Manager 接入。每笔带上自己的生成产物。`public/r/registry.json` 分别有第二、第三笔的 hunk，因此三组路径引用共 39 条。

## 审查发现与修复

| 级别 | 问题及触发方式 | 已完成修复 |
| --- | --- | --- |
| P2（本轮） | File Manager 传入 `extension: ""` 和 `name: "report.pdf"` 时，FileType 将空串作为显式覆盖，显示 FILE；旧文件图标会继续从文件名识别 | 接入层将空串转成 undefined，恢复从文件名识别。缺省扩展名和非空显式覆盖保持既有行为；不修改 FileType 的公开优先级语义。真实 FileItemVisual 渲染在修复前复现失败，修复后三种输入均通过。 |
| P2 | `invoice#final.pdf`、`budget?approved.xlsx` 被当成带参数的网址截断，回退为 FILE | 原始文件名和路径保留 `#`、`?`；仅解析绝对 URL 的 pathname，忽略 URL 查询参数和片段。显式 extension 仍优先。 |
| P2 | 可选原生属性 `role={undefined}`、`aria-label={undefined}` 覆盖默认名称；空白 fileName 导致图标没有有意义的名称 | 单独处理可访问属性并使用默认值回退；空白文件名回退到格式名称。保留 aria-labelledby 和装饰图标规则。 |
| P2 | 共享 Badge 分类色中，12 种浅色文字配对低于 4.5:1，最低约 2.84:1；File Type 复用了这些配色 | 修正 8 种分类色的浅色前景为现有深色 ink，另 4 种改为纯白。17 种内置配对的浅色最低约 4.60:1、深色最低约 6.88:1。填充、soft、dot、语义状态和自定义配色规则保持原有值。 |
| P3 | 未知扩展名按 UTF-16 代码单元截断，七个 emoji 会出现半个代理对和替换字符；WWW 或三个 emoji 等短宽标签也会超出左边界 | 按 Unicode 码点截断，保留完整可访问名称；所有未知标签都约束绘制宽度，不再仅限制五个字符以上的标签。 |
| P3 | 六档尺寸依赖 CSS，但 SVG width/height 始终是 40，缺少样式或输出原始 SVG 时尺寸不符 | SVG 固有宽高与 size 同步为 18、24、32、40、48、56；保留现有 Tailwind 尺寸类。 |

维护性优化：分类目录使用接受任意字符串查询的类型化 Map，移除将未知格式断言为已知扩展名的转换；直接构建索引，避免中间 flatMap 列表。展示页增加含特殊字符的文件名和 safetensors 长标签回退示例。

补充组合示例：InfoItem 附件列表使用 sm 32px 文件图标，展示 PDF、电子表格和设计稿；Table 使用 mini 18px 文件图标，增加 ZIP、Markdown 文件，展示格式和大小。文件名支持省略及完整 title，装饰图标隐藏；InfoItem 中直接组合 FileType，保留其公开尺寸。两组示例包含中英内容及可复制代码，沿用现有组件和语义样式。

File Manager 接入：统一的 FileItemVisual 默认文件图标改用 FileType，网格和详情为 lg 48px，列表和分栏为 mini 18px。移除旧的文件 SVG 及重复扩展名分类；空扩展名由文件名推断，非空元数据继续优先。缩略图、自定义图标、文件夹图标、待处理状态与选择行为沿用既有逻辑。为 file-manager-01 登记 file-type 安装依赖，并重新生成 Registry 及文档源码预览。

没有保留本次审查发现的阻断项。格式识别覆盖 99 种已知扩展名和未知格式；没有增加 MIME 推断、内容预览或文件操作。

## Commit 1：共享分类文字对比度

建议标题：`fix(ui): improve categorical strong color contrast`

文件：3 个。

- `packages/ui/src/components/badge-colors.ts`
- `tests/badge-colors.test.ts`
- `public/r/badge.json`

这一笔只修改命名分类色的浅色 strong 前景及对应验证、分发源码。它可独立提交；既有 Badge strong 消费者与新 File Type 共用修复后的配色。视觉变化是部分分类标签改为深色文字，另外四种浅色前景改为纯白。

最低验证：分类色测试、类型检查、设计 lint、Registry 一致性检查。

## Commit 2：FileType 组件、示例与发现信息

建议标题：`feat(ui): add accessible file type icons`

文件：29 条路径，依赖 Commit 1。`public/r/registry.json` 只纳入新增 file-type 条目。

| 分组 | 纳入内容 |
| --- | --- |
| 组件与安装 | file-type.tsx、UI 包导出、UI Registry、新组件与 Registry 索引产物 |
| 展示文档 | File Type 页面及 InfoItem/Table 组合示例、中英内容与通用描述、路由和导航登记、亮暗封面 |
| Agent 发现 | 使用指南、组件身份、检索信息、指南路由、加载器、llms 文件 |
| 验证 | File Type 回归测试、文档登记计数、Next.js/Vite 消费者示例 |
| 提交记录 | 本计划及逐文件清单 |

提交后的行为：四种样式、六档尺寸、11 类 99 种扩展名；文件名、路径及绝对 URL 的最后一个后缀识别；未知格式回退；独立图标名称与装饰图标隐藏；ref 和原生 SVG 属性透传。文档包含 InfoItem sm 与 Table mini 组合示例。

## Commit 3：File Manager 复用 FileType

建议标题：`refactor(blocks): reuse FileType icons in file manager`

文件：7 条路径，依赖 Commit 2。

- `packages/blocks/src/application/file-manager-01/file-manager.tsx`
- `packages/blocks/registry.json`
- `public/r/file-manager-01.json`
- `public/r/registry.json`：仅 file-manager-01 的 file-type 依赖 hunk
- `docs/lib/block-preview-sources.generated.ts`：仅 file-manager-01 的 URL hunk
- 新 File Manager 预览源码资产
- 删除旧 File Manager 预览源码资产

这一笔覆盖三种视图与详情图标替换、空扩展名兼容处理、安装依赖、Registry 和源码预览。原有 File Manager 数据、选择、文件夹、缩略图及自定义渲染契约继续适用。

## 验证结果与边界

| 检查 | 结果 |
| --- | --- |
| 相关测试 | 本轮重跑 7 份文件、129 项通过；覆盖文件解析、可访问名称、Unicode、未知宽字符、六档固有尺寸、17 种配色、反馈组件、国际化、文档、Agent 目录及 File Manager 数据接入。空扩展名另以真实 FileItemVisual 的三组静态渲染验证。 |
| 类型和样式 | typecheck、相关文件 ESLint、全项目 lint:design 通过；3 个核心审查文件的报告为 0 错误、0 警告。 |
| 注册与生成 | Registry 163 项检查通过；文档加载器、路由、指南加载器、Agent 目录无漂移；42 份指南的 44 个 TSX 示例通过。 |
| 独立消费项目 | File Type 的 Next.js/pnpm 与 Vite/npm 安装、类型及生产构建通过；使用实际生成的 Registry 依赖闭包。Vite 有常规 use client 指令提示，不影响构建。 |
| 浏览器 | Chromium 验证 390、768、1440px × 深浅主题 × 四种样式，共 24 组。每组 99 个格式，文字对比度至少约 4.60:1，文字无图标边界溢出、页面无横向溢出；CSS 与固有尺寸均为六档规定值。特殊文件名识别和 SAFET… 回退正确；另用真实组件的静态 SVG 验证 WWW、WWWW、三个 emoji 和长标签均未超出边界。 |
| 浏览器日志 | 无页面错误；开启 reduced motion 时有 Motion 的开发模式提示。 |
| 其他范围 | 本轮未执行全站生产构建、全量单元或完整 E2E；未将自定义配色、宿主主题覆盖及其他浏览器计入上述矩阵。 |

审查前新增用例复现了 11 个 File Type 失败和 12 种分类对比度失败；修复后相关用例通过。审查针对公开属性、文件识别和渲染契约，没有使用 memo、额外状态或新的通用抽象掩盖简单逻辑。

本地证据保存在 `.zeron/reports/file-type-review/` 与 `output/playwright/`，按仓库忽略规则保留。本次可复用回归用例进入正式 tests；安装示例进入既有消费者验证脚本。

本轮复审记录在 `.zeron/reports/file-type-session-review/`。发现并修复上述一处空扩展名兼容问题；当前没有未解决的阻断项。内容摘要核对确认此前已审查内容没有漂移；预览源码索引中的既有其他任务 hunk 继续排除，基线更新只反映已提交的 Avatar 文档。File Manager 的 Registry 和预览资产已随修复重建，提交清单中的最终摘要也随之刷新。

本轮另重跑 File Manager 的 Next.js/pnpm、Vite/npm 独立安装与生产构建，修复后的分发内容均通过，日志为 `.zeron/reports/file-type-session-review/consumer.log`。浏览器矩阵沿用会话内已验证的 24 组图标目录、12 组组合示例和 24 组 File Manager 检查；本轮新增的空串分支由静态渲染验证覆盖，未重复完整浏览器矩阵。

组合示例的增量验证：类型检查、页面 ESLint 和设计 lint、中英文键及占位符一致性检查（4 项）通过。Chromium 验证 390、768、1440px × 中英页面 × 深浅主题共 12 组：InfoItem 图标实际为 32px，Table 图标实际为 18px，表格有 5 行及语义列头，文件大小可见且没有页面横向溢出；两组代码预览正常加载，无页面错误。单页使用统计为 18 个 UI 导出、28 处 UI JSX 使用，0 错误、0 警告。增量证据保存在 `.zeron/reports/file-type-demos/`。

File Manager 的增量验证：相关 2 份测试共 37 项、类型检查、源码 ESLint 和设计 lint、163 项 Registry 检查、50 份预览源码及 Agent 目录一致性检查通过。独立 Next.js/pnpm 与 Vite/npm 的安装、类型和生产构建通过。Chromium 验证文档页 1440px 和独立预览 390、768、1440px，覆盖深浅主题、三种视图共 24 组；图标尺寸、边界、选择状态、详情与页面宽度符合预期，另核对文件夹中的 SVG、PNG、CSV、MD、MP4，无页面及控制台错误。源码复用 23 个 UI 导出、33 处 UI JSX 使用；自动统计中的动态 ActionIcon 仍需人工追溯，已确认来自既有 getItemActions 的 icon 参数。证据保存在 `.zeron/reports/file-manager-file-type/` 和 `output/playwright/file-manager-file-type-consumer.log`。

## 执行与范围控制

1. 核对清单中的路径与审查时的内容摘要。若共享文件后来混入其他任务的改动，按 hunk 选择 File Type 内容并重新检查。
2. 仅暂存 Commit 1 的三条路径，检查暂存 diff 后提交第一笔。
3. 暂存 Commit 2 的 29 条路径。`public/r/registry.json` 只选择新增 file-type 条目，暂不纳入 File Manager 的依赖变化，检查暂存 diff 后提交第二笔。
4. 暂存 Commit 3 的 7 条路径。Registry 索引只选择 File Manager 依赖 hunk；预览源码索引只选择 file-manager-01 的 URL hunk。删除旧 File Manager 预览资产并加入新资产，检查暂存 diff 后提交第三笔。
5. 在对应提交树检查 Registry、文档及 Agent 产物，确认每笔生成内容与其源码一致。生成产物随所属源码提交，不直接手改最终 JSON；不要从包含其他任务的工作区整批暂存重新生成的共享文件。

已通过临时索引生成三个独立 patch，逐笔应用、File Manager 安装依赖及预览源码资产一致性检查均通过。该验证未修改真实索引、分支或提交记录；详见 `.zeron/reports/file-type-session-review/commit-plan-verification.json`。

CI/E2E 分层、README、根 package.json、CodeView、ContextWindow、FleetHealth、PersonalSettings，以及这些区块的预览哈希和生成产物属于工作区其他改动。它们不进入这三笔提交；详细排除快照记录在清单中。这里没有创建新分支、执行暂存或执行提交。

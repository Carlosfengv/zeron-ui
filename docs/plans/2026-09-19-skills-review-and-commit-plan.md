# Skill 改动 Review 与 Commit 计划

日期：2026-09-19。基线：`83bf6ff`。范围：当前未提交的两个 Zeron Skill、对应决策 fixture，以及 CLI 路由识别和完成状态修复。本轮完成文档整理，未暂存、提交或发布。

## Review 结论与已做调整

| 发现 | 影响 | 已做调整 |
| --- | --- | --- |
| Builder 入口统一要求 block 优先，但资源列表允许基础组件优先 | 同一任务可能被要求额外证明 block 不适用 | 在选择顺序前明确标准资源列表例外，其他语义区域保持原选择顺序 |
| 完整资源页层级没有明确排除嵌入式列表 | 修改 dashboard、tab、dialog 中的列表时可能额外增加 PageLayout、标题或滚动容器 | 完整页面才套用页面层级；嵌入式列表复用宿主，只应用相关 toolbar/table/query 规则 |
| “一个内容表面”可能被理解成删除 DataTable 自带边框 | 诱导消费端修改 managed 组件内部样式 | 明确 PageContent 与 DataTable 自带表面可以共存，禁止的是额外项目 Card/Container 包装 |
| 完成判定细则重复，且未说明旧版 CLI 不具备新诊断 | 更新 Skill 后可能错误宣称已修复已安装 CLI，或以旧检查的通过结果替代验收 | 完成状态语义集中到 verification-and-recovery；补上版本识别、手工核对及新旧结果分别记录的规则 |
| 入口重复介绍图表、按钮几何和完整验收清单 | 增加默认阅读量，后续多处维护易发生分歧 | 入口保留选择原则与路由，具体数据、布局、状态和浏览器检查保留在专项 references |

已核对当前 Button 的 leadingIcon/trailingIcon、iconOnly、asChild 和 label 结构；Chart 的实际导出；DataTable 的工具栏 children、分页、表面和滚动结构。未发现这些新增指南宣称不存在的当前公共接口。所有指南仍要求消费端核对实际安装版本。

保留既定需求：图表优先 Zeron Chart/Recharts；控件和图标尺寸以 Zeron 规范为准；标准资源列表按基础组件结构约束，不强制指定两个 block/page 名称；局部验收不能代表全局完成。DataTable 展开能力本轮不实现。

## 决策场景复核

以下为主线程文档和源码推演，不是独立 agent 执行或浏览器验证：

| 场景 | 应得决策 |
| --- | --- |
| 完整资源管理页 | 公共页面布局 + useDataTable/DataTable，明确工具栏、分页、CRUD 和权限归属；无需 named block |
| dashboard 内嵌只读列表 | 保留宿主，只组合相关列表部件；不强加新页面层级或增删改 |
| 旧 icon + label 按钮 | 转到已验证的图标 slot API，清理旧尺寸覆盖，并验证实际渲染 |
| 专业图表能力超出公开接口 | 记录具体缺口或已有明确接受的例外；不能静默简化数据或修改 managed Chart |
| 报告仍有适配层，但计划全部 verified | 将剩余职责拆成可跟踪映射，修正覆盖和状态；不能只改 complete 标签 |
| 旧 CLI 报 Vite 路由错误 | 保留原版本和结果，记录人工分析；使用已修复 CLI 复查后分别记录新结果 |

## Commit 1：CLI 正确性修复

建议标题：`fix(cli): scope router detection and reconcile migration completion`

内容：Next 目录约定只适用于 Next 项目；保留 Vite 路由清单审查；非 complete 声明不能自动完成；complete 声明遇到失败/未检查项时报告矛盾。命令继续只读，保留 accepted exceptions、失败与未检查的区别。

完整文件清单：

- `packages/cli/src/swap/scan.js`
- `packages/cli/src/swap/check.js`
- `packages/cli/tests/swap/scan.test.js`
- `packages/cli/tests/swap/check.test.js`
- `packages/cli/README.md`

验收：`pnpm cli:test`、`pnpm cli:check`。上一轮当前代码的 56 项 CLI 测试已通过；本轮没有修改 CLI 源码或测试。GPUWorks 的只读复查结果为路由误报 106 → 0，计划仍返回 partial。不能将此结果表述为 GPUWorks 已完成 UI 迁移。

## Commit 2：Skill 规则整理

建议标题：`docs(skills): consolidate migration contracts and acceptance rules`

顺序：在 Commit 1 之后。将专项规则、入口引用、报告模板和决策 fixture 一起提交，确保这一提交可独立打包。图表、控件、资源列表都共享两个入口和验收文档，不再按主题拆成依赖细碎 hunk 的多笔提交。

完整文件清单：

- `.agents/skills/swap-to-zeronui/SKILL.md`
- `.agents/skills/swap-to-zeronui/assets/report-template.md`
- `.agents/skills/swap-to-zeronui/references/inventory-and-mapping.md`
- `.agents/skills/swap-to-zeronui/references/verification-and-recovery.md`
- `.agents/skills/zeron-page-builder/SKILL.md`
- `.agents/skills/zeron-page-builder/references/charts.md`（新增）
- `.agents/skills/zeron-page-builder/references/control-composition.md`（新增）
- `.agents/skills/zeron-page-builder/references/resource-list-structure.md`（新增）
- `.agents/skills/zeron-page-builder/references/composition-contracts.md`
- `.agents/skills/zeron-page-builder/references/project-adaptation.md`
- `.agents/skills/zeron-page-builder/references/selection-guide.md`
- `.agents/skills/zeron-page-builder/references/verification.md`
- `tests/fixtures/skill-decisions/scoped/review.md`
- `docs/plans/2026-09-19-skills-review-and-commit-plan.md`（本文）

本轮验收：两个 Skill 的 quick_validate 均通过；`pnpm skills:build` 成功生成 20 个分发文件；`tests/skill-distribution.test.mjs` 的 3 项测试通过，覆盖归档一致性、依赖为空的消费端安装及本地引用完整性、重复构建。`git diff --check` 通过。没有新增匹配文档措辞的测试，也没有运行无 UI 改动所不需要的浏览器/全站构建。

## 不纳入这两笔提交

- `.gitignore`：Bingo 本地设计数据忽略规则，另行处理。
- `app/globals.css`：移除 tw-animate-css，与本轮 Skill/CLI 修复无关。
- `packages/cli/package.json` 和 `packages/cli/tests/cli.test.js`：现有 beta.16 → beta.17 版本变更保留在工作区；不要混作本次修复或据此宣称 npm 已发布。后续发布时确认远端版本，统一决定版本号和发布记录。
- `docs/plans/2026-09-19-user-account-review-and-commits.md`：账号功能的既有整理文档，不混入 Skill 提交。
- `public/skills/`：已有忽略规则，分发产物由构建生成，不手工暂存 ZIP/manifest。

## 执行要求

每笔按上面的明确文件列表暂存，检查暂存 diff 与范围一致，运行 `git diff --cached --check`。不使用 `git add .`，不把已有版本改动或样式改动带入。本文仅提供计划，不授权 npm 发布；Git 提交和远端推送在用户要求执行时进行。

若工作区在执行前继续变化，先重新检查文件归属与测试适用性。文档中的测试结论对应本次代码状态，不代表未来修改后的状态。

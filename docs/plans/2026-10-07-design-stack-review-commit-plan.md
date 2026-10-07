# Design Stack review 与 commit 计划

日期：2026-10-07。范围：本次 Design Stack block，以及为它扩展的 Avatar、Select、DataGrid、文档和安装入口。本计划创建于 review 阶段；随后用户要求提交到 GitHub main，按下列顺序执行。实际提交与推送状态以 Git 历史为准。

## Review 结果

| 级别 | 发现 | 已完成处理与验证 |
| --- | --- | --- |
| P2 | 替换列定义后，行与单元格缓存保留旧分类标签 | 两层缓存识别列定义变化；visibleCells 同步更新。新增宿主替换分类标签的行为回归测试，修复前失败、修复后通过。 |
| P2 | Tool 文本不变、仅替换 logoSrc 时，leading 内容未刷新 | 有 leading 的单元格识别行数据引用变化；不强制刷新所有普通单元格。新增独立回归测试，修复前失败、修复后通过。 |
| P2 | 没有可撤销/重做记录时，快捷键仍清空选择 | 只处理可执行的历史操作。新增回归测试并在浏览器验证：Ctrl+Z/Ctrl+Y 保留已选 5 行。 |
| P2 | aria-rowcount 漏算表头，且按回调存在与否计入添加行 | 共用 showRowAdd 判断实际添加行是否显示，总数包括表头与逻辑数据行。四种只读/添加回调组合中，修复前三种失败，修复后全通过。 |
| P3 | 批量删除对每个选中行重复查找索引 | 先构建选中 ID 集合，再遍历当前行模型一次；复杂度由 O(n×k) 改为 O(n+k)。保留排序后按稳定 ID 删除的语义。 |
| P3 | 增删行导致列定义无意义重建；SVG 每次渲染重复去 title | 列定义不再依赖 items.length，空表判断读取当前行模型；可信品牌 SVG 在模块初始化时处理一次。 |
| P3 | Avatar guide 与首字母/装饰 SVG 示例不一致；历史快照描述过强 | 明确图片需要 fallback、纯首字母可只使用 fallback、可信 SVG 可配相邻文字；历史记录为克隆快照，返回 items 按 React state 使用。 |

审查同时保留此前要求：Tool 使用 Avatar sm（24px）、尺寸关联的 rounded-md 圆角；分类菜单以单元格为锚点并对齐底部；block 出现在列表；footer 为 px-2 py-0；最后一条逻辑数据行无底边框。

未发现本次范围内尚未处理的阻塞问题。受控同步数据、宿主持久化、不可变状态更新仍是既有公开契约；没有添加后端或发布包。

## 建议拆为 4 个 commit

按以下顺序执行。每步包含对应源码、契约文档、测试及由该步源码生成的产物。

### 1. `feat(avatar): support md sizing and size-aware rounded corners`

- `packages/ui/src/components/avatar.tsx`：sm/md/lg 为 24/32/40px；md 默认；图片、fallback、边框继承根圆角；徽标尺寸同步。
- 保留 `default` 尺寸别名与固定 `rounded-md` 输入；`shape="rounded"` 随尺寸选圆角。
- `tests/avatar.test.tsx`、`docs/pages/components/avatar/page.tsx`、两种语言的 Avatar 内容、`docs/agent-guides/components/avatar.md`。
- 对应 `public/r/avatar.json`、Avatar guide 的 `public/llms-full.txt` 内容，以及实际生成器产生的相关 catalog 变化。
- 验证：Avatar 测试、类型检查、design lint、Registry check；浏览器检查三种尺寸、徽标和分组计数。

### 2. `feat(select): support explicit popup positioning anchors`

- `packages/ui/src/components/select.tsx`：公开原生 Positioner 的 anchor，传递到定位层。
- Select 页面、两种语言内容与 `docs/agent-guides/components/select.md`，以及 `public/r/select.json`、相关生成 guide 内容。
- 验证：Select interaction/size tests、类型检查、Registry check。本步仅提供定位能力，DataGrid 的调用在下一步。

### 3. `feat(data-grid): support decorated cells and stable embedded editing`

- `packages/ui/src/components/data-grid/` 下本次修改的 DataGrid、Row、Cell、CellVariants、ColumnHeader。
- `packages/ui/src/hooks/use-data-grid.ts`、`packages/ui/src/system/data-grid-types.ts`。
- 装饰性 leading、URL hideProtocol、Container 交互边界、显式行选中状态、编辑期间的延迟焦点保护、最后逻辑行边框、列/leading 缓存刷新、行数 ARIA 修复。
- SelectCell 使用 commit 2 的 anchor，以单元格为定位基准，去掉 padding 偏移补偿。
- `tests/review-data-grid.test.tsx` 与 `tests/review-data-grid-cells.test.tsx`；DataGrid 页面及两种语言内容。
- `docs/agent-data/components.json` 仅 DataGrid keyApi 部分；`public/r/data-grid.json` 与相应生成 catalog 内容。
- 验证：DataGrid 回归测试（含重复 identity 测试）、类型检查、design lint、Registry check。
- 依赖 commit 2。

### 4. `feat(blocks): add editable design stack block`

- `packages/blocks/src/application/design-stack-01/` 的组件、类型、fixture、品牌素材、历史 hook 与导出；`tests/design-stack.test.tsx`。
- `packages/blocks/package.json`、Registry、capabilities、block catalog 注册。
- `scripts/test-consumer-installs.mjs` 的 Next.js/Vite 示例。
- 新增 block 文档页、客户端、demo、en/zh-CN 内容、agent guide、应用详情路由。
- `docs/catalog/artifacts.ts`、`docs/manifest.ts`、StandaloneBlockDemo/standalone-blocks 注册。
- `docs/components/blocks/BlockPreview.tsx` **仅 Design Stack preview loader 部分**。
- `scripts/preview-source-allowlist.mjs`，新增 agent identity/guide route/block metadata；对应 routes/loaders/i18n/preview sources、`public/r/design-stack-01.json`、Registry index、llms 产物。
- `tests/docs-artifact-catalog.test.ts`、`tests/i18n-document-manifest.test.ts`；本计划可随本步提交。
- 验证：block/history、catalog、manifest、standalone、agent tests；全部生成一致性检查；类型检查、design lint；Next.js/Vite pnpm 安装与生产构建；浏览器主流程和宽窄屏。
- 依赖 commit 1–3。

block 注册、文档发现与 gallery 注册应在同一步完成。catalog 测试要求文档与 block 一一对应，拆开会让中间 commit 失败。

## 暂存与生成策略

1. 以当前实际 HEAD 为起点，每个 commit 只挑选上列源码及契约内容；不要使用 `git add .`。
2. 在只包含该步和前序 commit 的独立候选 checkout 中生成匹配产物，然后验证并提交。当前混合工作区的生成 hash 不能直接当作每一步的结果。
3. 共享文件按内容分配：components.json 中 DataGrid API 属于第 3 步，新增 block 属于第 4 步；llms guide 变更随对应组件提交。不要手改生成 hash。
4. BlockPreview 的 PreviewToolbarProvider import、包装与封面注释属于其他任务，排除。block preview source hash 由 allowlist 中的规范 block 源码决定，候选 checkout 应重新生成对应 hash/source 文件。
5. `docs/plans/` 中其他任务的未跟踪计划排除；`.zeron/reports/` 与截图是本地验证证据，遵循仓库现有忽略策略。
6. Credit Usage 修复已由当前 HEAD 的 `35cc815` 单独提交，本计划不再次包含它；执行时重新检查 HEAD 与工作区，避免覆盖其他并行工作。
7. Gallery 和文档数量断言按候选 checkout 的实际完整 catalog 更新，不机械套用混合工作区数字。

主要生成命令：`pnpm docs:loaders:build`、`pnpm docs:routes:build`、`pnpm docs:sources:build`、`pnpm agents:guides:build`、`pnpm registry:build`、`pnpm agents:build`。新增文档时先生成 loaders，再生成依赖 loaders 的 routes。干净 checkout 还需先运行 `pnpm skills:build` 准备 agent catalog 使用的分发产物。只在本步影响对应输入时运行；生成后 review diff。

## 验证与覆盖

- 最终相关测试：11 个测试文件、132 项通过。日志：`/tmp/zeron-design-stack-review-tests-final.log`。
- `pnpm typecheck`、受影响源码 ESLint、完整 `pnpm lint:design` 通过；`git diff --check` 通过。
- Registry check、agent catalog check、文档 routes/loaders/preview sources、guide loaders 一致性通过；agent guide 示例 26 篇、27 个 TSX 示例通过。
- 浏览器主流程：排序、排序后删除、Undo/Redo、分类/URL 编辑、Escape 取消、添加并进入编辑、键盘撤销与重做通过。
- 浏览器末行边框：初始、添加、撤销添加、删除末行、撤销删除、排序、重载通过。
- 明暗主题 1280/768/480/360px 及 1280×320 短窗口复验；页面没有横向溢出，横向滚动由 DataGrid 承担；短窗口可滚动到 footer。
- 最终 Next.js/Vite pnpm Registry 安装、类型检查及生产构建全部通过；结果见本地 verification JSON 与 `/tmp/zeron-design-stack-review-consumer.log`。
- 完整文档站生产构建与完整浏览器/操作系统矩阵未运行；未覆盖项不计作通过。

## 组件与样式报告

23 个相关源码文件，218 种来源/导出组合、538 次 JSX 使用，design lint 0 错误、0 警告。该范围包含共享文档/预览文件中的既有组件，不能解读为新增组件数量。完整明细：`.zeron/reports/design-stack/review-after.json`。

| 组合 | 作用 |
| --- | --- |
| Container、ContainerHeader、ContainerFooter | 外层工具栏、表格区域与底栏 |
| DataGrid 与原生短文本、select、URL、date 编辑器 | 编辑、排序、选中与键盘交互 |
| Avatar、Badge、Checkbox、Button、createIconSlot | 工具 Logo、分类、行选择与操作 |
| 业务层历史 hook 与可信品牌 SVG | 宿主可选历史记录和品牌装饰；不重复实现 UI primitive |

源码采用 Zeron 公开组件与语义样式；spacing/overflow 工具类负责外部布局。品牌图保留自身颜色，单色图使用语义前景。未增加 token 或 lint 例外。自动 inventory 的 3 项未解析别名已经人工确认来源：DropdownTrigger 是公开 Menu.Trigger 适配；motion.svg/path 是托管 Select 内的动画 SVG。自动状态仍保留 unchecked，不伪改为通过。

review-after 增加 DataGridCell 文件，之前报告没有相同完整覆盖，且不能作为可靠的全范围 pre-edit 基线；不宣称自动归因或 token 合规百分比。

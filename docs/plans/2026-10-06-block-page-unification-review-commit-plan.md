# Block / Page 统一：最终 Review 与 Commit 计划

日期：2026-10-06。对应 [六阶段总方案](./2026-10-05-block-page-unification-plan.md)。

状态：六阶段本地实现及本次 review 修复、复验已完成；本文为最终提交拆分依据。尚未执行暂存、commit、push 或公开发布。人工验收与最终提交版本的完整安装矩阵仍需分别确认。

## 1 Review 结论

统一方向成立：视觉原语归 UI，领域状态映射归 Block，模拟数据与设置归文档。工作区外壳没有引入 Next 路由依赖；领域枚举、受控回调、缺失值、金额单位和业务汇总继续由消费者负责。无需再增加状态包装组件、万能页面或统一业务状态机。

提交使用最终设计，避免把已经撤销的中间实现写入提交历史：

| 场景 | 最终采用 |
| --- | --- |
| 短状态、状态点、独立图标 | Badge；plain / dot / solid / strong，业务自行映射 status |
| 首次失败与重试 | Alert + Title / Description / Action；静态错误与新发生错误明确分配播报职责 |
| 活动、过期、长说明、保留旧快照的刷新失败 | InlineNotice；活动图标由消费者组合，支持减少动态效果 |
| 趋势、圆环 | Chart 组合；TimeSeriesChart / DonutSummary / chartTrendPreset |
| 图例、格式化、分段条、可访问数据表 | chart-primitives；独立安装不引入 Recharts |
| 运维页面结构、非表格分页 | OperationsWorkspaceShell / ListPagination；查询、路由、组织与账号行为由宿主负责 |
| 演示设置 | PreviewToolbar + DemoSettingsMenu；全屏 Neutral、32px、16px 吸附、可拖拽；下次刷新失败使用 Switch |

状态 Badge 的有边框变体采用 **28% 不透明度（alpha 0.28）**。资源状态总览、资源指标列表、安全评分的主题蓝色保留。分类色不转换成健康状态；启用、就绪、已处置和恢复正常仍是不同领域含义。

### 本次发现与优化

| 级别 | 问题 | 处理与回归 |
| --- | --- | --- |
| P2 | dot Badge 使用 leadingIcon 替换圆点时误走填充样式分支 | 按 variant 决定外观，图标沿用原圆点颜色；状态与分类两种用例均回归 |
| P2 | 显式 total=null / 非法总量被已知分类推算成完整总量，违背公开指南 | 只有省略 total 且分类完整时推算；显式未知保持未知绘图；覆盖 null / NaN / Infinity / 负值 |
| P2 | 部分用量未知时 progressbar 仍通过 aria-valuenow 宣称完整数值 | 不完整容量或用量省略 aria-valuenow，由 valueText 说明；正常零值与超额数值保留 |
| P2 | 多个有限超大值累加溢出，可能向绘图或辅助技术输出 Infinity | 不可表示的汇总标为不完整，保留中性轨道，不输出无穷进度 |
| P2 | 源码预览测试在全量执行中误加载真实编辑器，单独运行却通过 | 每项测试重新登记延迟导入 mock 并导入预览模块；保留加载、取消、复制失败恢复与状态保持断言 |
| P2 | 总方案与阶段六表格仍容易被读成最终组件 API / 当前安装证据 | 总方案明确指向组件收敛记录与本文；历史数量保留为当时快照，不覆盖后续改动 |
| P3 | chart-primitives 指南 related 重复 Badge；新验收会覆盖阶段六历史输出 | 去重；安装 runner 增加独立证据目录参数，默认行为保持兼容 |

首次新增回归有 7 项失败，修复后通过；另补超大值汇总用例。源码预览问题在本轮完整测试中复现，原失败日志保留。没有降低断言、添加样式规则例外或把运行时问题改成跳过。

## 2 范围与证据有效性

迁移范围仍为 **44 个入口：43 个可安装 Block/Page + 独立 /workflow**。完整名单沿用阶段五台账；不以当前工作区的目录总数重新扩大迁移范围。

历史阶段六有 50 个安装项、192 个安装目标，全部通过；随后组件收敛以 Badge / Alert / InlineNotice 替换原有两个安装项，当前仍是 50 项、192 个目标。项目总 Registry、Agent 和文档数量还包含同期其他功能，不能据此计算本轮覆盖率。

本次逐目标比对当前 Registry 的递归依赖字节指纹：历史 192 个目标仅 **6 个一致，186 个过期或缺失**。指纹一致只代表 Registry 闭包未变，不证明当前 CLI、示例和验收器仍一致。因此历史 192/192 不作为当前最终版本的通过证据。

当前基础及局部修复可以进入提交拆分；最终合并 / 分发候选须在提交版本冻结后重跑完整矩阵。不得用 --collect 汇总历史文件替代复验。--resume 只允许同一轮 CLI、示例、检查器固定后的续跑。

本轮日志、回归结果、安装指纹核查和样式报告位于 `.zeron/reports/unification-final-review/`；本轮安装使用独立输出，阶段六安装证据目录保留。组件样式报告只覆盖本次直接修改的 Badge 和 chart-primitives 两个文件：7 类显式 token 引用，2/2 文件设计检查通过，0 错误 / 警告；这些文件的 JSX 为原语内部元素，不以此计算业务组件采用率。未捕获此次修改前的完整库存基线，不计算自动归因百分比。

## 3 推荐 Commit 顺序

不按六阶段机械提交。阶段二 / 三及后续组件收敛反复修改同一批文件，应按最终能力及真实依赖拆分。下面 9 笔各自包含对应源码、测试、登记、指南及该版本重新生成的产物；生成产物不统一推迟到最后一笔。

| 顺序 | Commit message | 范围与目的 | 前置 |
| --- | --- | --- | --- |
| 01 | `fix(ui): preserve menu activation and semantic typography` | 修正菜单事件传递、从 token 派生字体合并规则 | HEAD |
| 02 | `feat(ui): consolidate semantic feedback in badge alert and inline notice` | 最终状态 API、strong 语义配对、plain、图标替换、28% 边框与反馈文档 | 01 |
| 03 | `feat(charts): unify trends distributions and capacity visuals` | 共享图表与七处首批消费者，含未知 / 零 / 超额契约 | 02 |
| 04 | `refactor(blocks): share operations workspace and list pagination` | 六个运维页面、共享外壳、分页及完整列表数据反馈 | 02、03 |
| 05 | `feat(docs): unify demo settings and floating preview controls` | 预览工具栏、状态设置、失败 Switch、全屏悬浮控制与演示适配 | 03、04 |
| 06 | `refactor(blocks): complete semantic feedback and chart adoption` | 其余入口的状态 / 图表迁移及领域保留结论 | 02–04 |
| 07 | `fix(cli): preserve binary registry assets during installation` | Registry 与 CLI 配套的图片字节传输及冲突保护 | 01–06 |
| 08 | `test(delivery): verify installed unification consumers` | 安装矩阵、运行时验收、Node / CI、消费者示例与证据边界 | 01–07 |
| 09 | `docs(unification): record final contracts and acceptance evidence` | 六阶段记录、后续收敛及最终 review / 人工验收 / 新证据索引 | 01–08 |

### 01 菜单及字体合并

- `packages/ui/src/components/{menu-item,dropdown}.tsx`：实际点击与键盘激活经同一事件路径执行，禁用及取消语义保留。
- `packages/ui/src/system/{utils,tailwind-merge-tokens}.ts`、`scripts/generate-semantic-tokens.mjs`：合并规则使用已登记的 typography token；生成文件随源码同步。
- `tests/menu-item-activation.test.tsx`；semantic tokens 测试只选择派生字体数组的断言。
- **不带入** Transaction Details 的 display token 新增。派生规则可先提交，未来增加 token 自动进入规则。
- 验收：菜单、字体合并 / token、现有 Dropdown 用例，UI 类型检查；Registry / tokens 一致性。

### 02 状态基础能力

- `packages/ui/src/components/{badge,inline-notice}.tsx`；`packages/ui/src/tokens/semantic-tokens.mjs` 仅 strong 状态配对改动。
- 对应 token 生成产物与 `app/globals.css` 状态部分；不手工拷贝混合工作区全部生成 CSS。
- `docs/pages/components/{badge,alert,inline-notice}/page.tsx`、对应中英文内容、三份 Agent 指南及登记。
- 不新增 ErrorState / StatusIndicator 源码、导出、安装键或文档页。若需保留 retired identity，只带入退休说明，不恢复 active 目录。
- Badge 的独立基础用例可从 `status-feedback.test.tsx` / 阶段五测试中按 describe 块拆出；业务试点用例随 04 进入，避免提前依赖尚未迁移的页面。
- 验收：所有 Badge 变体、图标替换、静态播报职责、strong 深浅色对比度、Alert 重试和 InlineNotice 长文案；不引入 Recharts。

### 03 图表基础及首批真实消费者

- `packages/ui/src/components/{chart,chart-primitives}.tsx`、UI export / Registry 条目、图表文档 / 双语内容 / 指南 / 封面。
- 新文档所需 `scripts/generate-document-loaders.mjs` 与根 package 的 docs:loaders:build / check 入口在本笔提交；后续演示与交付检查复用该生成器。
- 首批消费者：`ai-gateway-overview-01`、`project-monitor-01`、`resource-status-all-01`、`resource-metric-list-01`、`storage-usage-01`、`credit-usage-01`、`security-overview-01`。
- Gateway / Project Monitor 同一文件中的刷新、保留快照与首次失败组合一并纳入；本笔依赖最终反馈 API，不拆出未采用的中间包装组件。
- 安全概览对应 charts / views / 主文件，趋势与评分统一，雷达仍保留领域绘制。资源指标列表使用 **SegmentedBar**，资源状态总览使用 DonutSummary / ChartLegend。
- `tests/chart-unification.test.tsx`，这些入口的契约、数据与交互回归，以及对应指南和 Registry 依赖片段。
- 验收：时间窗口 / 时区 / 单位、断点、分类颜色稳定、明确总量、未知总量、部分未知、零、超额及超大值；三个指定图表保持主题蓝色。

### 04 运维外壳、分页与完整试点

- `packages/blocks/src/application/operations-workspace-shell-01/` 与 `packages/ui/src/components/list-pagination.tsx`；两者的 export / Registry / 指南。
- 六个采用入口：`zaiops-operations-01`、`cluster-environment-list-01`、`cluster-environment-detail-01`、`inspection-report-list-01`、`monitoring-alert-list-01`、`service-management-01`。
- 相关 Block 的 framework、capabilities、共享依赖及资源 SVG 声明文件安装清单，同步本笔版本。
- `tests/{operations-workspace-unification,page-unification-pilot,status-feedback}.test.tsx` 与 Sidebar / Layout / Registry 契约中的相应片段。02 已落地的基础测试不重复提交。
- 包依赖只纳入本笔所需项，不夹带其他新增 Block 的 framer-motion 声明。
- 验收：一次快捷键打开一处搜索；受控组织 / 导航回调；收起侧栏退出键盘范围；移动菜单及焦点返回；分页越界和数据缩减；失败、重试与保留快照。

### 05 演示设置与预览

- `docs/components/content/{PreviewToolbar,FloatingPreviewControls}.tsx`、`floating-preview-position.ts`、`ComponentPreview.tsx`。
- `docs/components/blocks/{DemoSettingsMenu,DataStateDemoControls}.tsx`，BlockPreview / StandaloneBlockDemo 的对应 Provider / Slot 接入。
- Project Monitor / Gateway 演示、OperationsListDemos / OperationsWorkspaceDemos / FileManagerDemo / RuleFlowEditorDemo 及原范围文档页适配。
- 中文 / 英文 common 中相关工具栏文案；`tests/demo-settings-menu.test.tsx`、`tests/floating-preview-position.test.ts`、预览代码 / 源码加载测试。
- `next.config.ts` 只选开发目录可配置片段，`tsconfig.json` 只选开发类型目录片段；更新页的环境注入留给更新页任务。
- 验收：文档顶部入口归属正确；切换代码不重置演示；Switch 只影响下一次实际操作；全屏中 Neutral / 32px / 16px / 拖拽 / 菜单 / Escape 正确。

### 06 剩余迁移

- 监控 / 用量：`availability-monitor-01`、`personal-settings-01` 及其公开包装入口、`model-detail-02`。
- 列表 / 详情：`resource-list-table-01`、`member-department-01`、`ai-gateway-session-list-01`、`infinite-log-table-01`、`file-manager-01`、`resource-detail-page-01`、`deployment-detail-01`。
- 追踪 / 规则 / 账号：`agent-trace-01`、`agent-message-trace-01`、`model-router-01`、`traffic-rules-01`、`login-01`、`signup-01`、`user-account-01`。
- `tests/block-page-unification-stage-five.test.tsx` 与上述入口的契约 / 交互更新。既有公开包装入口没有直接代码 diff，仍纳入回归。
- 不强行修改 Resource Catalog、专用流程画布及没有状态 / 图表适用项的入口；阶段五的逐项保留理由保留。
- FileManager 的 `renderErrorState` 是公开回调，继续保留；删除组件不等于删除宿主自定义渲染 API。
- 验收：领域枚举、HTTP outcome、启用 / 停用、发布、处置、权限没有合并；表格 / 虚拟列表 / 画布操作保留；可访问数据表和旧快照提示正确。

### 07 二进制分发修复

- `packages/cli/src/{registry-binary,install-plan,resolve-registry-aliases,cli}.js`、CLI README、安装安全测试。
- `packages/registry/scripts/postbuild.mjs`、postbuild / consumer-registry-expectations 测试与对应安装预期 helper。
- MCP PNG 的重新生成 Registry 产物与依赖索引；CLI / Registry 两侧必须同笔提交。
- 验收：字节一致、真实图片加载、重复安装、用户修改保护、预检后的文件变化、计划目标与覆盖行为；单独 shadcn 不承担解码，文档明确本地配套边界。
- 本笔不改 npm 版本、不上传包、不公开发布。

### 08 验收基础设施

- `scripts/test-unification-consumers.mjs`、`scripts/lib/{unification-consumer-examples,unification-consumer-verification,feedback-consumer-verification}.mjs`。
- `scripts/test-consumer-installs.mjs` 的原范围示例、Vite 包管理器配置与验收器接入；新增 Block 的样例片段继续留在其所属任务。
- `scripts/check-agent-guide-examples.mjs` 的 ambient declaration 修复；复验 03 已提交的文档生成器增量更新与删除同步。
- `.nvmrc`、CI Chromium 安装顺序、根 package 的 test / worker / 浏览器隔离 / unification 入口、README 验证说明、`.gitignore` 仅 reports 忽略项。
- 相关消费者示例 / 指纹 / 安装闭包 / CLI 与渲染控件测试；保留所有原业务断言及超时诊断记录。
- 验收：本地和干净 checkout 的全部测试、类型、lint、生成检查、生产构建；最终 Registry / CLI 固定后执行新的完整安装矩阵。

### 09 最终文档与验收索引

- 总方案、六阶段实施记录、演示设置记录、状态组件收敛记录和本文。
- 新证据索引记录实际提交、Registry 快照 / 依赖闭包、CLI 包指纹、验收器版本、命令、数量及未检查项。日志截图可以留在本地 / CI artifact，仓库保存可追溯结论。
- 检查历史文档的后续收敛说明与最终验收入口；不删除历史失败，不把旧数字改成新版本的通过证据。
- 本笔不承担遗漏的代码修复或一次性补入所有混合工作区生成文件。发现遗漏，回到对应能力提交补齐。

## 4 共享文件与其他任务的边界

| 文件 / 区域 | 本计划的暂存范围 | 留给其他任务 |
| --- | --- | --- |
| `packages/{ui,blocks}/{package,registry}.json`、Block catalog / capabilities | 原 44 入口、共享能力、必要依赖与能力变化 | 四个新增 Block 的创建与依赖；全文件纯格式化 |
| `docs/manifest.ts`、catalog、standalone / preview 映射 | Chart 文档、原范围演示替换与 API 指南 | 新增 Block 文档入口和展示排序 |
| token 源码 / 全局 CSS / tokens 包 | strong 状态配对，通用字体合并派生 | Transaction Details 的 display 排版新增 |
| `packages/ui/src/components/{tabs,status-overview,radio-group}.tsx` | 本轮无须带入 | Tabs leading / 无标签轨道、RadioGroup 水合修复；作为相关新增 Block 的前置提交 |
| `app/[locale]/updates/`、commit-history / commit-artifacts、Next env 注入 | 不纳入 | 更新页增强及其测试 |
| `pnpm-lock.yaml` | 仅本轮实际新增依赖对应的锁变化，在隔离版本重新生成 | 新增 Block 的所有依赖变更；禁止整文件盲目纳入 |
| `public/r/`、`docs/generated/`、`public/docs-source/`、`docs/agent-data/`、llms | 按本笔已纳入源码重新生成、检查 | 当前混合工作区的全部输出 |

四个新增 Block 为 `file-upload-01`、`integration-monitors-01`、`support-analytics-01`、`transaction-details-01`，不属于原 44 入口。本轮已经将它们的反馈调用适配到最终 API，应保留这些修改，但不把整个新功能打包进统一迁移提交。

如果它们尚未提交：其创建提交直接使用最终 Badge / Alert / InlineNotice，按各自计划落地；如果已提交旧调用：在其创建提交之后单独追加反馈适配提交。Integration Monitors 旧计划里对 ErrorState / StatusIndicator 的前置要求已经失效，以本文最终边界为准。其他计划的历史失败不代表当前一定失败，也不能在没有复验时自动改成通过。

## 5 组装、验证与回退

1. 保留当前共享工作区；不使用 `git add .`。从确认的 HEAD 与前置提交组装隔离候选目录，按上表选择源码及共享文件中的相应片段。
2. 新测试文件若同时包含基础与业务用例，按 describe 块拆分或按对应能力一起提交；禁止提前提交会依赖未落地 API 的测试。每笔都执行 `git diff --cached --check` 并核对未跟踪文件和 import 闭包。
3. 每笔按需要生成 tokens、Registry、文档加载映射 / 路由 / 源码、指南及 Agent 目录。生成输入只包括该笔与前置提交；不手工编辑 hash 资源或最终 Registry 内容。
4. 每笔至少通过相关行为测试、包类型检查、Registry 闭包和生成一致性；有 UI 行为变化时检查对应真实页面。中途缺少最终验收器的步骤，使用当时已存在的安装 smoke 与实际消费者导入检查，08 再执行完整统一 runner。
5. 09 前冻结最终源码，运行完整验收；人工确认另列，公开发布另行走既有干净源码门禁。9 笔计划不是本轮已创建的 commit。

建议每笔生成流程按依赖顺序执行：

```sh
pnpm tokens:build
pnpm registry:build
pnpm docs:loaders:build
pnpm docs:routes:build
pnpm docs:sources:build
pnpm agents:guides:build
pnpm agents:build
```

最终版本检查入口：

```sh
pnpm test
pnpm cli:test
pnpm typecheck
pnpm lint
pnpm lint:design
pnpm tokens:check
pnpm registry:check
pnpm docs:loaders:check
pnpm docs:routes:check
pnpm docs:sources:check
pnpm agents:guides:examples:check
pnpm agents:check
pnpm build
```

为保留阶段六历史证据，新安装矩阵使用独立目录：

```sh
ZERON_UNIFICATION_EVIDENCE_DIR="$PWD/.zeron/reports/unification-final-candidate" \
  pnpm test:consumer:unification
```

默认完整重跑，不传 --resume / --collect。最终范围仍为 192 个目标，不把本轮少量定向安装扩大表述成 192/192。

回退按依赖逆序：先回退消费者 / 文档接入，再回退公共能力。每笔源码与生成产物一起恢复；CLI 二进制解码与 Registry 编码一起恢复。不覆盖其他任务或用户未提交修改，不增加永久 feature flag。

## 6 人工验收与剩余门槛

| 优先级 | 页面 | 重点 |
| --- | --- | --- |
| 必验 | Badge / Alert / InlineNotice 文档 | plain、dot 图标替换、strong、28% 边框；重试与长文案；深浅主题、键盘与减少动态效果 |
| 必验 | Chart / Chart Primitives 文档 | 零 / 缺失 / 不完整 / 超额、图例重排、时间窗口与可访问数据表 |
| 必验 | Project Monitor / AI Gateway Overview | 首次加载 / 失败、重试、旧数据、实际窗口切换、下次刷新失败 |
| 必验 | 六个运维页面 | 组织 / 账号 / 导航、搜索快捷键、折叠与移动导航、过滤、分页与首次 / 刷新失败 |
| 必验 | Resource Status All / Resource Metric List / Security Overview | 主题蓝色与业务严重程度分开；扫描结束后快照等待不误报 |
| 必验 | Cluster List 文档 / File Manager 文档与全屏 demo | 顶部设置、代码切换保留状态、Neutral / 32px / 16px / 拖拽与菜单 |
| 回归 | MCP Detail / Resource Catalog / Resource Detail / File Manager / Deployment Detail / Agent Trace | 图片、公开目录、必需 data、宿主渲染回调、状态图标与重试 |
| 全量核心路径 | 阶段五完整 44 行入口 | 按台账逐项确认；未改入口也不以“无 diff”代替行为验证 |

六阶段本地实现完成，不等于人工验收完成或正式公开发布。当前最终版本的完整 192 项安装矩阵、干净候选验证和人工确认是提交合并 / 分发的剩余门槛；本文提供具体执行步骤，不提前标记通过。

## 7 本轮复验结果

以 `.zeron/reports/unification-final-review/` 的实际日志为准；以下结果是本轮复验，不继承历史结果。

| 检查 | 当前记录 |
| --- | --- |
| 新增状态 / 图表回归 | 2 文件、47 项通过；首次新增的 7 项失败均已修复 |
| 九个相关套件 | 首次修复后 9 文件、148 项通过；随后追加超大值与预览隔离验证，最终全量结果另列 |
| 预览加载与设置 | 3 文件、13 项通过，保留取消、晚到响应与复制恢复断言 |
| 类型、全量 lint、设计 lint | 根项目及 UI / Blocks 独立类型检查通过；全量普通 / 设计检查通过；最终测试隔离与 runner 修改的定向 lint 再检通过 |
| Registry / 文档 / Agent | 146 Registry 项、120 文档加载器、116 路由、46 源码条目、154 Agent 项 / 52 指南检查通过 |
| 图表浏览器 | 390 / 1440px × 深浅主题无页面横向溢出；实际容量 80 → 166，重排后仍 166 |
| 全量测试 | 259 个源码 / 组件文件、2,270 项 + 1 个 Chromium 文件、7 项，共 **260 文件、2,277 项通过**，无跳过；首轮预览测试失败日志保留 |
| CLI 与生产构建 | CLI 139 项通过；生产站点构建通过；本地开发服务继续保留 |
| Agent 指南示例 | 26 份指南、27 个 TSX 示例类型检查通过 |
| 定向独立安装 | Badge / chart-primitives × Next / Vite，pnpm，**4/4** 通过；24 个深浅主题 / 宽度视图，0 页面运行异常；不扩展为完整矩阵通过 |
| 历史安装指纹核查 | 6/192 闭包一致；186 过期 / 缺失；只作审查，不作新安装结果 |
| 当前最终完整安装矩阵 / 人工确认 / 公开发布 | 尚未完成当前版本的完整矩阵；人工确认待记录；未发布 |

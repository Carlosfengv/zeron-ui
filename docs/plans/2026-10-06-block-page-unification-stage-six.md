# Block 与 Page 统一：阶段六交付及验收记录

日期：2026-10-06\
状态：本地实施与当时自动验收完成；人工验收待确认，尚未公开发布。本文的 API 表格、数量和安装证据是阶段六原始快照；后续状态组件收敛与当前提交依据见 [最终 Review 与 Commit 计划](./2026-10-06-block-page-unification-review-commit-plan.md)。

对应[总方案阶段六](./2026-10-05-block-page-unification-plan.md#9-阶段-6-整体交付和分发验收)。继续冻结原方案的 **44 个入口：43 个可安装 Block/Page 加独立 `/workflow`**。工作区同期新增的其他 Block 不计入本轮迁移覆盖；不覆盖或回退其他未提交修改。

## 1 本阶段交付

- 同步并检查公共导出、Registry 依赖与能力声明、文档路由/源码、Agent 指南和检索目录。
- 为全部 43 个可安装入口及 7 个共享安装项提供通过公开导入路径实际挂载的消费者示例。每个目标独立安装依赖、打包本地 CLI、从 HTTP Registry 安装源码，不使用 workspace 链接。
- 安装矩阵包含 npm/Next、pnpm/Next，以及声明支持 React 的项目的 npm/Vite、pnpm/Vite。50 项合计 **192 个目标**：100 个 Next、92 个 Vite；4 个 Next 专用入口不伪造 Vite 支持。
- 每个安装产物进行类型检查、生产构建、CSS 检查及真实浏览器运行。基础组件检查 320/480/800px，Block/Page 检查 390/1440px；均覆盖浅色/深色与减少动态效果。
- 再次复验全部 44 个公开入口的核心路径，并补充文档的实际主题按钮、预览/代码页签、全屏悬浮设置验收。
- 整理本轮发现的问题、最终安装边界、完整证据索引与人工验收入口。

### 已处理的问题

| 问题 | 修复与验证 |
| --- | --- |
| 字体合并漏掉 `text-display`，它与文字颜色一起使用时被错误删除 | 合并规则从已有排版 token 自动生成，避免手工枚举遗漏；字体合并测试及生产构建通过 |
| 共享分页底栏使用数字高度，与语义尺寸规范不一致 | 改用同为 40px 的 `min-h-control-xl`，保持尺寸与布局；设计检查通过 |
| 老测试仍按独立 Sidebar、Next 专用运维 Block、内联 Demo 按钮定位 | 根据共享外壳与实际公开菜单更新断言，保留行为与来源检查；补齐 intl 测试上下文，不删除业务断言 |
| 发布候选测试的 Node 环境及 Chromium 依赖不齐 | 使用已有 Node 22.17.0，补充 `.nvmrc`，并将 CI 的 Chromium 安装移到单测之前；保持干净源码和正式发布门禁 |
| 大量消费者构建与单测同时运行时，浏览器进程启停及独立 CLI 调用超出默认预算 | Chromium 启停 hook 和启动独立 Chromium 的 CLI 集成用例设为 30 秒；其余 UI 用例保留原超时与断言。`pnpm test` 顺序执行 2-worker 源码/组件测试和独立 Chromium 用例，CI 同步这两个步骤；全部用例保留，历史超时日志保留 |
| 测试日志写入被当作候选源码变化 | 仅忽略 `/.zeron/reports/` 的运行输出；不忽略整个 `.zeron`，不绕过脏源码门禁 |
| 消费者误把 `model-mcp-marketplace-01` 当作安装后的目录名 | 保持 Registry 安装键；导入真实公开目录 `resource-catalog-01`，Next/Vite 示例均修正 |
| Resource Detail 消费者漏传必需 `data` | 使用公开 `defaultResourceDetailPageData`；不为组件添加掩盖调用错误的默认行为 |
| MCP 详情 PNG 在 Registry 中被 UTF-8 解码，消费者拿到损坏图片 | Registry 用 `zeron:base64:` 字符串保留原始字节，本地 CLI 在已批准的安装计划目标内恢复图片。二进制冲突检查、重复安装、安装记录、用户修改保护及显式覆盖均有测试；Next 生产消费者验证图片真实加载 |

图片传输是本地 Registry 与本地打包 CLI 的配套能力。单独使用底层 shadcn 安装器会写入编码字符串；未来公开发布需要一起交付匹配的 CLI/Registry，并复验公开版本。本阶段没有上传、发布 npm 包或更改公开 Registry。

## 2 最终公共能力与适用边界

| 安装项 | 公开能力 | 宿主负责的部分 |
| --- | --- | --- |
| `badge` | `status` 可与 `strong` 组合；五种语义配对前景/背景 | 映射业务枚举；品牌、部门、供应商等分类继续用分类色 |
| `status-indicator` | 文字、标记、图标和可选运行动画；减少动态效果支持 | 保留运行、取消、中止、健康等不同业务含义；不默认制造 live region |
| `error-state` | 首次失败组合与重试反馈 | 确认无数据使用 Empty；刷新失败保留旧内容，使用局部 InlineNotice |
| `chart` | 原 ChartContainer/Tooltip 接口及趋势、分布、容量组合；可访问数据表 | 明确单位、locale、timeZone、时间域、汇总与缺失策略；不暗中换算或补零 |
| `chart-primitives` | 稳定 ID 分类色、独立状态色、静态/受控图例、容量/分布绘制 | 图例 `pressed` 与真实系列显隐受控；超额数字保留；null 不伪造为 0 |
| `list-pagination` | 页码、页大小及总数展示与回调 | 筛选后页码、数据获取与并发请求属于宿主 |
| `operations-workspace-shell-01` | 共享运维导航、页头、布局、身份组合 | 导航和账号操作通过宿主回调/链接适配；不包含 Next 路由依赖或业务状态机 |

指南见 `docs/agent-guides/components/{badge,status-indicator,error-state,chart,chart-primitives,list-pagination,operations-workspace-shell-01}.md`。公共 API 采用原有组合方式，不新增万能页面、列表或流程引擎。

`login-01`、`signup-01`、`mcp-detail-01`、`zlrlist` 声明为 Next 专用；其余本轮安装项声明支持 React。`/workflow` 是独立应用，没有 Registry 安装键，使用应用构建与浏览器验证。完整 44 行最终处置沿用[阶段五迁移台账](./2026-10-06-block-page-unification-stage-five.md#3-全部-44-个入口的最终处置台账)，每个入口的最终共享依赖另见 [`scope.json`](../../.zeron/reports/stage-five/scope.json)。

## 3 需要人工验收的页面

每组先在桌面浅色/深色验收，再检查 390px。重点检查文字、图例、提示和按钮的可读性，以及表格/画布滚动是否限制在自己的容器。

| 优先组 | 页面 | 可验收结果 |
| --- | --- | --- |
| 公共状态组件 | [Badge](http://localhost:3007/zh-CN/docs/components/badge)、[Status Indicator](http://localhost:3007/zh-CN/docs/components/status-indicator)、[Error State](http://localhost:3007/zh-CN/docs/components/error-state) | 五种状态在两主题清晰，长文案可读；运行动画在减少动态效果时停止；错误与无数据区分，重试操作可达；代码/预览可切换 |
| 公共图表组件 | [Chart](http://localhost:3007/zh-CN/docs/components/chart)、[Chart Primitives](http://localhost:3007/zh-CN/docs/components/chart-primitives) | 容量、分布、零和缺失值说明清楚；长图例在窄容器换行，超额数字不被截成上限；键盘可读取数据表；主题按钮确实改变样式 |
| 领域图表 | [Availability Monitor](http://localhost:3007/zh-CN/block-demo/availability-monitor-01)、[Personal Model Usage](http://localhost:3007/zh-CN/block-demo/personal-model-usage-01)、[Model Detail 02](http://localhost:3007/zh-CN/block-demo/model-detail-02) | 图例显隐恢复，系列色稳定；金额、百分比、Token 等单位正确；页签/范围切换与数据表可用 |
| 加载、失败和刷新 | [File Manager](http://localhost:3007/zh-CN/block-demo/file-manager-01)、[Cluster List](http://localhost:3007/zh-CN/block-demo/cluster-environment-list-01)、[Gateway Overview](http://localhost:3007/zh-CN/block-demo/ai-gateway-overview-01) | 设置里选择正常/首次加载/首次失败/无数据；重试可恢复。有刷新功能的页面打开“下次刷新失败”Switch，再执行刷新：旧数据保留，局部错误可见，下一次刷新可恢复 |
| 运维共享组合 | [Cluster Detail](http://localhost:3007/zh-CN/block-demo/cluster-environment-detail-01)、[Inspection Reports](http://localhost:3007/zh-CN/block-demo/inspection-report-list-01)、[Monitoring Alerts](http://localhost:3007/zh-CN/block-demo/monitoring-alert-list-01)、[Service Management](http://localhost:3007/zh-CN/block-demo/service-management-01) | 导航/账号菜单、筛选和分页保持可用；等级与处理状态不同；无报告仍保留环境头部和巡检操作 |
| 本阶段分发问题回归 | [MCP Detail](http://localhost:3007/zh-CN/block-demo/mcp-detail-01)、[Resource Catalog](http://localhost:3007/zh-CN/block-demo/resource-catalog-01)、[Resource Detail](http://localhost:3007/zh-CN/block-demo/resource-detail-page-01) | MCP 概览原图显示、工具页签可用；目录搜索与资源页签正常。独立安装的图片与导入路径以自动安装证据为准，工作区页面不能代替该证据 |
| 演示设置与全屏 | [Cluster List 文档](http://localhost:3007/zh-CN/docs/pages/cluster-environment-list-01)、[File Manager 文档](http://localhost:3007/zh-CN/docs/blocks/file-manager-01) | 设置按钮在预览/代码页签右侧；下次刷新失败用 Switch；全屏时 Neutral icon button 为 32px，不挤占内容；可拖拽，松开后吸附边缘 16px，菜单在全屏中可打开 |
| 主题蓝色回归 | [Resource Status All](http://localhost:3007/zh-CN/block-demo/resource-status-all-01)、[Resource Metric List](http://localhost:3007/zh-CN/block-demo/resource-metric-list-01)、[Security Overview](http://localhost:3007/zh-CN/block-demo/security-overview-01) | 资源用量与安全评分图仍是此前指定的主题蓝色；安全严重程度继续采用对应语义色 |

上述是重点验收入口；其他页面可按阶段五完整台账抽查。认证、部署、文件与工具操作仍使用示例数据或宿主回调，不代表接通真实后端。

## 4 自动验证与证据

证据存放于 `.zeron/reports/stage-six/`，截图在 `output/playwright/stage-six/`。均为当前本地工作区验证；没有运行远端 GitHub 发布或将脏源码声明为正式发布。

| 验证 | 当前结果 | 证据 |
| --- | --- | --- |
| 全仓库单测 | **260 文件、2,268 项通过，无跳过**；259 个源码/组件文件共 2,261 项，再独立运行 1 个 Chromium 文件共 7 项 | `tests-delivery.log`；首轮 `tests-stable.log` 和调整前日志保留 |
| CLI 全量测试 | 139 项通过，含图片字节与冲突回归 | `cli-final.log` |
| 生产站点构建 | 通过 | `build.log` |
| 类型、全量 lint、设计检查 | 通过；UI/Blocks 包各自类型检查通过，最终修复局部 lint 通过 | `typecheck.log`、`ui-package-typecheck.log`、`blocks-package-typecheck.log`、`lint-all-final.log`、`lint-delivery-fixes.log`、`design-lint.log` |
| Registry / tokens / 文档 / 指南 / 目录 | **148 Registry 项、118 文档路由、46 预览源码条目**一致；26 指南/26 TSX 示例通过；目录 156 项/52 指南，检索 33/33 Top-3 命中 | `registry-final-check.log`、`tokens-final-check.log`、`docs-*-final-check.log`、`guide-examples.log`、`agents-final-check.log`、`agents-final-evaluate.log` |
| 44 个入口核心路径 | 44/44，通过 176 个视图检查，未发现运行异常或页面外层溢出 | `browser-release.json`、88 张入口截图 |
| 文档主题、预览与全屏设置 | 5 个组件文档的真实主题按钮/预览/代码通过；集群列表通过新标签页进入全屏演示，Neutral/32px/拖拽/16px/菜单通过 | `browser-docs-extra.json` |
| 独立安装与运行目标 | **192/192 通过**：100 个 Next、92 个 Vite；50 安装项无未检查目标 | `consumer-results.json`、`installed/*.json` 和对应截图 |
| 本地分发候选 | 最终源码冻结后的生成、重试、依赖闭包、字节一致性及未上传范围，以[候选校验报告](../../output/agent-access/registry-candidate.json)为准 | `registry-candidate.json`、`registry-candidate-manifest.json`、`registry-publication-plan.json`；均在 `output/agent-access/` |

消费者证据绑定实际 Registry 快照及递归安装依赖的字节指纹。遇到本轮图片分发修复时，只复用根项和全部传递依赖都字节一致、且经核查 CLI/示例/检查器变化不会影响该目标的已通过结果：非二进制文本分支字节行为等价，CLI 全量回归通过，图片分支及先前失败示例均重新验证。原始证据和当时的快照保留，不把旧的失败记录改写为通过。独立项目在验证后清理，截图、JSON、日志与版本记录保留。

`pnpm test:consumer:unification` 默认重新运行完整目标，不因 Registry 未变就复用旧 CLI/示例/检查器的结果。`--resume` 仅用于本轮固定工具链内的显式续跑；工具链或示例改变后应完整重跑。`--collect` 汇总已有证据，不执行新的安装检查。

本地 CLI 分发包位于 [`zeron-ui-0.2.0-beta.18.tgz`](../../output/agent-access/stage-six-cli/zeron-ui-0.2.0-beta.18.tgz)，打包哈希与范围见 [`cli-artifact.json`](../../.zeron/reports/stage-six/cli-artifact.json)。完整台账汇总在最终 [`acceptance-index.json`](../../.zeron/reports/stage-six/acceptance-index.json)，每行关联安装与浏览器证据；人工确认仍记录为 pending。

验证版本为 Node 22.17.0、React/React DOM 19.2.0、Next 15.5.24、Vite 8.2.1、Tailwind 4.3.3、TypeScript 5.9.3。CLI 使用本地打包的 `0.2.0-beta.18` 源码，不声称同名公开版本已包含本轮修改。主题矩阵通过 DOM 主题/媒体偏好检查安装 CSS；文档的真实主题按钮另行验收，不混为同一证据。

## 5 组件与样式采用报告

统计范围是本阶段直接调整的两个 UI 文件（字体合并工具及分页组件），不是整个脏工作区：识别 **9 类组件/内部 helper、12 次 JSX 使用，0 个错误、0 个警告**；库存解析与 2/2 文件设计检查通过。报告和基线见 [`after.md`](../../.zeron/reports/stage-six/after.md)、[`after.json`](../../.zeron/reports/stage-six/after.json)、[`before.json`](../../.zeron/reports/stage-six/before.json)。全量设计检查为另一项验证。

- 公共 UI：Button ×4，Select/SelectContent/SelectItem/SelectTrigger；共享分页继续复用这些控件。
- 内部 helper：4 类、4 次使用，保留原有分页组合。
- 字体工具读取已有生成排版 token；不新增任意字体样式。图片、安装计划与验证脚本不属于 JSX 组件数量。

报告未启用任意样式值、内联样式等附加规则，不据此宣称所有样式百分之百符合 token。阶段五的 91 个迁移文件报告及动态别名人工追溯保持原记录，不重复归因到本阶段。

## 6 交付边界与人工确认

- [x] 独立安装矩阵完成，所有本轮目标均通过。
- [x] 44 个入口无未分类项；完整安装与浏览器证据已关联。
- [x] 最终本地分发包已打包；Registry 候选验证状态及 source provenance 见独立报告，未上传。
- [ ] 用户确认第 3 节重点页面的视觉与交互结果。

自动验证完成后可以确认本地交付；用户人工验收与公开发布是独立事项。工作区包含未提交修改，正式候选仍须通过既有干净源码门禁；不把本地测试候选标成正式公开发布。


## 后续组件收敛（2026-10-06）

按用户反馈移除 ErrorState 与 StatusIndicator：首次失败直接使用 Alert，轻量短状态使用 Badge plain，活动与长文案使用 InlineNotice。以上验收数量和证据是阶段六当时的快照；本次调整的范围、验证和验收入口见 [状态组件收敛记录](2026-10-06-feedback-component-consolidation.md)。

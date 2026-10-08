# 阶段四实施与验收记录：运维工作区与分页统一

日期：2026-10-06\
状态：实现完成；自动验证结果见第 4 节，人工验收待完成。尚未公开发布。

对应方案：[Block 与 Page 统一实施及阶段验收方案](./2026-10-05-block-page-unification-plan.md)。本阶段覆盖六个运维页面，没有启动阶段五的全量状态迁移。

## 1 已实施内容

| 能力 | 实施结果 | 边界 |
| --- | --- | --- |
| 工作区外壳 | 新增业务组件 OperationsWorkspaceShell；六页共享组织身份、主要导航、服务导航、诊断会话入口、搜索、账号、页面标题与移动导航 | 使用现有 Sidebar、PageLayout、NavMenu、SidebarIdentityRow、UserAccount，没有另建通用应用框架 |
| 页面采用 | ZaiopsOperations、ClusterEnvironmentList、ClusterEnvironmentDetail、InspectionReportList、MonitoringAlertList、ServiceManagement 全部接入 | 列表数据、筛选、领域等级、详情、报告选择、表格引擎和原有业务回调由页面保持 |
| 路由适配 | workspace 提供链接、选择回调和 renderLink；Next / 语言路径 / 主题放在文档演示适配层 | 六页和共享外壳没有 Next 导入；默认链接是演示地址，应用必须配置实际业务路由 |
| 搜索 | 一个外壳注册一套 Meta / Ctrl + K 监听；焦点所属的工作区处理；跳过编辑区、输入法组合、重复键及隐藏预览；卸载清理 | searchContent、searchOpen、onSearchOpenChange 由宿主接入；默认内容仅为搜索入口占位，没有真实检索后端 |
| 组织和账号 | 组织 ID / 名称分离，支持受控和默认值；账号直接复用 UserAccount 的公开 API | 受控值仅通过宿主更新；演示组织切换改变身份展示，未接入组织业务数据请求；主题和语言由宿主处理 |
| 收起与移动导航 | 同一导航面板复用于侧栏和浮层；收起后侧栏设置 inert / aria-hidden，焦点返回展开按钮 | 桌面点击展开按钮恢复侧栏，悬停可打开浮层；窄屏点击菜单按钮打开浮层，Escape 关闭 |
| 分页 | 新增不依赖表格引擎的 ListPagination，巡检和告警列表采用；服务和详情保留 DataTable 自有分页 | 没有伪造 TanStack Table 实例；组件只展示和发出回调，数据过滤、切片和页码重置仍属于页面 |
| 数据缩减 | 巡检报告和监控告警立即显示有效页码，并保存夹取后的页码；改变页大小和筛选回到首页 | 零条以第 1 页、共 1 页展示，所有导航按钮禁用；不会出现负页码或无效末页 |
| 安装与指南 | 包导出、Registry、能力声明、预览源码、Agent 目录与六页指南同步；新增外壳和分页指南 | 外壳作为业务 component 分发，分页作为 UI 分发；每页独立安装会包含外壳与所需依赖 |

六页新增可选 `workspace?: OperationsWorkspaceOptions`，原有 props 和回调仍可使用。首页的原 `account` 参数继续有效，包括 `null` 隐藏账号；显式传入时优先于 `workspace.account`。ServiceManagement 的受控 `view` / `onViewChange` 保持原约定。

主要导航包含首页、集群环境、巡检报告、监控告警。服务入口包含服务进度、服务授权、操作记录。文档演示可从其他页面跳转到相应服务视图，并通过 URL hash 保留选择。

诊断会话仅在配置回调或实际链接后可操作。未配置的创建动作禁用，未配置的重命名、删除不展示；静态演示会话没有伪装成已连接业务。

## 2 人工验收页面

建议先打开下面的独立演示检查，再回到对应文档页面检查“预览 / 代码”切换和全屏入口。

| 页面 | 独立演示 | 文档预览 | 页面重点 |
| --- | --- | --- | --- |
| 运维首页 | [打开首页](http://localhost:3007/zh-CN/block-demo/zaiops-operations-01) | [首页文档](http://localhost:3007/zh-CN/docs/pages/zaiops-operations-01) | 首页激活；环境概览、列表、影响范围保持；账号菜单与导航可操作 |
| 集群环境列表 | [打开环境列表](http://localhost:3007/zh-CN/block-demo/cluster-environment-list-01) | [环境列表文档](http://localhost:3007/zh-CN/docs/pages/cluster-environment-list-01) | 集群环境激活；健康、过期、搜索与详情演示保持；数据状态和刷新失败设置不回退 |
| 集群环境详情 | [打开环境详情](http://localhost:3007/zh-CN/block-demo/cluster-environment-detail-01) | [环境详情文档](http://localhost:3007/zh-CN/docs/pages/cluster-environment-detail-01) | 集群环境激活；面包屑取实际环境名称；报告日期、前后报告及详情分区切换保持 |
| 巡检报告列表 | [打开巡检报告](http://localhost:3007/zh-CN/block-demo/inspection-report-list-01) | [巡检报告文档](http://localhost:3007/zh-CN/docs/pages/inspection-report-list-01) | 巡检报告激活；默认 8 条、每页 5 条；翻页、每页条数、优先级和环境筛选 |
| 监控告警列表 | [打开监控告警](http://localhost:3007/zh-CN/block-demo/monitoring-alert-list-01) | [监控告警文档](http://localhost:3007/zh-CN/docs/pages/monitoring-alert-list-01) | 监控告警激活；默认 8 条、每页 5 条；处置、静音、记录、分析及末页缩减回到有效页 |
| 服务管理 | [打开服务管理](http://localhost:3007/zh-CN/block-demo/service-management-01) | [服务管理文档](http://localhost:3007/zh-CN/docs/pages/service-management-01) | 切换服务进度、服务授权、操作记录；激活项、标题、表格列和 URL hash 对应；搜索、表格分页保持 |

六页都需要检查：

- [ ] 切换主要导航后只显示一套工作区，当前导航项正确激活。
- [ ] 组织菜单鼠标和键盘可切换名称；长名称不会挤掉收起按钮。
- [ ] Meta / Ctrl + K 每次只打开一个搜索入口；Escape 关闭；输入框内的快捷键不会打开另一个搜索。
- [ ] 桌面收起后焦点回到展开按钮，隐藏的侧栏无法 Tab 进入；点击恢复侧栏，悬停可访问浮层。
- [ ] 768px、390px 下点击操作导航菜单可访问组织、导航、搜索和账号；Escape 关闭并返回触发项。
- [ ] 账号菜单可切换主题和语言，页面内容与侧栏不出现重复滚动或整个页面横向溢出。
- [ ] 浅色、深色下导航激活、边框、背景和分页一致；内容表格允许在自己的区域内横向滚动。
- [ ] 文档预览和独立演示的导航、搜索、服务视图行为一致。

巡检报告和监控告警再检查：

1. 默认每页 5 条，下一页到第 2 页；首页、上一页、下一页、末页在边界正确禁用。
2. 在第 2 页把每页条数改为 10：回到第 1 页，共 1 页，展示全部 8 条。
3. 输入不存在的关键词：显示 0 条、第 1 页、共 1 页，四个分页导航按钮全部禁用；清空后恢复 8 条。
4. 改变优先级或环境筛选：回到首页，分页总数与筛选结果一致。
5. 告警恢复每页 5 条，到第 2 页逐一静音三行：最后回到第 1 页、共 5 条；清空数据也不能留在无效末页。

集群列表和告警已有的演示设置继续保留：文档中位于预览 / 代码右侧，独立 / 全屏为可拖拽的 Neutral 图标按钮，尺寸 32px、吸附间距 16px；“下次刷新失败”使用 Switch。详见 [演示数据设置记录](./2026-10-06-demo-settings-toolbar.md)。巡检报告等未接入数据状态演示的页面没有额外增加模拟状态选项。

## 3 抽象选择与保留项

- 外壳是六页的业务组合，依赖通用 UI 和 UserAccount，页面依赖外壳；外壳不反向依赖六个整页。路由、业务数据、请求和检索不进入 UI 原语。
- ListPagination 与 DataTablePagination 的展示语义接近，但后者要求真实 TanStack Table。两个手写列表保持现有结构，采用独立受控分页；不为了复用页脚而更换数据引擎。
- 本阶段没有新增只改变 padding 的面板。PageLayout / PageContent / PageBody 保持标题、内容和滚动职责，原 Card 和领域 section 保持已有表面层级。
- 模型身份与行操作的数据、菜单、业务回调尚不具有共同契约，本阶段保留领域实现；没有把不同字段强行装入一个万能行组件。现有信息行能力继续可用。
- 集群详情空 reports 的原行为、报告列表空态和各页未迁移的领域状态仍属于阶段五台账；本阶段的完成不表示 44 个入口已全量迁移。

## 4 自动验证与证据

- 定向测试 7 个文件、80 项通过，覆盖行为和分发/布局契约：六页外壳与激活项、受控组织/搜索、快捷键隔离与清理、会话回调、受控服务视图、分页边界、页大小变化、数据缩减、页面布局和目录契约。
- TypeScript、受影响文件 ESLint、全项目 design lint 通过。本阶段源码的生产站点构建通过，证据为 `build-final.log`；之后的最终共享工作区整站复核受到另一项新增 File Upload 尚未完成的元数据影响，见本节末尾。
- 本阶段 147 项 Registry 检查通过；Agent 目录、指南加载器与预览源码同步检查通过。随后共享工作区的 File Upload 新增改变了整体目录输入，最新整站状态单列在本节末尾。
- 指南示例 25 个指南、25 个 TSX 示例通过。示例检查器补入项目已有的 ambient 声明，使含 SVG 依赖的详情页示例与项目类型环境一致，没有编造资源声明。
- 浏览器完成六页 × 浅色/深色 × 1440/768/390 共 36 组：导航激活、账号菜单可达、页面无整体横向溢出。另检查六页组织切换、单个搜索入口、桌面收起焦点返回及浮层搜索。
- 浏览器另验证窄屏组织菜单 Enter 切换、搜索和导航浮层的 Escape 焦点返回、账号主题实际切换与悬浮设置按钮 32px 尺寸。
- 浏览器完成主要导航串联、服务三个视图与列切换、两处列表翻页/页大小/零结果/恢复，以及六个文档入口的搜索；未出现页面运行异常。
- 六页均通过 pnpm / Next 的 Registry 独立安装、类型检查和实际页面构建；六页均通过 npm / Vite 的独立 React 安装、类型检查和构建。共享外壳、ListPagination 另各通过 Vite 独立安装和构建。修复 SVG 声明分发后，集群详情在 Next 和 Vite 单独复验通过。

证据目录：`.zeron/reports/stage-four/`；浏览器截图：`output/playwright/stage-four/`。浏览器结构化摘要为 `browser-evidence.json`。独立安装摘要为 `consumer-evidence.json`，实际日志为 `consumers-recheck.log`、`consumers-react-pages-final.log` 和 `consumers-detail-final.log`。核心日志为 `tests-release.log`、`typecheck-final.log`、`lint-final.log`、`design-lint-final.log`、`build-final.log`、`registry-check-final.log`、`examples-release.log`、`browser-recheck.log`、`browser-journeys.log`、`browser-mobile.log`。

首次安装检查中发现一项无独立 Registry 定义的 huge-icon 依赖，已删除错误条目并使用 icon-context 的真实传递依赖；原失败日志保留。React 六页安装检查首次因验证脚本缺少页面示例停止，已补齐示例；随后发现资源图标的既有 SVG 类型声明未随 Registry 分发，已补入 resource-metric-list 的文件清单并复验。浏览器发现收起侧栏未退出辅助技术导航范围，已修复并复验；另有一次桌面展开按钮按移动菜单名称定位失败，修正验证路径后通过。

安装与构建证据不等于真实后端业务验证；浏览器证据来自本地工作区。未重跑完整仓库测试，阶段二中记录的全仓库失败仍独立追踪。本阶段不宣称全仓库 CI 或公开发布通过。最终站点复核曾遇到工作区另一项文档新增过程中的生成路由临时不同步，原失败保留为 `build-release.log`；未修改该业务页面，路由检查恢复后重新执行构建，又因 `registry:file-upload-01` 缺少 active identity 登记停止，见 `build-release-retry.log`。这些是阶段四之外的新增文件，未通过补入无依据登记或删除文件来绕过；因此不把最新共享工作区整站构建写为通过。

## 5 组件与样式报告

### 统计

范围为 16 个 TSX 文件：六页、共享外壳与分页、演示适配和预览入口。识别 260 种组件、536 次 JSX 使用；静态检查覆盖 16/16 文件，0 错误、0 警告。预览入口原有及工作区并行新增的其他 Block 也计入统计，数量不表示本阶段迁移了 260 个组件。基线只覆盖原六页，新增文件扩大范围，不能据此计算消除比例。

### 组件

| 分类 | 种类 / 使用次数 | 本阶段主要采用 |
| --- | --- | --- |
| Block | 37 / 45 | OperationsWorkspaceShell 六处采用；账号复用 UserAccount |
| UI | 81 / 281 | Sidebar、PageLayout、NavMenu、SidebarIdentityRow、Dialog；ListPagination 两处采用；原 DataTable、状态和反馈组件保持 |
| 内部辅助 | 54 / 63 | 共享导航面板、链接适配、搜索按钮、收起焦点处理及原有页面辅助 |
| 业务组件 | 85 / 144 | 演示路由、账号偏好与服务 hash 适配，和原预览入口 |
| 第三方 | 3 / 3 | React Suspense、文档 Next Link、原 HugeiconsIcon |

### 问题与说明

工具有 10 处来源未自动识别：9 处 DropdownTrigger 是公开 Menu.Trigger 的导出别名，1 处 MetricIcon 是由 useIcon 生成的健康图标映射；已沿源码人工确认，不把它们改写为私有实现。

专用样式规则覆盖 11 个源码/文档页文件，5 个 docs/components 适配文件按当前配置只启用基础限制；没有为了通过检查改变规则范围。内联样式与动态类名检查未启用，不能视为自动检查通过。组件选择、公共 API、表面层级和布局另外通过源码审查与浏览器检查确认。

完整来源、使用位置和规则覆盖见 [组件统计 JSON](../../.zeron/reports/stage-four/after.json)。本阶段没有新增 UI 原语重绘、重复应用外壳或同义面板。

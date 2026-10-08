# Block 与 Page 统一：阶段五实施及验收记录

日期：2026-10-06\
状态：阶段五本地实现完成，自动检查范围内通过，待用户人工验收；本记录保留当时的测试与安装限制，后续处置见 [阶段六交付记录](./2026-10-06-block-page-unification-stage-six.md)。尚未公开发布。

对应 [总方案阶段五](./2026-10-05-block-page-unification-plan.md#8-阶段-5-全量迁移台账)。范围冻结为原方案的 44 个公开入口（43 个独立 Demo 与 `/workflow`），不把工作区同期新增的其他 Block 算入本轮覆盖。保留其他未提交修改。

## 1 完成内容与最终决定

### 状态与反馈

- `Badge` 的 `strong` 变体正式支持 `status`，五种语义均使用成对前景/背景 token。浅色/深色共十组实际渲染文字对比度为 **4.83–11.78**。原分类色、自定义色调用保持兼容。
- 严重程度、优先级、执行结果改由所属 Block 映射到语义色，不合并业务枚举。启用/发布使用 info，停用/未发布使用 neutral；停用不代表故障，工单完成也不代表资源健康。
- 运行图标采用 `StatusIndicator`；仅 running 持续旋转，减少动态效果模式不依赖动画传达状态。静态 Badge 不默认成为 live region。
- 首次错误复用 `ErrorState`，新操作错误复用 `InlineNotice`，字段校验继续使用 `FieldError`。保留原 retry 和防重复机制；静态节点问题不会制造多个 `role=alert`。
- 文件管理补齐首次加载、失败、无数据和搜索无结果；仍支持自定义错误/空态 renderer。日志、会话列表保留旧行及局部加载错误。
- 集群详情无报告时保留工作区、环境信息和原操作回调，显示 `Empty`；巡检列表区别确认无数据与筛选无结果。
- HTTP outcome 在行、筛选与图例统一为成功绿/警告橙/失败红。**Resource Status All、Resource Metric List、安全评分图继续使用此前要求的主题蓝色。** 供应商、消息类型、部门分类和评分不强制映射为健康状态。

### 图表

- 可用性监控改用稳定系列色、共享网格、受控 `ChartLegend` 与可访问数据表；75–100% 轴域、时区、时间窗口保持。
- 个人设置的分布图使用 `DonutSummary` 和共享图例；全部分类的金额和比例可直接读取。日费用图提供 CNY 数据表。热力图、排名条和时间桶保留领域绘制。
- 模型分析的供应商颜色按稳定 ID 分配，新增供应商也有颜色；价格、性能、应用 Token 和每日 Token 图提供等价数据表，原堆叠和轴域保留。
- `ChartLegendItem.pressed` 是可选受控属性：宿主负责实际系列显隐；静态图例不伪装成可切换控件，action-only 图例不擅自改变图表。
- 新迁移的可用性、模型分析折线/面积图明确 `connectNulls=false`。此前监控图沿用已登记的断点策略；本轮不留下未解释的自动连线例外。容量条、圆环、热力图、规则图与流程图不适用时序连接策略。
- 数字 0 保留为 0；null、非有限值与无采样表示未知，避免补出假零。性能单位明确为 tok/s、s、%；应用 Token 表保留 B 单位，价格保留 $/M，不做隐式换算。

### API、安装与演示

公共能力的变化均为兼容性增加：`Badge` strong 支持 status；图例增加可选 pressed；`AvailabilityPoint` 支持 null；模型 `ChartPoint` 支持缺失值，`PerformanceChart` 增加可选 unit。领域回调、受控行为、包装入口和安装名称继续保留。

演示调整集中于文档层：文件管理顶部设置可选正常/首次加载/首次失败/确认无数据并演示重试；集群详情可选无报告；规则编辑器的文档与独立演示共用受控宿主，必须先选流量入口。没有实际刷新 API 的示例不提供“下次刷新失败”。已有支持刷新的示例继续使用 Switch；全屏设置继续保持 Neutral、32px、可拖拽、边缘间距 16px。

Registry 直接依赖、预览源码、Badge/Chart Primitives 指南和六个运维指南已同步，原语由真实消费者验证。文件、认证、部署演示没有接入真实后端。

## 2 人工验收：优先页面与步骤

每组先在桌面浅色/深色检查，再在 390px 窄屏复验。预期是页面外层无意外横向滚动，必要的表格/画布滚动留在自己的容器，关键按钮、反馈和数据入口可达。

| 优先组 | 页面 | 需要验收的内容 |
| --- | --- | --- |
| 图表 | [Availability Monitor](http://localhost:3007/zh-CN/block-demo/availability-monitor-01)、[Personal Model Usage](http://localhost:3007/zh-CN/block-demo/personal-model-usage-01)、[Model Detail 02](http://localhost:3007/zh-CN/block-demo/model-detail-02) | 图例颜色稳定；可切换图例确实隐藏/恢复系列；时间范围及页签可用；打开数据表核对单位，键盘可读；个人用量分布金额/比例清楚 |
| 加载、失败和空态 | [File Manager](http://localhost:3007/zh-CN/block-demo/file-manager-01)、[Gateway Sessions](http://localhost:3007/zh-CN/block-demo/ai-gateway-session-list-01)、[Infinite Log](http://localhost:3007/zh-CN/block-demo/infinite-log-table-01) | 文件设置依次选择加载/失败/无数据/正常，失败后重试恢复；搜索无结果可清空恢复；日志筛选成功/警告/失败色一致，无限加载与行操作可用 |
| 运维与报告 | [Cluster Detail](http://localhost:3007/zh-CN/block-demo/cluster-environment-detail-01)、[Cluster List](http://localhost:3007/zh-CN/block-demo/cluster-environment-list-01)、[Inspection Reports](http://localhost:3007/zh-CN/block-demo/inspection-report-list-01)、[Monitoring Alerts](http://localhost:3007/zh-CN/block-demo/monitoring-alert-list-01)、[Service Management](http://localhost:3007/zh-CN/block-demo/service-management-01)、[ZAIops](http://localhost:3007/zh-CN/block-demo/zaiops-operations-01) | strong 等级标签两主题可读，等级/处理状态分开；筛选和分页正常；详情选择无巡检报告仍有环境头部，触发示例巡检恢复报告；导航、账号菜单保持可用 |
| 安全与部署 | [Security Overview](http://localhost:3007/zh-CN/block-demo/security-overview-01)、[Deployment Detail](http://localhost:3007/zh-CN/block-demo/deployment-detail-01) | 安全严重程度语义色、评分图蓝色；切换风险/扫描视图；部署总体与检查阶段状态区别清楚，域名浮层可打开/关闭，重试无重复请求 |
| 资源与执行状态 | [Resource List](http://localhost:3007/zh-CN/block-demo/resource-list-page-01)、[Resource Detail](http://localhost:3007/zh-CN/block-demo/resource-detail-page-01)、[Members](http://localhost:3007/zh-CN/block-demo/member-department-01)、[Agent Trace](http://localhost:3007/zh-CN/block-demo/agent-trace-01)、[Message Trace](http://localhost:3007/zh-CN/block-demo/agent-message-trace-01) | 启用/发布、停用/未发布与健康状态分开；分类色保留；运行中、成功、错误、取消/中止文案和图标正确，折叠与页签不受影响 |
| 规则与账号 | [Traffic Rules](http://localhost:3007/zh-CN/block-demo/traffic-rules-01)、[Rule Flow](http://localhost:3007/zh-CN/block-demo/rule-flow-editor-01)、[Login](http://localhost:3007/zh-CN/block-demo/login-01)、[Signup](http://localhost:3007/zh-CN/block-demo/signup-01)、[User Account](http://localhost:3007/zh-CN/block-demo/user-account-01) | 停用不显示故障；先选择流量入口再添加条件，节点/草稿更新；字段校验与操作失败分开；账号菜单可关闭，pending 不重复执行 |
| 共享包装与既有试点 | [Personal Settings](http://localhost:3007/zh-CN/block-demo/personal-settings-01)、[Personal Usage](http://localhost:3007/zh-CN/block-demo/personal-usage-01)、[Resource Settings](http://localhost:3007/zh-CN/block-demo/resource-settings-01)、[Gateway Overview](http://localhost:3007/zh-CN/block-demo/ai-gateway-overview-01)、[Project Monitor](http://localhost:3007/zh-CN/block-demo/project-monitor-01) | 共享实现的公开入口仍逐项可用；有刷新功能的示例打开“下次刷新失败”Switch，执行一次刷新，旧数据保留、提示错误、开关消费后恢复 |
| 公共原语和演示容器 | [Badge](http://localhost:3007/zh-CN/docs/components/badge)、[File Manager 文档](http://localhost:3007/zh-CN/docs/blocks/file-manager-01)、[Cluster Detail 文档](http://localhost:3007/zh-CN/docs/pages/cluster-environment-detail-01) | strong 五种状态浅/深色清晰；预览/代码右侧设置可用；全屏后设置悬浮且不挤占内容，32px、Neutral、拖拽后距离边缘 16px |

零/缺失/自定义供应商、静态与受控图例、渲染 slot、分页越界和异步重试防重入已用行为测试覆盖；不是所有页面均公开这些演示参数，验收时不假设未提供的控件存在。未连接真实服务的操作以 UI 与约定回调验证为准。

## 3 全部 44 个入口的最终处置台账

下表每一行均有独立浏览器核心路径记录，1440/390px × 浅色/深色共四个视图。自动检查已通过，人工确认仍待验收。“保留领域实现”是明确完成决定，不是待迁移；图表不适用项不创建占位图。

证据：[`scope.json`](../../.zeron/reports/stage-five/scope.json) 记录源码及最终依赖；[`browser-evidence.json`](../../.zeron/reports/stage-five/browser-evidence.json) 按 slug 对应每一行检查；截图位于 `output/playwright/stage-five/`。

| 批次 | 入口 | 最终处置/采用项 | 保留理由与边界 | 已验证核心路径 |
| --- | --- | --- | --- | --- |
| A | [availability-monitor-01](http://localhost:3007/zh-CN/block-demo/availability-monitor-01) | **迁移**；ChartLegend / 稳定系列色 / grid / 可访问数据表 | 75–100% 轴域、三天/24h 窗口和时区；不套用通用零起点 | 图例显隐恢复与键盘读取数据表 |
| A | [ai-gateway-overview-01](http://localhost:3007/zh-CN/block-demo/ai-gateway-overview-01) | **已复用**；阶段二/三状态反馈、趋势与分布原语 | 请求、Token、费用不同单位及旧快照刷新契约 | 视图切换：1d |
| A | [project-monitor-01](http://localhost:3007/zh-CN/block-demo/project-monitor-01) | **已复用**；阶段二/三状态反馈、趋势与容量原语 | 实例/存储等视图、采样口径与受控回调 | 视图切换：存储 |
| A | [security-overview-01](http://localhost:3007/zh-CN/block-demo/security-overview-01) | **迁移**；ErrorState / 语义 severity Badge；已有图表原语 | 扫描任务与快照、雷达维度、评分分母；评分图主题蓝 | 视图切换：风险项 13 |
| A | [resource-status-all-01](http://localhost:3007/zh-CN/block-demo/resource-status-all-01) | **已复用**；DonutSummary / 主题蓝 / 状态摘要 | 覆盖率与分类计数；静态摘要无刷新 API | 静态摘要与数值可读；无业务操作适用 |
| A | [resource-metric-list-01](http://localhost:3007/zh-CN/block-demo/resource-metric-list-01) | **已复用**；SegmentedBar / 语义状态色 / 主题蓝 | 指标分母、分类分布；静态摘要无刷新 API | 静态摘要与数值可读；无业务操作适用 |
| A | [storage-usage-01](http://localhost:3007/zh-CN/block-demo/storage-usage-01) | **已复用**；SegmentedUsageBar / 语义容量值 | 容量单位与超额文本；裁剪仅影响图形 | 静态摘要与数值可读；无业务操作适用；容量 aria 值保留 |
| A | [credit-usage-01](http://localhost:3007/zh-CN/block-demo/credit-usage-01) | **已复用**；SegmentedUsageBar / 数值格式 / InlineNotice | 额度周期、余额与扣减、宿主操作回调 | 视图切换：Last cycle |
| B | [personal-settings-01](http://localhost:3007/zh-CN/block-demo/personal-settings-01) | **迁移**；DonutSummary / ChartLegend / dataTable / strong Badge.status | 个人设置组合、热力图与时间桶保留领域绘制 | 账号菜单打开与 Escape 关闭 |
| B | [personal-model-usage-01](http://localhost:3007/zh-CN/block-demo/personal-model-usage-01) | **迁移（共享实现）**；个人设置中的图表原语、稳定分类色 | 公开包装页独立验证；计费/CNY 与模型分母保留 | 时间筛选选择与数据更新 |
| B | [personal-usage-01](http://localhost:3007/zh-CN/block-demo/personal-usage-01) | **迁移（共享实现）**；共享设置实现与计费趋势表 | 消息数/Token 页签、统计口径不合并 | 视图切换：消息数 |
| B | [resource-settings-01](http://localhost:3007/zh-CN/block-demo/resource-settings-01) | **迁移（共享实现）**；共享设置实现、状态标签与空结果 | 资源筛选、分组、账号入口与宿主行为保留 | 搜索无结果与清空恢复 |
| B | [model-detail-02](http://localhost:3007/zh-CN/block-demo/model-detail-02) | **迁移**；稳定供应商色 / ChartLegend pressed / grid / dataTable | 价格 $/M、性能单位、B tokens 和日 Token；供应商表与堆叠不合并 | 视图切换：Listed |
| C | [resource-list-page-01](http://localhost:3007/zh-CN/block-demo/resource-list-page-01) | **迁移（共享列表）**；列表 Badge.status / DataTable / Empty | 分类管理、选择/过滤 preset 与宿主回调 | 视图切换：分类管理 |
| C | [resource-list-table-01](http://localhost:3007/zh-CN/block-demo/resource-list-table-01) | **迁移**；启用 info/停用 neutral / 既有健康状态 / Empty | 启用≠健康；批量选择、行菜单和分页继续由宿主控制 | 搜索无结果与清空恢复 |
| C | [resource-catalog-01](http://localhost:3007/zh-CN/block-demo/resource-catalog-01) | **保留领域实现**；复用现有卡片、分类 Badge、Empty 和筛选组件 | 目录品牌/模型分类不是健康状态；Registry 键为 model-mcp-marketplace-01 | 搜索无结果与清空恢复 |
| C | [member-department-01](http://localhost:3007/zh-CN/block-demo/member-department-01) | **迁移**；部门启用 info/停用 neutral / 现有表格与 Empty | 部门树、展开、成员选择与目录 CRUD 模型 | 视图切换：部门 |
| C | [ai-gateway-session-list-01](http://localhost:3007/zh-CN/block-demo/ai-gateway-session-list-01) | **迁移**；首次失败 ErrorState / 旧数据 InlineNotice | 会话查询、游标、详情跳转、原 retry 回调 | 搜索无结果与清空恢复 |
| C | [infinite-log-table-01](http://localhost:3007/zh-CN/block-demo/infinite-log-table-01) | **迁移**；ErrorState / HTTP outcome 语义色 / 通用字段 Badge.status | 虚拟化、无限加载和旧行；布尔元数据仍可使用分类色 | 结果筛选切换恢复；虚拟列表正常 |
| C | [file-manager-01](http://localhost:3007/zh-CN/block-demo/file-manager-01) | **迁移**；Skeleton + StatusIndicator / Empty / ErrorState | 文件树与三种视图、局部加载、custom renderer 和受控文件操作 | 设置选择加载/错误/无数据/正常；重试恢复 |
| D | [zaiops-operations-01](http://localhost:3007/zh-CN/block-demo/zaiops-operations-01) | **迁移**；共享 OperationsWorkspaceShell / 连接 Badge.status | 86 分评分仍为主题色；业务概览与快捷操作 | 账号菜单打开与 Escape 关闭 |
| D | [cluster-environment-list-01](http://localhost:3007/zh-CN/block-demo/cluster-environment-list-01) | **迁移**；共享外壳 / strong Badge.status / 既有刷新反馈 | 严重程度、健康与新鲜度独立；分页/过滤逻辑 | 视图切换：严重 2 |
| D | [cluster-environment-detail-01](http://localhost:3007/zh-CN/block-demo/cluster-environment-detail-01) | **迁移**；strong Badge.status / Empty / 共享外壳 | 无报告仍保留环境上下文与触发巡检回调；资源摘要蓝色 | 无报告保留外壳；示例巡检恢复报告 |
| D | [inspection-report-list-01](http://localhost:3007/zh-CN/block-demo/inspection-report-list-01) | **迁移**；strong Badge.status / no-data、no-results Empty / 共享分页 | 报告等级、过滤后页码、跳转及业务操作 | 搜索无结果与清空恢复 |
| D | [monitoring-alert-list-01](http://localhost:3007/zh-CN/block-demo/monitoring-alert-list-01) | **迁移**；严重程度 strong Badge.status / 共享外壳与分页 | P0/P1 等领域等级与已解决/未解决状态独立 | 搜索无结果与清空恢复 |
| D | [service-management-01](http://localhost:3007/zh-CN/block-demo/service-management-01) | **迁移**；优先级 strong Badge.status / 共享外壳 | 工单完成不代表资源恢复；服务/工单状态原样保留 | 视图切换：已完成 1 |
| E | [resource-detail-page-01](http://localhost:3007/zh-CN/block-demo/resource-detail-page-01) | **迁移**；发布 info/未发布 neutral strong Badge / 现有详情组合 | 发布、权限、安全设置与工具配置仍是不同状态 | 视图切换：工具 5 |
| E | [model-detail-01](http://localhost:3007/zh-CN/block-demo/model-detail-01) | **保留领域实现**；现有 Badge / InfoItem / DetailList / Tabs | 供应商品牌、代码语言示例与模型身份不是运行健康；没有待迁移时序图 | 视图切换：Python |
| E | [mcp-detail-01](http://localhost:3007/zh-CN/block-demo/mcp-detail-01) | **保留领域实现**；现有 Empty / InlineNotice / 字段与工具反馈 | 连接过期、安全设置、工具调用生命周期；无通用图表适用 | 视图切换：工具测试 |
| E | [deployment-detail-01](http://localhost:3007/zh-CN/block-demo/deployment-detail-01) | **迁移**；StatusIndicator 阶段结果 / 首次错误 ErrorState | 总体部署与阶段结果分离；排队/取消/未知、域名和 retry 防重入 | 域名浮层与名称展示；Escape 关闭 |
| E | [agent-trace-01](http://localhost:3007/zh-CN/block-demo/agent-trace-01) | **迁移**；StatusIndicator / InlineNotice 获取错误 | 流式消息投影、折叠与虚拟化；running 才持续旋转 | 视图切换：Chat |
| E | [agent-message-trace-01](http://localhost:3007/zh-CN/block-demo/agent-message-trace-01) | **迁移**；运行 info/成功 success/错误 danger/取消 neutral | agent/tool/chat 是分类色；属性检查器、耗时与 Token 原始口径 | 视图切换：Attributes 3 |
| E | [agent-session-detail-01](http://localhost:3007/zh-CN/block-demo/agent-session-detail-01) | **保留领域实现**；复用既有状态组件、详情行和消息检查器 | 会话/Trace 切换、消息投影、取消/中止生命周期；图表不适用 | 视图切换：Trace |
| F | [traffic-rules-01](http://localhost:3007/zh-CN/block-demo/traffic-rules-01) | **迁移**；启用 info/停用 neutral / 工作流节点 InlineNotice | 规则草稿、限流条件与树/图节点；静态问题不产生多个 alert | 搜索无结果与清空恢复 |
| F | [filter-rule-builder-01](http://localhost:3007/zh-CN/block-demo/filter-rule-builder-01) | **保留领域实现**；既有字段组件、验证反馈和规则组合 | 草稿结构、分组、删除和受控 onChange；不抽取通用业务引擎 | 删除条件更新草稿；重载恢复演示 |
| F | [rule-flow-editor-01](http://localhost:3007/zh-CN/block-demo/rule-flow-editor-01) | **保留领域实现；修复演示宿主**；既有组件；独立/文档共用受控 Demo | 先选择流量入口才能添加条件；节点拖拽、分支与动作模型保留 | 受控示例添加条件，画布与条件内容更新 |
| F | [model-router-01](http://localhost:3007/zh-CN/block-demo/model-router-01) | **保留领域实现**；现有状态/字段组件和图节点 | 成本/性能路由、草稿和模拟；路由图不是时序图 | 视图切换：Cost |
| F | [workflow](http://localhost:3007/workflow) | **保留领域实现**；现有公共控件与节点反馈 | 独立 /workflow 原型；ReactFlow、本地历史、撤销与配置模型；没有 Registry 安装键 | 节点配置打开/关闭；领域图引擎保持 |
| F | [login-01](http://localhost:3007/zh-CN/block-demo/login-01) | **迁移**；InlineNotice 表单操作错误 / 原 FieldError | 认证回调、原生字段校验与 pending；演示不连接真实认证 | 首次提交触发表单校验，未连接真实认证 |
| F | [signup-01](http://localhost:3007/zh-CN/block-demo/signup-01) | **迁移**；InlineNotice 表单操作错误 / 原 FieldError | 注册验证与业务提交；字段错误与提交失败不混合 | 首次提交触发表单校验，未连接真实认证 |
| F | [provider-create-form-01](http://localhost:3007/zh-CN/block-demo/provider-create-form-01) | **已复用**；FieldError / InlineNotice / 字段与步骤组件 | 服务商品牌、分步校验、凭据验证及宿主提交；不新增全局 loading | 缺少名称时保留第一步并显示 FieldError |
| F | [user-account-01](http://localhost:3007/zh-CN/block-demo/user-account-01) | **迁移**；StatusIndicator 操作 busy / InlineNotice error | 菜单、退出等原回调、防重复与作用域；错误只在操作后播报 | 账号菜单打开与 Escape 关闭 |
| F | [top-nav-app-shell-01](http://localhost:3007/zh-CN/block-demo/top-nav-app-shell-01) | **已复用**；PageLayout / Container / 既有导航与身份组合 | 布局插槽与路由由宿主绑定；没有数据状态/图表待迁移 | 静态摘要与数值可读；无业务操作适用 |
| F | [zlrlist](http://localhost:3007/zh-CN/block-demo/zlrlist) | **保留领域实现**；既有布局、状态 Badge 和详情组合 | 灾备站点、恢复状态与操作语义；不映射成普通运行状态 | 视图切换：贵州灾备站点 |

`resource-catalog-01` 是文档/Demo slug，实际安装项仍为 `model-mcp-marketplace-01`。`workflow` 是独立应用，不生成虚假的 `block-demo/workflow` 或 Registry 安装项。

## 4 复用清单与统计口径

继续使用现有 `Badge`、`Empty`、`Skeleton`、`InlineNotice`、`FieldError`、`DataTable`、`InfoItem`、`DetailList`、`Container`、`PageLayout`、导航、字段与菜单控件；采用前期新增的 `StatusIndicator`、`ErrorState`、`ChartLegend`、`DonutSummary`、`SegmentedUsageBar`、趋势预设、`ListPagination` 和 `OperationsWorkspaceShell`。没有新增万能页面状态机、列表引擎或流程引擎。

组件采用报告覆盖 **91 个 TSX 文件**：识别到 838 类组件/局部 helper，3,852 次 JSX 使用，53 类显式 token，91/91 文件设计检查无错误/警告。这些是静态引用统计，**不是 838 个公开组件，也不是运行时挂载数**。

| 识别类别 | 类别数量 | JSX 使用次数 |
| --- | ---: | ---: |
| Block | 84 | 171 |
| UI | 216 | 2,741 |
| 内部局部组件/helper | 474 | 737 |
| 项目组件 | 26 | 69 |
| 外部组件 | 38 | 134 |

报告工具未自动识别的 43 次别名/动态图标引用已逐项追溯：Base UI trigger/close 转发、Recharts Tooltip 别名、图标 context/品牌映射等，见 [`manual-inventory.json`](../../.zeron/reports/stage-five/manual-inventory.json)。原始 [`after.json`](../../.zeron/reports/stage-five/after.json) 的 inventory/manualReview 仍保留 `unchecked`，不会把工具限制改写为通过；人工补充结论与自动 lint/browser 通过是不同证据。

基线报告覆盖 80 个文件、42 个入口；最终报告补齐目录别名与独立 Workflow，并包含公共原语/文档等 91 个文件、44 个入口。口径不同，因此不计算前后复用率增幅或把全部工作区 diff 归因于阶段五。

## 5 验证结果与限制

| 验证 | 结果 | 证据 |
| --- | --- | --- |
| 状态/图表/工作区/列表/详情等核心行为回归 | **40 个测试文件、382 项通过**；含阶段五新增 18 项 | `tests-release.log`、`test-files.json` |
| 44 入口浏览器核心路径 | **44/44，通过 176 个视图检查**；无页面运行异常与页面外层溢出 | `browser-evidence.json`、88 张入口截图 |
| Badge 实际样式与窄屏图表 | 十组 strong 文字对比度通过；三个消费者各 320/480/800px 窄视口及实际 ChartContainer 宽度通过 | `browser-primitives.json`、`browser-final-extras.json` |
| 类型检查、局部 lint、全量设计检查 | 通过；局部 91 文件报告 0 error/0 warning | `typecheck-release.log`、`lint-release.log`、`design-lint-release.log`、`after.json` |
| 本地 Registry、指南及 Agent 目录 | 148 个 Registry 项、26 指南示例/26 TSX 通过；目录 156 项/52 指南生成 | `registry-release.log`、`registry-check-release.log`、`guide-examples.log`、`agents-release.log`、`agents-check-release.log` |
| 生产站点构建 | 通过 | `build-release.log` |
| 真实独立安装、类型与构建 | Badge、Availability Monitor、Model Detail 02、File Manager：**pnpm/Next + npm/Vite 共 8 目标通过** | `consumers.log`、`consumer-evidence.json`；模型最终源码复验 `consumers-model-final.log` |
| 全仓库单测 | **239 文件通过、17 文件失败；2,186 项通过、28 项失败、38 项跳过**，不能宣称全仓库通过 | `tests-all-final.log`；初始对照 `tests-all-first.log` |

以上证据均在 `.zeron/reports/stage-five/`，只证明当前本地工作区。主题矩阵通过切换文档根节点主题 class/colorScheme 检查实际样式；真实宿主主题入口、完整安装版本矩阵和公开发布不由该矩阵代替。文件管理、集群详情和规则编辑器的文档预览/代码页签及实际 320/480/800px 图表容器也已复验，见 `browser-final-extras.json`。文档生成期间的一次 HMR/useId 告警在生成结束后重新加载已消失，见 `browser-doc-refresh.log`。

全仓库遗留失败包括：发布/CI/source gates 的 Node 22 环境要求；旧 rendered-controls 测试指定的 Chromium 二进制缺失；Sidebar 源码结构与数字高度断言；运维外壳 React 能力与旧 Next-only 元数据预期；Cost Estimate 测试未提供 intl context、Getting Started 测试仍查找已移至设置菜单的 Empty list 按钮；字体工具合并断言。发布候选/干净源码门禁不因本次实现而绕过。初始对照已存在这些类目，最终仍需阶段六逐项处理，不能用定向测试替代全仓库 CI。

### 留给阶段六的交付工作

- 完整入口的独立安装矩阵及 npm/Next、pnpm/Vite 等尚未覆盖组合；实际安装环境主题、容器与交互复验。
- 整体 CI 环境对齐与剩余失败清单处置；公开 API/安装能力元数据终审。
- 用户人工验收记录，最终文档/Registry/指南一致性冻结。
- 如后续授权公开发布，按既有门禁验证实际版本与公开安装；当前尚未发布。

阶段五不包含真实后端认证、文件存储、部署服务或全业务编辑器重写。所有 44 个入口都有最终处置与本地证据；不会将未检查的发布或安装范围标记为完成。

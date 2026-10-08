# 集成监控 Block：Demo 拆解与落地方案

日期：2026-10-06。状态：方案待审阅，尚未实施。

依据：[参考视频](/Users/carlos/Downloads/oLOE7xaIY7CmJzg0.mp4)，时长约 39.78 秒；当前工作区组件源码、公开类型、四个参考 block 和语义变量。HEAD 为 `c84d317`，工作区已有未提交变更，本文以当前文件为准，不代表已发布版本。视频里的界面文字只作为参考内容。

## 1. 推荐实现

新增 `integration-monitors-01`，导出 `IntegrationMonitors`，作为 React 数据驱动的嵌入式 block。保留 demo 的标题操作区、四类导航、筛选搜索、三条一页的集成列表、细竖条检查状态、底部检查时间与分页。

全部界面控件使用当前 Zeron；新增内容限定为业务数据、查询组合、列表行组合及 demo 适配。无需新 UI 库、图表库、全局 CSS 或 token，也不修改基础组件。默认中文，集成名称保留原文，支持 labels / locale / timeZone。

首版交付可安装 block、完整可交互的示例和文档站独立预览。真实集成授权、检查任务和持久化由宿主接入回调；示例操作不宣称已连接第三方服务。

## 2. 视频中可确认的内容

| 区域 | 观察结果 | 实施对应 |
| --- | --- | --- |
| 顶部 | Monitors、下载、分享、更多、Add Monitor | 标题 + 三个低强调图标操作 + 一个主要新增操作 |
| 分类导航 | All monitors / Failing / Compliant / Inactive；初始后三项为 6 / 8 / 4 | 中文为全部 / 存在失败 / 全部通过 / 未启用，数量统计集成行 |
| 查询区 | 集成选择、Any status、搜索及清空按钮 | 两个 Select + InputGroup；筛选叠加，重置分页 |
| 集成行 | Logo、名称、业务描述；ACTIVE / PAUSED / NEEDS SETUP；竖条、失败摘要、资产数量、更多菜单 | InfoItem + Avatar + Badge + StatusOverview + Dropdown |
| 行菜单 | 查看详情、立即检查、暂停监控、编辑、复制链接、移除 | 对应宿主动作；暂停状态提供恢复入口 |
| 移除 | Jira、Confluence 移除后补入后续行，分类数量减少并出现反馈 | 宿主更新同一数据快照，列表、分类和页数一起更新 |
| 搜索 | 输入 Merc 后结果含 Mercury 和 Square（Commerce） | 搜索名称及业务描述；只高亮实际匹配文本 |
| 新增 | 下拉展示未连接集成；添加 Jira / Dropbox 后为待配置，未启用数量增加 | 添加到列表不等于完成授权；待配置行提供配置入口 |
| 状态筛选 | Active / Needs setup / Paused | 生命周期筛选独立于通过/失败分类 |
| 顶部更多 | 全部刷新、CSV 导出、复制分享链接、静音一小时、管理集成 | 公开菜单组合；共用顶部导出/分享处理器 |
| 底部 | 上次检查时间、数字页码、省略号、前后翻页；重新检查有完成反馈 | 实际更新时间 + 数字分页 + 宿主 Toast |

视频没有展示暂停/恢复完成、编辑表单、详情内容、资产详情、导出文件、静音结果、失败重试、移动端和深色主题。以下针对这些情况作明确实现选择，不把推定行为当作视频证据。

## 3. 四个参考 block 的借鉴方式

| 参考 | 复用的组合原则 | 保持独立的原因 |
| --- | --- | --- |
| security-overview-01 | ContainerHeader / Body / Footer 的 raised、floating 表面层次；胶囊 Tabs；异步任务与数据快照分离 | 安全评分和风险快照的数据模型不能承载集成管理 |
| deployment-detail-01 | InfoItem 属性组合、Badge、复制反馈、StatusOverview 的 nodes 和 activity 模式 | 部署阶段不是集成检查项 |
| project-monitor-01 | 细竖条、中文提示、容器响应式、刷新时保留已有数据 | 请求时间分桶不能冒充检查项状态 |
| model-router-01 | 紧凑卡片、公开 Tabs / Select / Table 组合、宿主回调边界、Logo 接入思路 | 不需要路由策略和流量动画 |

现有 `monitoring-alert-list-01` 是带导航的告警工作区，`resource-status-all-01` 是资源状态概览，也不直接匹配此任务。新 block 不导入其他 block 的私有子组件，不额外添加 AppShell / Sidebar。

宽度参考后三个 block 的 `w-full max-w-3xl`（默认 768px），由根节点 className 接受宿主布局调整。这是实施选择，不是从视频推算的 CSS 尺寸。外层采用更直接匹配 demo 的 Container。

## 4. 区域与现有组件映射

| 区域 | 当前组件及已核实的公开能力 |
| --- | --- |
| 外框 | Container / ContainerHeader / ContainerBody / ContainerFooter |
| 分类导航 | Tabs `variant="pill" color="default"`；TabItem 的 label、badge、leading；leading 使用 StatusIndicator 显示失败红点、通过绿点与未启用灰点，全部不加圆点；一个共享 TabPanel 承接当前列表 |
| 状态点 | StatusIndicator 用于说明/图例；Tabs 中的小标记通过公开 icon 槽接入，不能向 string 类型的 label 塞自定义元素 |
| 集成、运行状态选择 | Select / SelectTrigger / SelectContent / SelectItem |
| 搜索 | InputGroup / InputGroupInput / InputGroupAddon / InputGroupButton；保留可访问名称和清空按钮 |
| 行身份 | InfoItem / Content / Title / Description / Trailing；Avatar `shape="rounded" size="lg"`、Image / Fallback |
| 运行状态 | Badge：active→success、needs-setup→warning、paused→neutral |
| 检查项竖条 | StatusOverview `variant="activity"`，`content.type="nodes"`，包含稳定 ID、status、ariaLabel、tooltip；底部文字使用 `content.footer` |
| 操作菜单 | DropdownMenu / Trigger / Content / Separator + MenuItem；品牌资源通过 MenuItem.leading 接入 |
| 图标与操作 | Button 的 size / variant / leadingIcon / iconOnly / loading + useIcon + Tooltip |
| 页码 | 现有 Button 组合数字和箭头；用 useDataTable 的行模型及分页 API，保留 aria-current |
| 加载和失败 | Skeleton / Empty / ErrorState / InlineNotice |
| 详情、配置、移除确认 | Dialog + Field / Input / Select / Button，由 demo 或业务宿主拥有 |
| 完成反馈 | 宿主统一使用 ToastStack，block 不创建全局通知实例 |

### 两处组件能力适配

1. **检查轨道排列**：当前 StatusOverview.activity 是“说明 / 竖条 / 结果”响应式布局，不能通过公开 prop 直接变成 demo 中的纯轨道。首版在 InfoItem 身份行下保留该组件的检查说明与竖条，使用 content.footer 呈现失败摘要和资产入口。保留细竖条与信息层次，接受轨道位置的小幅适配；不覆盖内部 data-slot、grid 或颜色。先在浏览器验证组合，不承诺内部布局逐像素一致。
2. **数字分页**：当前没有独立 Pagination 组件；DataTablePagination 是页容量选择、页数说明及四个导航按钮，也没有数字页码模式。此处按 demo 的富内容列表使用 useDataTable 提供筛选/分页行模型，列表由 InfoItem + StatusOverview 呈现，数字页码控件由现有 Button 组成。该组合是 block 业务适配，不新增基础分页组件，也不修改 DataTablePagination。

不使用标准 DataTable 外观，是因为用户要求每行保留身份信息、完整检查轨道和底部摘要，且整体嵌入卡片；强行拆成列会改变 demo 主体。普通资源管理页面仍按库的 DataTable 结构实现。

Logo 是内容资源，复用项目已安装的 `@thesvg/icons`，按稳定 integrationId 显示已有品牌图形。宿主提供 logoSrc 时优先使用；图标包未收录的品牌通过 AvatarFallback 显示名称缩写。图形为装饰内容，名称由相邻身份文本提供。仅为复刻品牌图形而添加新图标库或手绘 SVG 不在首版范围。

## 5. 样式变量与响应式

| 角色 | 使用当前变量/工具类 |
| --- | --- |
| 宿主画布 | bg-surface-base |
| 外框、内容、弹层 | Container 自带 surface-raised / floating；Dropdown、Select、Dialog 保留自身 Surface 上下文 |
| 标题和描述 | text-body / text-title / text-label，text-fg-default / muted / subtle |
| 检查状态 | StatusOverview 自带 success / danger / warning / neutral 状态色；文本同步说明，避免只靠颜色 |
| 新增操作 | Button primary，跟随现有 primary-action 配色；图标操作 ghost |
| 当前页 | Button secondary，其余 ghost，aria-current="page"；不将 active prop 用作分页选中状态 |
| 分隔 | border-hairline、border-border-subtle；不覆盖控件自己的标准边框 |
| 间距与圆角 | Tailwind 当前 gap-2/3/4、p-4 和组件默认圆角；不存在的 --space-* / 自造圆角变量不使用 |
| 动效 | 保留 Tabs / Dropdown / Button 内置反馈；业务过渡使用 duration-fast / moderate 与 motion-reduce |

demo 的橙色操作适配为当前品牌色，焦点环仍使用独立 focus-ring。首版跟随浅色/深色主题，不覆盖全局品牌；如后续明确要求橙色，再用现有品牌派生能力统一配置。

宽卡片中筛选在左、搜索在右；窄卡片中搜索占独立一行，行菜单保持可见，长名称换行。四类 Tabs 在自身区域允许横向浏览，数字页码减少可见数量。检查轨道超出时只在 StatusOverview 自身滚动，不压缩或删掉实际检查项。

Container 随内容增长，不固定整卡高度，默认每页 3 行。长页面由宿主滚动；只有宿主明确限制高度时才使用 ContainerBody.maxHeight，不额外套 ScrollArea。背景斜线和录屏舞台不属于 block。

## 6. 数据和状态约定

建议拆分 snapshot / query / actions 三部分，以下是待实现的业务契约，不是现有组件已经具备的 props。

- 快照：scopeId、snapshotId、updatedAt、lastCheckedAt、完整 items、可新增 integrations、mutedUntil。
- 每行：稳定 id / integrationId、名称、描述、logoSrc、lifecycle（active / paused / needs-setup）、assetCount、检查项集合、详情/分享信息、允许执行的动作。
- 检查项：稳定 id、名称、result（passed / failed / warning / unknown）、checkedAt。`null` 集合表示未加载，空集合表示没有检查项；零资产是真实值。
- 查询：category、integrationId、lifecycle、search、pageIndex、pageSize；默认全部、无筛选、无搜索、第 1 页、每页 3 行。query / defaultQuery / onQueryChange 支持受控或非受控，改变筛选和搜索时一次性回到首页。
- 数据状态：ready / loading / stale / error；refreshing 独立。已有快照刷新失败保留数据并显示局部错误；首次失败显示 ErrorState 和重试。
- 操作：onConnect、onConfigure、onCheck、onCheckAll、onPause、onResume、onEdit、onRemove、onOpenDetails、onOpenAssets、onExport、onShare、onMute、onManageIntegrations、onRetry。按能力显示，不保留无响应按钮。

首版以完整的小规模集合集成数据进行本地查询。不得只传后端某一页，再由前端计算“全局”数量或筛选结果。后端分页属于之后单独接入的模式，需要权威总数和查询匹配快照，不能复用本地模式冒充。

### 必须保持一致的统计口径

- Tabs 数量统计集成行，不统计行内失败检查项。例如 Failing=6 表示 6 个集成存在失败，GitHub 的 3/73 表示该行 73 项检查中 3 项失败。
- 生命周期与检查结果分开。ACTIVE 可以存在失败；暂停和待配置属于未启用；active 且有失败属于存在失败；全部已知检查通过才归全部通过。
- active 但零检查、数据缺失或仅 warning/unknown 不能算全部通过：保留在“全部”中并显示说明，不伪造互斥三类的完整覆盖。后三类之和不足总数时显示未归类说明。
- Tabs 徽标统计当前 scope 完整快照，和视频一样保持概览；列表使用 category + integration + lifecycle + search 的交集，分页总数只针对交集结果。
- 搜索按名称及描述不区分大小写匹配，支持 Commerce→Merc；高亮使用安全文本拆分和现有 emphasis 变量，不注入 HTML。
- 竖条首版明确表示逐个检查项，使用 nodes，不能凭屏幕外观当作时间轴。失败→down、通过→operational、警告→degraded、未知→unknown。缺失值不补零、不补绿条。
- 待配置且无检查项时显示“尚未配置检查项”，不生成视频中的装饰性灰条。暂停保留历史检查快照并标明暂停/旧结果，不能把历史通过显示为当前正在检查。
- 行内失败计数和总数来自同一检查集合；数据不完整时显示未知，不显示“全部通过”。资产数独立于检查项数量。
- 删除当前页最后一项后校正页码；添加/移除同步更新概览、筛选结果和页数。更新时间只在宿主提供新快照时改变，不在点击刷新时提前写“刚刚”。

## 7. 交互落地选择

| 操作 | Block 职责 | 可交互 demo 的具体结果 |
| --- | --- | --- |
| 添加集成 | 菜单显示宿主可添加列表，按 integrationId 调用 onConnect，防重复 | 加入待配置行、更新未启用计数，从可添加列表移除；提示继续配置 |
| 配置/编辑 | 交给宿主表单；当前没有统一的真实集成授权表单 | Dialog 编辑示例显示名/描述；配置完成后有明确检查数据，再进入 active |
| 检查当前/全部 | 等待 Promise、阻止同一目标重复检查、保留旧快照和失败提示 | 模拟检查后更新同一示例快照和 lastCheckedAt，支持失败重试 |
| 暂停/恢复 | onPause / onResume，宿主更新 lifecycle；能力与当前状态匹配 | 示例状态实际变化，分类列表与数量同步 |
| 移除 | 宿主拥有确认与持久化；完成后以新快照为准 | Dialog 明确目标，成功后移除并补齐当前页，失败保留原行 |
| 详情/资产 | 稳定 ID 回调，点击嵌套操作不触发行详情 | Dialog 展示该行检查项和资产示例；不是虚构的生产详情页 |
| 复制链接 | 复制宿主给定链接或 onShare，显示成功/失败 | 生成当前预览的可恢复查询链接；缺少可用链接时隐藏 |
| 导出 CSV | 上下文包含 scopeId、snapshotId、当前查询；按钮和菜单共用处理器 | 下载当前筛选的全部结果，非仅当前页；处理逗号/引号/换行、公式前缀并释放 Blob URL |
| 静音一小时 | onMute 由宿主记录绝对截止时间；不改变检查状态 | 保存示例 mutedUntil，显示到期时间与取消静音入口；不声称控制真实通知 |
| 管理集成 | onManageIntegrations 打开宿主管理区域 | Dialog 展示已连接和可添加集成，接入相同新增/配置动作 |

异步结果绑定 scopeId、行 ID 和操作序号，切换 scope 或移除目标后不得覆盖新对象反馈。block 不自行请求第三方网络，也不在回调完成时擅自改变宿主数据。demo 宿主负责数据更新、通知及计时器清理。

## 8. 文件与实施顺序

拟新增 `packages/blocks/src/application/integration-monitors-01/` 下的主 block、types、data 工具、row 组合、demo-data 和 index。分页及菜单保持 block 内部业务组合，不提升为基础组件。

1. 明确数据契约和固定示例：全量约 18 行、每页 3 行，覆盖失败、通过、待配置、暂停与未知；计算口径先统一。
2. 组合 Container、Tabs、查询区、InfoItem、StatusOverview 和数字分页；先验证宽窄容器及两个主题的视觉适配。
3. 补齐所有菜单动作和演示结果，加载/空/刷新失败/操作失败状态，详情及配置 Dialog、真实 CSV 下载和链接复制。
4. 接入 block catalog / registry / capabilities / 包导出、文档 manifest、中英文内容、Demo 和独立预览路由；按现有生成流程更新派生产物。
5. 完成局部检查、行为测试与浏览器验收，记录组件/样式使用情况。实施时保留现有未提交改动，不回退或覆盖其他任务。

## 9. 验收标准

- **组件约定**：UI 全部来自 Zeron，图标来自当前图标入口，品牌图形作为 Avatar 内容；无新 UI 依赖、自制竖条、控件内部样式覆盖或全局 token 修改。
- **核心操作**：搜索 Merc 匹配名称与描述；分类、双筛选、清空、数字分页共同工作；新增、配置、检查、暂停/恢复、移除均更新示例数据；每个显示的菜单项都有结果。
- **数据一致性**：Tabs 行数量、行内检查数量、筛选总数和页码分别验证；包含最后一页删除、零资产、未知检查、请求拒绝、重复点击和 scope 切换。
- **视觉与可访问性**：768px / 480px / 360px 容器、浅色/深色、长名称；键盘 Tabs、菜单、Dialog 焦点回归、轨道方向键/触摸提示；无页面横向溢出或截断操作。
- **交付验证**：运行新文件的普通及 design lint、类型检查、针对性单元/交互测试；执行 Registry 与 agent/docs 生成产物检查，验证可安装依赖闭包和预览路由。工作区已有问题与本次新增问题分别记录。

目前仅完成视频与本地源码分析及方案文档；没有运行时实现、浏览器验收或真实后端验证。预计工作量主要在查询一致性、菜单状态和文档注册，视觉主体可由现有组件直接组合。

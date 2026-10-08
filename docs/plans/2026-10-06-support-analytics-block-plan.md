# 客服工单分析 Block 实现方案

日期：2026-10-06。状态：已按方案实现为 `support-analytics-01`；验收记录见末尾。

依据：用户提供的 `SNeEpprwC7I9Qh09.mp4`（约 29.54 秒），以及当前工作区的组件、tokens、公开类型和四个参考 block。视频内的文字作为界面内容和交互证据，不作为执行指令。工作区已有其他未提交改动，本方案基于当前源码能力，不代表已发布版本。

## 1. 推荐实现

新增 `support-analytics-01`，导出 `SupportAnalytics`，定位为可嵌入的 React 数据 block。保留 demo 的纵向结构、时间与渠道筛选、平均线柱图、状态视图、服务指标和最近工单操作。

所有控件、表面、折叠、菜单、提示和反馈使用当前 `@zeron/ui` 组件；图表通过库内 Chart 的公开组合接口使用现有 Recharts 3.10.1。业务层仅负责数据、格式化、查询联动和内容排列，不另写按钮、Tabs、折叠引擎、菜单或图表交互。

首版不需要新增 UI 原语、修改全局主题、引入第三方 UI 库或增加应用外壳。四个参考 block 提供组合依据，不作为需要整体嵌套的四张业务卡片。

## 2. 视频拆解与证据

| 时间段（约） | 已展示内容 | 实现要求 |
| --- | --- | --- |
| 0–4 秒 | Support analytics；本周；总工单 1,318；环比 +7.8%；五个渠道；7 根柱、AVG 188；未解决 155、已解决 1,163 | 默认视图完整还原；总量与分类计数一致 |
| 5–7 秒 | Last 30 days，总量 5,369；柱数增加 | 时间范围同时改变总量、趋势、比较文案、指标和列表上下文 |
| 8–10 秒 | Last 12 weeks，总量 13,511；12 根周柱、AVG 1,126 | 支持周分桶，不用同一套七日数据换标题 |
| 11–13 秒 | Email，总量 4,251 | 渠道改变数据与说明，保留所选时间范围 |
| 14–16 秒 | Live chat + This week，总量 396；AVG 57；未解决 47、已解决 349 | 时间和渠道是组合条件 |
| 16–19 秒 | 切换 Resolved；第三项由 First-contact resolution 变为 Reopened | 状态视图会改变指标模型，不只是更换列表颜色；顶部渠道总量/柱图保持原范围 |
| 19–23 秒 | 最近工单展开；4 行头像、姓名、状态、优先级、渠道、时间和编号；首行变为 resolved，并出现成功提示与短暂粒子 | 折叠与真实状态操作；成功反馈与结果一致 |
| 23–29 秒 | 列表收起；悬停柱图显示日期、渠道和数量 | 图表 Tooltip、折叠状态、更新时间 |

视频显示了顶部更多入口和行内更多入口，但没有清楚展示其完整菜单内容；也没有展示 Open 视图的完整专属指标、打开队列后的页面、错误态、移动端或深色主题。这些部分以下面的首版设计为准，不声称是视频已经证明的行为。

斜线背景、外围虚线和录屏中的页面滚动属于演示环境，不进入 block 本体。

## 3. 参考 block 的采用方式

| 参考 | 采用内容 | 本次适配 |
| --- | --- | --- |
| security-overview-01 | 当前源码已使用 Container / Header / Body / Footer；范围快照匹配；受控查询；Skeleton / Empty / InlineNotice；图表可读数据入口 | 作为主结构参考，组织三个浮动内容区域与独立状态栏 |
| deployment-detail-01 | Avatar / InfoItem 的身份与属性组合；Dropdown / MenuItem；窄容器换行；异步动作错误与防重复 | 将部署属性行适配为工单身份、元数据和行操作 |
| project-monitor-01 | 统计窗口、Tab 联动、ready/loading/stale/error、已有数据刷新失败保留、时间与数值格式化 | 将服务窗口替换为工单窗口；复用同一数据来源原则 |
| model-router-01 | 分段 Tabs、表格信息密度、线上数据由宿主确认、异步动作与环境切换隔离、减少动画策略 | 保留确认后更新的行为；本次没有模型路由拓扑 |

SecurityOverview 当前上限为 576px；其余三个参考上限为 768px。客服 demo 是紧凑单列面板，建议新 block 默认 `w-full max-w-xl`（576px），宿主可通过公开 className 调整外部宽度。保留当前库的默认控件尺寸，不按录屏放大比例反推 UI 尺寸。

## 4. 区域与组件映射

| 区域 | 当前组件 / API | 具体安排 |
| --- | --- | --- |
| 外框 | Container、ContainerHeader、ContainerFooter | 保留 raised 外框、默认圆角、间距与 surface 上下文 |
| 顶部 | Tooltip、Button、Select / SelectTrigger / SelectContent / SelectItem | 标题与说明；本周 / 最近 30 天 / 最近 12 周；可选更多操作 |
| 总量 | MetricCard、Badge | 使用 `content={{ type: "none" }}`、公开 valueClassName / meta / footer；取消重复卡片外框采用已有 block 的公开 className 组合方式 |
| 渠道 | Badge | All / Email / Live chat / In-app / Social；选中项 strong 与当前主题 brand/fg-on-brand 变量，其余默认 solid/gray，点击和键盘激活筛选对应趋势 |
| 柱状趋势 | ChartContainer、ChartTooltip、ChartTooltipContent + Recharts BarChart / Bar / XAxis / YAxis / ReferenceLine | 柱形、分桶标签、平均虚线、Tooltip；不嵌套 ResponsiveContainer |
| 状态视图 | Tabs、TabsList、TabItem、TabPanel、TabItem.badge | All tickets / Open / Resolved；使用 `variant="pill" color="default"`，计数走公开 badge 参数，未解决 strong/red、已解决 strong/green，状态栏直接位于 raised 框架 |
| 服务指标 | Table、TableHeader、TableBody、TableRow、TableHead、TableCell、Badge | 标题 / 趋势 / 实际值 / 上期比较四列，阈值说明放标题下 |
| 指标小趋势 | ChartContainer + Recharts LineChart / Line | 业务图表组合，支持真实 7 / 12 / 30 点；保持 null 断点 |
| 最近工单 | Accordion、AccordionItem、AccordionTrigger、AccordionContent、Avatar、InfoItem、Badge | 默认折叠；展开最多 4 条预览；身份、状态、优先级与渠道分层 |
| 工单动作 | DropdownMenu、DropdownTrigger、DropdownContent、MenuItem、Button | 首版提供查看详情、标记已解决；操作按宿主能力显示 |
| 页脚 | Button、Tooltip、统一图标 | 实际更新时间；打开队列；可选刷新 |
| 状态与反馈 | Skeleton、Empty、ErrorState、InlineNotice、ToastStack / toast | block 内呈现局部状态；Toast 由 demo 或宿主统一拥有 |

### 已核对的能力边界

1. **小趋势不能直接使用 MetricCard 的内置图。** 当前 `MetricCardContent` 的 visualization 至少需要 24 个有限值；不能补点凑数，也不能为了视频改动此契约。使用 ChartContainer 的公开组合边界绘制真实小趋势，并提供对应数据入口。
2. **Tabs 没有橙色选中款。** 状态 Tabs 采用 default；按用户后续要求，渠道改为 Badge，其公开 strong 与自定义颜色参数可以引用当前主题变量提供实心选中项，不覆盖内部样式。
3. **Accordion 默认是箭头指示器。** 当前 AccordionTrigger 没有替换指示器的公开参数，采用默认箭头；不隐藏内部节点再插入仿制的加减按钮。
4. **Tooltip 采用现有 ChartTooltipContent。** 保留日期、渠道和数量，沿用库的浮动表面，不覆盖成视频中的黑色气泡。
5. **视频粒子庆祝没有现成对应组件。** 首版用 success Badge 与 Toast 表达完成，保留组件自带动效。ModelRouter 的专用流量粒子不能当成通用庆祝组件使用。

以上差异是“全部使用当前组件库”的选择。渠道 Badge 已通过公共 API 实现当前主题色选中（默认蓝色）；如果后续要求状态 Tabs 也采用橙色、加减指示器、黑色提示和粒子逐项一致，应单独定义公共组件能力扩展。

## 5. 结构与样式变量

推荐内容顺序如下；这是区域责任图，状态 Tabs 保留自己的 TabsList / TabPanel 关系，渠道 Badge 直接筛选柱图。

```text
Container
├─ ContainerHeader：标题、说明、范围、可选更多
├─ ContainerBody：总量、环比、渠道 Badge、柱图
├─ 状态 Tabs
│  ├─ 普通滚动排列：TabsList + 两种状态计数
│  └─ TabPanel → ContainerBody：服务指标 Table
├─ ContainerBody：Accordion → 最近工单
└─ ContainerFooter：实际更新时间、队列入口
```

不额外用 Card 包裹每个 ContainerBody。顶部、状态栏和页脚留在 raised 框架，三个内容区域由 ContainerBody 提供 floating 表面。状态栏不使用 rounded-2xl / border-hairline / border-border / bg-surface-floating / p-4 的额外包裹。组件随内容增长，宿主拥有页面垂直滚动；不设置固定卡片高度，也不复制录屏中的滚动容器。Table 的局部横向溢出只归 Table 区域。

| 样式职责 | 使用当前变量 / utility |
| --- | --- |
| 外部画布 / 框架 / 内容 | `surface-base` / `surface-raised` / `surface-floating`，由组件管理 |
| 标题 | `text-body font-medium`（14px / 500），与 SecurityOverview 的嵌入式标题一致 |
| 核心总量 | MetricCard 公开 valueClassName 使用 `text-display`，窄容器降到 `text-heading`，搭配 tabular-nums |
| 行文、指标和控件 | `text-body`；辅助说明、时间和图表标签 `text-label` |
| 主 / 次 / 弱文字 | `fg-default` / `fg-muted` / `fg-subtle` |
| 结构分隔 | `border-hairline border-border` 或 `border-border-subtle`；控件边框保留默认宽度 |
| 柱形 / 小趋势 / 平均线 | 柱形使用当前主题 `brand` 半透明到透明渐变，小趋势使用 `fg-muted`，平均虚线与右端圆点使用 `fg-default`；平均标记使用 strong Badge 与 `inverse-background` / `fg-on-inverse` |
| 改善 / 恶化 / 未知 | `fg-success` / `fg-danger` / `fg-neutral-status`；徽标通过 Badge.status |
| 渠道和优先级分类 | Badge 的现有分类色，与业务成败状态色分开 |
| 操作与焦点 | Button 公共 variant、原有 hover / active / focus-ring |
| 间距 / 圆角 | Container 与控件默认；业务排列采用既有 gap-2/3/4、p-4、rounded-* 等尺度 |
| 动效 | Tabs / Accordion / Dropdown / Toast 自带动效；必要 CSS 使用 duration-fast / moderate / slow 及退出档位 |

主柱图保留原型的竖向渐变结构，按用户后续要求使用当前主题 `brand` 色，底部淡出到透明；均值 Badge 贴在平均虚线左端，右端使用小圆点。Bar 圆角、柱间距与图表尺寸属于公开图形几何参数，不用于覆盖 UI 控件。星期、日期和 W1–W12 标签对应各时间范围，Tooltip 与可读数据表保留真实日期。渐变 ID 按实例独立，不新增全局样式变量。小趋势不播放逐点生长动画，减少动态效果偏好下保留静态信息。

## 6. 数据与交互契约

以下为拟新增的 block 契约，不是现有 UI 组件已有 props。

- `scopeId`：客服团队或项目的稳定 ID；切换 scope 重置非受控视图、展开状态和操作反馈。
- `range` / `onRangeChange`：受控范围，建议 `this-week | last-30-days | last-12-weeks`。
- `channel` / `onChannelChange`：受控渠道，建议 `all | email | live-chat | in-app | social`。
- `view` / `defaultView` / `onViewChange`：`all | open | resolved`，支持受控及非受控；视图不改顶部渠道总量。
- `ticketsExpanded` / `defaultTicketsExpanded` / `onTicketsExpandedChange`：最近工单展开状态。
- `data`：可为空的快照，包含 id/revision、scopeId、range、channel、起止时间、分桶粒度、上期窗口、updatedAt、summary、buckets、counts，以及各 view 的 metrics / recentTickets。
- `state`：ready / loading / stale / error；`refreshing` 独立；`retainDataOnError` 明确控制同查询快照刷新失败时的保留行为。
- `actions`：按能力提供 onRefresh / onRetry / onOpenQueue / onOpenTicket / onResolveTicket / onExport。操作参数包含 scopeId、ticketId 或 snapshotId、revision 以及点击时筛选条件。
- `labels` / `locale` / `timeZone`：默认中文、zh-CN、Asia/Shanghai；英文 demo 文案可通过 labels 覆盖。

快照按 `scopeId + range + channel` 匹配，包含三个状态视图。状态切换读取对应 metrics/recentTickets；某视图未加载时展示该区域加载态，不借用别的视图数据。范围或渠道改变后，新查询下不显示旧查询的数值；宿主以请求序号或 AbortController 丢弃旧响应。

### 数据口径

1. 首版统计总体定义为“窗口内创建、属于当前渠道的工单”；Open / Resolved 是这些工单在快照时刻的互斥状态。因此完整数据下 `total = open + resolved`。其他真实状态应由宿主明确映射，不静默丢弃。
2. 分桶以创建时间归属，每条工单只计一次；完整分桶总和等于 total。平均线为实际完整分桶的算术均值，AVG 标签仅显示舍入结果，线的位置使用未舍入值。比如 396 / 7≈56.57，文本显示 57。
3. 时间起止为 UTC 毫秒、窗口采用左闭右开，显示按 timeZone。This week 是指定时区的周窗口，与滚动最近 7 天区分；未来分桶不伪装成已观测零值。示例用固定完整周，生产当前周须明确已覆盖时间。
4. null 表示未知，0 表示真实零；不使用插值、复制或补零制造趋势。分桶不完整时，平均线不可用；可以显示宿主明确提供的已知总量，但须标注趋势数据不完整。
5. 首次回复和解决时间统一使用毫秒，比例输入为 0..1。时长聚合、首次解决率、重开率由服务端给出，不平均每日均值或比例。指标包含 sampleSize、aggregation、目标值、比较方式和 improvementDirection。
6. 比较窗口由宿主明确提供；前值为零时不产生无穷环比。比例比较明确用百分比变化或百分点，不能只写含糊的“+3.4%”。首次解决率上升通常改善；回复/解决时长及重开率下降通常改善。工单量上升不自动当成成功。
7. Recent tickets 的 4 是预览条数，不替代全局状态计数。预览按当前 view/channel/window 过滤，以 createdAt 降序、ID 作稳定排序；“已解决”视图的排序策略在文案中保持相同，不暗改为解决时间。
8. 更新时间来自快照。没有 now 时使用绝对时间；有 now 时才格式化相对时间。demo 不靠定时器把旧数据改成“刚刚更新”。

### 各状态视图

| 视图 | 服务指标 | 来源说明 |
| --- | --- | --- |
| All tickets | 首次回复时间、解决时间、首次联系解决率 | 与视频主视图一致；按指标实际样本定义聚合 |
| Open | 未解决样本的首次回复时间、当前等待时长、SLA 超时比例 | 首版补充设计；后两项针对仍未解决工单，避免展示虚构的解决时长 |
| Resolved | 首次回复时间、解决时间、重开率 | 与视频展示的指标模型一致 |

每项附可读阈值与样本说明。阈值由宿主传入，不将视频中的 45 分钟、8 小时、70%、8% 写成不可配置规则。等待与超时按 snapshot.asOf 计算，前端显示期间不自行改历史快照指标。

## 7. 动作与状态设计

- 范围或渠道切换：保持其他筛选，关闭已失去对应工单的行菜单；新查询未到达时显示加载，禁止不匹配快照的导出或处理。
- 状态切换：顶部量与趋势保持范围/渠道口径，下方指标、列表与上下文同步切换；Tabs 必须有对应 Panel，支持方向键和可见焦点。
- 最近工单展开：使用 Accordion 受控 API，保留默认箭头与键盘行为；列表为空时使用 Empty，数量未知时显示 —。
- 查看工单：有 onOpenTicket 才提供详情入口；demo 打开现有 Dialog 展示完整示例，不用只有成功提示的假导航。
- 标记已解决：只对可处理的 open 工单显示；等待 Promise，按 ticketId 防重复；错误留在相应行并允许重试。宿主更新确认的快照后才展示 resolved。旧 scope、旧工单或旧 revision 的响应不能修改新上下文。
- 操作影响：创建量与创建时间柱图不因解决动作改变；Open / Resolved 计数、受影响预览和有必要重算的服务指标来自同一确认快照。不能从 4 条预览反推全部 396 条的统计。
- 演示处理：用确定性模拟宿主返回新 revision，原子更新工单和相关计数；成功后显示 Toast。可以复现 47/349 → 46/350，同时保持 total=396。视频中的实际后端与粒子行为不作为生产集成证据。
- 顶部更多：视频未给出菜单；首版仅在提供能力时显示“刷新”“导出当前快照”。demo 导出真实 JSON 文件并标记 demonstration=true，绑定点击时快照。
- 打开队列：将点击时 range/channel/view 交给宿主；demo 展示可筛选的示例 Dialog。生产队列导航由 onOpenQueue 承接。
- 首次加载用 Skeleton；首次失败用 ErrorState 与重试；stale 保留匹配快照并提示；同查询刷新失败可保留旧快照与 InlineNotice；真正无工单显示 0 与空列表，缺数据显示 —。

ToastStack 由宿主统一放置，block 不创建第二个全局 Toast。操作能力缺失时隐藏对应入口；公开类型和文档明确说明宿主负责请求、权限和持久化。

## 8. 响应式与可访问性

- 以容器宽度判断布局，覆盖 320 / 375 / 576 / 768px；标题与范围可换行，长姓名和文案不顶出容器。
- 五个渠道 Badge 在窄容器内允许局部水平滚动，通过点击、Enter 和空格筛选，并使用 aria-pressed 标注选中项。状态 Tabs 在宽度足够时平分；窄容器或大计数时局部滚动，键盘焦点自动移入可见区域。
- 指标四列在正常宽度保留；极窄时 Table 局部横向滚动，保留同一语义表格和标题关系，避免整张面板水平溢出。
- 小图只有辅助作用；实际值、目标、比较和样本量可读。主趋势与小趋势提供可展开的数据入口，不能只能靠鼠标悬停读取。
- 图表配置可测量高度，窄宽度自动减少轴标签密度，但 Tooltip/数据表保留真实时间；7/12/30 桶不采样或删数据。
- 工单行的菜单按钮始终可以通过键盘到达；标题、展开操作、数据表、Select、Tooltip、菜单和 Dialog 的焦点顺序完整。
- 减少动画偏好下停止非必要图表动画；检查现有 Accordion / Tabs 的实际表现，不以源码采用 motion 为通过证据。
- 深色主题依赖当前 tokens 自动适配；无需新颜色变量或全局 CSS。

## 9. 文件与分发接入

预计新增业务文件：

```text
packages/blocks/src/application/support-analytics-01/
  index.ts
  support-analytics.tsx
  support-analytics-types.ts
  support-analytics-data.ts
  support-analytics-charts.tsx
  support-analytics-metrics.tsx
  support-analytics-tickets.tsx
  support-analytics-demo-data.ts
docs/components/blocks/SupportAnalyticsDemo.tsx
docs/pages/blocks/support-analytics-01/
docs/content/{zh-CN,en}/blocks/support-analytics-01.json
docs/agent-guides/blocks/support-analytics-01.md
tests/support-analytics-data.test.ts
tests/support-analytics-interaction.test.tsx
```

依照现有 block 登记包导出、catalog、block-capabilities、Registry、docs manifest/artifacts、BlockPreview、独立预览、源码 allowlist、文档 loaders 和消费者 smoke 用例。生成 public/r、预览源码、agent guide/catalog 等分发资料。

实际依赖清单以最终 import 为准；Dialog / Toast 等仅在 demo 用到的能力不误算为核心 block 依赖。业务文件可复制，公开导入使用 `@zeron/blocks/support-analytics-01`；Registry 消费项目采用其实际安装别名。

现有 UI 源码、全局 CSS 和 tokens 不列为预期修改。登记或生成共享文件时保留当前其他任务改动，不用整库重置处理差异。

## 10. 实施顺序和验收

| 阶段 | 交付与完成条件 |
| --- | --- |
| 1. 数据契约 | 固定三种窗口、四种渠道与 All、三种状态样本；总量/分桶/分类一致；null、比较方向、时间格式与样本口径纯函数 |
| 2. 静态组合 | Container 三个浮动内容区域、独立状态 pill Tabs、渠道 Badge、柱图和平均线、指标表、折叠工单、页脚；浅深色与窄容器初验 |
| 3. 联动与动作 | 时间/渠道/状态联动；详情、解决、刷新、失败重试、队列、快照导出；模拟宿主真实更新数据 |
| 4. 分发与验证 | 双语文档/guide、预览、Registry 安装、Next/Vite 消费者检查、组件/样式报告与浏览器验收 |

必验用例：

1. 视频基准数据：1,318=155+1,163；396=47+349；AVG 188 与 57 的文本舍入及真实线位置正确；12 周总量 13,511 的分桶一致。
2. 周→30 天→12 周→Email→Live chat→本周；每次数据属于当前筛选，旧响应不会覆盖新条件。
3. All/Open/Resolved 的指标模型、TabPanel 和最近工单过滤正确；顶部柱图不被状态视图误改。
4. 工单处理只执行一次；成功状态与新 revision 一致；失败重试；期间切换 scope/查询不污染新上下文；总量不因解决动作变少。
5. 零工单、null 分桶、缺比较值、前期零值、部分数据、未来分桶、超长文案与时间边界都有明确结果。
6. 下载内容对应点击时快照，队列/详情入口有实际结果；未接生产服务的 demo 明确标识示例。
7. 320/375/576/768px、短视口、浅深色、长标签、大数字、键盘、减少动画、同页双实例；没有重复外框、整体横向溢出或遮挡焦点。

实施后运行实际可用的 targeted Vitest、typecheck、受影响文件常规 ESLint 和 design lint；生成 Registry/文档/agent 资料并核对；显式选择新 block 做 Next/Vite 安装与编译；最后做实际浏览器视觉和交互检查、输出组件来源与样式报告。构建通过不替代图表数据、菜单/折叠或响应式验证。

## 11. 实施与验收记录

已新增核心 block、确定性完整示例数据、中文和英文文档、Agent guide、独立演示与 Registry 安装入口。公开导入为 `@zeron/blocks/support-analytics-01`，导出 `SupportAnalytics` 和相关类型。控件、状态与表面均采用现有组件；图表通过公开 Chart / Recharts 接口组合。

已验证 1,318 / 5,369 / 13,511 / 4,251 / 396 的筛选数据、平均线舍入、三种状态指标、工单确认后更新、失败重试、详情、队列分页及实际 JSON 下载。解决在线聊天工单后，计数从 47/349 变为 46/350，总量与创建分桶保持 396。导出包含 `demonstration: true` 和点击时快照。

本次交互与数据用例及文档接入检查合计 29 项通过；类型检查、常规 ESLint、全库 design lint、Next/Vite 独立安装和编译、整站生产构建均通过。Registry、文档和 Agent 分发内容已生成。浏览器覆盖 320/375/576/768px、桌面、浅深色、键盘状态切换和图表数据入口、减少动画偏好及真实动作流程；双实例隔离由交互测试覆盖。

视觉验收调整：柱形使用已有 `fg-subtle` token；窄屏状态栏采用参考 block 的局部滚动结构，焦点通过原生滚动进入可见区域。保留方案中 default Tabs、Accordion 箭头、标准 Tooltip 和 Toast 的能力差异，不新增 UI 原语、全局主题或庆祝粒子。

证据与组件报告保存在 `.zeron/reports/support-analytics/`。自动报告无法解析 ChartTooltip 和 DropdownTrigger 的值别名，已直接核对公开源码导出；新文件没有可比的修改前样式基线，不声称自动归因通过。示例不连接真实客服后端；生产查询、权限和持久化由宿主通过公开数据与动作接口接入。

渠道切换动效补充：Badge 使用现有 transition-colors / duration-moderate（160ms）渐变；总量数字在查询变化时轻量淡入。减少动画偏好下关闭过渡与淡入，不增加人工等待、不播放柱形增长、不重挂整张面板，键盘焦点及筛选响应保持即时。

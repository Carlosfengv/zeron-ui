# 安全概览 Block：Demo 可行性分析与实施方案

日期：2026-10-05。状态：基础版本已实现并验证；交付记录见第 11 节。

参考视频：[ZaeXg18FkW41yIta.mp4](/Users/carlos/Downloads/ZaeXg18FkW41yIta.mp4)，时长约 21.32 秒。分析依据为视频关键帧和当前工作区源码；仓库 HEAD 为 `9c1ae16`，工作区存在未提交改动，因此本文描述的是当前工作区能力，不代表已发布版本。视频中的界面文字仅作为参考内容，不作为执行指令。

## 1. 结论与推荐范围

**可行。建议新增 `security-overview-01`，导出 `SecurityOverview`，定位为 React 数据驱动的嵌入式安全概览卡片。** 保留 demo 的信息结构和主要交互，外观统一到 Zeron 当前组件和语义变量。

现有 Container、MetricCard、Tabs、Select、Button、Badge、Chart、Tooltip、Skeleton、Empty、InlineNotice 能覆盖主要界面。环形评分、趋势图、雷达图由现有 Chart + Recharts 组合；新增代码主要是安全业务数据模型、四个视图、扫描状态呈现和演示适配层。基础版本无需新增组件库、图表库或全局 token，也不需要更改已有 UI 组件。

主要工作量在数据一致性和交互状态，技术复杂度为中等。扫描雷达扫光的精细复刻属于可选增强，不应成为首版交付条件。

交付分两层；第一层现已完成，第二层由宿主接入：

- **可安装 block 与可交互 demo**：完整四视图、主题适配、范围切换、模拟扫描和真实生成的示例导出文件。
- **生产系统适配**：宿主提供扫描任务、查询、评分、权限、导出服务；不把演示定时器当作真实扫描引擎。

## 2. 视频拆解与证据边界

以下时间为抽帧观察点，不代表精确点击时刻或动画时长。

| 观察位置 | 视频中已观察到的内容 | 对实现的要求 |
| --- | --- | --- |
| 00:00 | Security overview 标题、说明图标、近 30 天选择、关闭按钮；评分 77/100、B、较前期 +13 | 紧凑卡片头；评分、等级、比较值各自有明确数据来源 |
| 00:00 | 未解决 13、已解决 21、资产 26、修复时间中位数 2.4 天；严重风险 2 | 四项摘要；保留单位和统计口径 |
| 00:02、00:04 | Run scan 变为 Scanning；评分环变成扫描刻度效果；底部进度从 9/26 到 24/26 | 扫描按钮防重复；扫描状态、实际进度和旧快照并存 |
| 00:06 | 扫描结束；评分变为 75、未解决变为 14、比较值变为 +11；出现新增 1 项高风险提示 | 结果作为同一快照更新；完成反馈不能早于结果可用 |
| 00:08 | Findings：风险分布条、四级数量、三条风险摘要、评分、Show all 14 | 分类计数、短列表和查看全部入口 |
| 00:10 | Posture：六维雷达图、当前/历史对比、各维度评分与变化 | 六维评分采用同一量纲；同时提供可读数值列表 |
| 00:12、00:14 | Assets：6 个受影响资产，预览 3 个；每行有各级风险数量；另标明共扫描 26 个资产 | 区分扫描资产总数与受影响资产数 |
| 00:16、00:19 | 时间选择器提供近 7、30、90 天 | 首版使用固定范围 Select，无需自定义日期面板 |
| 00:18、00:21 | 7 天与 30 天视图切换，图表、比较值、已解决数及修复耗时变化 | 范围影响一组相关数据，不能只更换文案 |

视频未展示：风险详情打开、资产详情打开、Show all 的后续页面、导出结果、关闭结果、更多菜单内容、扫描失败、权限不足、浅色主题、移动端和键盘操作。下文针对这些情况给出实施决策，不声称是视频原行为。

需要主动纠正两处不能直接照搬的细节：

1. 风险列表标注“按 CVSS 排序”，但 00:08 画面中 7.2 排在 9.6、9.3 之前。首版建议按评分降序稳定排序；若业务要求新发现置顶，必须改成相应标签。评分和风险级别由宿主传入，不在前端推导行业规则。
2. 视频曲线看起来具有分层面积效果，但无法仅凭画面确认是否为累计堆叠。方案明确采用四级互斥数量的堆叠面积图，Tooltip 展示原始单级数量及总数。此项是实施选择，需用演示数据验证，不把屏幕曲线当作精确原始数据。

## 3. Block 边界与组件复用

### 3.1 为什么新增独立 block

已检查当前 block catalog，没有覆盖“安全评分 + 扫描任务 + 风险/态势/资产”的完整组合。

| 现有候选 | 可以借鉴 | 不直接扩展为本需求的原因 |
| --- | --- | --- |
| `project-monitor-01` | 嵌入式卡片、受控范围、摘要指标、Chart、加载和过期状态 | 主任务是项目资源和请求监控；公开数据模型没有扫描任务、安全评分或风险关联 |
| `model-router-01` | 紧凑多区域卡片的组织方式 | 核心任务是模型路由配置，与安全概览不匹配 |
| `availability-monitor-01` | 趋势图及状态呈现 | 服务可用性不能替代风险分布和安全态势 |

借鉴布局与组合方式，不直接导入其他 block 的私有视图。首版保持 `framework: "react"`、`kind: "data-block"`，不创建 AppShell、Sidebar 或页面导航，不依赖 `next/navigation`、`next-intl`。文档站适配层可以使用 Next 和站点翻译。

### 3.2 区域到组件的映射

| 区域 | 选用组件/公开能力 | 新增业务组合 |
| --- | --- | --- |
| 外框、头部、内容、底部 | Container / ContainerHeader / ContainerBody / ContainerFooter | 标题、范围控件、评分区、各视图内容与操作布局 |
| 时间范围 | Select / SelectTrigger / SelectContent / SelectItem | `7d / 30d / 90d` 选择，触发宿主加载 |
| 扫描、关闭、导出 | Button；普通图文用 `leadingIcon`，图标按钮用 `iconOnly` + `aria-label` | 扫描状态、权限和导出回调适配 |
| 四项指标 | MetricCard 的 `label / value / unit / footer / state` | 业务格式化；内容设为无附加图表 |
| 评分环 | ChartContainer + Recharts PieChart / Pie / Cell，中心覆盖等级文字 | `SecurityScore`，仅 block 内部使用 |
| 四视图导航 | Tabs / TabsList / TabItem / TabPanel；`variant="pill" color="default"`；TabItem 支持 `badge` | 默认趋势页，保留风险数/受影响资产数徽标 |
| 时间趋势 | ChartContainer / ChartTooltip / ChartTooltipContent + AreaChart / Area | 四级互斥数量、时间轴、缺失值断点 |
| 风险分布与列表 | Badge、Button、Tooltip；语义化列表 | 比例条、风险摘要、评分、稳定排序、查看全部 |
| 安全态势 | ChartContainer + RadarChart / Radar / PolarGrid / PolarAngleAxis / PolarRadiusAxis | 六维当前值和历史值；旁置数值列表 |
| 资产列表 | Badge、Tooltip、语义化列表 | 资产类型、扫描时间和风险计数 |
| 加载/空/失败 | Skeleton / Empty / InlineNotice | 快照和各面板状态适配 |
| 完成提示 | Toast 由宿主演示层负责；block 内保留可读状态 | 避免每个 block 实例都安装全局 Toaster |

当前 Chart 导出不包含 `ChartLegend` / `ChartLegendContent`；图例使用业务组合，不引用不存在的 API。ChartContainer 已包含 ResponsiveContainer，不再嵌套第二层。Recharts 已安装 3.10.1，所需雷达图与极坐标轴导出已在本地类型中确认。

小型摘要列表不需要 DataTable；“查看全部”由宿主接管到完整列表或详情。没有回调的入口隐藏，不做无响应按钮。首版省略视频中用途不明的底部更多菜单；关闭按钮仅在提供 `onClose` 时出现。

## 4. 视觉、样式变量与响应式

### 4.1 保留和适配的视觉特征

保留纵向紧凑卡片、突出评分、四项并列摘要、胶囊导航、下方可切换视图及底部状态栏。外部斜线舞台背景不纳入 block；宿主自行决定页面背景。参考视频为深色，但实现同时支持当前浅色和深色主题。

默认建议 `w-full max-w-xl`；这是基于卡片形式的实现起点，不是从视频推算出的精确 CSS 尺寸。宿主可用根节点 `className` 调整宽度。内部不用固定整卡高度，不把闭合卡片误做模态 Dialog。

| 角色 | 使用现有变量/工具类 | 实施说明 |
| --- | --- | --- |
| 页面承载面 | `bg-surface-base` | 由预览/业务宿主拥有 |
| 整体卡片 | Container 的 raised 表面 | 继承组件默认间距和圆角，不硬编码纯黑 |
| 内部内容区域 | ContainerBody 的 floating 表面 | 由组件提供表面、边框、间距和圆角 |
| 下拉弹层 | Select 内置 Surface 解析 | 不用全局 CSS 强行覆盖浮层 |
| 标题、正文、辅助信息 | `text-fg-default / muted / subtle` | 主次层级与字号分别选择 |
| 正向/负向变化 | `text-fg-success / danger` | 同时显示正负号和比较说明 |
| 主操作 | Button `variant="primary"` | 跟随品牌变量；不为匹配视频写死橙色 |
| 分隔 | `border-hairline border-border` / `border-border-subtle` | 普通控制边框由组件负责 |
| 排版 | `text-heading / body / label`、`tabular-nums` | 顶部标题使用 body + medium；评分使用 heading |
| 布局间距 | `gap-2/3/4`、`p-4/5`、`px-4` | 当前库使用 Tailwind 原生刻度，没有 `--space-*` |
| 圆角 | `rounded-lg / xl / full` | 当前库没有额外 Radius Token，不新造变量 |
| 阴影 | `shadow-raised`；弹层沿用组件默认 | 不复制视频黑色光晕 |

风险四级颜色采用单一映射：`critical → red`、`high → orange`、`medium → amber`、`low → gray`。使用 Badge 公开的分类 `color` 和 `badgeColors`，在 ChartConfig 中复用同一映射；不向 block 复制 palette 的十六进制值，不虚构 `--severity-high` 或 `--chart-1`。

这是风险分类颜色映射，不是新增四套反馈状态。文字以可读前景色呈现，配完整级别名称和数量；图形加线型/清晰轮廓，浅色模式必须实际检查非文本对比度。若已有 palette 不能满足图形可辨识性，优先调整线型和使用现有可读语义前景；只有确认存在跨场景视觉角色缺口，才另案扩展 token，不能用局部硬编码绕过。

评分环使用宿主给定 `scoreTone` 对应的现有 `--fg-success / warning / danger / muted`，轨道使用 `--muted`。不根据“75 分”擅自推断安全等级或成功色。

### 4.2 容器响应式与滚动

- 按 block 自身容器宽度响应，不能仅依赖浏览器 viewport：它可能嵌在宽页面的窄列中。
- 宽容器：四指标单行；雷达图与列表左右排列。窄容器：指标 2×2；雷达图与列表上下排列；头部操作自然换行。
- 四个中文 Tab 标签建议“趋势 / 风险项 / 态势 / 资产”；保持一行，空间不足时 Tabs 区域独立横向滚动，不裁切焦点。正文不产生横向溢出。
- 卡片内容随视图自然增高；长列表仅预览前三项，完整数据交给查看全部动作。整卡不增加嵌套纵向滚动，外层页面拥有滚动。
- 风险标题可换行；长域名允许断行；不靠 Tooltip 才能读取关键风险信息。
- 图表给出可测量高度，如趋势 `h-48`、雷达 `h-56`，父级 `min-w-0`。验证隐藏 Tab 切换为可见时尺寸正确。

## 5. 数据与公开接口草案

以下均为**计划新增的 block API**，不是当前已存在的导出。所有类型最终统一以 `SecurityOverview` 前缀导出；此处为可读性缩写。

```ts
type Range = "7d" | "30d" | "90d";
type View = "trend" | "findings" | "posture" | "assets";
type Severity = "critical" | "high" | "medium" | "low";
type Counts = Record<Severity, number>;
type DataState = "ready" | "loading" | "stale" | "error";

interface Finding {
  id: string;
  title: string;
  assetId: string;
  assetName: string;
  severity: Severity;
  score: number | null; // 宿主提供的 0–10 评分；未知为 null
  detectedAt: number;   // UTC 毫秒时间戳
}

interface Asset {
  id: string;
  name: string;
  kind: string;
  lastScannedAt: number | null;
  findings: Counts;
}

interface PostureArea {
  id: string;
  label: string;
  score: number | null;
  previousScore: number | null;
}

interface Snapshot {
  id: string;           // 同一轮一致结果的版本标识
  scopeId: string;      // 租户/项目/扫描范围的稳定标识
  range: Range;
  asOf: number;
  window: { start: number; end: number; comparisonAt: number };
  score: number | null; // 0–100
  grade: string | null;
  scoreTone: "success" | "warning" | "danger" | "neutral";
  previousScore: number | null;
  openBySeverity: Counts | null;
  resolvedInWindow: number | null;
  scannedAssetCount: number | null;
  newAssetsInWindow: number | null;
  affectedAssetCount: number | null;
  medianFixTimeHours: number | null;
  lastScanAt: number | null;
  trend: Array<{ at: number; counts: Counts | null }> | null;
  posture: PostureArea[] | null;
  findings: Finding[] | null; // 已排序的预览子集或完整集合
  assets: Asset[] | null;     // 预览子集或完整集合
}

type ScanState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "running"; jobId: string; completed: number | null; total: number | null }
  | { status: "refreshing"; jobId: string }
  | { status: "succeeded"; jobId: string; snapshotId: string; newFindingCount: number }
  | { status: "failed"; jobId?: string; message: string };

interface SecurityOverviewProps {
  scopeId: string;
  data: Snapshot | null;
  state: DataState;
  statusMessage?: string;
  range: Range;
  onRangeChange: (range: Range) => void;
  view?: View;
  defaultView?: View;
  onViewChange?: (view: View) => void;
  scan: ScanState;
  scanDisabledReason?: string;
  exportState?: "idle" | "pending" | "error";
  exportError?: string;
  actions?: {
    onRunScan?: (context: { scopeId: string }) => void;
    onExport?: (context: { scopeId: string; snapshotId: string; range: Range }) => void;
    onOpenFinding?: (id: string) => void;
    onOpenAsset?: (id: string) => void;
    onViewAll?: (kind: "findings" | "assets") => void;
    onRetry?: () => void;
    onClose?: () => void;
  };
  title?: string;
  description?: string;
  labels?: Partial<Record<string, string>>; // 落地时替换成明确的文案键接口
  locale?: string;
  timeZone?: string;
  className?: string;
}
```

### 5.1 数据口径与一致性

- `range` 是受控查询条件，`view` 支持受控/非受控；扫描、数据和导出状态始终由宿主控制。首版无需为范围同时维护第二套本地缓存。
- 分清**当前快照**和**窗口统计**：当前评分、未解决数、当前资产总数不因用户切换范围而人为改变；比较评分、窗口内解决数/新增资产数、修复耗时、历史曲线和历史态势随范围变化。数据真实更新导致的当前值变化允许发生。
- 未解决总数从 `openBySeverity` 求和，供摘要与风险 Tab 共用。受影响资产总数使用 `affectedAssetCount`；不能用三行预览长度推断 6，更不能混用扫描资产总数 26。
- 风险预览按 score 降序、同分按发现时间降序、最后按稳定 ID 排序；null 分数排最后。若服务端只传预览，其选择本身也应遵守该排序，前端不能从三条数据推断“全局 Top 3”。
- 风险分类计数必须为非负整数；评分/耗时为有限有效数。未知用 `null`，0 是真实值。空数组表示已加载且无结果；null 表示未提供/不可用，不显示“零风险”。
- 修复中位数由宿主聚合并以小时传入，显示层转换成天或小时；不平均多个中位数。等级和总评分由宿主提供，不用风险计数自行拟合算法。
- 四级趋势为各时间点互斥的未解决数量。缺失点不补零、不连线；Tooltip 读取原始单级值，不能把堆叠高度当作该级数量。总数为零时不除零，分布条显示无风险空态。
- 雷达图范围固定 0–100，各轴同尺度；变化为当前减历史，缺失历史不显示伪造的 0 变化。六个维度由数据定义，缺失维度不补成满分或零分。
- 宿主保证 `data.scopeId === scopeId` 且 `data.range === range` 才能作为当前结果展示。切换范围时保留公共框架；旧范围的窗口指标与图表进入骨架或明确旧范围标注，绝不在“近 7 天”标题下静默展示 30 天结果。
- 范围请求使用 AbortController 或请求序号防止旧响应覆盖新条件。扫描任务归属 scope，不因切 Tab/切范围重复发起；扫描结束后使该 scope 的范围缓存失效，并刷新当前选中范围。
- `succeeded.snapshotId` 必须对应已接收的结果快照；扫描完成但结果未就绪时保持 `refreshing`。切 scope 后旧任务和旧 Toast 不得写入新 scope。
- 默认文案中文、`locale="zh-CN"`、`timeZone="Asia/Shanghai"`，宿主可覆盖。所有日期格式化显式使用时区，SSR 首屏使用同一 `asOf` 基准，避免服务端/客户端“刚刚”文字不一致。

## 6. 交互与动效方案

### 6.1 扫描状态

状态流为 `idle → starting → running → refreshing → succeeded`；启动/扫描/刷新任一步失败进入 `failed`。宿主负责网络、轮询或事件流、超时和重试，block 不自建服务请求。

| 状态 | 界面行为 |
| --- | --- |
| idle / succeeded | 可再次扫描；显示最近扫描时间 |
| starting | 按钮使用内置 loading；立即阻止重复触发 |
| running | 显示“扫描中”和已完成/总数；保留并标明上一份评分和指标快照 |
| running，未知总数 | 只显示“扫描中”，不伪造百分比 |
| refreshing | “扫描完成，正在更新结果”；不提前宣称指标已更新 |
| failed | InlineNotice 显示原因；保留旧快照并标记；提供宿主扫描重试入口 |
| 无扫描权限 | 用 `scanDisabledReason` 禁用并解释；没有扫描能力回调则隐藏按钮 |

已知进度满足 `0 ≤ completed ≤ total` 才显示 determinate 进度；非法进度降为未知并在数据验证中报告。进度更新使用节制的 `aria-live="polite"`，不逐帧播报；屏幕阅读器至少获知启动、阶段变化、完成和失败。

扫描按钮同一个事件周期就需要防重，宿主演示控制器用同步 pending guard 配合状态更新；不能仅依赖下一次 React 渲染后的 disabled。点击关闭只通知宿主关闭卡片，不隐含取消服务器扫描；取消任务不是首版功能。

### 6.2 动效分级

- **必需**：复用 Button 的 loading、Tabs 的选中动画、Select 的展开/退出动画。CSS 状态过渡使用 `duration-fast / moderate / slow`；已有 JS 动效使用 `@zeron/ui/system/springs`。
- **首版可做**：评分环和扫描进度在同一固定尺寸区域切换；扫描态使用环形进度/未定进度表达，不同时把评分比例当作扫描比例。中心等级保持旧快照含义并有说明。
- **可选增强**：刻度环、扫光和整卡随内容高度变化。优先现有 Pie 组合/隔离的装饰层；不新建通用 RadarScanner 组件。若必须新增局部动画样式，单独评审并纳入 Registry 文件闭包。
- 首版图表直接呈现最终数据，避免视频中范围切换时逐点展开造成的短暂误读；数值不播放经过虚假中间值的计数动画。
- 减少动态效果时去掉装饰旋转、扫光和高度动画，保留文本进度、即时视图切换与结果反馈。持续扫描效果的循环周期不是界面过渡时长，不能硬套 80ms/160ms token 造成闪烁。
- 不锁定整卡高度，不同时让 CSS transition 和 Motion 竞争同一属性；多个实例的图表标识使用 React useId。

### 6.3 查看详情与导出

风险/资产行有对应回调才获得交互语义和可见焦点；无回调则展示普通列表，不出现可点击假象。查看全部的宿主动作可以打开既有列表页，demo 可打开本地 Dialog 展示完整示例集合。

导出回调包含 `scopeId + snapshotId + range`，绑定点击时的可用快照；导出期间用 loading，失败保留可重试反馈。首版 demo 明确“导出示例数据”，实际生成 JSON 文件并释放 object URL。PDF 报告和后端报告服务不在首版内。扫描进行中若允许导出，只能导出已完成的上一份快照，并在文件中保留快照时间；首次无快照时禁用导出。

## 7. 文件组织与接入清单

建议的新增实现文件如下；不提前抽象为通用安全平台框架：

```text
packages/blocks/src/application/security-overview-01/
  index.ts
  security-overview.tsx           # 根布局、公开 props 和视图组织
  security-overview-types.ts      # 业务类型和公开文案接口
  security-overview-data.ts       # 验证、格式化、排序、计数纯函数
  security-overview-charts.tsx    # 评分环、趋势、雷达
  security-overview-views.tsx     # 风险/态势/资产视图
  security-overview-demo-data.ts  # 明确标记的确定性数据
docs/components/blocks/SecurityOverviewDemo.tsx
docs/pages/blocks/security-overview-01/page.tsx
docs/pages/blocks/security-overview-01/SecurityOverviewBlockDocClient.tsx
docs/content/zh-CN/blocks/security-overview-01.json
docs/content/en/blocks/security-overview-01.json
docs/agent-guides/blocks/security-overview-01.md
tests/security-overview-data.test.ts
tests/security-overview-interaction.test.tsx
```

Mock 扫描、延迟、Toast、下载与详情 Dialog 全部放在 demo 层。使用确定性序列复现 77→75、13→14、新增 1 项高风险；定时器卸载时清理。demo 显示“示例数据”，提供 loading/error/stale 等状态入口，不连接真实扫描目标。

| 接入点 | 具体改动 |
| --- | --- |
| `packages/blocks/package.json` | 添加 `./security-overview-01` 导出 |
| `packages/blocks/src/catalog.ts` | 名称、说明、分类和实际依赖 |
| `packages/blocks/block-capabilities.json` | 注册 react / data-block |
| `packages/blocks/registry.json` | 添加完整源文件与依赖闭包；目标为 `components/blocks/security-overview-01/*` |
| `docs/manifest.ts`、`docs/catalog/artifacts.ts` | 文档入口、展示分类、搜索词；不擅自发明所属产品 |
| `docs/components/blocks/BlockPreview.tsx` | 注册动态预览加载 |
| `docs/components/blocks/standalone-blocks.ts`、`StandaloneBlockDemo.tsx` | 独立预览 slug、demo 渲染分支 |
| `scripts/preview-source-allowlist.mjs` | 预览源代码白名单 |
| `scripts/test-consumer-installs.mjs` | 增加 Next/Vite 消费者导入与渲染样例 |
| 文档与 agent 生成链 | 生成路由、源代码映射、guide loaders、agent catalog 和静态发现资料 |

Registry 的 block 直接依赖预计为 badge、button、card、chart、empty、icon-context、inline-notice、metric-card、select、skeleton、tabs、tooltip、utils，npm 依赖为 recharts；最终以实际 imports 为准。若 block 自己导入 Motion/springs，再声明对应闭包。Toast/Dialog 仅用于 demo 时不要误加到 block 运行时依赖。

通过已有脚本更新路由、预览源码、Registry 和 agent 生成产物。实际实施发现 `docs/generated/*page-loaders.generated.ts` 和 `docs/i18n/content-loaders.generated.ts` 的导入映射目前作为生成脚本的输入维护，没有对应的导入生成器，因此需按现有约定登记新模块，再运行路由生成器。新增路由按当前 manifest 机制落地。当前工作区有其他任务改动，生成前后核对 diff，避免把无关变化归入本 block。

## 8. 实施顺序、难点与工作量

以下为熟悉仓库的单人开发估算，不是已验证工期，不含真实扫描平台/API 开发。

| 阶段 | 产出与完成条件 | 估算 |
| --- | --- | --- |
| 1. 数据与静态骨架 | 固定类型、中文标签、语义颜色映射；四视图都能由同一数据渲染 | 0.5–1 天 |
| 2. 图表与主交互 | 三类图表、范围查询契约、模拟扫描、详情与示例导出；数据一致性可验证 | 1–1.5 天 |
| 3. 边界与视觉验证 | 窄卡片/宽卡片、双主题、键盘、reduce-motion、失败/未知值、竞态修复 | 0.5–1 天 |
| 4. 文档与分发 | 中英文文档、独立预览、Registry、agent guide、消费者安装验证 | 0.5–1 天 |

基础版本合计约 **2.5–4.5 个工作日**。精细雷达扫光/连续高度动效可另加 0.5–1 天，视组件契约适配结果决定。真实服务接入需先明确接口和评分口径，当前不估算。

风险及处理优先级：

1. **扫描结果和窗口缓存错配**：用 scope、jobId、snapshotId、range 归属约束和请求序号；先完成状态流再润色动画。
2. **分类统计误导**：列表为预览时不拿数组长度冒充总数；四级计数、趋势和摘要来自同一快照语义。
3. **移动端拥挤与隐藏图表零宽**：使用容器响应式、明确图表高度，专门测试 Tab 切换和父容器 resize。
4. **四色在浅色模式不清楚**：真实主题检查对比度、线型和文字标签；不复制视频调色板。
5. **发布链漏项**：核心实现之后单独完成 Registry/预览/agent/消费者安装闭环，不能只在源码仓库跑通。

## 9. 验收与验证方案

### 9.1 必须覆盖的行为

- 四个 Tab 鼠标/键盘均可切换；Tab 徽标与同一快照的计数一致；切换不丢失扫描任务。
- 7/30/90 天均对应明确窗口；快速 7→90→30 后最后一份旧响应不能覆盖 30 天。
- 连续点击扫描只产生一次请求；扫描失败可以重试；完成前保留旧快照；新快照到达后评分、计数、列表同步更新。
- 在扫描期间切范围、切 scope、关闭/卸载后，无过期状态写入或重复完成通知。
- 无数据、全为 0、未知数据、部分未知历史、超长标题/域名、无权限、导出失败分别有正确呈现。
- “查看全部”和详情动作传递正确稳定 ID；示例导出文件内容匹配点击时 snapshotId/range。
- 固定雷达轴 0–100；堆叠 Tooltip 读取单级数量；修复耗时单位正确；没有把缺失补成零。
- 在同一页放置两个实例不发生图表 ID、Tab 或反馈状态串扰。

### 9.2 视觉和可访问性验收

代表性容器宽度：320、375、576、768px；浏览器宽屏中另测 320px 窄侧栏。全部检查浅/深色主题、200% 缩放、长文本、键盘焦点和 reduced motion。

基本检查包括：无整体横向溢出，按钮文字/图标不错行，Select 弹层不被裁切，Tab 切换后图表非零宽且正确 resize，风险级别不只靠颜色，雷达图旁有同等数值内容，扫描完成/失败可被辅助技术获知。趋势提供可访问摘要及数值查看途径；不能仅因图表库存在 accessibilityLayer 就宣称整块可访问。

### 9.3 实施时运行的检查

这些命令来自当前仓库脚本，是原方案的实施清单。实际执行范围与结果见第 11 节；消费者验证使用显式指定本 block 的范围。

```sh
# 迭代期：实际新增实现目录
pnpm exec eslint --config eslint.design.config.mjs packages/blocks/src/application/security-overview-01
pnpm exec vitest run --config vitest.config.mts tests/security-overview-data.test.ts tests/security-overview-interaction.test.tsx
pnpm typecheck

# 注册后：依次更新各生成产物
pnpm registry:build
pnpm docs:routes:build
pnpm docs:sources:build
pnpm agents:guides:build
pnpm agents:build

# 交付前：静态、分发与既有契约
pnpm lint:design
pnpm tokens:check
pnpm registry:check
pnpm docs:routes:check
pnpm docs:sources:check
pnpm agents:guides:check
pnpm agents:check
pnpm exec vitest run --config vitest.config.mts tests/block-standalone-demo-contract.test.ts tests/block-preview-visibility.test.tsx tests/i18n-document-manifest.test.ts
pnpm test:consumer:smoke
pnpm build
```

消费者验证需要把新 block 纳入脚本实际测试集合，同时覆盖 Next 和 Vite；默认 smoke 命令通过但没有安装本 block，不算本 block 安装验收。浏览器主流程与上述自动检查分别记录结果；若仓库已有无关失败，保留失败事实和归属，不能重设基线掩盖。

最终完成条件：新 block 可以被发现、独立预览、复制或安装；默认 demo 全部可见操作有实际结果；公开 API 有文档；数据状态与交互检查通过；双主题和窄宽布局有实测证据。生产服务未接入时明确标记为可接入的演示 block。

## 10. 已核对的本地依据

路径相对仓库根目录，重点使用源码而非凭组件名称推测能力。

- `packages/blocks/src/catalog.ts`、`packages/blocks/block-capabilities.json`、`packages/blocks/registry.json`：现有 block 范围与安装边界。
- `packages/blocks/src/application/project-monitor-01/project-monitor.tsx`、`project-monitor-charts.tsx` 和 `docs/agent-guides/blocks/project-monitor-01.md`：嵌入式监控卡片、状态和 Chart 组合参考；当前为工作区内容。
- `packages/ui/src/components/{card,metric-card,tabs,select,button,badge,badge-colors,chart,toast}.tsx`（其中 palette 文件为 `badge-colors.ts`）：实际 props、导出与配色能力。
- `packages/ui/src/tokens/semantic-tokens.mjs`、`SEMANTIC-TOKENS.md`、`packages/ui/src/system/springs.ts`：颜色、排版、间距、圆角和动效来源。
- `.agents/skills/zeron-page-builder/SKILL.md` 及 `references/{selection-guide,charts,verification}.md`：组合、图表和验证约束。
- `docs/components/blocks/{BlockPreview,StandaloneBlockDemo}.tsx`、`standalone-blocks.ts`、`scripts/preview-source-allowlist.mjs`、根 `package.json`：预览接入与生成命令。

方案阶段完成视频关键帧分析、组件 API 核对、样式变量映射和实施链梳理；随后按用户指示完成以下基础版本。

## 11. 实施与验证记录

### 11.1 已交付

- 核心：`packages/blocks/src/application/security-overview-01/`，公开导出 `SecurityOverview`、快照/状态/动作类型与示例数据工厂。
- 四视图：四级堆叠趋势、按评分排序的风险预览、六维雷达与数值列表、受影响资产预览；时间选择支持 7/30/90 天。
- 状态：加载、过期、错误、未知值；扫描启动/运行/刷新/成功/失败；scope 和范围归属校验、旧快照保留、动作防重复。
- 文档 demo：模拟扫描从 77 分/13 项风险更新到 75 分/14 项风险；失败重试、详情、完整风险与资产集合、关闭/重新打开、实际 JSON 下载。示例导出标记 `demonstration: true`。
- 分发：React data-block 注册、独立预览、双语文档、复制源码、Registry、agent guide、包导出及 Next/Vite 消费者安装用例。
- 外观：复用现有 UI 与语义变量；无新增全局 token，无需修改 UI 原语。扫描环展示已知进度；未加入视频中的装饰性雷达扫光。

本地入口：

- [独立预览](http://localhost:3000/zh-CN/block-demo/security-overview-01)
- [中文文档](http://localhost:3000/zh-CN/docs/blocks/security-overview-01)

### 11.2 实际验证

| 范围 | 结果 |
| --- | --- |
| 类型与样式 | `pnpm typecheck`、全库 `pnpm lint:design` 与新增文件 ESLint 通过 |
| 单元与契约 | 6 个相关测试文件、25 个测试通过，含数据格式/排序/缺失点、归属隔离、视图控制、防重复、快照关联、demo 更新及现有预览/多语言契约 |
| 生成一致性 | token、Registry、文档路由、预览源码、guide loader、agent catalog 检查通过 |
| 消费者安装 | 显式选择 `security-overview-01`、pnpm 的 Next 与 Vite 安装/构建 smoke 通过；没有宣称全组件或所有包管理器矩阵通过 |
| 生产构建 | 最终 `pnpm build` 退出码 0，页面构建完成；磁盘空间不足曾产生 Webpack 缓存写入警告，未影响本次构建结果 |
| 浏览器主流程 | 四视图、扫描成功与失败重试、7/90 天切换、详情与集合、关闭/重开、键盘 Tab 切换、下载验证通过 |
| 下载内容 | 快照 `northwind-scan-2`、范围 `7d`、14 条风险与分类总数一致 |
| 响应式与主题 | 320/375/576/768/1280px 视口无整体横向溢出；浅/深色及 reduced motion 已实测；图表等待容器 resize 后宽度正确 |

消费者命令：

```sh
ZERON_CONSUMER_COMPONENTS=security-overview-01 \
ZERON_VITE_CONSUMER_COMPONENTS=security-overview-01 \
ZERON_CONSUMER_PACKAGE_MANAGERS=pnpm pnpm test:consumer:smoke
```

浏览器截图保存在 `output/playwright/security-overview-*.png`。组件报告范围为 5 个主要实现/演示/文档文件：29 种 UI 导出、62 次使用；全部组件含图表与内部组合共 59 种、100 次使用。完整报告：`.zeron/reports/security-overview/after.json`，分组摘要：同目录 `after.md`。这是新文件的交付报告，没有迁移前基线；内部组合的计数不等于 Registry 条目数。

报告工具不能解析 `ChartTooltip` 的重导出，因此自动来源库存标记为 unchecked；人工核对 `packages/ui/src/components/chart.tsx:44`，确认它是公开导出的 Recharts Tooltip。图表 SVG 字号使用现有排版变量。报告中未启用的样式规则不计为通过；另有全库设计 lint 和浏览器实测作为独立证据。

### 11.3 接入边界与未覆盖项

宿主仍需提供真实查询、扫描任务与权限、评分聚合、导出服务，并按公开契约处理异步请求归属；demo 定时器不代表真实扫描能力。未实现 PDF 报告和精细扫光。

200% 浏览器缩放、同页双实例、屏幕阅读器、真实服务竞态、所有超长文本/权限组合未作为本次浏览器验收执行，不能据自动测试和一般窄屏结果推定通过。图表使用实例 ID，任务归属和未知值已有实现与测试，但这些不替代上述运行验证。既有工作区改动保留，没有提交或发布。

### 11.4 Container 结构修订

按用户反馈将外层 Card 替换为 Container，评分区域与各 Tab 内容使用 ContainerBody，头尾使用 ContainerHeader / ContainerFooter。去掉原来手动设置的 section 背景、圆角、边框、外边距和阴影，由组件提供 raised / floating 层级。标题统一为 text-body / font-medium，实际为 14px / 500。

本次复查：类型检查、设计 lint、3 个测试文件 15 个测试通过；Registry、源码与 agent catalog 已重新生成且一致性检查通过。浏览器四视图均使用两块 ContainerBody（评分区 + 当前视图），模拟扫描仍更新至 75 分。浅/深色 320/375px 均无整体或 Body 横向溢出；宽屏标题计算样式为 14px / 500。截图为 `output/playwright/security-overview-container-wide.png` 和 `security-overview-container-mobile.png`。

组件报告范围仍为 5 个主要文件，UI 由 29 种/62 次变为 30 种/64 次。报告位于 `.zeron/reports/security-overview-container/after.json`，前后对比没有新增 lint 问题；ChartTooltip 的自动来源解析限制仍如上所述。本次没有重新执行生产构建或消费者安装矩阵。

# Chart Token 统一实施记录

日期：2026-10-07

状态：本轮完成

对应方案：[Chart Token 统一实施方案](./2026-10-07-chart-token-unification-plan.md)

普通图表已统一到五个全局槽位。第一顺位采用当前项目主题蓝，默认系列色盘不含中性色；图表、图例、渐变和相关 Slider 通过 CSS 变量同步换色。按追加要求，资源状态总览与资源指标列表也使用该色盘；数据计算、状态标签、品牌素材和交互契约保持原有行为。

## 当前默认色盘

| Token | 色彩 | Light | Dark |
| --- | --- | --- | --- |
| `chart-1` | 主题蓝 | `#0060D2` | `#1483FD` |
| `chart-2` | 青 | `#06B6D4` | `#22D3EE` |
| `chart-3` | 琥珀 | `#F59E0B` | `#FBBF24` |
| `chart-4` | 绿 | `#10B981` | `#34D399` |
| `chart-5` | 紫 | `#8B5CF6` | `#A78BFA` |

采用 PanelUI 五槽位体系。第一、第二项按本项目的实施要求调整，后三项沿用 Panel 初始色值，并按区分度要求将琥珀放在青与绿之间。第一项与当前品牌蓝初始值一致，但独立定义，修改 Chart 不会修改按钮或链接。

唯一手工色值源为 `packages/ui/src/tokens/semantic-tokens.mjs`。`app/globals.css`、`@zeron/tokens` 和 Registry surfaces 均由现有生成器更新。后续调整最终色盘只需修改这一处的十个亮暗值，再生成和复验。

## 公共契约

- `ChartColorIndex` 限定为 1–5；`chartColor(index)` 返回 `var(--chart-N)`，运行时非法索引回到槽位 1。
- `chartSeriesColor(id, options?)` 按有效 `colorIndex`、旧分类 `color` 适配、稳定 ID 哈希依次解析；单参数调用继续有效。
- `chartLegacyColor` 只接受旧分类输入，不从 Badge 读取 HEX。旧 gray 适配到默认槽位 1，不输出灰色；真实状态独立使用状态色。
- Credit、Router、Storage、ProjectMonitor 增加可选索引，保留原必填旧字段。外部显式 `color` 和 `theme` 覆盖继续有效。
- 五槽位允许动态实体重复颜色。实体 ID、完整标签、数值和数据表保留，不因颜色数量不足而删项或合并。

## 已迁移的消费者

| 分组 | 已完成范围 |
| --- | --- |
| 共享组件 | Chart、ChartLegend、SegmentedBar、DonutSummary、TimeSeriesChart；TimeRangeHistogram 保留显式 series 配置 |
| 三个试点 | CreditUsage、CostEstimate、ModelRouter；同一实体或费用项的图形、图例和相关控件共用槽位 |
| 监控与分布 | StorageUsage、ProjectMonitor、AiGatewayOverview、AvailabilityMonitor |
| 页面图表 | ModelDetail02、PersonalSettings、SupportAnalytics、SecurityOverview 的普通系列 |
| 通用日志 | Generic InfiniteLog counts 使用稳定 key，移除按列表下标分配状态色的分类数组 |
| 资源分布 | ResourceStatusAll 的 DonutSummary / ChartLegend 与 ResourceMetricList 的 SegmentedBar 接入全局槽位；类别映射一致 |
| 文档与分发 | Chart、ChartPrimitives、SemanticTokens 的亮暗示例和双语说明；相关指南、预览源、Agent 目录、Registry |

补充了 TimeRangeHistogram 指南及其显式路由身份。Cost、Router 和通用日志补齐 chart-primitives 直接 Registry 依赖，独立安装不依赖工作区导入。

固定系列通过索引避免碰撞。ModelDetail02 的五个已知 Provider 共享一张按 ID 配置的映射，Pricing 与性能保持一致；未知 Provider 使用稳定 ID 兜底。Storage 保留全部六个分类，第六项允许复用槽位 1。活动热图采用槽位 1，保留 30% / 60% / 100% 的强度和空格样式。

### 资源图表追加范围

`resource-status-all-01` 和 `resource-metric-list-01` 使用同一套固定类别映射：

| 类别 | 总览 tone | 列表 tone | Token |
| --- | --- | --- | --- |
| 正常 | `normal` | `brand` | `chart-1`，主题蓝 |
| 告警 | `warning` | `warning` | `chart-3`，琥珀 |
| 严重／异常 | `critical` | `danger` | `chart-5`，紫 |
| 未知 | `unknown` | `neutral` | `chart-2`，青 |

`tone` 继续表达类别身份。列表的旧 `neutral` 字段兼容保留，但图形采用青色，不代表中性色。映射按类别确定，重排输入不会换色；圆环及图例共用同一个解析结果，分段条采用对应槽位。未分配轨道仍属于图表结构色。

保留总数、分类计数、可判断覆盖率、未知是否计入覆盖的设置、负数及非有限值处理，以及未覆盖／超额提示。告警文本仍使用文本语义色；两个图表的映射不修改全局状态色工具。

## 保留的独立取色

两个资源分布图已按追加范围迁移。其余严重度、健康状态、真实 success / warning / error、文件操作进度、Logo、选择手柄、网格、坐标轴、文本和未分配轨道继续沿用各自语义。Security 的严重度与评分、HTTP 日志的结果状态、FileUpload 保留独立取色。

默认系列排除中性色不等于删除图表结构中的中性色；外部调用方的显式颜色覆盖也继续保留。

## 验证记录

| 检查 | 首轮统一范围结果 |
| --- | --- |
| 类型、全项目 ESLint、设计 lint | 通过 |
| Token、Registry、Code Engine、预览源、指南和 Agent 目录一致性 | 通过 |
| 指南示例 | 27 份指南、28 个 TSX 示例通过 |
| 本地浏览器 | 52 个视图检查通过；390 / 1440 宽度、亮暗模式、计算色和单槽位覆盖 |
| 三试点数据基线 | 六组亮暗对照通过，显示数据与文案保持一致 |
| 文档浏览器 | Chart、ChartPrimitives、SemanticTokens 的六组亮暗检查通过 |
| 全量单元测试 | Node 22.17.0 下 261 份测试文件、2,331 项测试全部通过 |
| 独立安装 | 14 个 Next、7 个 Vite 干净消费者全部通过；128 个安装视图检查，依赖闭包哈希与该阶段 Registry 一致 |

资源追加范围另行记录：两个组件的 46 项相关测试通过，包括重排后固定槽位、圆环图例与分段条一致、覆盖率、未覆盖和超额行为；类型检查及本次修改文件 ESLint 通过。8 个亮暗／尺寸视图验证通过，4 组修改前后数据与文案对照一致。Registry、预览源及 Agent 目录均已重新生成并通过一致性检查。

两组件各自通过 Next / Vite 干净安装、生产构建及浏览器验证，共新增 4 个安装实例、16 个安装视图。在资源追加阶段，此前 21 个实例的依赖闭包哈希再次核对一致；累计 25 个安装实例、144 个安装视图，详细证据见验证索引的 `checks.resources` 及逐项安装报告。该阶段未重复执行全量单元测试，上表 2,331 项为首轮记录，追加范围以 46 项相关测试为准。后续色盘顺序修订的验证见下一节，旧安装记录保留为阶段证据。

浏览器检查会临时修改单个 `--chart-N`，验证对应标记一起变化、其他槽位及品牌和状态 Token 不变，再恢复原值。验证读真实安装组件的计算色，不只检查源码字符串。安装证据记录生产构建、页面错误、响应式尺寸及 Registry 依赖闭包哈希。

个人设置的现有账户演示禁用了用量入口，因此本地演示只检查其主题；独立安装夹具通过公共 `defaultView`、`lockedNavigation` 和 `enabledViews` 进入使用情况、模型用量、调用日志，验证热图、圆环、排名和直方图。产品演示的导航策略未改动。

证据入口：

- [本地亮暗与覆盖检查](../../output/playwright/chart-tokens/after.json)
- [文档检查](../../output/playwright/chart-tokens/docs.json)
- [使用统计与设计 lint](../../.zeron/reports/chart-tokens/after.json)
- [最终验证索引与独立安装逐项报告](../../.zeron/reports/chart-tokens/verification.json)
- [资源图表追加范围亮暗与覆盖检查](../../output/playwright/chart-tokens/resources/after.json)
- [资源图表组件与样式统计](../../.zeron/reports/chart-tokens/resource-after.md)

## 组件与样式统计

19 个界面文件沿用现有组件，统计到 262 种已归类组件、1,039 次 JSX 使用。相对基线新增三次文档展示组件使用；设计 lint 前后均为 0 错误、0 警告。

| 组件归类 | 种类 | 使用次数 |
| --- | ---: | ---: |
| Block | 13 | 27 |
| UI | 119 | 652 |
| 内部组件 | 94 | 173 |
| 项目组件 | 13 | 83 |
| 外部组件 | 23 | 104 |

自动组件归类仍有 20 个未识别引用，与修改前一致；完整归类状态为 unchecked，不将其宣称为完整自动通过。Lint、类型、行为、浏览器和安装检查单独记录。

资源追加范围为 2 个界面文件，沿用 9 种共享 UI 组件及 4 种内部组合，合计 13 种组件、13 次 JSX 使用，与修改前一致。归类无未识别引用，设计 lint 覆盖 2/2 个文件，0 错误、0 警告；相对基线未新增诊断。圆环、图例和分段条继续使用现有实现，未新增图表渲染器。报告未启用内联样式及动态类名检查，实际取色由亮暗浏览器及 CSS 覆盖检查补充。

## 色盘顺序修订

按区分度要求，第三、第四槽位交换，默认顺序为主题蓝、青、琥珀、绿、紫；琥珀将青与绿隔开。亮暗色值本身保持不变，普通图表继续按原系列槽位取色。两个资源图表的告警随琥珀改用槽位 3，旧绿系分类输入适配到槽位 4，旧琥珀系适配到槽位 3。

97 项相关测试、类型和修改文件 ESLint 通过。六个业务图表共 24 个亮暗／尺寸视图及十组数据基线对照通过；Chart Tokens 文档的八个视图通过。Foundations 文档、亮暗封面、主题文件、Registry 和 Agent 目录同步生成。四个界面文件的使用统计与基线一致：20 种组件、33 次 JSX 使用，设计 lint 0 错误、0 警告。

本次未重复独立安装，旧安装证据不代表修订后的 Registry 哈希。当前顺序的证据见 [验证记录](../../.zeron/reports/chart-order/verification.json)、[业务图表检查](../../output/playwright/chart-order/after.json) 和 [文档检查](../../output/playwright/chart-order/docs.json)。

## 横向分段条样式统一

按追加要求，横向分段条统一为容器、每个数据段和剩余轨道 `rounded-sm`，可见段间 `gap-0.5`（默认 2px）。共享 SegmentedBar 维护此规则，CreditUsage 与 ResourceMetricList 移除旧圆角覆盖，StorageUsage 自动继承。FileUpload 的单段容量进度同样继承几何样式，仍采用原品牌色。圆环和时间序列保持各自绘制参数。

CostEstimate 的无轴、无悬停费用构成条改用 SegmentedBar distribution，移除该 Block 的 Recharts / Chart 直接安装依赖。金额、计费和比例算法不变，扣除间距后的宽度按实际金额分配；零值、未知和非法段隐藏且不占间距，空数据保留原有反馈。间隙透明，透出当前表面背景。

Foundations 的 Chart Tokens 双语说明、组件指南、预览源、亮暗封面及 Registry 同步更新。8 份相关测试文件、77 项测试通过；补充零值与未知段布局断言后，共同绘制的 38 项测试再次通过。类型检查、修改文件 ESLint、设计 lint、Registry / 预览源 / Agent 目录一致性检查通过。四个业务图表的 16 个亮暗／尺寸视图及六组显示数据基线对照通过；费用估算 Next / Vite 各一份干净安装、生产构建及共 8 个浏览器视图通过。

实际几何检查共 20 个视图通过，覆盖四个业务图表亮暗／窄宽屏、Hobby 零值费用项及中英 Foundations 示例，校验实际圆角、段间距、真实比例和隐藏段不占空间。

圆角随后按追加要求从 xs 调整为 sm（默认 4px），间距保持 gap-0.5（默认 2px）。同一组 20 个几何视图再次通过，当前结果见 [sm 圆角检查](../../output/playwright/chart-segments-sm/geometry.json)；原 chart-segments 报告及独立安装记录对应 xs 阶段。文档、封面、Registry、预览源与 Agent 目录已同步更新并通过一致性检查，本次尺寸微调未重复独立安装。

本轮证据：[样式与数据检查](../../output/playwright/chart-segments/after.json)、[几何检查](../../output/playwright/chart-segments/geometry.json)、[组件统计](../../.zeron/reports/chart-segments/after.json)、[独立安装](../../.zeron/reports/chart-segments/installed/)。旧安装报告作为对应阶段记录保留，不代表当前几何修改后的 Registry 哈希。

## 后续调整

本轮完成的是全局取色契约及当前默认五色。此前提出的低饱和度、明度与相邻色协调方案留到统一换色阶段，在真实亮暗承载面上比较。当前验证不承诺五色在任意背景上满足统一对比度，也不承诺无限数量动态系列只靠颜色就能区分。

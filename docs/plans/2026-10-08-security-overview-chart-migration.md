# security-overview-01 Chart 迁移记录

日期：2026-10-08。状态：已实现，未提交。

## 统计

本次将 `security-overview-01` 的图表迁移到当前组件库的公开入口，并补齐保持原有业务行为所需的可选 API。组件与样式报告覆盖 13 个业务、共享组件和示例源文件，识别 65 种组件、143 次 JSX 使用及 15 种显式 CSS 变量引用。范围内设计检查覆盖 13/13 个文件，0 错误、0 警告；这些数字不代表全仓组件或全部 Token 的统计。

| 验证 | 结果与范围 |
| --- | --- |
| 相关单元与集成测试 | 11 个文件、153 项通过；包括真实图表渲染、堆叠坐标、断点、跨日时区、键盘提示、未知评分和雷达布局 |
| 类型检查 | UI 包、Blocks 包通过 |
| 设计检查 | 全项目 `lint:design` 通过；任务范围报告 0 错误、0 警告 |
| 文档示例 | 38 个指南、40 个 TSX 示例通过 |
| 生产构建 | 通过 |
| 浏览器 | 1440、390、320px × 明暗主题 × 三个视图，18 个案例；共 26 项布局和交互检查通过 |
| 独立安装 | pnpm / Next.js、npm / Vite 的 Registry 安装、类型检查和生产构建通过；未执行独立安装项目的浏览器验证 |

浏览器覆盖原始数值 Tooltip、键盘浏览与 Escape、雷达当前/前期提示、受控时间范围以及扫描中保留上一快照评分、完成后更新评分。验证日志及截图位于 `output/playwright/security-chart-migration/`。

自动报告见 [.zeron/reports/security-chart-migration/after.json](../../.zeron/reports/security-chart-migration/after.json)，人工补充记录见 [.zeron/reports/security-chart-migration/manual-review.json](../../.zeron/reports/security-chart-migration/manual-review.json)。

## 组件

| 业务位置 | 当前组件 | 组合方式 |
| --- | --- | --- |
| 安全评分 | `RingChart`、`Ring`、`RingCenter` | 96px，最大值 100，中心显示快照等级 |
| 风险趋势 | `AreaChart`、`Area`、`Grid`、`XAxis`、`YAxis`、`ChartTooltip` | 四个严重等级按同一 `stackId` 堆叠；线性连接、渐变填充，低风险边线为虚线 |
| 安全态势 | `RadarChart`、`RadarGrid`、`RadarAxis`、`RadarLabels`、`RadarArea` | 当前填充，完整前期数据使用无填充虚线；复用 `TooltipBox`、`TooltipContent` 显示指标值 |
| 风险分布 | `SegmentedBar` | 根据权威计数绘制分布和总量 |
| 图例与数据查看 | `ChartLegend`、`ChartDataTable` | 明确的系列颜色、原始数值、折叠数据表 |

业务源码通过 `@zeron/ui/area-chart`、`radar-chart`、`ring-chart`、`chart-core`、`chart-primitives` 等公开入口使用组件。该 Block 已移除 Recharts 与旧 `@zeron/ui/chart` 的使用。其 Registry 依赖、外部 `@visx/curve@4.0.0` 依赖、组件目录、中英文说明、Agent 指南及生成资源已同步。

雷达图与数据表共同使用一个外层容器，作为响应式网格的第一个子项；指标列表是第二个子项。宽屏左右展示，窄屏顺序展示，避免数据表抢占右列。

## 问题与说明

为保持原有信息含义，新增以下可选 API；原有默认行为和冻结参考基线不变。

| API | 行为 |
| --- | --- |
| `Area.stackId` | 同组、同轴、按声明顺序累加几何位置；正负值分别累加。任何组成员缺失或非有限值时整组保留断点。Tooltip 和数据表保留原始观察值 |
| `XAxis.formatDate` | 按宿主 locale / timeZone 格式化标签，并同步默认日期提示与键盘读屏日期。未设置时保留共享短日期格式 |
| `RadarArea.fillOpacity` | 支持前期无填充虚线；0 在悬停时仍不产生填充 |
| `RadarArea.strokeDasharray` | 支持前期边线虚线 |
| `RadarArea.onPointHover` | 提供指标 key 和指针事件；离开时返回 null，供业务组合公开 Tooltip 组件 |

实现保留以下业务边界：

- 未知或无效评分显示未知状态，不能转换为 0；真实 0 分仍是有效观察值。
- 扫描期间显示上一快照评分，扫描进度不替代安全评分。
- 趋势图按快照的完整时间窗口绘制，保留缺失数据断点及单点标记；数值提示不显示累计值。
- 少于三个或含无效当前评分的态势数据进入空状态；前期指标不完整时不绘制前期多边形。
- 普通评分及当前态势使用 `chart-1`，历史态势使用 `chart-2`；风险等级及告警评分继续使用已有语义颜色变量，避免改变严重程度的含义。
- 扫描、导出、统计范围和业务状态的公开契约未改动。

自动组件来源清单及基线比较状态仍为 `unchecked`：报告无法解析 `motion.circle`、`motion.g`、`motion.path` 三个动态成员，已人工确认来自已有的 `motion/react`；两个新增覆盖文件没有同范围的前置基线，因此不声称自动归因了新增或修复数量。动态样式、内联样式和 Token 语义经过人工复查，显式变量计数不用于计算 Token 合规率。

生产版浏览器发现两条已有的本地 Vercel Analytics / Speed Insights 脚本 404，来源为 `/_vercel/insights/script.js` 和 `/_vercel/speed-insights/script.js`；未发现图表运行或 hydration 错误。该限制不影响 26 项检查结果。

本次保留工作区原有的 Chart、更新日志与其他 Block 修改。具体任务路径由前后文件哈希比较记录在 `output/playwright/security-chart-migration/task-scope.json`；没有暂存、提交或推送。测试环境地址为 `http://127.0.0.1:3907/docs/blocks/security-overview-01`。

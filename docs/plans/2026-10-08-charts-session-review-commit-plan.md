# Chart session 审查与提交计划

日期：2026-10-08。基线：`fadf9639a5eacc91b886b77cdad990cbe2f9f450`，审查分支 `main`。本轮完成代码审查、修复和分发核对；审查完成时尚未暂存、提交或推送。用户随后授权按本计划提交至 GitHub main，执行补充见文末。

## 范围

审查开始时，本 session 有 238 个未提交文件；修复与记录整理后为 246 个文件，其中维护文件 203 个、生成文件 43 个。另有 18 个更早任务的文件保留，其中包括 `docs/components/blocks/BlockPreview.tsx` 和 17 份计划文档；18 个文件的 SHA-256 均未变化，全部排除。完整范围、删除项和提交归属见 [文件清单](./2026-10-08-charts-session-review-task-files.json)。

范围包括 Line、Bar、Pie、Heatmap、LiveLine、Radar、Ring 七类组件，Area 的堆叠与日期格式扩展，Pie/Donut 文档合并，StatusBarChart 配色，全年 Git commit 更新日历，security-overview-01 接入，以及包导出、Registry、双语文档、Agent 指南、封面、生成产物和测试。

本次审查另修复已提交的销售漏斗 block 两处字号 token 用法。该基线问题由全量测试发现，按小范围附带修复纳入 Commit 3。参考项目的 API 基线 JSON 和参考清单保持冻结；新增可选扩展继续由独立契约测试验证。

## 审查结果与修复

| 优先级与问题 | 修复及验证 |
| --- | --- |
| P2：PieChart 把 Fragment 内的 PieCenter 放进 SVG，中心 HTML 无法正确显示。 | 分类前展开 Fragment，中心内容进入 HTML 层。两种 geometryScrubbing 模式的回归用例均验证中心不在 SVG 内；修复前用例失败。 |
| P2：PieSlice 使用 memo 包装，原判断仅接受函数类型，geometryScrubbing 同时绘制合成路径和 PieSlice，扇区重复。 | 识别 memo 组件的 displayName，跳过重复的 PieSlice。回归用例验证两个有效扇区仅有两条可见路径；真实文档 demo 验证五条路径，几何往返切换保持总量。 |
| P2：递归展开 Fragment 后，兄弟片段中的局部 key 可能相同。 | 共享 chartChildren 保留父片段的 key 路径，避免 React 重复 key 警告及更新身份冲突。嵌套片段回归用例验证无 console.error；Area、Line 和其余图表回归通过。 |
| P2：HeatmapChart 更换显示数据后，Tooltip 与键盘索引保留旧日期。 | 显示数据或可交互状态变化时清空检查状态；旧状态不能直接触发选取。回归用例验证旧提示清除、新日期与新 count 可重新检查和选取；修复前失败。 |
| P2：安全评分的旧快照描述仅挂在普通 div 上。 | 包装层增加 group 语义，让完整评分与旧快照说明可被辅助技术读取；内部 Ring 的检查交互保留。更新旧测试的 matchMedia 环境和原 DonutSummary 断言，检查实际 RingChart。 |
| P3：RingCenter 注释的 WebKit 问题编号被颜色扫描识别为十六进制色值。 | 改为不带井号的问题编号表述，未增加检查豁免，也未改变颜色。全量颜色检查通过。 |
| P3：已提交的销售漏斗 block 使用两处 text-4xl，违反语义字号检查。 | 两处改为 text-display。该 token 为 40px / 48px；原固定字号为 36px。单独记录为基线修复，并同步该 block 的 Registry 与预览源码。 |
| P3：security Agent 指南的一处组合清单仍写旧 Chart 名称。 | 对齐 AreaChart、RadarChart、RingChart 的实际实现，重新生成 Agent 产物。 |

复查保留这些业务边界：时间序列绘图排序不修改原始行；Bar 使用非负有限数值，受控时间选择由示例按真实时间戳过滤；Heatmap 使用周列与日期格；LiveLine 的输入时间是 Unix 秒；未知安全评分和不完整雷达维度保持未知。更新日历按访客时区汇总，未来日期和不完整 Git 历史不伪造零提交。

## Commit 计划

建议依次提交四次。文件清单标记每个文件的主要归属；共享锁文件、索引和生成产物按下面规则处理。

### Commit 1 — 组件库与组件文档

`feat(charts): complete native charts and consolidate pie demos`

- 发布七类图表根入口、子组件及公共类型；补齐共享辅助模块、Registry 单一文件归属和真实依赖。
- 纳入 Area.stackId、XAxis.formatDate、RadarArea 的可选交互及描边扩展；这些扩展先于安全概览接入。
- 合并 Donut 文档到 PieChart，保留双语旧地址永久跳转与 Agent 别名。所有 Pie demo 为 180px，圆环使用 2px 间距和 4px 圆角；纹理与动态几何示例采用图表／图例组合。
- 纳入 Bar 受控时间范围示例、移除纵深表面与脉冲 demo，以及 StatusBarChart 的 chartColors/default chart-1 配色。
- 纳入本轮 Pie/Fragment/Heatmap 修复、组件契约和交互测试、组件双语文档、安装说明、Agent 指南、目录与封面。

主要文件：`packages/ui/src/components/charts/`、七个公开根文件、`packages/ui/{package,registry}.json`、组件页面与翻译、组件 Agent 指南、`docs/manifest.ts`、`docs/lib/chart-types.ts`、Donut 路由与删除文件、API 生成脚本、相关测试和冻结参考基线。文件清单列出全部路径。

验收：原始 API 契约、片段与动态几何回归、Bar 受控范围、类型与 lint、组件复制示例、Registry 文件归属、独立消费者安装、双语目录与旧地址跳转。

### Commit 2 — 更新活跃度应用

`feat(updates): add annual commit activity calendar`

- 新增 GitHub 固定 revision 的全年 commit 来源、分页完整性检查与完整本地 Git 历史回退。
- 按访客时区构建全年日历，保留未来日期和空白填充的不同语义。
- 连接 HeatmapChart 的点击和键盘日期选择、当天提交列表、恢复最近提交及分页。
- 窄屏使用日历自身的横向滚动，Tooltip 保持在可见容器内；移除用户指定的可见说明文案。

主要文件：`app/[locale]/updates/`、`docs/lib/commit-activity{,.server}.ts`、`tests/{commit-activity,updates-activity,updates-streaming}.test.*`。依赖 Commit 1 的 HeatmapChart 及 onCellSelect。

验收：跨年与时区、DST、去重、完整／不完整历史、GitHub 分页失败、日期选择与提交条数一致、窄屏日历滚动和键盘选取。

### Commit 3 — 安全概览接入与基线 token 修复

`refactor(blocks): adopt native security charts and semantic typography`

- 安全评分改用 RingChart；扫描保留旧快照，未知分数保持占位。
- 风险趋势改用线性堆叠 AreaChart，Tooltip 与数据表继续展示原始分级数值，日期服从 locale/timeZone。
- 安全态势改用 RadarChart，前期比较使用无填充虚线；图表与数据表属于同一列，旁边为指标列表。
- 更新 block 依赖、目录、双语文档与 Agent 指南；补上评分描述的 group 语义和实际组件测试。
- 销售漏斗仅纳入两处 text-display 基线修复及对应生成产物。

主要文件：`packages/blocks/src/application/security-overview-01/` 的本轮三个修改文件、`packages/blocks/{package,registry}.json`、`packages/blocks/src/catalog.ts`、安全概览文档与指南、`tests/security-overview-charts.test.tsx`、`tests/chart-unification.test.tsx`，以及 `sales-conversion-funnel.tsx` 的两处字号。依赖 Commit 1 的 Area/Radar/Ring 与共享扩展。

验收：旧快照、未知／零分、不完整历史雷达、原始堆叠 Tooltip、扫描完成换快照、受控时间窗口、完整 Registry 安装闭包和语义字号检查。

### Commit 4 — 审查与验收记录

`docs(charts): record implementation review and commit scope`

纳入本 session 的实施记录、集成计划更新、本计划及最终文件清单。历史验收快照保留日期和覆盖范围，最新状态以本计划为准。冻结参考基线属于 Commit 1，避免契约测试缺少输入。`.zeron/reports/`、`output/playwright/` 和临时构建目录保持本地证据，不纳入 Git。

## 共享文件与生成顺序

执行提交时从基线建立隔离 checkout，按清单复制维护源码。每个提交在自己的源码状态重新生成、检查并暂存对应产物；避免把当前工作区含有后续修改的完整生成 diff 提前纳入。

- `pnpm-lock.yaml`：Commit 1 对齐 UI 与根校验依赖，Commit 3 增加 Blocks 的 @visx/curve importer。共享包快照若已在 Commit 1 存在，Commit 3 不重复引入。
- `scripts/test-consumer-installs.mjs`：实际 diff 仅新增七类图表消费者样例，全部纳入 Commit 1。安全概览已有通用消费者样例无需源码修改；Commit 3 使用该样例验证新的 Registry 安装闭包。
- `public/r/registry.json`、`public/llms*.txt` 和 Agent 生成资源：Commit 1 与 Commit 3 分别再生成。组件根 JSON 属于 Commit 1；安全概览、销售漏斗 JSON 属于 Commit 3。
- `docs/lib/block-preview-sources.generated.ts` 与 `public/docs-source/`：Commit 3 从实际 block 源码再生成，并纳入内容哈希变更导致的旧文件删除。
- 文档路由、内容 loader、组件页 loader、指南 loader 与原生图表封面：Commit 1 同步。删除 Donut 文档、翻译和封面要一起纳入。

推荐生成与核对顺序：

```sh
pnpm skills:build
pnpm registry:build
pnpm docs:loaders:build
pnpm docs:routes:build
pnpm docs:sources:build
pnpm agents:guides:build
pnpm docs:charts-api:build
pnpm agents:build
pnpm registry:check
pnpm agents:check
pnpm agents:guides:examples:check
```

每次提交前核对显式清单与暂存 diff；不使用全目录暂存来混入保留文件。隔离状态应重新执行对应测试、类型与设计检查；最后执行整站构建及完整单元测试，再确认四个提交合起来的源码内容与已审工作区一致。

Commit 3 之前的全量语义字号检查仍会遇到已记录的销售漏斗基线问题；先核对对应提交范围，Commit 3 修复后再执行全量检查。该问题不应通过临时豁免或放宽规则绕过。

## 验证结果

- 修复后相关回归：8 个文件、149 项通过；原始 API、双语文档与 token 检查：5 个文件、115 项通过。
- 根类型检查、普通 lint、全量设计 lint、差异空白检查通过。
- Registry、预览源码、路由、文档 loader、指南 loader、API 表与 Agent 产物已再生成。指南示例：38 份指南、40 个 TSX 示例通过；Agent 目录：169 项、67 份指南。
- 整站生产构建通过。随后仅整理安全概览 Agent 指南的一处组件名称，重新生成并检查 Agent 产物；运行时源码与浏览器验证版本一致。
- 最新 Pie/Heatmap：全新 Next/pnpm 与 Vite/npm 四组消费者的安装、独立类型检查和生产构建通过。其余图表及安全概览的消费者证据沿用本 session 已完成的安装验证，见对应实施记录。
- 开发与生产环境分别覆盖 Pie 6 组、Bar 12 组、安全概览 18 组、更新日历 12 组布局／主题／语言组合。Bar 与安全概览分别通过 26 个检查；Pie 间距采样、4px 圆角、180px 尺寸、图例联动及动态几何路径数量通过；日历日期、真实提交条数、恢复／分页、键盘选取及 Tooltip 边界通过。
- 追加生产页面巡检：八类图表（含 Area）× 1440/390px × 浅深色共 32 组，图表尺寸正常、无页面横向溢出或 NaN/Infinity 路径；销售漏斗 1440/390/320px 三组确认两项数值为 40px、无溢出。
- 完整单元测试复跑：287 个文件、2649 项全部通过。并行构建期间曾有一个已有发布 CLI 用例超过默认 5 秒，9 项独立复跑及随后完整复跑均通过；未放宽超时或改变用例。
- 18 个排除文件哈希保持不变，暂存区为空，3907 开发环境保留运行。

开发环境英文更新页仍出现已有 DocsPrimaryNavigation/NavMenu 的 useId 属性水合提示，已保留完整日志；生产环境未复现。生产预览的 console 404 已逐条对应到本地缺少的 `/_vercel/insights/script.js` 和 `/_vercel/speed-insights/script.js`，没有归入图表通过项，也没有忽略其他资源错误。浏览器另提示一份 Next CSS preload 在短时间内未使用，未发现样式缺失；未在本轮调整宿主资源预加载。未执行线上发布验证。

本轮证据位于 `output/playwright/session-review/`，包含修复前失败、修复后回归、检查日志、独立安装、开发／生产浏览器结果、截图和排除文件哈希。

主题验收以真实主题按钮／页面快捷键操作为准，并记录实际 `colorScheme` 与容器背景色。最初直接改 root class 的脚本可能被 ThemeProvider 初始化覆盖，其主题标签不作为最终通过证据；最终结果见 `development-verified/`、`production-verified/` 与 `browser-evidence-final.json`。共 131 组功能／布局检查、104 次实际主题检查通过。开发浏览器检查仍报告前述两条导航水合提示和一条 reduced motion 的 Motion 开发提示，原始日志保留；未把开发环境描述为无诊断问题。

## 组件与样式报告

### 统计

最终报告覆盖 105 个明确源码文件：214 种组件来源／导出组合、696 次 JSX 使用，18 类显式 CSS 变量引用。设计检查覆盖 105/105，0 错误、0 警告。104 个 session 源文件有同范围 before/after 报告；附带的销售漏斗文件另有独立前后报告，不把已有字号问题算作本 session 新增问题。统计不是挂载实例数，也不是 token 合规比例。

### 组件

| 来源 | 种类／JSX 使用 | 主要用途 |
| --- | --- | --- |
| UI 公共组件 | 90／385 | 原生图表根与子组件、ChartLegend、ChartDataTable、Button、Empty、Tooltip、布局与操作组件 |
| Block | 1／1 | 既有安全概览文档集成 |
| 库内部辅助 | 43／50 | 几何、图层、动画与格式辅助 |
| 项目组合 | 55／194 | 文档预览、更新日历和业务图表组合 |
| 第三方 | 25／66 | 指定参考实现中的 Visx、Motion 等 |

参考图形与动画采用指定来源；原有 Recharts 封装不能提供完全相同的几何与交互契约。业务日期聚合、受控范围过滤和快照判断由宿主负责，组件不替宿主生成业务数据。

### 问题与说明

自动 inventory 保持 `unchecked`：38 个动态引用已人工追溯，36 个是直接从 motion/react 导入的 SVG 工厂，2 个是兼容文档测试中旧 chart 导出的 Recharts Tooltip 别名。公开七类新图表页面和安全概览使用当前原生图表入口。没有把人工来源核实伪装成自动检查通过。

完整报告为 `.zeron/reports/session-chart-review/complete.{json,md}`，可比的 session 前后报告为 `before/after.{json,md}`；人工来源说明见同目录 `manual-review.json`。生成文件、二进制封面与删除项通过各自分发／浏览器检查，不计入 JSX 源码统计。

## 提交执行补充

2026-10-08 在 `codex/charts-session-commits` 隔离 checkout 按本计划执行，前三笔提交为：

| Commit | SHA | 独立验证 |
| --- | --- | --- |
| 1：组件库与组件文档 | `90dec2259c6b9000b1c78dd02ef219ce5ec95ee6` | 19 个测试文件、225 项通过；根类型、普通 lint、范围设计检查通过。 |
| 2：更新活跃度 | `5992069a3d4f9d2fb277b3d30033c6f784989ab6` | 3 个测试文件、27 项通过；根类型、范围设计检查通过。 |
| 3：安全概览与 token | `328721a90561c2e7b1e3f111ea65e217411f4845` | 2 个测试文件、45 项通过；根类型、范围设计检查通过。 |

两次 Registry／Agent 产物重建与检查、38 份指南的 40 个示例通过。前三笔合并后的普通 lint、全量设计 lint 和生产构建通过。隔离 checkout 的完整单元测试复跑：287 个文件、2649 项全部通过；第四笔仅增加审查文档与清单。

执行时核实了四项细节：干净基线先生成技能分发文件，文档 loader 先于路由生成；消费者脚本新增部分全部属于 Commit 1；三个 loader 的新文档条目按干净基线重建顺序排列，只有排序差异；暂存检查将新文件纳入后发现 LiveLine 状态辅助文件末尾多一个空行，已清理。运行时行为与本轮审查结果一致。

Commit 4 保存本执行记录及文件清单，随后将主工作区快进到四笔提交，并普通推送 `origin/main`。18 个排除文件保持在主工作区，不纳入提交；临时隔离 checkout 在完成核对后归档。执行日志保存在 `output/playwright/session-review/commit-*.log`。

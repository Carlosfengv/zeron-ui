# AreaChart 审查与提交计划

日期：2026-10-08。审查开始基线：`9c68a6dc176e7b678db5f3da69314213db2a3a64`；制定提交计划时 main 已由另一项任务更新至 `65fc0baeaa7dc2f5acf387a95d77400482c89d95`。本轮只整理、审查、修复并制定计划，没有暂存、创建提交或推送。

范围为尚未提交的 AreaChart、chart-core / chart-motion / chart-brush、图例布局、安装闭包、相关测试与文档。SalesConversionFunnel / FunnelSeries 已由另一项任务提交；保留其现有实现。既有 BlockPreview 工具栏及其他区块整理文档不属于本次提交。

## 1. 审查结论与修复

| 优先级 | 问题及触发条件 | 本轮处理与验证 |
| --- | --- | --- |
| P2 | LTTB 采样从第二个内部分桶开始，漏掉前段峰值，末桶重复最后一点。全有效数据的边界还被误判为缺失值邻居。 | 修正当前桶和下一桶边界，只比较实际存在的相邻点。100 点、8 点预算保留第 5 点峰值、首尾及 8 个不同观测；断点保留规则继续通过。 |
| P2 | 鼠标拖动期间转为 loading，再回到 ready，拖拽标记未清除，后续悬停失效。 | 重置拖拽标记与 Tooltip / 选区暂态。回归测试与两个独立生产消费者均确认加载后悬停恢复。 |
| P2 | 非受控 Brush 在首次提交后跳过原生同步，清除后键盘恢复只有覆盖层；时间域改变后手柄与日期不同步。 | 空选区同步 Visx idle 状态；有效选区按当前尺度同步原生 extent；提交后重新同步。恢复完整窗口并把焦点交给起始手柄，日期在时间域变化后保持。 |
| P2 | 无效 Date 或完全位于时间域外的受控选区回退成完整原生窗口，造成手柄与覆盖层不一致。 | 在生成初始位置前验证日期、像素和交集；无效或无交集时没有选区及手柄，不隐式通知宿主清除或修正值。有效值恢复后仍可操作。 |
| P2 | Y 轴补间进行中改变 enabled、duration 或减少动态效果设置，旧补间被取消，新补间却未继续；loading 状态也可能保留旧骨架域。 | 一个 effect 管理补间生命周期；目标或选项变化从当前域继续，禁用或减少动态效果时立即对齐。5 项针对性测试覆盖设置变化、骨架域更新、settled 回调与卸载停止。 |
| P2 | 改变高度、尺度、曲线或 dataKey 后，虚线几何没有重新计算，面积与尾线错位。 | 将尺度、访问器、曲线和字段加入几何依赖。高度 300→400 的回归测试与两个消费项目确认底线及虚线的 path 一致。 |
| P2 | 图例展开/收起按钮有焦点时，容器变宽使按钮消失，焦点落到页面 Body。 | 将焦点移到图例布局容器；容器仅可程序聚焦，不增加日常 Tab 停靠点。分别覆盖展开和收起状态下的宽度恢复。 |
| P2 | 复合图例的长连续标签或长数值撑破窄容器。 | 内置标签和值允许收缩、换行。真实组件与文档 CSS 的 342px 宿主，scrollWidth 从 1110px 降至 342px。自定义 renderItem / 样式仍由宿主负责其内容边界。 |
| P3 | 减少动态效果下，坐标轴位置 / 透明度、系列标记和高亮弹簧仍执行动画。 | 关闭对应过渡或直接对齐。单测及生产浏览器检查确认轴 transitionDuration 为 0s。 |
| P3 | 普通面积图也测量路径长度；缩放或阶段变化重新格式化全部隐藏原始行；元数据出现无关格式化 diff。 | 按虚线 / pulse 的实际需要启用路径测量，缓存原始数据 JSX，移除无关元数据格式变化。原始行完整性和既有 API 保留。 |

先写失败用例再修复：采样、拖拽、Brush、Y 域生命周期、虚线高度变化与图例焦点均有修复前失败记录。长文本溢出另由真实 CSS 布局测量复现。没有增加检查豁免或修改同期 Sales 源码。

## 2. 保留的用户要求与 API

- 图表尺寸、曲线、渐变、加载阶段、Tooltip 和非颜色 API 以 `/Users/carlos/Downloads/charts` 为来源；颜色使用当前 Zeron 变量。多系列重叠绘制，双轴使用 yAxisId。
- Brush 未选范围默认中性色灰度，blurPx=0、fadeOuterEdges=false；整个轨道有 1px border，清除后仍保留。显式视觉覆盖 API 继续可用。
- ChartLegend 与复合 Legend 由 API 控制 layout="stack" | "inline"、overflow="wrap" | "collapse"、maxVisibleItems、renderOverflowLabel。默认 stack + wrap 保持旧调用；多系列示例固定 inline + collapse，窄屏自动折叠。
- 文档没有逐行/同行或溢出模式设置按钮；更多/收起只控制内容披露。折叠项通过 inert 和 aria-hidden 排除键盘及读屏，悬停下标不改变。
- 四个 Registry 条目共拥有 85 个源文件：area-chart 6、chart-core 69、chart-brush 6、chart-motion 4。共享 motion 只拥有一份文件，Funnel 保留绘制实现并依赖它。
- 不替换既有 Recharts chart / chart-primitives 或业务 Block；缺失参考 ShimmeringText 依赖由私有辅助补齐，未增加新的公开组件入口。

完整实施、API 与参考来源见 [实施记录](./2026-10-07-area-chart-implementation.md)、[参考清单](./2026-10-07-area-chart-reference-manifest.json) 和 [任务范围](./2026-10-07-area-chart-task-files.json)。

## 3. 验证结果与边界

| 检查 | 最新结果 | 本地证据 |
| --- | --- | --- |
| Area、图例、Y 域、Funnel、复制示例及文档契约 | 6 个文件，95 项通过 | `output/playwright/area-chart-review-unit.log` |
| UI 包 / 工作区类型 | 均通过 | `area-chart-review-ui-typecheck.log`、`area-chart-review-typecheck.log` |
| 普通 lint / 全库设计 lint | 均通过；本轮最终实现再次定向检查 | `area-chart-review-full-lint.log`、`area-chart-review-lint.log`、`area-chart-review-design.log` |
| Registry / Agent | 153 项 Registry；166 项 Agent、60 份指南通过 | `area-chart-review-registry-check.log`、`area-chart-review-agents-check.log` |
| Agent 指南代码 | 类型检查通过 | `area-chart-review-guide-examples.log` |
| Next / Vite 独立安装 | 实际 CLI 安装、类型及生产构建通过；五段复制示例、边界 fixture 和 Funnel 同装 | `area-chart-review-consumers.log` |
| 安装源一致性 | 两个消费者的 170 份安装文件对应 85 个源文件；Registry 内容也一致 | `area-chart-review-installed-parity.json` |
| Next / Vite 生产浏览器 | 1280px / 390px、明暗、无默认 blur、清除与键盘恢复、时间域变化、无效受控值、加载后悬停、虚线 resize、图例展开与焦点、减少动态效果均通过；无运行错误或横向溢出 | `area-chart-review-{next,vite}-browser.log`、对应 Brush 截图 |
| 全量单测 | **267 个文件通过、1 个失败；2442 项通过、1 项失败** | `area-chart-review-full-unit.log` |

安装源比较只归一化 TypeScript 格式、注释和已确认的 lib 导入别名，不删减行为代码，不声称文件字节完全相同。独立消费者使用固定本地数据，无远端业务服务。Vite 测试宿主首次访问缺少 favicon 导致 404，已补充该宿主图标后复查通过；未修改图表源码来忽略错误。

全量失败位于 `tests/semantic-tokens.test.mjs:613`，原因是 `packages/blocks/src/application/sales-conversion-funnel-01/sales-conversion-funnel.tsx` 使用 text-4xl。它属于另一项任务，未在本轮放宽规则或修改。不能将当前全库状态描述为全部通过。文档开发站既有导航 hydration 提示沿用原记录；独立生产消费者没有该提示。

上述结果验证当前工作区和实际消费端。本轮未执行整站生产构建，也尚未建立仅含 AreaChart 的隔离候选提交；这两项不能由 Registry 总数或消费者构建推断为已通过。

## 4. 组件与样式覆盖

明确范围为 85 个安装源文件和 1 个文档预览：86/86 设计检查覆盖，识别 89 种组件、171 次 JSX 使用，0 错误、0 警告。审查前后报告的规则与覆盖可比，新增 / 原有 / 消除诊断均为 0；该基线只覆盖本轮 review，不能归因到最初的 AreaChart 迁移。

- 绘制与选择：AreaChart / Area / PatternArea、ChartBrush / ChartBrushLayout、ReferenceArea、SVG 纹理及共享 motion。
- 展示与交互：Grid / XAxis / YAxis、ChartTooltip 及子组件、ChartLegend / Legend 及布局辅助。
- 文档：既有 DocPage、DocSection、ComponentPreview、PropsTable、Button、ChartDataTable；原始数据及阶段操作沿用公开接口。

工具仍将 17 处动态 Motion SVG / BrushComponent 别名来源标记 unchecked。人工已追踪到 motion/react 和 @visx/brush，保留工具原状态。未启用的内联 style、动态类名、restyle、任意样式值规则仍未检查；SVG 几何和参考 API 的动态 style 经人工与浏览器核对。没有新增颜色 Token 或 lint 豁免。参考目录缺少原项目主题和 ShimmeringText 实现，其字体 / 阴影主题解析及精确动画时序仍无法逐像素确认。

完整统计为 `.zeron/reports/area-chart-review/{before,after}.{md,json}`，人工来源及边界说明为同目录 `manual-review.json`。这些本地报告不纳入 Git。

## 5. 建议提交

建议 **1 个完整、可安装的 feature commit**：

```text
feat(area-chart): add reference chart with brush and configurable legends

Add reference area rendering with shared axes, tooltip, patterns and motion.
Support neutral brush ranges, a full track border and API-controlled legends.
Fix sampling, interrupted dragging, brush synchronization and animation lifecycle.
Ship registry ownership, bilingual demos, agent guides and regression coverage.
```

提交内容按四组检查，但在一个提交内交付：

1. **实现与安装闭包**：四个入口、85 个源文件，UI exports / Visx 与 D3 依赖 / 锁文件，四个 Registry 条目与 Funnel motion 所有权调整。
2. **文档与发现入口**：五个复制示例、七张预览图、双语 API / 描述、明暗封面、四份 Agent 指南及对应元数据。
3. **验证**：Area / 图例 / Y 域回归，文档示例、Funnel 安装闭包预期和 Next / Vite 消费示例。
4. **记录**：集成方案更新、实施记录、参考与任务清单、本审查计划及提交文件快照。

核心、导出、Registry、Agent 与文档相互引用。当前 AreaChart 尚未在 main 发布，单独提交修复或先提交文档会产生不完整的安装 / 发现状态，因此不拆分成多个过渡提交。

## 6. 暂存与生成步骤

配套 [提交文件清单](./2026-10-08-area-chart-commit-files.json) 区分完整文件、共享源码区段和必须重新生成的资源，并记录源文件 SHA-256。它是候选范围，不能直接执行 git add 全清单。

1. 执行时重新读取 HEAD、origin/main 与 index；本轮没有修改 index。若基线继续变化，重新计算相对新 HEAD 的候选文件及快照，不覆盖别人已暂存的内容。源文件 hash 变化时先审查差异。
2. 从执行时 main 的确定提交建立隔离候选树，加入完整文件。保留该基线已提交的 SalesConversionFunnel / FunnelSeries，不复制或撤销其工作区 diff；BlockPreview 工具栏与旧区块计划不加入。
3. 共享源码只选择 Area 的语义改动：manifest 的 area-chart 项、双语 Area 描述；四个 Agent 项和指南路由；Area 身份由 reference 改为 component，并新增 core / brush / motion 身份；Funnel 指南只修改共享 motion 依赖句；消费者只增加两份 Area 示例；i18n 测试只改 Area Registry 预期。不加入纯格式化改动。
4. 在候选树执行 `pnpm registry:build`、`pnpm agents:guides:build`、`pnpm agents:build`。四个新 public/r 条目、Funnel 条目、Registry 索引、Agent guide loader 与 llms 必须来自候选源码重新生成，不能直接复制混合工作区产物。
5. Funnel 的两个源码文件由当前 main 保留；其生成条目只将共享动画文件移交 chart-motion 并添加依赖，原有 series 扩展保留。四个新条目文件所有权不重叠，Funnel 单独安装不引入 Visx。
6. 在候选树重新运行相关 95 项、类型、普通 / design lint、Registry / Agent / 指南例子检查及 Next / Vite 安装。执行全量测试并明确记录结果；Sales 字号失败未修复时保留失败事实，不把它算成 Area 的通过证据。需要站点发布时另补整站构建与部署验证。
7. 核对最终 staged diff 只含计划内容、无生成漂移、无输出缓存及无其他任务删除；再创建上述一个提交。本请求没有授权执行本步骤中的 commit / push，本轮到计划交付为止。

排除：SalesConversionFunnel / FunnelSeries 的已提交改动与记录、既有 BlockPreview 工具栏改动、旧区块计划、临时消费者、output、.zeron、.playwright-cli、缓存及部署资源。不要使用 `git add .`。

## 7. 授权后的提交执行验证

2026-10-08，用户随后授权“提交到github main”。以本地和 origin/main 一致的 `65fc0baeaa7dc2f5acf387a95d77400482c89d95` 为基线，在隔离 checkout 按清单组装 125 个候选文件：107 个完整文件、9 份共享源码的 Area 改动、9 份重新生成资源。生成前没有复制混合工作区产物；生成后的 9 份资源均与审查版本一致。原工作区 143 个已有改动文件在验证期间字节未变。

- 隔离状态下相关 6 个文件 / 95 项测试通过。UI 与工作区类型、普通 lint、全库 design lint、Registry 153 项、Agent 166 项 / 60 指南、31 份指南 / 33 个 TSX 示例检查通过。
- 全量单测重新执行：267 个文件 / 2442 项通过，1 个文件 / 1 项失败。唯一失败仍为 SalesConversionFunnel 的 text-4xl 语义字号检查；没有新增失败或检查豁免。
- 新建 Next/npm 与 Vite/npm 消费项目分别安装 AreaChart 与 FunnelChart，四份类型及生产构建全部通过。新 Area 安装闭包的 79 个源文件对应 158 份安装文件，实现与候选源码 / Registry 一致；Brush 的 85 / 170 份组合安装及交互证据沿用此前 review 的相同源码状态。
- 整站 `pnpm build` 通过，路由、预览源码和指南加载映射检查通过；没有保留 tsconfig 变更。
- 隔离生产文档页显示 7 张图。1440px 三个图例完整同行，390px 展开显示全部项目；宽度恢复保留焦点。键盘 End 播报 Oct 7 / requests 340，加载转 ready、选区灰度无 blur、清除保留 border、Enter 恢复原生窗口与起始手柄焦点、暗色窄屏无横向溢出均通过。29 个 SVG ID 无重复；未观察到图表或导航运行错误 / hydration 提示。
- 本地 Next 宿主未提供 Vercel analytics / speed-insights 注入脚本，两项请求返回 404，作为环境问题保留完整记录；不声称所有网络请求通过，也没有修改统计脚本。

最终范围保留基线中 FunnelSeries / SalesConversionFunnel 的实现，并排除 BlockPreview 工具栏和其他区块计划。验证证据位于本地 `output/zeron/area-chart-commit/`，不纳入提交。按上述一个 feature commit 提交并推送 GitHub main；具体提交 SHA 由 Git 历史和推送结果记录。

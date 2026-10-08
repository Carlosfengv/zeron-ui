# 阶段二实施与验收记录：图表及用量可视化

日期：2026-10-05\
状态：实现与定向自动验证完成，待人工验收；尚未发布。全仓库测试存在下文列明的失败，不能据此宣称全仓库 CI 通过。

对应方案：[统一实施及阶段验收方案](./2026-10-05-block-page-unification-plan.md)。

## 1 本阶段交付

公共能力分成两个安装入口，避免简单分段条和状态组件携带图表引擎。

| 入口 | 交付能力 | 边界 |
| --- | --- | --- |
| `@zeron/ui/chart` | 现有 ChartContainer / Tooltip，新增 TimeSeriesChart、DonutSummary、chartTrendPreset | 继续使用 Recharts；业务汇总、请求和缓存由消费者负责 |
| `@zeron/ui/chart-primitives` | ChartLegend、SegmentedBar、ChartDataTable、稳定系列颜色、状态色及数字/时间格式工具 | 不依赖 Recharts；容量与分类分布通过明确的 mode 区分 |

实际采用：

| 消费者 | 已采用能力 | 保留的业务行为 |
| --- | --- | --- |
| AI Gateway Overview | 请求趋势、费用圆环、提供商图例、其他专用图的数据表及共享样式 | 时间范围、刷新/重试、提供商和明细回调；费用继续以 micros 输入 |
| Project Monitor | 请求趋势、服务分布与资源用量圆环、图例 | 概览/存储/报告切换；请求仍由同一组服务分桶汇总 |
| Resource Status All | 响应式圆环、公共图例、独立语义状态色 | 已知状态覆盖率、未知资源数和总数分别计算 |
| Resource Metric List | 分类分段条、语义状态色 | 原有资源计数、图标与数据输入；窄容器下允许行内换行 |
| Storage Usage | 容量分段条、分类图例 | 总容量、剩余容量、百分比、格式化与整卡操作 |
| Credit Usage | 容量分段条、长名称换行 | 周期切换、自动切换、限额和升级回调；模型标识和用量明细保留 |
| Security Overview | 评分圆环、趋势预设/图例、雷达数据表和共享分类色 | 安全快照与扫描生命周期保持独立 |

Cluster Environment Detail 通过资源总览和资源指标列表继承本阶段修改，因此需要整页回归。

## 2 实现规则与迁移结论

- 分类默认色由稳定系列 ID 决定。重排、筛选后恢复和刷新不会重新按位置配色；显式业务分类色仍有效。有限调色板可能重复，分类名称与数值保持可读。
- 健康状态提供独立的 success / warning / danger / info / neutral 语义色。按验收反馈，Resource Status All 的正常状态、Resource Metric List 的正常分段和 Security Overview 的正常评分圆环使用主题蓝色 `fg-brand`，图例同步；告警、严重及未知保持原语义色。P50/P95/P99 使用相同的分类颜色映射，不将分位数当作健康状态。
- Gateway 和 Project Monitor 请求趋势共享轴、网格、边距、Tooltip 和线型。保留 null 断点，关闭非必要绘图动画；单点显示标记，全零显示真实零，空数组显示无数据。
- locale 与 timeZone 显式传入；时间窗口变化对应实际数据变化。非法时间点不进入坐标轴，但保留其数值在数据表中，并显示时间无效提示。
- 金额 micros/minor-unit 的换算由业务负责。比例格式化接受 0.15 → 15%；null、NaN 和 Infinity 保持未知，不被格式化成零。
- 圆环接收业务总数，未分配部分保持中性轨道。Gateway 使用费用摘要总数，未归属费用有明确说明；分类费用大于摘要总数时提示核对统计范围。
- 容量条显示真实超额数字，图形按 max(总容量, 已使用量) 缩放；分布条显式保留未覆盖部分。不对独立系列分别归一化。
- 图例默认静态；有 onSelect 时只触发宿主的明确操作，不增加隐式显隐状态。名称可换行，保留完整可访问内容。
- 趋势和 Gateway 专用图提供可展开的数据表；圆环/分段条提供可读图例或完整说明；雷达提供数据表。取值不依赖鼠标悬浮。
- 图表内的方向键由图表处理，不再触发文档站的上一页/下一页快捷键；Tab 和其他宿主按键保持原有处理。
- Resource Status All 的圆环随容器缩小；保留适合其设计的最大环尺寸，而非把所有圆环强制设成同一大小。
- 安全评分圆环始终表达快照评分。扫描进度单独显示；扫描成功但新快照未到达时，仍显示旧快照提示。

保留专用实现的场景：

| 场景 | 结论 |
| --- | --- |
| Gateway 成本、Token、错误率和指标序列 | 保留专用坐标/单位及数据口径，采用共同网格、Tooltip 和数据入口 |
| Gateway 延迟直方图、Project Monitor 分位数比较 | 保留不同模型；只统一适用颜色、格式和可读数值 |
| Security 趋势和雷达 | 趋势保留堆叠严重性及空缺语义；雷达保留专用绘制，不新增通用雷达 API |
| MetricCard 小图 | 保留轻量实现与最低有效点数契约 |
| TimeRangeHistogram | 保留选择、拖拽和键盘引擎，不迁入请求趋势组件 |
| 其他 Block / Page 的独立图 | 本阶段先固定经过多个真实消费者验证的能力；全量组合验收按后续阶段推进 |

## 3 人工验收页面

本地预览使用端口 3007。建议先检查两页公共能力，再检查七个区块和一页完整组合。

| 页面 | 验收路径 | 操作和预期 |
| --- | --- | --- |
| Chart | [打开](http://localhost:3007/zh-CN/docs/components/chart) | 切换正常、空数组、全零、单点、中间缺失、部分来源缺失；单点有标记，缺失留断点，未知占比显示 —。切换时区及多日窗口，实际时间变化；重排分类，颜色不变。用键盘打开“查看数据”并检查方向键不会跳页 |
| Chart Primitives | [打开](http://localhost:3007/zh-CN/docs/components/chart-primitives) | 切换超出容量，显示 166 / 100 GB 和 166%，图形保持在容器内；分类重排颜色不变；下方分布条保留 20 未覆盖量 |
| AI Gateway Overview | [打开](http://localhost:3007/zh-CN/block-demo/ai-gateway-overview-01) | 切换 1d/7d/30d/90d，观察数据与时间标签一同变化；展开数据表核对请求、费用、Token、毫秒及错误率。检查费用圆环与提供商图例、长名称、刷新后旧数据和移动端导航 |
| Project Monitor | [打开](http://localhost:3007/zh-CN/block-demo/project-monitor-01) | 进入“报告”，切换统计窗口并展开请求数据。总请求数、趋势和服务图例一致；检查 P50/P95/P99 的真实值。进入“存储”，检查容量与剩余量；保留阶段一的刷新和错误演示 |
| Resource Status All | [打开](http://localhost:3007/zh-CN/block-demo/resource-status-all-01) | 正常、告警、严重、未知的图形与图例同色；未知不计入默认可判断覆盖率。缩小窗口，圆环、总数和覆盖率不被挤坏 |
| Resource Metric List | [打开](http://localhost:3007/zh-CN/block-demo/resource-metric-list-01) | 核对每行总数和状态分布。窄屏可换行；未覆盖量保持中性，不变成“正常” |
| Storage Usage | [打开](http://localhost:3007/zh-CN/block-demo/storage-usage-01) | 示例仍为 18.8 / 20 GB、94%、剩余 1.2 GB；分类名称和值完整可读；条形与这些数字一致 |
| Credit Usage | [打开](http://localhost:3007/zh-CN/block-demo/credit-usage-01) | 切换周期，数值与模型分段同步；长模型名可换行；自动切换、限额和升级入口仍可操作，数值不因图形缩放被改变 |
| Security Overview | [打开](http://localhost:3007/zh-CN/block-demo/security-overview-01) | 检查评分圆环、趋势和“态势”雷达数据；扫描中和等待新快照时保留旧评分说明。不要把扫描完成误判成新快照已经到达 |
| Cluster Environment Detail | [打开](http://localhost:3007/zh-CN/block-demo/cluster-environment-detail-01) | 在完整页面中检查资源圆环、覆盖率和六行资源分布；侧栏与窄屏布局不会挤坏这些组件 |

每页共用检查：

- [ ] 浅色、深色下，文字、轨道、系列和图例可辨认。
- [ ] 桌面、平板、手机宽度下没有页面横向溢出、图例截断或圆环变形。
- [ ] 长名称完整可读；Tooltip 在实际页面容器中未被裁剪。
- [ ] 用 Tab / Enter 可以取得图中数据；方向键操作图表时不触发文档翻页。
- [ ] 减少动态效果模式中，仍能完成所有操作和读取数值。
- [ ] 原有时间范围、刷新、标签切换和业务入口保持可用。

页面使用示例数据。生产数据来源与后端回调集成由宿主负责，人工验收不代表生产后端已接入。

## 4 自动验证证据

| 项目 | 结果与范围 |
| --- | --- |
| 定向测试 | 15 个文件、108 项通过，包含新共享数据契约、七个消费者、阶段一状态回归、文档语言与封面；兼容数字及中文系列键、显式图表 ID |
| 类型与样式 | TypeScript、受影响源文件 ESLint、全项目 design lint 通过；静态样式检查 0 错误 / 0 警告 |
| 站点构建 | 生产构建通过，新增两个组件文档路由可生成 |
| Registry | 143 项检查通过；公共导出、源码依赖与生成内容已同步。该数量包含工作区其他已登记内容，不是本阶段组件数量 |
| 文档和 Agent | 路由、加载器、预览源码、Guide 加载器和目录生成检查通过；17 个 Guide 示例编译通过 |
| 独立安装 | pnpm / Next：chart、chart-primitives 和七个消费者；Vite：chart、chart-primitives，共 11 个组合通过安装和编译。新增能力、Gateway、Project Monitor、Storage、Security 有对应实际构建示例；资源状态、资源指标和 Credit 的该安装矩阵验证安装/类型，其显示另有本地浏览器和行为测试 |
| 后续安装复核 | Next 的 chart、Gateway 及 Vite 的 chart 再次安装/构建通过；记录分开保存，不重复计入 11 个不同组合 |
| 页面浏览器 | 七个区块 × 两个主题 × 三个宽度，共 42 个组合；集群环境详情另有 6 个组合。未发现横向溢出、NaN/Infinity 图形或页面运行异常 |
| 数据边界浏览器 | 六种图表输入 × 两个主题，共 12 个组合；确认单点一个标记，缺失曲线两个断点路径，零值真实保留；时区/窗口变化和颜色重排验证通过 |
| 容量边界浏览器 | 分段条页面两个主题、三个宽度共 6 个组合，真实超额值保留且图形无溢出 |
| 嵌入和尺寸更新 | 资源卡宽度 200/240/320/480/700px 验证通过；Gateway 移动端导航开关、窗口缩放及恢复宽度后图形尺寸正常更新，费用圆环保持方形 |
| 键盘和 Tooltip | 390px 页面中键盘激活 Tooltip，数据可读、未触发文档跳页、未被页面祖先容器或视口裁剪；数据表可通过 Enter 打开 |
| 按需依赖 | 依赖闭包断言：chart-primitives / StatusIndicator / ErrorState 不包含 Recharts；Chart 包含 Recharts |

证据目录：`.zeron/reports/stage-two/`。浏览器结果有对应 JSON；截图位于 `output/playwright/stage-two/`。

### 全仓库测试的限制

完整测试尝试没有通过。Node 23 运行首先遇到要求 Node 22 的发布工具检查；改用本机 Node 22 后，记录为 2072 项通过、6 项失败、31 项跳过，并有失败套件。失败包括：

1. 发布候选 / Skill 源冻结校验受到工作区输入变化影响，不能作为发布通过证据。
2. Registry 发布候选发现 Slider → Tooltip 的依赖闭包问题，涉及 Slider 和 Infinite Log Table。
3. 预览源码检查在输入变化期间发现过期资产；随后已重新生成，最终源检查通过。
4. 两个发布 / 示例测试超时。
5. `cn` 的 text-display 与语义文字色合并测试失败；本阶段没有修改该工具。

这些结果保留在 `unit-all.log` 和 `unit-node22.log`。最终定向测试、生成内容、安装矩阵和构建分别验证通过，但不能替代发布流程或全仓库 CI。后续发布前需在稳定输入下使用 Node 22 串行复核并解决对应问题。

## 5 组件与样式使用报告

统计范围为本阶段的 12 个 TSX 文件，涵盖公共图表、七个消费者涉及的图表实现和两页组件文档；识别 111 种组件、267 次 JSX 使用，其中 Zeron UI 为 52 种、145 次使用。类型、Registry 与其他工作区文件不计入 JSX 统计。静态样式检查覆盖 12/12 文件，0 错误 / 0 警告。数量不等于 Registry 条目数，细节见 [完整报告](../../.zeron/reports/stage-two/after.md) 和 [JSON 明细](../../.zeron/reports/stage-two/after.json)。

| 分组 | 主要组件与采用原因 |
| --- | --- |
| 公共图表 | TimeSeriesChart、DonutSummary、ChartContainer、ChartTooltip / Content：统一绘制和提示，保留专用业务图的口径 |
| 无引擎可视化 | ChartLegend、SegmentedBar、ChartDataTable：共用图例、分母规则和可访问数据入口 |
| 现有业务及布局 | MetricCard、Card、Container、PageLayout、Tabs、Sidebar、DetailList、StorageUsage 等：保留原有页面结构和操作 |
| 第三方绘制 | Recharts 的 Area/Bar/Line/Pie/Radar：保留适合各数据模型的绘制器 |

人工说明：自动来源分析有 10 处 ChartTooltip 待确认，它们均通过公共 Chart 导出别名指向 Recharts Tooltip，已核对源码与实际消费者。不能把这个分析限制说成自动来源确认通过。

前置报告覆盖 9 个文件，最终增加 3 个文件；报告因此不自动归因前后变化。动态颜色、比例尺寸、CSS 变量含义和必要的业务组合经过人工核对，浏览器验证承担布局与交互证明；静态工具未检查的动态样式不被改写为“全部检查通过”。

开发预览通过可选 NEXT_DEV_DIST_DIR 使用独立缓存，3007 的预览与已有开发服务不再共用构建目录。默认开发目录仍为原配置。

## 6 阶段退出判断

本阶段的多个真实消费者采用、适用数据边界、主题、响应式、键盘等价数据和按需依赖已有定向证据。人工验收使用第 3 节清单，完成后再推进阶段三的完整页面组合验收。全仓库发布问题保持独立追踪，本次没有发布或提交合并操作。

# 状态组件收敛

日期：2026-10-06

后续调整：状态 Badge 的边框采用 28% 不透明度（alpha 0.28）；dot 图标替换、未知图表总量及最终证据边界见 [最终 Review 与 Commit 计划](./2026-10-06-block-page-unification-review-commit-plan.md)。本文件的数量是组件收敛时的快照。

## 最终组件边界

| 场景 | 实现 | 验收重点 |
| --- | --- | --- |
| 首次请求失败、独立区域提示 | Alert + AlertTitle / AlertDescription / AlertAction | 失败区别于 Empty；宿主重试、防重复操作、窄屏按钮换行 |
| 短状态、状态点、独立图标 | Badge variant="plain" + status；leadingIcon 替换圆点 | 无背景、边框、水平内边距；保留其他 Badge 变体；图标和圆点为装饰 |
| 刷新活动、过期、长文案、保留快照的刷新失败 | InlineNotice + InlineNoticeContent / InlineNoticeAction | 长文案换行、减少动态效果、保留快照、单一播报归属 |

ErrorState、StatusIndicator 源码、包导出、Registry 条目、组件目录及独立文档已删除。原有分类色和 Badge solid / dot / strong 保留。FileManager 的 renderErrorState 是宿主自定义渲染回调，保留接口兼容；它不是公开组件。

## 实现范围

迁移 15 个业务 Block：AI Gateway Overview、AI Gateway Session List、Agent Trace、Cluster Environment List、Deployment Detail、File Manager、File Upload、Infinite Log Table（两种视图）、Integration Monitors、Monitoring Alert List、Project Monitor、Security Overview、Support Analytics、Transaction Details，以及 User Account。同步 FileManager / IntegrationMonitors 演示、Badge / Alert / InlineNotice 中英文文档、Agent 指南和安装验证。

静态首次错误显式使用 role="group"；新发生的错误保留原有 alert 播报条件。Badge 默认不创建 live region。活动图标由调用方组合并保留 motion-reduce:animate-none，不新增活动状态包装组件。页面/面板占位空间由业务布局拥有。

## 验收入口

- /zh-CN/docs/components/badge：plain 五种语义色、独立圆点、图标替换、原有变体。
- /zh-CN/docs/components/alert：请求失败示例，点击重新加载检查等待与恢复，重置后可再次执行。
- /zh-CN/docs/components/inline-notice：活动与长文案示例，减少动态效果时停止动画。
- /zh-CN/block-demo/cluster-environment-list-01、/zh-CN/block-demo/monitoring-alert-list-01：短状态；设置中切换首次失败、过期、刷新和下次刷新失败，检查重试与旧数据保留。
- /zh-CN/block-demo/project-monitor-01、/zh-CN/block-demo/ai-gateway-overview-01：刷新状态与局部失败不丢失图表，首次失败直接使用 Alert。
- /zh-CN/block-demo/integration-monitors-01：分类页签独立状态点、检查详情长文案、重试。
- /zh-CN/block-demo/deployment-detail-01、/zh-CN/block-demo/agent-trace-01：独立状态图标、运行中动画、无障碍名称。
- /zh-CN/block-demo/file-manager-01、/zh-CN/block-demo/file-upload-01：加载与错误提示、完成/失败短标签。

跨页面检查深浅主题、窄容器、长文案、键盘操作；悬浮设置按钮继续使用 Neutral、32px、16px 边距。

## 验证记录

本次证据保存于 .zeron/reports/feedback-consolidation/。此前阶段六的全部安装/浏览器证据保留为历史快照，不作为新组件 API 的验证结果。



| 检查 | 本次结果 |
| --- | --- |
| 单元测试 | 259 个文件、2,262 项全部通过 |
| 真实浏览器控件测试 | 1 个文件、7 项全部通过 |
| 类型与构建 | UI / Blocks 独立类型检查、根项目类型检查和生产构建通过 |
| 静态检查 | 普通 lint、完整设计 lint、差异空白检查通过 |
| Registry / 文档 | 146 个 Registry 条目、120 个文档加载器、116 个独立路由、46 个预览源码检查通过 |
| Agent 指南 | 52 份指南；可运行示例检查覆盖 26 份指南、27 个 TSX 示例，通过 |
| 独立安装 | Badge / Alert / InlineNotice × Next.js / Vite，pnpm，6/6 通过；36 个深浅主题和宽度视图，无运行时异常 |
| 生产浏览器 | Alert 重试/恢复/重置；集群首次失败/重试/刷新失败保留 18 个轻量状态/过期并刷新；减少动态效果停止动画 |
| 悬浮演示设置 | 实测 32×32px，右侧 16px；保留 Neutral 与拖拽吸附实现 |

完整测试暴露了预览源码加载测试会复用编辑器模块缓存的问题。仅在该测试中重置模块缓存，确保延迟加载 mock 在完整测试与单独运行时一致；未改变预览的产品行为。

组件与样式报告覆盖 23 个实际改动文件：UI 117 种/819 次、Block 33 种/45 次；包含导出的子部件，不能换算为 Registry 条目数。完整设计 lint 通过，0 错误/警告。报告工具仍将 14 处动态图标/公开再导出标为未解析；人工追踪到图标映射、宿主 action.icon 和 DropdownTrigger。库存自动判定与基线归因继续保留 unchecked：3 个最终覆盖文件不在初始基线中。没有以此计算合规百分比。

生产站点本地运行时，Vercel 统计脚本的两条 404 属于托管统计服务；已区分资源请求与页面异常。所检查页面没有 React 运行时/水合错误。阶段六之前的证据不计入本次验证；没有重新运行完整 192 项安装矩阵。

# 阶段一：状态表达与反馈实施记录

日期：2026-10-05\
状态：实现与自动验收通过，供用户进行页面验收；尚未公开发布。\
源码基线：`c84d317369113891b6d2413266915d82906507e4`。

本阶段对应 [统一实施方案](./2026-10-05-block-page-unification-plan.md) 第 4 节。只迁移四个状态试点；图表底座、工作区外壳与全量迁移继续按后续阶段推进。

## 1 已实现的能力

| 能力 | 实现与使用边界 |
| --- | --- |
| StatusIndicator | 圆点或图标 + 可读文案；五种语义色、两种字号、可选活动动画。遵从减少动态效果。领域枚举仍属于 Block，静态标记不自动宣告。 |
| ErrorState | 基于现有 Alert 组合确认失败、说明和宿主操作；支持 page/section/inline。默认安静，新事件可显式 announce。确认空结果继续使用 Empty。 |
| 旧数据与刷新 | 复用 InlineNotice + StatusIndicator。新鲜度和请求进度可同时表达，刷新不会自动清空现有数据。 |
| 操作等待 | Gateway 与 Project Monitor 的刷新、重试等待回调返回的 Promise；用按钮反馈与同步保护防止重复调用；拒绝后显示错误，可以继续重试。 |
| 独立安装 | 新原语增加包导出与 Registry；四个 Block 补齐依赖。新增中英文文档、Agent 指南及可检索元数据。 |

未新增通用状态边界或全局状态管理。组件不替宿主请求网络、更新业务数据或推断业务成功。

## 2 四个试点的变化

| 试点 | 实际变化 | 保留的行为 |
| --- | --- | --- |
| 集群环境 | 指标采用 StatusIndicator；正常统一为 success。数据过期独立提示，保留原健康结论；新增确认空数据与筛选无结果及清空筛选。 | 筛选、搜索、组织切换、导航及查看详情回调。 |
| 监控告警 | 等级筛选采用 StatusIndicator；已处置使用 success，但原 P0/P1/P2 等级保持。新增确认空数据与筛选无结果及清空筛选。 | 原始处置/静音/AI 回调及 payload、处置记录、分页。 |
| Gateway Overview | 首次失败采用 ErrorState；首次 loading 或 refreshing 无快照显示骨架；后台刷新保留指标和图表；带快照的失败有旧数据提示和重试；stale 可与 refreshing 并存。 | 受控 range 与回调、业务数据、单位、时区及图表实现。 |
| Project Monitor | 首次失败采用 ErrorState 并保留 tabpanel 关联；新增独立 refreshing、onRefresh；retainDataOnError 控制刷新失败时保留快照。 | 原 error 默认隐藏指标，保持兼容；受控/非受控 tab、range，复制、自定义及图表口径。 |

现有 onRetry/onRefresh 的 void 回调类型保持兼容，异步函数同样可传入。组件只等待实际返回的 Promise，成功后仍由宿主更新 data/state。组件自己捕获到的新操作失败只创建一处 alert；静态演示与列表状态保持安静。

保留例外：strong Badge 继续使用原有分类色映射，未增加 strong/status 支持或通过类型断言绕过限制。集群的严重/告警/离线以及监控 P0/P1/P2 的强调级别保持；最终收敛按原方案阶段五处理。

## 3 需要人工验收的页面

验收服务：`http://localhost:3007`。以下路径可以在本地站点访问。四个业务试点为本阶段必验，两页原语文档用于确认公共样式与交互。

| 页面 | 路径 | 验收重点 |
| --- | --- | --- |
| 集群环境列表 | `/zh-CN/block-demo/cluster-environment-list-01` | 正常、严重、告警、离线、过期可区分；过期环境仍保留健康结论。切换状态筛选、输入不存在的名称，再点“清空筛选”恢复列表。 |
| 监控告警列表 | `/zh-CN/block-demo/monitoring-alert-list-01` | P0/P1/P2 颜色与筛选一致；已处置保留原告警等级。检查处置记录、筛选无结果、清空筛选和分页。 |
| Gateway Overview | `/zh-CN/block-demo/ai-gateway-overview-01` | 打开“演示数据设置”图标菜单，遍历八种状态。首次失败与确认无数据不同；刷新失败保留图表，过期与刷新同时展示；点击重试可恢复。 |
| Project Monitor | `/zh-CN/block-demo/project-monitor-01` | 打开“演示数据设置”图标菜单，遍历八种状态。检查首次失败、旧数据、刷新与重试；切换概览/存储/报告及时间窗口，复制、自定义继续可用。 |
| StatusIndicator | `/zh-CN/docs/components/status-indicator` | 五种语义、活动图标、长文案、小字号；减少动态效果时停止旋转但保留文案。 |
| ErrorState | `/zh-CN/docs/components/error-state` | 错误标题、解释、重试布局；点击重试显示等待，再显示恢复；可重新展示失败。 |

两个数据演示的八种状态：正常、首次加载、首次失败、后台刷新、刷新失败保留旧数据、数据过期、数据过期并刷新、确认无数据。

每页切换浅色/深色，检查 390、768、1440 宽度。表格允许自身横向滚动，页面外层不应横向溢出。用 Tab/Enter 检查清空筛选与重试，用键盘检查标签与时间范围。

这些页面明确使用示例数据；刷新和重试是演示宿主回调，不代表已经接入真实监控服务。

## 4 自动检查和证据

- 定向测试：54 项通过，覆盖原语、四个试点、原有 Project Monitor 交互、Gateway 安装契约、空态与文档/i18n。
- 补充契约：42 项通过，覆盖 Agent 目录、StatusOverview、DataTable 空态与 Gateway 数据口径。
- 类型检查、全库设计检查、改动文件常规 lint：通过。
- Registry 检查：139 个条目通过；Agent 目录 147 个条目、35 份指南；15 份指南示例类型检查通过。
- 文档路由、预览源码、指南与 token 一致性检查：通过。
- 公共原语的实际文案对比度检查均高于 4.5:1，最低为深色 ErrorState 的 5.21:1。
- 四个试点均检查 390/768/1440、浅色/深色。两个数据页面分别遍历八种状态；两个列表页面检查筛选、清空与领域状态；保留代表截图。
- Next 独立消费者：六个目标分别通过 npm、pnpm 安装与编译。新原语及数据 Block 有实际构建示例。
- Vite 独立消费者：两个新原语、Project Monitor 和 Gateway 分别安装、类型检查及构建通过。
- 新原语独立消费者的运行时 CSS、主题与 320/480/800 尺寸复验：通过。两个原语分别在 Next 与 Vite 检查六种尺寸/主题组合，总计 24 组，浏览器运行错误为空。
- 站点生产构建：最终源码构建通过；包含编译、lint、类型检查与静态页面生成。

可重复运行的独立运行时入口：

```sh
ZERON_CONSUMER_COMPONENTS=status-indicator,error-state \
ZERON_VITE_CONSUMER_COMPONENTS=status-indicator,error-state \
ZERON_CONSUMER_PACKAGE_MANAGERS=pnpm \
ZERON_CONSUMER_FEEDBACK=1 pnpm test:consumer:smoke
```

安装与运行时证据分别记录，不用 workspace 编译代替独立安装。运行时检查直接读取安装产物及其编译 CSS，输出到 `output/consumer-feedback`。

证据目录：

- `.zeron/reports/stage-one`：测试、构建、安装、运行时及浏览器记录。
- `output/playwright/stage-one`：页面截图及本轮浏览器验收脚本。
- `output/consumer-feedback`：独立安装后的实际 CSS、主题、尺寸与浏览器错误记录。

## 5 组件复用与保留差异

四个试点的静态报告识别 75 种 UI 组件、261 次使用；总计 135 种组件、344 次代码使用。设计检查 0 错误、0 警告。UI 次数按源码统计，不等于 Registry 条目数。

- 状态与反馈：StatusIndicator、ErrorState、Badge、InlineNotice、Empty、Skeleton、Button。
- 页面组合：Card、Container、PageLayout、Sidebar、Tabs、Select，以及原有图表与业务视图。

完整报告位于 `.zeron/reports/stage-one/after.json` 和 `after.md`。自动来源识别的八处未检查项与基线相同：局部 Icon/MetricIcon 来自已有图标映射，DropdownTrigger 为已导入的 Zeron Dropdown 导出；没有另建同名控件。动态 class 与内联样式未由该报告自动审计，已检查本轮差异及浏览器布局。

旧开发服务在减少动态效果设置下出现文档外壳的 useId hydration 提示，已有 Alert 文档页同样可复现。重新启动的开发服务复查 Alert、ErrorState、StatusIndicator，三页错误均为空；生产文档也未出现该提示。本地生产环境的两项 Vercel 分析脚本返回 404，属于未部署的平台统计服务。后续检查应单列这些环境现象，不能与组件行为通过混为一谈。

## 6 阶段退出清单

- [x] 两个公共状态原语、导出、Registry、指南与文档已接入。
- [x] 业务状态与数据状态两类真实试点已采用。
- [x] 首次加载/失败、后台刷新、旧数据、确认空数据与筛选无结果均有独立表达。
- [x] 新增数据操作 pending、防重复提交、失败后重试及受控行为通过测试。
- [x] 深浅主题、窄屏、键盘核心路径与减少动态效果已有浏览器证据。
- [x] 定向独立 Next/Vite 安装、编译与构建通过。
- [x] 独立原语运行时复验及最终生产构建通过。
- [x] 最终检查记录收尾，本阶段实现可交付验收；后续阶段未实施，尚未公开发布。

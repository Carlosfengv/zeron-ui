# 演示数据设置工具栏

## 本次调整

把已有的模拟数据状态和操作失败参数集中到一个“演示数据设置”图标菜单，减少演示内容区的控制项。

- 文档预览：按钮位于“预览 / 代码”右侧；区块和页面使用相同入口。
- 独立预览 / 全屏：按钮为 Neutral 变体的悬浮 icon button，默认位于右下角，距边缘 16px；不占用页面布局空间。没有可调参数的 demo 不显示按钮。
- 模拟数据状态采用单选菜单，当前状态显示勾选。
- “下次刷新失败”使用 Switch 开关；扫描失败、保存失败等其他模拟行为采用独立勾选。二者都不改变当前数据状态，操作时菜单保持打开。
- 支持刷新失败模拟的 demo，在一次实际刷新开始时消费勾选；失败保留旧数据，后续重试恢复正常。
- 切换“代码 / 预览”保留演示实例、数据状态和参数。
- 每个 demo 仅提供已有实现支持的选项；生产 block/page 的数据接口和业务操作没有增加演示参数。

## 涉及的验收页面

下面每一行都有文档预览和独立预览两处入口。

| Demo | 文档预览 | 独立预览 | 模拟参数 |
| --- | --- | --- | --- |
| Project Monitor | [打开](http://localhost:3007/zh-CN/docs/blocks/project-monitor-01) | [打开](http://localhost:3007/zh-CN/block-demo/project-monitor-01) | 八种数据状态、下次刷新失败 |
| AI Gateway Overview | [打开](http://localhost:3007/zh-CN/docs/pages/ai-gateway-overview-01) | [打开](http://localhost:3007/zh-CN/block-demo/ai-gateway-overview-01) | 八种数据状态、下次刷新失败 |
| Cluster Environment List | [打开](http://localhost:3007/zh-CN/docs/pages/cluster-environment-list-01) | [打开](http://localhost:3007/zh-CN/block-demo/cluster-environment-list-01) | 八种数据状态、下次刷新失败 |
| Monitoring Alert List | [打开](http://localhost:3007/zh-CN/docs/pages/monitoring-alert-list-01) | [打开](http://localhost:3007/zh-CN/block-demo/monitoring-alert-list-01) | 八种数据状态、下次刷新失败 |
| Support Analytics | [打开](http://localhost:3007/zh-CN/docs/blocks/support-analytics-01) | [打开](http://localhost:3007/zh-CN/block-demo/support-analytics-01) | 八种数据状态、下次刷新失败、工单操作失败 |
| Transaction Details | [打开](http://localhost:3007/zh-CN/docs/blocks/transaction-details-01) | [打开](http://localhost:3007/zh-CN/block-demo/transaction-details-01) | 八种数据状态、操作失败 |
| Integration Monitors | [打开](http://localhost:3007/zh-CN/docs/blocks/integration-monitors-01) | [打开](http://localhost:3007/zh-CN/block-demo/integration-monitors-01) | 数据状态、未知检查、操作失败、重置示例 |
| Security Overview | [打开](http://localhost:3007/zh-CN/docs/blocks/security-overview-01) | [打开](http://localhost:3007/zh-CN/block-demo/security-overview-01) | 数据状态、扫描失败 |
| Cost Estimate | [打开](http://localhost:3007/zh-CN/docs/blocks/cost-estimate-01) | [打开](http://localhost:3007/zh-CN/block-demo/cost-estimate-01) | 费率状态、保存失败 |
| Getting Started | [打开](http://localhost:3007/zh-CN/docs/blocks/getting-started-01) | [打开](http://localhost:3007/zh-CN/block-demo/getting-started-01) | 展开、禁用入口、全部完成、空清单、重置示例 |

## 手动验收步骤

1. 优先打开集群环境列表、项目监控和网关概览的文档预览。确认图标按钮在代码 tab 右侧，演示内容中不再出现原来的状态选择条。
2. 打开菜单，分别选择正常、首次加载、首次失败、后台刷新、刷新失败、过期、过期并刷新、确认无数据；确认当前项有且仅有一个勾选。
3. 在支持刷新失败模拟的页面选择正常，再开启“下次刷新失败”Switch。关闭菜单，点击页面自身的刷新按钮：出现错误提示，旧数据保留。重新打开菜单，Switch 已关闭；点击重试后恢复。
4. 选择首次失败，然后切到代码再返回预览：仍然显示首次失败。代码 tab 激活时也能打开参数菜单。
5. 使用 Enter/空格选择菜单项；Escape 关闭菜单后焦点回到图标按钮。模拟行为可以独立勾选，不改变数据状态。
6. 在独立预览重复选择和刷新操作；确认设置按钮悬浮显示，页面顶部没有工具栏占位。拖动按钮到四边附近，松开后吸附到最近的边缘，保持约 16px 的间距。
7. 在约 390px 宽度打开菜单，检查菜单及说明不超出屏幕，所有选项均可访问。
8. 检查客服、安全、估算、交易和入门清单的专属参数仍能操作；安全扫描和估算保存期间相应失败开关保持禁用。

### Switch 调整

“下次刷新失败”已按后续要求改为现有 Zeron Switch。开关与模拟数据状态保持独立，开启时不关闭菜单，一次实际刷新开始后自动关闭。其他模拟行为仍使用原来的独立勾选。

本次补充验证：菜单定向测试 5 项、类型检查、源代码与样式检查、预览代码资产检查通过；集群列表文档预览验证 Switch 的空格切换、失败消费、旧数据保留和重试恢复。独立预览在 1440px 和 390px 验证鼠标点击、Tab 聚焦、空格切换和 Escape 后焦点回到设置按钮；修复了从 Switch 关闭菜单时焦点丢失的问题。工具栏初版的 40 组菜单检查和生产构建记录保留如下，本次 Switch 调整没有重新执行整个矩阵或生产构建。

## 实现与验证记录

`DemoSettingsMenu` 复用现有 Button、DropdownMenu、DropdownContent、MenuItem、DropdownLabel、DropdownSeparator 和图标。`PreviewToolbar` 为每个预览提供独立插槽，通过 React portal 将控制项放到工具栏；演示状态仍由各 demo 自己管理。长说明按菜单宽度换行，菜单宽度限制在 Base UI 提供的可用空间内。

- 定向测试：7 个文件、30 项通过，包含新增菜单、预览隔离、一次刷新失败、异步旧请求保护，以及现有代码加载和交易操作回归。
- 浏览器：10 个 demo × 文档/独立预览 × 桌面 1440px 浅色/窄屏 390px 深色，共 40 组检查通过，覆盖菜单位置、边界、键盘单选和独立勾选；无页面脚本错误。
- 集群列表额外检查：代码 tab 保留状态、一次真实异步刷新失败、6 张旧卡片保留、勾选消费和重试恢复；另有窄屏浅色检查。
- 英文入口：Project Monitor 的菜单、状态标签和刷新失败项已检查。其他已有专属参数的文案继续沿用各自 demo。
- 无参数 demo：Resource Status All 不显示空工具栏。
- 类型检查、源代码 lint、样式 lint、预览代码资产检查及生产构建通过。此次没有修改 Registry 管理的 UI/block 源文件，也没有重跑完整仓库测试或全部业务操作。

完整证据位于 `.zeron/reports/demo-settings/`，浏览器截图位于 `output/playwright/demo-settings-*.png`。本记录提供验收指引，不代表人工验收已完成。

## 组件和样式范围

组件统计覆盖 15 个文件；其中独立预览路由含有其他 block 的引用，因此统计中的 block 数量不代表本次迁移数量。公共 UI 组件承担按钮和菜单行为，项目组件只负责演示选项和工具栏插槽。

样式检查在该范围内无错误或警告。自动来源报告对 `DropdownTrigger` 保留一处未检查：人工已追踪为现有 Dropdown 导出的 Base UI `Menu.Trigger` 别名。报告没有自动检查所有动态样式及 CSS 变量语义；菜单使用的 `--available-width` 来自现有 Base UI 定位接口，并已通过浏览器边界检查。两个新增组件没有修改前的基线覆盖，不能据报告计算整体改进比例。

统计和逐项来源见 [组件报告](../../.zeron/reports/demo-settings/after.md) 与 [完整 JSON](../../.zeron/reports/demo-settings/after.json)。

## 全屏悬浮入口调整

独立预览移除了原来 44px 高度的顶部工具栏，演示页面直接使用完整高度。设置入口复用现有 Zeron Button 的 `neutral`、`md` 和 `iconOnly` API，大小为 32px。文档内的普通预览仍使用原来的顶部入口；浏览器原生全屏也使用悬浮入口，并隐藏预览工具栏。

`FloatingPreviewControls` 仅承担演示入口的定位和拖拽，状态与菜单仍由原有 demo 管理。鼠标 / 触屏拖拽超过 6px 才开始移动；松开后以现有 moderate spring 吸附最近的上、下、左、右边，保留沿边位置。拖动时关闭已打开的设置菜单，拖动结束不触发打开操作。视口改变时保留吸附方向和相对位置；启用减少动态效果时直接定位。

### 验收内容

1. 打开上表任意独立预览：默认右下角显示 Neutral 悬浮图标，右侧和下侧均距边缘 16px，页面顶部没有工具栏占位。
2. 分别拖向左、右、上、下边缘，松开后自然吸附；拖动时菜单不会误打开，再点击按钮可以正常打开菜单。
3. 菜单打开时拖动按钮，菜单关闭。菜单内切换数据状态、点击 Switch 和其他模拟行为不会触发拖拽。
4. 在 390px 窄屏上用触屏拖拽；改变窗口大小后按钮仍可见，菜单不越出屏幕。按钮外的页面区域可以正常点击和滚动。
5. 普通文档预览的入口仍在预览 / 代码 tabs 右侧。原生全屏时入口浮动且菜单在全屏容器内；退出后恢复顶部入口，保留数据状态和 Switch 设置。
6. Resource Status All 等无参数 demo 没有空入口和工具栏占位。

### 本次验证范围

- 定向测试 4 个文件、22 项通过；布局契约测试 31 项通过，覆盖四边吸附、24px 边距、窄屏、可见视口偏移与既有菜单 / 代码加载行为。
- 10 个独立 demo × 1440px / 390px，共 20 组位置、Neutral 样式、40px 尺寸、24px 间距和菜单边界检查通过；无页面脚本错误。无参数 demo 不出现空悬浮按钮。
- 集群列表实际浏览器验证：桌面四边拖拽、菜单边界、拖动关闭菜单、鼠标 / 触屏拖拽、390px 视口、窗口缩放、Enter 打开菜单、触屏轻点打开菜单和 Escape 焦点返回。
- 普通文档与原生全屏验证：工具栏切换、菜单在全屏容器内、代码 tab 保留状态、Switch 保留，以及一次刷新失败后旧数据保留和重试恢复。
- 类型检查、源代码 lint、全仓库配置范围内的设计 lint、预览代码资产检查及生产构建通过。首次构建发现代码预览资产过期，重新生成后构建成功。

上述记录为自动验证范围，人工验收尚待完成。截图位于 `output/playwright/floating-demo-settings-*.png`，完整验证日志位于 `.zeron/reports/floating-demo-settings/`。

### 本次组件与样式报告

本次报告明确覆盖 6 个实现文件：80 种组件、103 次 JSX 使用，其中公共 UI 为 11 种 / 30 次。独立路由引用的其他 block 计入源代码使用次数，不能据此推算本次修改的 block 数量。
- 公共 UI：Button、Dropdown、MenuItem、Switch、Tabs、Tooltip，使用现有尺寸和变体。
- 文档组合：PreviewToolbar 为各预览提供独立入口；FloatingPreviewControls 负责屏幕定位和手势，不承担演示数据状态。
- 动画：已有 Framer Motion 与 moderate spring；定位计算不需要新建 UI 原语或样式 token。

范围内基础 lint 无错误 / 警告。设计 lint 的组件覆盖、颜色、任意样式值等专用规则未对 `docs/components` 启用，相关样式通过公开 API、来源和浏览器检查人工核对；不能将基础 lint 通过解释为这些专用规则通过。`DropdownTrigger` 仍为来源报告的一处未检查项，人工追踪为现有 Dropdown 导出的 Base UI `Menu.Trigger` 别名。新增定位文件没有修改前基线，不能计算整体改善比例。没有修改管理的 UI / block 源文件或新增样式 token。

见 [本次组件报告](../../.zeron/reports/floating-demo-settings/after.md) 与 [完整 JSON](../../.zeron/reports/floating-demo-settings/after.json)。

### 32px / 16px 尺寸调整

按后续要求将悬浮按钮改为公共 Button 的 `md` 尺寸（32px），吸附边距改为 16px。普通文档预览尺寸不变。上面的初版自动验证记录对应 40px / 24px；新规格按本节记录验收。

新规格验证：14 项定位 / 菜单测试、类型检查、定向 lint 和预览代码资产检查通过。集群列表在 1440px / 390px 实测 32px 尺寸、默认 16px 间距、四边吸附与菜单边界均通过；本次尺寸调整未重复生产构建。测试环境已恢复运行于 3007 端口。

本次组件报告覆盖 2 个实现文件，10 种组件 / 15 次 JSX 使用，公共 UI 为 7 种 / 12 次；基础 lint 无错误 / 警告。专用样式规则未覆盖 docs/components，DropdownTrigger 自动来源仍未检查；沿用上文人工来源核对。Button 使用公共 md 尺寸，未增加内部样式覆盖。见 [本次尺寸调整报告](../../.zeron/reports/floating-demo-32/after.md) 与 [完整 JSON](../../.zeron/reports/floating-demo-32/after.json)。

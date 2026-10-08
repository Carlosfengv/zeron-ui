# 集成监控实施记录

## 统计

已实现 `integration-monitors-01`，导出 `IntegrationMonitors`。核心界面及演示的 4 个 TSX 文件，自动报告识别 67 种组件、111 次代码使用，其中 50 种为现有 Zeron UI 导出。按代码出现位置统计，包含业务组合与图标辅助，不代表挂载数量。3 处 DropdownTrigger 别名使用需人工溯源，已确认来自当前 `@zeron/ui/dropdown` 的公开导出。

核心范围普通 lint、适用的设计规则、全仓 TypeScript 检查通过；报告 0 错误、0 警告。新增 16 项核心数据和交互测试，加上相关目录及国际化测试，共 34 项通过。演示状态、下载、分享与 Dialog 采用真实浏览器验证。没有新增 UI 依赖、基础组件或全局样式变量。

品牌图标完成时的受影响代码统计包含 22 个文件，包含共享文档入口的既有组件。设计报告覆盖 20 个文件，两个生成/安装脚本不在该配置覆盖范围；不能把这份报告称为全范围设计 lint 通过。新增文件未具备修改前基线，归因通过源码人工审阅，不计算自动合规率。

检查附件：`.zeron/reports/integration-monitors/after.json`、`after.md`、`full-scope.json`、`full-scope.md`、`verification.json`。

## 组件

| 区域 | 当前组件与职责 |
| --- | --- |
| 外框与分类 | Container / Header / Body / Footer、Tabs / TabItem / TabPanel；顶部数量基于完整集成快照 |
| 查询与分页 | Select、InputGroup、Button，useDataTable 管理客户端分页；四项筛选取交集 |
| 列表身份 | InfoItem、Avatar、Badge；复用现有 @thesvg/icons 的 18 个品牌图标，logoSrc 优先，未收录品牌使用首字母回退；长名称换行 |
| 检查集合 | StatusOverview activity / nodes；检查项稳定 ID、历史结果 Tooltip、未知和待配置区分 |
| 操作与反馈 | Dropdown、MenuItem、Button、Tooltip、Skeleton、Empty、ErrorState、InlineNotice |
| 文档演示 | Dialog、Field、Input、Switch、StatusIndicator、ToastStack；宿主执行数据变更与本地文件导出 |

数字分页为当前 Button 与 useDataTable 的业务组合；行式监控保留 InfoItem 与 StatusOverview 的结构。状态条带沿用库的公开尺寸、颜色、滚动和 Tooltip 行为。

## 问题与说明

Registry、包导出、capabilities、catalog、文档 manifest、中英文内容、独立预览、源代码预览和 agent 指南均已接入。Registry 与文档/agent 生成产物检查通过；Next 和 Vite 消费项目安装、类型检查及构建通过。保留工作区原有改动，未创建提交或部署。

浏览器已验证：名称与描述搜索、交集筛选、页码、添加配置、编辑、暂停/恢复、单项/全部检查、详情/资产、移除、CSV、分享恢复、静音/取消、管理集成、失败重试、未知数据、首次失败、空集合后重新添加、键盘菜单、检查条带方向键/End/Escape、触摸提示和 Dialog 焦点回归。最后一页删除 3 项后由第 6 页校正至第 5 页，剩余 15 项。CSV 真实文件包含所有匹配项，已验证引号、换行和公式前缀处理。

浅色及深色分别验证 768 / 480 / 360px 容器，无页面横向溢出；另验证 360px 浏览器窗口，以及长名称和 100 字符连续名称。窄容器的分类可横向滚动，密集检查条带由 StatusOverview 保留其内部滚动。没有将条带解释为时间趋势。

演示明确使用本地示例数据，检查操作生成通过结果。真实集成、权限、超时与请求取消由宿主数据源和 actions 接入。无真实后端验证。界面沿用当前品牌蓝、语义状态色、头像回退及组件响应式结构。

## 品牌图标补充

已复用项目现有 `@thesvg/icons`（工作区安装版本 3.3.1），采用各品牌独立导入，Registry 声明相同依赖并包含品牌映射文件。列表与添加菜单继续使用公开 Avatar，图形仅使用图标包内的可信 SVG；装饰图标不重复提供品牌读屏标签。黑白标志通过语义前景色跟随主题，Stripe 使用图标包的品牌色，其余多彩图形保留原色。宿主 logoSrc 优先；连接时保留宿主提供的图标地址。没有新增基础组件或全局样式。

已覆盖 18 个品牌：Asana、Atlassian、Coda、Confluence、Dropbox、Figma、GitHub、Jira、Linear、Loom、Mailchimp、Notion、Sentry、Slack、Square、Stripe、SurveyMonkey、Vercel。当前包未收录 Mercury、Harmonic、Synthesia，继续显示首字母，不使用相似名称的其他品牌图标。

补充验证逐页覆盖浅色/深色的 18 条初始数据、添加菜单，以及 Dropbox 添加后的列表图标；两种主题下 768 / 480 / 360px 容器均无页面横向溢出。图标截图保存在 `.zeron/reports/integration-monitors/brand-*.png`。

## 状态条对齐调整

行内移除可见的“检查项”标签，轨道独占上方整行。下方左侧显示检查结果，右侧显示资产数量。通过 StatusOverview 既有 label 插槽传 null；在组件源码补齐 activity 无标签时的公开布局行为，取消标签列与预留尾列。带标签的 activity 以及 card 继续沿用原有布局。组件无障碍名称仍由 ariaLabel 提供。中英文组件 API 文案与 block 指南同步说明此用法。

本次源码检查覆盖 StatusOverview、监控行与组件回归测试 3 个文件，识别 21 种组件、35 次使用，设计检查 0 错误、0 警告；DropdownTrigger 别名继续人工溯源。全仓类型检查、普通 lint、完整设计 lint、4 个文件的 28 项相关测试通过。浅色/深色的 768 / 480 / 360px 浏览器验证显示：标签数量为 0，轨道左右边界与列表内容一致，结果/资产位于轨道下方，无页面横向溢出。条带 End/Escape 操作仍可检查最后一项。Registry、源代码预览及 agent 产物重新生成并通过检查。

证据：`.zeron/reports/integration-monitors/alignment-before.json`、`alignment-after.json`、`alignment-*.png`。本次新增测试没有修改前基线，不计算自动合规率。

## 状态区域对齐标题

整个状态区域的左边缘改为与 InfoItem 标题、描述对齐，右边缘延伸至列表内容末端。通过业务外层的既有间距单位避开 lg Avatar 和 InfoItem 间隔，不改状态组件内部布局。浅色/深色的 768 / 480 / 360px 实测显示：标题、描述、状态区域及结果行左坐标均为 93px，右边缘与列表内容一致，无页面横向溢出。10 项监控交互测试、类型检查、受影响文件设计检查，以及 Registry/源代码预览/agent 产物检查通过。单文件报告识别 18 种组件、21 次使用，设计检查 0 错误、0 警告；DropdownTrigger 别名已人工确认来源。附件为 `title-alignment-after.json` 与 `title-alignment-*.png`。

## 顶部 Tabs 外层样式

顶部分类 Tabs 移除 ContainerBody 外层，使用普通溢出容器承载现有 TabsList，去掉外层 rounded-2xl、border-hairline、border-border、bg-surface-floating 和 p-4。Tabs 本身继续使用现有组件样式。浅色/深色、768 / 360px 容器实测外层无背景、边框、圆角和内边距，无页面横向溢出，分类切换正常。10 项交互测试、受影响文件设计 lint 和 Registry/源代码预览/agent 生成检查通过。单文件报告识别 38 种组件、61 次使用，0 错误、0 警告；DropdownTrigger 别名来源已人工确认。附件为 tabs-surface-after.json 和 tabs-surface-*.png。

## 筛选与搜索控件默认尺寸

“所有集成”“所有状态”与搜索框去掉 sm 尺寸，使用 Select / InputGroup 的默认 md（32px），文字和图标尺寸同时跟随组件默认约定，无额外高度覆盖。浅色/深色、768 / 360px 容器实测三个控件均为 32px，搜索框出现清空按钮后仍为 32px，无页面横向溢出。受影响文件设计 lint 与 Registry/源代码预览/agent 产物检查通过。单文件报告识别 38 种组件、61 次使用，0 错误、0 警告；DropdownTrigger 别名来源已人工确认。附件为 control-size-after.json 和 control-size-*.png。

## 分类 Tabs 状态圆点

参照 demo 的分类导航，为存在失败、全部通过、未启用分别增加红、绿、灰色圆点，全部分类不加圆点。复用现有 StatusIndicator 与语义 tone，圆点在文字左侧并与文字垂直居中。TabItem 增加公开 leading 插槽承载装饰内容，优先于 icon；已有 icon 用法保持原有行为。StatusIndicator 在 label=null 时不渲染空标签间距，圆点由相邻分类文字提供含义并设为 aria-hidden。Registry 闭包增加 status-indicator，公共 API 的中英文文案、组件/Block 指南与生成产物同步。

本次报告覆盖 5 个源码/文档示例/测试文件，识别 61 种组件、198 次代码使用，0 错误、0 警告；两个 DropdownTrigger 别名仍人工确认公开导出，自动来源库存未检查。全仓类型检查、普通 lint、完整设计 lint、5 个文件的 40 项相关测试以及 Next/Vite 消费安装、类型检查、构建通过。浅色/深色、768 / 360px 容器浏览器实测三个圆点直径均为 8px，位于文字左侧且垂直中心偏差为 0px，无页面横向溢出，分类切换正常。没有新增 UI 包或全局样式变量。

附件为 `.zeron/reports/integration-monitors/tabs-dots-after.json` 与 `tabs-dots-*.png`；新增 slot 的替代优先级、装饰内容无障碍名称及选择行为通过组件回归测试。没有本次修改前自动基线，不计算自动合规率。

## Tabs 中性色主题

顶部 Tabs 通过公开 color="neutral" 切换为中性色主题，选中项采用组件库的反色背景和前景配对。浅色/深色选中项、状态圆点和分类切换已在浏览器验证。受影响文件设计 lint 与 Registry/源代码预览/agent 产物检查通过。单文件报告识别 39 种组件、62 次使用，0 错误、0 警告；两个 DropdownTrigger 别名仍人工确认来源。附件为 tabs-neutral-after.json 和 tabs-neutral-*.png。

用户撤回中性色主题修改，顶部 Tabs 已恢复公开 color="default"。

## 审查与优化

本轮审查修复了不支持的检查结果值渲染、含反斜线/换行的分享路径解析、单项与批量检查目标删除后的时间误更新、管理连接期间的窗口切换，以及未知检查详情文案。单项检查的结果和时间合并为一次快照更新。新增 7 项回归测试，修复前复现失败、修复后通过；6 个相关测试文件共 55 项通过。

最终类型检查、受影响文件普通 lint、全仓设计 lint、Registry 与预览源码检查通过。浏览器复查浅色/深色、960px/360px 窗口，确认 32px 控件、标题/状态对齐、3 个分类圆点、无页面横向溢出；管理连接锁定与未知详情通过。7 文件使用报告识别 76 种组件、129 次代码使用，其中 50 种公开 UI、96 次 UI 使用；0 设计错误/警告。DropdownTrigger 的 3 处别名自动来源仍未检查，已人工确认来源。无自动修改前基线。

审查期间其他任务加入 file-upload-01，Agent 生成暂因该条目的身份注册缺失而失败，共享目录测试也曾出现对应计数与入口不一致。没有修改其他任务代码来消除这些失败，详见同目录 `2026-10-06-integration-monitors-review-commit-plan.md`。没有创建提交。证据为 `.zeron/reports/integration-monitors/review-after.json`、`verification.json` 和 `output/playwright/integration-monitors-review-dark-360.png`。

# 集成监控审查与提交计划

本轮只审查 integration-monitors-01、它新增的公共组件用法及文档接入。不提交代码，不撤销工作区中其他任务的修改。

## 已修复

| 问题 | 修复与验证 |
| --- | --- |
| 未知检查结果的计数与条带不一致；toString / constructor 会读到对象原型，active 会误读运行状态文案 | 增加内部 normalizeMonitorResult，计数、条带颜色和无障碍提示统一归为 unknown。检查结果映射使用完整的枚举类型。新增交互回归测试，修复前出现错误 data-status 警告，修复后通过。 |
| 单斜线路径含反斜线或制表符、换行符时，会被浏览器解析为其他站点的地址 | 复制地址校验拒绝这些字符，保留正常 http(s) 与站内路径。新增反斜线、tab、LF、CR 用例，修复前失败、修复后通过。这是地址解析问题，没有发现外部导航或脚本执行。 |
| 单项或批量检查等待期间清空数据，仍会更新上次检查时间 | 单项检查只在目标仍存在时更新检查结果与时间，合并为一次快照更新；批量检查无运行中目标时直接结束。新增两种等待期间删除目标的测试，不再产生检查时间或成功提示。 |
| 管理集成连接期间还能进入编辑/配置窗口，旧连接结果会影响新窗口 | 等待连接时禁用同窗口中的编辑和配置按钮。测试与真实浏览器验证等待期间锁定、完成后恢复、窗口不被替换。 |
| 详情把 checks=null 描述为“尚未配置检查项” | 明确区分“检查数据未知”“暂无检查项”和“尚未配置检查项”。测试与浏览器验证未知数据文案。 |

没有新增依赖或公共 prop，没有改动筛选、分类、分页的既有契约。顶部 Tabs 保持 color="default"；状态圆点、32px 查询控件以及用户确认的对齐方式保留。

## 验证记录

- 本轮 6 个相关测试文件、55 项测试通过：数据、Block 交互、演示异步行为、Tabs leading、StatusOverview 与状态反馈。新增 7 项回归用例。
- 最终源码的全仓 TypeScript 检查与受影响文件普通 ESLint 通过。设计 lint 和生成产物的最终结果见下方补充记录。
- 浏览器验证浅色/深色与 960px、360px 窗口：无页面横向溢出；三个查询控件均为 32px；状态区左边与标题一致、右边与行内容一致；可见“检查项”标签为 0，分类状态圆点为 3。
- 浏览器确认管理连接锁定/恢复和未知检查详情。重新加载后的验证没有 pageerror；共享目录热更新期间出现过 Turbopack HMR 错误，重新加载后不再出现。
- 本轮使用报告覆盖 7 个文件，识别 76 种组件、129 次代码使用，其中 50 种 Zeron UI、96 次 UI 使用。设计规则报告 0 错误、0 警告。3 处 DropdownTrigger 自动来源库存未识别，已人工确认是现有公开导出。没有自动修改前基线，不计算自动合规率；数量包含被审查的组件内部实现，不能当作页面实际挂载量。
- Next / Vite 消费安装、类型检查与构建在此前状态圆点及 Registry 闭包更新后已通过；本轮没有变更安装闭包，未重复消费构建。本轮回归由源码测试和浏览器覆盖。真实集成服务、权限与生产请求仍由宿主负责。

报告与浏览器尺寸数据保存在 `.zeron/reports/integration-monitors/review-after.json` 和 `verification.json`，不建议把整个截图、日志目录纳入功能提交。

最终检查补充：全仓设计 lint、Registry 检查（148 条目）与预览源码检查（46 条目）通过。生成期间其他任务写入 Registry，曾短暂出现未经过后处理的 workspace imports；后处理完成后重新检查已通过。Agent 生成仍因另一任务的 `registry:file-upload-01` 缺少 active identity 注册而失败，不能标记为通过。本 Block 的身份已注册，不能为消除该失败擅自修改其他 Block 的注册。提交前需在隔离基线上重新生成 Agent 产物，或等待共享身份注册完成后重跑。

共享目录补齐 file-upload 的入口和计数后，目录与国际化两个测试文件重跑，14 项通过；与上述 55 项合计 69 项相关测试通过。没有由本轮修改其他 Block 的入口或计数。

## 提交前置依赖

工作区存在其他任务的未提交修改，不能使用整仓暂存。以下公共基础需要先形成可编译的基线，或者确认已由对应任务提交：

- ErrorState、StatusIndicator 的 canonical source、包导出、Registry 条目及必要依赖。两者目前是新文件；StatusIndicator 的 label=null 用法可在首次基础提交中一并纳入。不要把其他反馈组件、图表或 token 修改全部带入。
- 演示公共工具：DemoSettingsMenu → PreviewToolbar → FloatingPreviewControls / floating-preview-position，以及预览容器的 Provider/Slot。它们属于共享演示工具任务；第三笔提交依赖这条完整链。
- 如果沿用当前文档 loader 生成方式，先纳入对应生成器及入口变更；不要仅提交生成文件，却遗漏 scripts/generate-document-loaders.mjs。也可在原有生成方式的基线上重新生成本 Block 入口。
- @thesvg/icons 已在 HEAD 的 root / blocks dependencies 中，无需新增包依赖或将当前 lockfile 中无关变化提交。

StatusIndicator 是新文件，无法可靠地根据 HEAD 区分其创建过程中的各次修改。公共基础先提交它的最终合法实现，随后主体提交只包含尚未进入基线的变化。

## 主体 commit 1

`feat(ui): support leading tab content and unlabeled status rails`

目的：提供 Block 所需的两个增量公共组件能力，同时保留已有 icon、带标签 activity、card 的行为。

范围：

- packages/ui/src/components/tabs.tsx：leading 插槽、替代 icon 优先级、标签折叠条件。
- packages/ui/src/components/status-overview.tsx：activity 下 label=null 的全宽轨道与下方结果布局。
- 若公共基础尚未包含 StatusIndicator 的 label=null 行为，补入该部分及对应文案。
- docs/pages/components/tabs/page.tsx 与中英文 tabs、status-overview API 文案；StatusIndicator 指南仅选择本次装饰圆点用法的变化。
- tests/tabs-leading.test.tsx 与 tests/status-overview-interaction.test.tsx 的新增回归。
- 本次组件对应的生成源码、public/r/tabs.json、public/r/status-overview.json，以及必要的共享生成索引。

验收：组件回归测试、类型检查、受影响文件 lint、Registry 闭包检查。

## 主体 commit 2

`feat(blocks): add integration monitors block`

目的：提供可安装的宿主驱动 Block，包含检查条带、组合筛选、分页、异步操作保护和品牌图标。

范围：

- packages/blocks/src/application/integration-monitors-01/ 的 7 个文件。
- tests/integration-monitors-data.test.ts 与 tests/integration-monitors-interaction.test.tsx。
- packages/blocks/package.json 只选择该 Block 的 export。
- packages/blocks/registry.json、block-capabilities.json、src/catalog.ts 只选择 integration-monitors-01 条目；含 status-indicator 与 @thesvg/icons 安装声明。
- scripts/test-consumer-installs.mjs 中该 Block 的 Next / Vite 验证样例。
- public/r/integration-monitors-01.json 及对应 Registry 索引更新。

验收：核心数据/交互测试、包类型检查、Registry 检查。发布或真正提交候选版本时，用该版本的 Registry 再运行指定 Block 的 Next / Vite 消费验证。

## 主体 commit 3

`docs(blocks): document and demonstrate integration monitors`

目的：接入文档、独立预览和 Agent 发现，提交可交互的本地演示及本轮竞态修复。

范围：

- docs/components/blocks/IntegrationMonitorsDemo.tsx 与 tests/integration-monitors-demo.test.tsx。
- docs/pages/blocks/integration-monitors-01/、对应 app 生成路由、中英文内容、docs/agent-guides/blocks/integration-monitors-01.md。
- docs/catalog/artifacts.ts、docs/manifest.ts、BlockPreview、StandaloneBlockDemo、standalone-blocks、scripts/preview-source-allowlist.mjs 只选择该 Block 接入片段。
- docs/agent-data 的 components、item-identities、guide-routes 只选择该 Block 数据。
- 文档 loaders、源代码预览、Agent 与 llms 生成产物；目录和国际化测试的计数必须匹配这一笔提交的实际内容。
- 本 Block 的计划、实施记录和本审查提交计划。

验收：演示竞态测试、目录/国际化测试、文档路由/source 与 Agent 生成检查、独立预览的主流程和窄屏验证。

## 暂存与生成原则

每笔从已确认的前置基线组装，选择共享文件中的本次片段。计数测试不能直接照抄当前整个工作区的数量：目前另有 support-analytics、transaction-details、file-upload 等任务，三笔提交各自的计数应由其实际包含的条目决定。

生成产物应在仅包含该笔提交和前置依赖的隔离目录中重新生成、检查，再带回对应提交。不要把当前 public/r、docs/generated、public/docs-source、llms 的全部变化打包；也不要手改内容哈希来制造检查通过。

排除图表/图表 primitive、operations shell、菜单与 RadioGroup 修复、token/全局样式，以及其他 Block 的代码和文案；不纳入临时视频、下载 CSV、Playwright 日志和本地缓存。执行前逐笔检查暂存 diff 和未跟踪依赖，保持每笔可编译、可验证。

本轮仅给出 commit 计划，未执行 git add、commit 或 push。

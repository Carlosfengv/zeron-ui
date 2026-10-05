# Zeron MCP 组件采用修复：实施与验证记录

日期：2026-10-05。对应 [修复方案](./2026-10-05-mcp-component-adoption-remediation.md)。

本轮完成 A、B、C、D1、D2 的本地实现。新增组件上下文、完整侧栏宿主、消费者浏览器检查及精确误用提示，帮助 Agent 先取得正确组合，再适配业务并检查实际渲染。E 正式发布与 F 独立 Agent 开发评测仍待完成；当前证据证明信息入口和官方组合可用，不能证明所有 Agent 的业务开发质量已改善。

## 已完成的改动

| 工作包 | 交付内容 | 关键边界 |
| --- | --- | --- |
| A | 新增 AppShell、Sidebar、NavMenu、NavItem、SidebarIdentityRow、SidebarAccountMenu 六份指南；增强 Button、PageLayout | 给出可类型检查的最小组合、公共 API、业务接入及样式归属；组件公共 API 和核心 CSS 无须为本次误用改写 |
| B | MCP 查询与静态目录加入任务上下文入口；Skill 按新应用、既有宿主、控件、业务状态、主题渐进读取 | 使用现有五个工具，参数 schema 不变；指向所选 catalogVersion；历史快照没有新资源时不生成失效入口 |
| C | 官方三页范例的宿主采用 SidebarProvider、AppShell、Sidebar、NavMenu、身份及账号组件；响应提供源码清单和 manifest | 宿主采用项单列，共 17 项；页面采用项与 guided 覆盖没有因加入宿主虚增；保留查询、路由、焦点和原有业务契约 |
| D1 | 对外分发只读 `check-rendered-controls.mjs`、安装说明和失败修复路径 | 从消费者自己的项目解析 Playwright；没有控件、隐藏/加载或无法判断的内容不会伪装为通过；不自动执行业务操作 |
| D2 | 新增 `zeron/button-icon-slots` ESLint 规则 | 定位标准 Button 中图标与文字混入 children 的常见错误；处理别名与绑定作用域，豁免明确的自定义组合；无自动改写 |

Sidebar 指南明确：折叠状态由 Provider 管理，身份行须由调用方切换紧凑展示，移动导航后关闭抽屉。NavMenu 负责分组导航反馈和键盘模式；独立 NavItem 保留为合法能力。Button 使用图标组件类型作为 `leadingIcon`/`trailingIcon`，children 保留文字；纯图标按钮另外提供可访问名称。

任务入口、消费者说明和脚本均纳入 Skill 资源白名单与固定版本目录。MCP 的纯文本读取和结构化读取测试覆盖相同入口；发布资源测试检查完整宿主源码索引、资源哈希及不可变目录重建。公开站点的实际可达性仍属于 E。

主要源码位置：

- `docs/agent-guides/components/`、`docs/agent-data/`：指南及目录元数据。
- `lib/agent-catalog/task-context.mjs`、`query.ts`、`example-links.mjs`、`lib/mcp/handler.ts`：任务入口、指南输出、宿主资源发现。
- `scripts/build-agent-catalog.mjs`、`agent-catalog-release.mjs`：开发目录与固定资源生成。
- `.agents/skills/zeron-page-builder/references/{task-context,consumer-verification}.md` 和 `scripts/check-rendered-controls.mjs`：工作流与消费者自查。
- `tests/fixtures/agent-examples/app.tsx`、`scripts/agent-example-browser.mjs`、`scripts/agent-examples.mjs`：标准宿主及本地浏览器验收。
- `scripts/lib/consumer-style-verification.mjs`、`packages/lint/button-icon-slots.mjs`：安装后样式回归与静态误用检查。

## 已运行的验证

隔离验证使用 Node 22.17.0、pnpm 10.12.4、npm 10.9.2、Playwright 1.55.1、Chromium 140.0.7339.186。隔离工作树采用独立依赖安装；消费者从本地 Registry 安装源码，不靠组件库 workspace 链接。

| 验证 | 结果与范围 |
| --- | --- |
| 相关测试整组 | 最终隔离运行 14 个文件、166 项通过，包含实际 Chromium 脚本测试；不是整个仓库的全量测试 |
| 类型与设计检查 | 隔离工作树 typecheck、lint:design 通过；主目录最终 typecheck、lint:design 也通过 |
| 指南示例 | 13 份指南的 13 个 TSX 示例类型检查通过；Skill 校验通过 |
| 目录与检索 | 主目录重新生成后 agents:check 通过，33/33 检索用例 Top-3 命中 |
| 官方业务消费者 | Next 15.5.9 + pnpm；Vite 8.2.1 + pnpm：两者均完成安装、类型检查、生产构建和完整浏览器验收 |
| 安装后样式消费者 | Next 15.5.24 + npm、Next 15.5.24 + pnpm、Vite 8.2.1 + npm：三个实际 profile 通过；未以此声称 Vite + pnpm 的同一套样式矩阵通过 |
| 外部独立脚本 | 脚本复制到仓库外项目，仅使用其自己的 Playwright，在 Next 生产预览的 390×844、1440×1000 尺寸运行，均退出 0；脚本哈希与最终资源一致 |

每个官方业务消费者分别执行 32 个适用业务状态，全部通过；另有 2 个明确不适用的集合空态，未计作通过。还执行 3 条键盘业务流程、6 个页面尺寸检查和 2 个宿主检查。宿主验收包括分组激活反馈、键盘导航、真实内容切换、桌面折叠/紧凑账号、移动抽屉关闭及账号菜单操作。

导航图标与文字的中心差在手机和桌面均为 **0px**，间距 **8px**，内容处于控件边界内。安装后按钮覆盖前后图标、五种尺寸、中文动态文案、纯图标、禁用和加载态；亮/暗主题及 390/1440px 下适用几何检查通过。加载前后尺寸保持稳定：Next 为 154×32px，Vite 为约 153.14×32px。

在真实安装 CSS 中构造“把图标移入文字标签”的临时反例，检查器正确返回 failed：Next 中心差 18px、Vite 17.5px，间距 -16px，越界；测完移除反例。浏览器单测另覆盖相邻动态文字节点、空白可访问名称、隐藏/富文本/无控件，以及经符号链接运行 CLI、404 页面输出 unchecked 且退出 2。独立外部项目验证的是运行与依赖边界，反例识别由实际安装样式用例和浏览器单测分别证明。

## 证据与版本身份

原始报告、截图、日志及文件哈希清单保存在仓库内忽略目录：

`output/agent-adoption/implementation-2026-10-05/`

关键证据：

- `final-isolated-tests.log`：最终 166 项整组结果。
- `examples/next-adoption-isolated-03/`、`examples/vite-adoption-isolated-02/`：安装/构建报告、浏览器状态结果、独立宿主测量、页面截图。
- `examples/next-adoption-isolated-03/portable-check.json`、`portable-package*.json`：外部项目脚本执行报告与自有依赖身份。
- `consumer-styles/{npm-button,pnpm-button,vite-button}-components.json`：实际样式、反例与加载尺寸；同目录包含主题/尺寸截图。
- `root-catalog-*.json`、`isolated-catalog-*.json`、`skills-manifest.json`、`identity.json`：各验证范围对应的资源身份。
- `evidence-files.json`：上述证据文件的字节数和 SHA-256。

| 身份 | 值 |
| --- | --- |
| 改动前开发上下文 catalogVersion | `a207b9e8b0d5a8fc5e0398c66f1d71bc8703f7462fc742d88dded3beb333eec7` |
| 最终隔离上下文 catalogVersion | `bffee2cae8ee27169398ec1f0902260136e79ad6f65820f2ac99300b2f68b069` |
| 主目录本次末次生成 catalogVersion | `770d516a3d6580bfdcb9246b7094929e3b436a7bd55d20c40e9306b6534d1ad9` |
| 最终 Skill 包身份 | `a620f5790052ad538efeda0fed336205a2be999c353aed17ca65d53dfd8c8060` |
| 最终消费者检查脚本 SHA-256 | `b4cc7fa09db1f7e3bbde759df4a38397d7d14b6b2cde4b44887baae20f8a106f` |
| Next/Vite 浏览器验收 sourceRevision | `f782dc367ddc1acbbda6b6c867d93c4aafe9ad04`；`sourceClean=false` |
| Next/Vite 浏览器验收 sourceInputSha256 | `bcf42fb543a074c1ec28a9873bb03604c51a5f6b7a374bca126408f4db15f412` |
| 官方示例源码清单 SHA-256 | `2ffa34d420b8a36d83da994470199cc55c1b51c228676e7843292ce1be086ade` |

主目录同时存在其他任务的 Block/文档改动，因此主目录和隔离目录的条目数、版本不同；两者不可互相冒充发布身份。浏览器完整业务验收之后只补充检查器的空白名称与 CLI 路径处理及对应测试，宿主、页面与安装组件未随之修改；最终脚本另经独立项目执行及 166 项测试验证。这里没有一份已绑定全部最终源码的正式发布验收输入。

曾有源文件并发变化导致版本门禁拒绝、磁盘不足导致安装/测试失败，以及浏览器测试定位与选择框就绪时序问题。均保留尝试日志；改用隔离工作树、清理本任务缓存并修正检查后重新运行，最终结果通过。末次主目录整组尝试曾报 `llms-full.txt is stale`，随后重新生成并通过 agents:check，重跑目录生成与指南路由两个文件的 11 项测试也通过；稳定源码上的整组结论采用隔离的 166 项结果。

输出目录不进入 Git。交接或删除工作区之前必须将这些证据复制到受控存储；摘要 Markdown 不能代替原始报告。临时隔离工作树清理前已把所需报告保存到上述主目录路径。

## 复验入口

使用 Node 22 和固定包管理器，按顺序执行目录检查；业务消费者每次使用新的输出目录：

```sh
pnpm typecheck
pnpm lint:design
pnpm agents:guides:examples:check
pnpm agents:check
pnpm agents:evaluate
pnpm test:consumer:styles
pnpm agents:examples --framework next --package-manager pnpm --output output/agent-examples/next-new-attempt --check-browser
pnpm agents:examples --framework vite --package-manager pnpm --output output/agent-examples/vite-new-attempt --check-browser
```

`--check-browser` 会在安装和构建后启动并关闭自身生产预览，写入 `local-browser-verification.json`，不能与 `--serve` 合用。固定消费者模板与独立安装有磁盘成本，应保存报告后清理本次生成的 consumer/environment 缓存。

外部项目按 `consumer-verification.md` 获取并核验脚本，在项目目录安装自身 Playwright，然后检查实际业务路由：

```sh
pnpm add -D playwright@1.55.1
pnpm exec playwright install chromium
node /absolute/path/to/check-rendered-controls.mjs --url http://127.0.0.1:3000/orders --output output/orders-controls.json --viewport 390x844
```

URL 和脚本路径替换为实际值。退出码：0 为当前适用检查通过，1 为失败，2 为存在未检查项。脚本不准备业务状态，不代替侧栏交互、完整可访问性或 API 验收；分别准备加载、错误、权限和长文案状态后再检查。

## 剩余工作与下一步

1. **F 初始项目矩阵**：四项业务任务及改动前 57 份上下文资源已冻结。补齐三个既有应用初始项目与 API fixture，固定模型、客户端、预算和资源身份；按 `tests/fixtures/agent-adoption/README.md` 执行旧版/候选版各 12 次，共 24 次，保存首次交付与修复后结果。当前没有独立 Agent 成绩，不能补填成功记录。
2. **E 正式发布**：待本任务改动形成可追溯的干净源码并具备真实发布输入，沿用既有发布流程绑定 CLI、Registry、Skill 和 catalog；运行 published consumer/example 验收，再用真实客户端复验发现上下文→读源码→安装→业务适配→浏览器检查路径。维持 `INSTALLATION_UNVERIFIED` 保护，不能用本地验收替代。
3. **根据 F 失败分类迭代**：分别判断未发现、未读取、理解错误、业务适配错误、未自查与环境失败，决定是否加强入口、示例或检查。只有报告模型、任务、环境和前后结果后，才能得出 Agent 采用质量改善的结论。

本轮源码保留在主目录，未提交、推送或发布。其他任务正在修改的 Block/AI 页面不属于本修复的交付边界。

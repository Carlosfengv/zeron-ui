# Zeron 组件库 E2E 测试落地方案

日期：2026-10-10。状态：阶段 A 实现与本地验收完成，首次 GitHub 工作流验收待提交后执行；阶段 B/C 待实施。核对基线：`e121ba55` 及当前工作区的测试配置。实际结果见[阶段 A 实施与验收记录](2026-10-10-e2e-stage-a-implementation.md)。

本方案通过三个阶段建立持续运行的浏览器验证：先把已有 E2E 接入 CI，再补齐高风险组件交互，最后增加跨浏览器检查和少量视觉回归。单元和组件测试继续承担状态逻辑、数据处理及契约检查；E2E 重点验证浏览器行为、组件组合和安装后的可用性。

首个交付范围是统一运行入口、现有五套 Playwright 配置的 Chromium CI 覆盖，以及可以定位失败的报告。阶段 A 已实跑：完整模式 70 项通过，PR 模式连续三次各 61 项通过；源码/构建关联、跳过项、故障证据与远端验收边界均在实施记录中说明。

## 审查结论与预期收益

方案方向成立，优先实施 A，再实施 B；C 在前两批次稳定后推进。A 可以利用已有测试取得最快的回报，B 直接补充组件库的浏览器与消费端行为证据，C 增加浏览器兼容和视觉变化的检查能力。

本次审查修正了以下实施缺口：

| 优先级 | 原方案问题 | 修订后的要求 |
| --- | --- | --- |
| P1 | `.next/BUILD_ID` 只能证明构建存在，不能证明对应当前源码 | 成功构建后记录源码输入与构建 ID，复用构建时校验；不匹配即要求重新构建 |
| P1 | 消费者矩阵描述容易被理解为 Next/Vite × npm/pnpm 四组合 | 明确当前默认三组合：Next+npm、Next+pnpm、Vite+npm；Vite+pnpm 单独列为扩展 |
| P1 | 只记录进程退出码，全部跳过的套件也可能显示成功 | 读取结构化测试结果；预期执行的套件若实际执行零项，整体失败 |
| P1 | 上传附件使用 always 不代表前序行为测试失败后仍会执行视觉检查 | 为视觉步骤显式设置构建成功且未取消的执行条件，分别记录两类结果 |
| P2 | `ubuntu-24.04` 标签本身无法锁定字体和系统依赖 | 视觉检查使用版本匹配、digest 固定的 Playwright 容器与固定字体资产；升级时审查基线 |

### 能带来的具体收益

以下是实施并验收后的预期收益。文档本身提供实施范围、优先级和验收口径；保存文档不会自动提高当前测试覆盖。

| 收益 | 实施前情况 | 实施后的变化 | 如何验证收益 |
| --- | --- | --- | --- |
| 更早发现回归 | 主 CI 只自动执行五套配置中的导航 E2E | 构建及前置检查通过的 PR 自动执行全部五套 Chromium 配置；required check 阻止已覆盖场景的失败进入主分支 | 五套配置均有实际执行结果；临时制造焦点/复制等回归，确认 CI 失败且阻止合并 |
| 提高组件组合的可靠性 | jsdom 难以完整验证真实焦点、Portal 层级、滚动和布局 | 在浏览器中验证 Dialog 内弹层、Select/Combobox 键盘操作及 DataGrid 编辑状态 | 验证实际焦点、点击结果、滚动后的值；对关键行为做可控回归验证 |
| 减少用户安装后的问题 | 现有消费端检查偏向样式，选择与关闭后的焦点证据不足 | 原三组合的独立消费者新增 Select 受控选择和 Dialog 焦点验证 | 使用打包 CLI 和本地 HTTP Registry，在独立 Next/Vite 项目中验证；同时保留原样式断言 |
| 降低复现和定位成本 | 专项测试报告分散，输出目录可能被下一轮清理 | 每个套件都有独立 trace、截图、结构化结果及源码/构建关联 | 故意触发一次失败，另一位维护者可用附件还原失败步骤；后续记录实际定位耗时 |
| 减少完整本地回归的重复工作 | 连续调用五个专项命令会触发五次生产构建 | 统一完整回归复用一次构建；CI 复用自身已完成的构建 | 对完整本地回归记录构建次数和总耗时；不把新增 CI 覆盖宣称为 CI 总耗时下降 |
| 发现兼容性和视觉退化 | CodeBlock 跨引擎配置未接入主 CI；没有自动图片比较 | 扩展检查执行明确范围的 Firefox/WebKit 场景，并比较 16 张固定视觉基线 | 刻意改变浮层宽度、控件尺寸或主题色，确认对应检查或图片 diff 能识别 |

成功指标包括：已有五套 Chromium 配置全部执行、消费者默认三组合通过、报告完整、重复构建消除、规定范围的兼容性检查通过，以及视觉基线稳定。缺陷拦截率、定位时间和用户问题数量需要实施后记录，当前不能承诺百分比下降。

### 收益边界与投入

该方案仍需维护测试、处理误报和审查基线；新增覆盖会增加 CI 执行时间。A 阶段重点投入现有用例稳定性、执行器和 CI，B 阶段投入有真实组合意义的演示及行为断言，C 阶段投入容器/字体固定和图片维护。

覆盖只对列出的演示、输入和环境有效。WebKit 移动端模拟不等于真实 iPhone/Safari 验收；本地打包 CLI 与 HTTP Registry 的通过不等于正式发布资源可用，发布验证仍由现有 `test:consumer:published` 等流程承担。真实业务后端、系统输入法、真机手势、性能和完整可访问性审计也不由本方案保证。

## 1. 当前实现与缺口（实施前基线）

### 1.1 已有测试

以下路径均相对于仓库根目录。

| 测试层级 | 当前入口 | 实际范围 |
| --- | --- | --- |
| 单元和组件测试 | `pnpm test:unit` | Vitest、Testing Library；覆盖组件交互、受控状态、数据逻辑、源码和分发契约 |
| Chromium 控件检查 | `pnpm test:controls:browser` | `tests/rendered-controls.test.mjs`；验证控件检查器在实际浏览器中的测量和报告能力，部分使用手工 HTML 夹具 |
| 文档站 E2E | 下表五套配置 | 在 Next 生产构建上执行导航、焦点、编辑、加载与恢复检查 |
| 独立消费者验证 | `pnpm test:consumer:styles`、`pnpm test:consumer:migrations` | CLI 安装/迁移后，在独立项目中检查构建、浏览器样式及部分交互 |
| 扩展消费者验证 | `pnpm test:consumer:unification` | 独立 Next/Vite 消费者中的布局、主题、图表及部分组件行为；当前没有接入主 CI 工作流 |

控件检查器测试、组件交互测试和生产文档站 E2E 分别提供不同证据，不能用其中一类的通过替代另一类。

| Playwright 配置 | 用例文件 | 主要覆盖 | 现有项目 | 主 CI 自动执行 |
| --- | --- | --- | --- | --- |
| `playwright.config.ts` | `i18n-navigation.e2e.ts`、`docs-collections.e2e.ts` | 语言切换、路径/query/hash 保留、搜索、历史记录、移动端集合导航 | Chromium；用例内部也有移动端视口 | 否 |
| `playwright.navigation-loading.config.ts` | `navigation-loading.e2e.ts` | 导航竞态、请求中断、失败恢复、返回历史 | Chromium 桌面、移动端减少动态效果 | 是 |
| `playwright.focus.config.ts` | `focus-modality.e2e.ts` | focus-visible、抽屉焦点恢复、Tree 键盘和菜单操作 | Chromium 桌面、移动端 | 否 |
| `playwright.code-block.config.ts` | `code-block.e2e.ts` | 复制、编辑、查找替换、输入法事件、窄屏和 hydration | Chromium 桌面/移动端、Firefox 桌面、WebKit 移动端 | 否 |
| `playwright.detail-loading.config.ts` | `detail-loading.e2e.ts` | 懒加载、错误重试、状态保留、DataGrid 编辑和布局 | Chromium 桌面、移动端 | 否 |

上述六个文件都位于 `tests/`。当前 `--list` 共发现 82 个测试实例，包含项目/视口展开和随后会跳过的组合，不等于 82 个独立业务场景，也不代表执行通过。

CodeBlock 的 Firefox/WebKit 复制用例替换了 `navigator.clipboard`，验证复制文本和界面反馈；真实系统剪贴板只由当前 Chromium 路径验证。

### 1.2 需要解决的问题

1. `pnpm test` 只运行单元/组件测试与 Chromium 控件检查，缺少统一 E2E 入口。
2. 主 CI 和干净检出验证都运行导航 E2E，其余四套配置尚未成为自动检查。
3. 每个现有 `test:*:e2e` 命令都包含 `pnpm build`，依次运行会重复构建。
4. Dialog、Select、Combobox 等高风险组件已有 jsdom 交互测试，但真实浏览器中的组合、焦点和几何行为需要补充。
5. 当前截图主要作为检查证据，未发现 `toHaveScreenshot` 自动基线比对。

## 2. 覆盖原则与边界

优先增加能捕获浏览器差异的用例：Portal 挂载与层级、焦点恢复、键盘操作、滚动和虚拟列表、剪贴板、输入法事件、响应式几何、CSS 主题及 SSR hydration。

每个 E2E 必须验证用户可见结果，例如选择后的文本、关闭后实际焦点、滚动后的编辑值、失败后的重试入口。源码字符串、属性排列、纯数据解析继续由已有单元和契约测试检查。定位优先使用 role、label 和可访问名称；有必要时使用明确的测试标识。[Playwright 的测试建议](https://playwright.dev/docs/best-practices)支持这种写法。

本轮不追求所有组件、全部变体、全部浏览器和全部视口的笛卡尔积。首批不接入真实 OAuth、支付、邮件或业务后端；业务 Block 验证组件与宿主回调的协作。已有消费者安装验证继续保留，不在每个 PR 额外运行完整 unification 矩阵。

## 3. 阶段一：已有 E2E 进入 CI

### 3.1 先建立执行基线

使用 Node 22、`pnpm@10.12.4` 和锁文件安装依赖。当前本地 `playwright` 与 `@playwright/test` 均为 1.55.1；实施时以锁文件实际解析版本为准，安装对应浏览器。

在隔离的检出目录中完成一次生产构建，再分别执行五套配置。首轮保留现有用例、项目名称、视口、超时和服务器端口；记录实际执行、跳过、失败及耗时。先修复可复现的产品问题或不稳定等待，再把套件设为合并检查。

现有代码可以直接执行以下基线命令：

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm code-engine:build
pnpm build
pnpm exec playwright test --config playwright.config.ts
pnpm exec playwright test --config playwright.navigation-loading.config.ts
pnpm exec playwright test --config playwright.focus.config.ts
pnpm exec playwright test --config playwright.code-block.config.ts
pnpm exec playwright test --config playwright.detail-loading.config.ts
```

每条测试命令读取同一份构建产物。现有配置自己启动和关闭生产服务器，运行时不要同时启动占用相同端口的服务。

### 3.2 增加统一入口

新增 `scripts/run-e2e.mjs`，顺序调用现有配置，并支持 `--build` 和 `--build-only`。前者执行一次 `pnpm build` 后运行测试，后者执行一次构建并记录构建依据，供同一 CI job 的后续检查复用。阶段一保留五份配置，避免合并配置时改变依赖 `testInfo.project.name` 的条件跳过和断言。

阶段 A 已增加以下 `package.json` 脚本：

```json
{
  "test:e2e:build": "node scripts/run-e2e.mjs --build-only",
  "test:e2e": "node scripts/run-e2e.mjs --mode pr --build",
  "test:e2e:run": "node scripts/run-e2e.mjs --mode pr",
  "test:e2e:full": "node scripts/run-e2e.mjs --mode full --build",
  "test:e2e:full:run": "node scripts/run-e2e.mjs --mode full"
}
```

| 运行模式 | 配置范围 | CodeBlock 项目 | 构建方式 |
| --- | --- | --- | --- |
| `pr` | 全部五套配置 | `chromium-desktop`、`chromium-mobile` | 本地 `test:e2e` 构建一次；CI 调用已有构建后的 `test:e2e:run` |
| `full` | 全部五套配置 | 全部四个项目 | 本地 `test:e2e:full` 构建一次；扩展 CI 调用 `test:e2e:full:run` |

除 CodeBlock 外，阶段一的其他套件继续使用各自当前的 Chromium 项目，不宣称全库已覆盖 Firefox/WebKit。旧的专项命令保留，便于单独调试。

执行器必须满足：

- 校验模式；成功构建后写入 `.next/e2e-build.json`，记录 revision、BUILD_ID、锁文件哈希、Node/pnpm 版本、构建模式和源码输入指纹。指纹覆盖应用、文档、公共源码/资源及相关构建配置，包括未忽略的新输入文件，不读取私有凭据。构建前后输入有变化则不生成有效记录。
- 复用构建时校验记录与当前输入；缺失记录、BUILD_ID 不匹配、源码/配置/锁文件变化或构建模式变化均明确失败并要求重建。单独存在 `.next/BUILD_ID` 不能作为最新源码的通过证据。
- 使用参数数组启动进程；按套件顺序执行，不并发占用浏览器和构建资源。
- 一个套件失败后继续收集其余套件结果；任何套件失败，最终退出码非零。
- 为每套配置传入独立的 `--output`，避免后一个测试进程清理前一个的附件。
- 独立生成 HTML/JUnit/JSON 报告，设置 `PLAYWRIGHT_HTML_OPEN=never`；报告目录按运行模式和套件分开。
- 输出 `summary.json`，至少包含源码指纹、Git revision、构建 ID、模式、配置、项目、耗时、退出码和状态；从 JSON 结果读取实际通过、失败、flaky 和 skip 数量，报告缺失/损坏或预期套件实际执行零项均判失败。
- 中断时转发信号并等待子进程退出，停止后续套件，记录 interrupted 并返回非零退出码。

证据统一放在 `output/e2e/<mode>/<run>/<suite>/`，每次运行保留自己的 `summary.json`，最新汇总另写入 `output/e2e/<mode>/summary.json`；该目录已由仓库忽略规则覆盖。

为执行器增加 `tests/e2e-runner.test.mjs`，通过可控的子进程替身验证模式选择、项目过滤、失败汇总、零执行/报告缺失、构建新鲜性、独立输出路径和中断处理，不在该单元测试中再次启动浏览器。

### 3.3 CI 改动

在 `.github/workflows/ci.yml` 的 `checks` job 中，将已有 `Build` 步骤的命令替换为 `pnpm test:e2e:build` 并设置 `id: build`；保留 `test:production`，把最后的单独导航 E2E 步骤替换为 `pnpm test:e2e:run`。构建和前置检查通过后执行 E2E，沿用已安装的 Chromium，整个 job 不为各套 E2E 再次构建。

将导航专用附件上传改为上传 `output/e2e/pr/`，使用 `if: always()`，保留 14 天。`agent-clean-checkout` 继续保留当前导航验证，用于隔离检出证据；阶段一不向该 job 再复制一套全部 E2E。

新增 `.github/workflows/e2e-extended.yml`：

- 支持手动触发；建议每日北京时间 02:00 运行，GitHub cron 对应 UTC 18:00。
- 行为检查使用 `ubuntu-24.04`，安装锁定依赖及 Chromium、Firefox、WebKit，执行 `test:e2e:build` 一次，再运行 `test:e2e:full:run`。
- 按套件上传独立报告；全量失败应体现在工作流状态中，不使用 `continue-on-error`。
- 阶段三将视觉检查加入这个工作流，复用其构建。

构建前执行现有源码/生成一致性检查；Code Engine 输入与主 CI 使用相同的准备步骤。构建依据记录必须在所有准备操作结束后生成。手动检查明确选择待验证 ref 并记录最终 SHA，夜间结果只证明该次检出的 SHA，不能替代另一份发布 revision 的检查。

在五份配置中统一设置 CI 禁止 `test.only`、失败保留 trace 和截图。PR 默认不重试；扩展检查如设置一次重试，需同时启用 `failOnFlakyTests`，使重试后通过仍暴露为不稳定失败。Playwright 对重试后通过的测试有独立 flaky 分类，不能把它混入稳定通过。[重试行为说明](https://playwright.dev/docs/test-retries)。

工作流检查接入后，核对分支保护是否已要求 `checks` 成功；仅在 workflow 中增加步骤不能保证阻止合并。本轮已启用并读取验证 `main` 的 `checks` required check；新工作流首次运行仍需提交后验收。

### 3.4 阶段一验收

- [x] 干净隔离检出能够冻结锁文件安装、准备输入、构建并运行五套现有配置。
- [x] `pr` 模式覆盖五套配置，CodeBlock 同时覆盖 Chromium 桌面和移动端。
- [x] `full` 模式实际运行 CodeBlock 的 Firefox 和 WebKit 项目。
- [x] 每个运行目标仅构建一次；沿用现有服务器端口和项目名称。
- [x] 构建后修改应用输入或锁文件，复用命令拒绝旧构建；执行器测试确认全部 skip 或缺少结果文件不能显示成功。
- [x] 同一 revision、源码指纹及构建的 PR 模式连续三次首次执行通过；按项目设计跳过的组合有明确理由。
- [x] 本地注入断言失败，runner 最终失败、其余套件继续执行、独立报告及 trace/截图有效；随后恢复断言。
- [x] 中断执行后无遗留测试服务器；`main` 已启用并读取验证 `checks` required check。
- [x] README 说明统一命令、浏览器安装要求、专项调试及报告路径。
- [ ] 提交后在 GitHub 实跑新工作流，验证 Linux 结果、下载失败 trace，并验证失败的 required check 阻止合并。

## 4. 阶段二：补齐高风险交互

首批新增三个 E2E 文件，使用独立的 `playwright.components.config.ts`，沿用桌面 1440×960、移动端 390×844 的 Chromium 项目。新配置加入 `pr` 和 `full` 执行清单。不要把它加入 Vitest 的 `*.test.*` 文件匹配。

默认在 `/en/docs/components/<slug>` 的真实演示上测试。现有演示缺少必要组合时，补充有实际说明价值的文档演示，再按文档生成规则更新源码索引；不依赖被忽略的 `app/test/` 私有页面。

| 优先级 | 拟新增文件 | 首批场景 | 可观察的验收结果 |
| --- | --- | --- | --- |
| P0 | `tests/overlay-interaction.e2e.ts` | Dialog 键盘打开/关闭；Dialog 内 Select/Popover；移动端滚动；关闭动画结束前重新打开 | 初始焦点合理、Tab 留在模态窗口内；Escape 优先关闭内层；关闭后焦点回触发器；内层浮层可点击；背景不能滚动；重新打开后内容仍在 |
| P0 | `tests/selection-controls.e2e.ts` | Select 方向键/Enter/Escape；Combobox 搜索和无结果；关闭再打开；禁用项和受控值 | 选中值与触发器文本一致；取消保持原值；禁用项不能提交；搜索反馈可见；焦点恢复正确；浮层不超出视口 |
| P1 | `tests/data-grid-interaction.e2e.ts` | F2/Enter/Escape 编辑；编辑后滚动离开再返回；排序/筛选；不同实例与窄屏 | 提交或取消结果正确；数据按稳定行身份保留；实例状态不串联；网格内部可以横向滚动，页面不产生意外横向溢出 |

现有 `detail-loading.e2e.ts` 已覆盖 DataGrid 编辑后滚动回来、懒加载激活和页面溢出。阶段二保留该覆盖，新增文件重点补编辑取消、排序后的行身份和实例隔离，不重复搬运同一条用例。

Tree 已有真实键盘/菜单验证，CodeBlock 已有编辑和输入法事件验证，阶段二直接复用。文件上传、日期约束、图表 Brush/Tooltip 等列为后续按缺陷或变更触发的扩展，不进入首批门槛。

### 4.1 等待、数据与错误处理

- 使用 `expect(...).toBeVisible()`、`toBeFocused()`、`toHaveText()` 和 `expect.poll()` 等等待实际条件；固定延时不能作为交互完成的主要判断。
- 每条用例独立创建浏览器上下文；固定数据、随机种子和必要的时间，不依赖上一条测试残留状态。
- 网络失败/延迟用例拦截受控请求，并在清理阶段释放或取消；HTML、组件代码与浏览器交互保持真实。
- 记录 pageerror 和 hydration 错误并使测试失败；第三方统计请求如需排除，列出具体 URL/错误及理由，不笼统忽略所有 console error。
- 行为测试保留正常动画；减少动态效果单独验证。关闭后重新打开等竞态场景不能通过禁用动画绕过。
- 浏览器合成的 composition 事件验证输入处理契约；真实系统输入法、真机触摸仍需另行人工验证。

### 4.2 安装后的关键交互

复用现有消费者样式验证，扩展 `scripts/test-consumer-installs.mjs` 和 `scripts/lib/consumer-style-verification.mjs`：在原安装集合 Button/Input/Card/Dialog 上增加 Select，并在当前默认三组合 Next+npm、Next+pnpm、Vite+npm 内增加两条行为：

1. 键盘选择 Select 后，消费端页面显示对应受控值。
2. 关闭 Dialog 后，焦点回到打开它的按钮。

安装条目、生成的消费者页面和断言必须一起修改。原有明暗主题、按钮尺寸、Portal 样式检查继续保留；这些行为随已有 `pnpm test:consumer:styles` 进入 CI，避免为同一矩阵增加第二轮安装构建。

Vite 默认只运行 npm；Vite+pnpm 可通过 `ZERON_VITE_CONSUMER_PACKAGE_MANAGERS=npm,pnpm` 扩展。首批维持三组合，后续根据安装兼容性问题决定是否扩大，不能把未运行的第四组合计入验收。

### 4.3 阶段二验收

- [ ] 三个新增文件全部使用公开文档演示，纳入统一执行器。
- [ ] 桌面和移动端的适用场景首次执行通过；键盘场景至少覆盖桌面，几何与滚动场景覆盖移动端。
- [ ] 覆盖真实的焦点、Portal、滚动和编辑行为，没有用直接改 DOM 替代关键用户操作。
- [ ] 修改相关组件能触发对应用例失败，例如去掉焦点恢复、错误覆盖编辑值；检查后恢复修改。
- [ ] 新增 Select 和 Dialog 焦点验证在 Next+npm、Next+pnpm、Vite+npm 三组合中通过。
- [ ] 文档演示变更涉及的生成文件检查通过，新增交互不引入运行时/hydration 错误。

## 5. 阶段三：跨浏览器与视觉回归

### 5.1 跨浏览器

在 `playwright.components.config.ts` 中增加 `firefox-desktop` 和 `webkit-mobile`，由 `full` 模式选择。覆盖阶段二的弹层、选择控件和 DataGrid 适用场景，保留项目范围的明确 skip 理由；PR 继续只选 Chromium。

执行器为组件配置显式传入项目过滤：`pr` 选择 `chromium-desktop`、`chromium-mobile`，`full` 选择全部四个项目，避免新增项目后意外扩大 PR 范围。

不将所有现有配置直接展开到全部浏览器。优先检查 CSS/焦点/滚动/输入差异；导航和文档集合继续沿用其 Chromium 检查。

### 5.2 首批 16 张视觉基线

新增 `playwright.visual.config.ts` 与 `tests/visual/components.visual.ts`。首批选择四个固定区域，每个区域覆盖桌面/移动端与 light/dark，共 16 张基线：

| 固定区域 | 检查重点 |
| --- | --- |
| Button + Input 的固定组合演示 | 同一画面同时展示默认、禁用、加载态，检查尺寸、图标与文字对齐、主题颜色 |
| 已打开的 Dialog | 内容、遮罩、Portal 样式、移动端宽度 |
| 已打开的 Select | 弹层定位、选中项、文字溢出、主题颜色 |
| 固定数据的 DataGrid | 表头、单元格、选中状态和窄屏裁切 |

截图按组件/区域截取，Dialog 等 Portal 区域必须包含相应浮层或遮罩。使用 `toHaveScreenshot()` 自动比较，保留 actual/expected/diff；截图文件提交到 `tests/visual/__screenshots__/`，测试报告仍写入 `output/e2e/visual/`。

视觉检查选择与锁文件实际 Playwright 版本匹配的官方 Noble 容器，确认镜像可用后固定 digest，并固定字体资产、视口、语言和 UTC 时区。容器内使用项目要求的 Node 22/pnpm，不直接依赖镜像自带 Node 版本；初始/更新基线在同一镜像生成。系统或浏览器升级须显式更新镜像并审查 diff。镜像与项目 Playwright 版本需要一致。[官方容器说明](https://playwright.dev/docs/docker)。

扩展工作流在该容器内构建和运行行为/视觉检查，所有测试共用一次容器内构建，不复用宿主机生成的依赖和 `.next`。等待字体加载和演示 ready，固定数据及日期；视觉项目使用减少动态效果并在截图时禁用动画。行为项目的动画保持原设置。[视觉比较说明](https://playwright.dev/docs/test-snapshots)解释了统一渲染环境的必要性。

移动光标离开截图区域，避免无意的 hover 状态；有意检查 hover 时明确触发。动态时钟只在非检查对象区域局部遮罩，禁止遮住待检查组件、错误文本或焦点标识。初始采用默认差异参数，重复运行后再针对具体区域记录必要容差。

新增 `test:e2e:visual`（通过 `test:e2e:build` 构建后运行）与 `test:e2e:visual:run`（校验并复用构建）命令；视觉复用入口的构建校验逻辑复用执行器。视觉检查独立于 `full` 行为模式，构建步骤设置 `id: build`，视觉步骤使用 `if: ${{ !cancelled() && steps.build.outcome == 'success' }}`，使行为失败后仍可收集视觉结果，构建失败或取消时不继续启动测试。两类附件始终分别上传，工作流保留行为和视觉各自的失败状态。[GitHub 状态条件说明](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions)。

基线更新复用扩展工作流的 `workflow_dispatch`，增加 `visual_action` 输入 `verify`/`candidate`，默认 `verify`。只有显式选择 `candidate` 时允许 `--update-snapshots`，生成候选图片和 diff 附件，再人工审查并提交图片与对应组件修改。candidate 不计为视觉验证通过，普通/夜间 CI 不能自动更新或提交基线。视觉检查先作为扩展检查运行；同一 revision 在至少三次独立 job 中合计重复十次、无非预期差异后，再决定是否纳入 PR required check。

### 5.3 阶段三验收

- [ ] 阶段二的适用场景在 Firefox 桌面与 WebKit 移动端通过。
- [ ] 16 张视觉基线可在固定 Linux 环境重复生成，动态内容处理有明确范围。
- [ ] 修改控件尺寸、浮层宽度或主题色可产生可读 diff；随后恢复修改。
- [ ] 正常 CI 无自动基线更新；缺失基线会失败。
- [ ] 行为用例失败后仍能获取独立视觉结果；构建失败或取消时不误启动测试。
- [ ] 视觉稳定性通过后才加入 PR 检查；跨浏览器仍由扩展工作流和发布前完整检查承担。

## 6. 文件改动与实施批次

| 批次 | 文件 | 交付内容 |
| --- | --- | --- |
| A：现有 E2E 门槛 | `package.json`、`scripts/run-e2e.mjs`、`tests/e2e-runner.test.mjs`、五份现有 `playwright*.config.ts`、`.github/workflows/ci.yml`、`.github/workflows/e2e-extended.yml`、`README.md` | 执行入口、基线修复、报告隔离、Chromium 自动检查与扩展工作流 |
| B：组件交互 | `playwright.components.config.ts`、三个新 `tests/*.e2e.ts`、必要的 `docs/pages/components/` 演示与生成文件、执行器清单 | 弹层、选择、DataGrid 的高风险真实浏览器行为 |
| B：消费者 | `scripts/test-consumer-installs.mjs`、`scripts/lib/consumer-style-verification.mjs` | 安装 Select、受控选择结果和 Dialog 焦点验证 |
| C：扩展检查 | 组件配置与执行器、视觉配置/测试/基线、必要的文档演示与生成文件、`package.json`、扩展工作流、`README.md` | Firefox/WebKit 场景和 16 张截图基线 |

建议拆成 A/B/C 三个可独立审查的小批次。A 阶段的历史用例失败先单独修复，避免与新场景混在一次大改动中。若实际修复涉及公开组件契约，配套更新对应单元测试和分发产物。

计划新增配置和执行器后，检查范围限定到这些文件；变更组件时运行对应单元/类型检查；修改 Registry 源码时运行 `registry:build`、`registry:check` 并提交对应生成差异；修改文档演示时运行相关源码生成与一致性检查。各批次最终用生产构建及相应 E2E 验收。

## 7. 耗时与失败维护

第一阶段记录 E2E 增量耗时，分别列出服务器启动、浏览器执行和报告生成，不把已有安装/构建时间计入新增测试开销。以 PR E2E 步骤中位耗时不超过 10 分钟为初始目标；尚无实测，因此它是优化目标，不是当前性能承诺。

超过目标时，先修正重复构建、重复导航、无意义的长等待和不必要的项目展开，再评估 suite 拆 job。首次不引入分片、远程缓存或复杂测试平台。

| 失败类型 | 处理方式 | 完成条件 |
| --- | --- | --- |
| 产品回归 | 结合 trace 确认焦点/值/页面变化，修复实现 | 原用例及相关单元测试通过 |
| 测试不稳定 | 检查等待、时钟、数据及请求拦截，修复测试 | 同一 revision 连续三次首次执行通过 |
| 环境问题 | 核对 Node/pnpm、浏览器、字体和构建产物 | 干净检出可复现运行 |
| 预期视觉变化 | 审查 actual/expected/diff，在固定环境生成新基线 | 图片与组件修改一起审查并提交 |

禁止通过扩大所有超时、笼统忽略异常或永久 skip 来消除红灯。临时 skip 必须说明适用项目、缺陷关联及恢复条件，不计作覆盖完成。扩展工作流失败由变更维护者处理，各批次由该批次实施者负责直到验收并交接维护方式。

发布前检查按已完成批次要求：A 要求对应 revision 的 full 行为检查及现有消费者检查；B 增加首批组件和消费者行为；C 验收后增加视觉检查。未实施的视觉检查不能提前成为 A/B 的发布前置条件。正式发布后的包/Registry 资源验证继续走现有发布验证流程。

## 8. 整体验收清单

- [ ] 本地有统一 E2E 命令，专项命令仍可调试。
- [ ] PR 自动运行已有五套 Chromium 检查和首批新增组件场景。
- [ ] 扩展工作流运行明确范围的 Firefox/WebKit 与视觉检查。
- [ ] 用户通过 CLI 安装后的 Select/Dialog 关键交互有独立消费者证据。
- [ ] 每个运行目标只构建一次，报告互不覆盖，失败会返回非零退出码。
- [ ] 旧构建、零实际执行或缺失报告不会产生通过结论。
- [ ] 16 张截图基线由固定环境生成并纳入版本管理。
- [ ] CI required check、失败责任和基线更新流程清楚且实际生效。
- [ ] 交付记录区分通过、失败、flaky、skip 和尚未执行，不以发现用例或截图留存替代验收。

## 9. 仓库依据

- [运行脚本与依赖](../../package.json)
- [主 CI 工作流](../../.github/workflows/ci.yml)
- [干净检出验证](../../scripts/check-agent-clean-checkout.mjs)
- [现有默认 Playwright 配置](../../playwright.config.ts)
- [焦点配置](../../playwright.focus.config.ts)、[CodeBlock 配置](../../playwright.code-block.config.ts)、[详情加载配置](../../playwright.detail-loading.config.ts)、[导航配置](../../playwright.navigation-loading.config.ts)
- [消费者安装入口](../../scripts/test-consumer-installs.mjs)、[消费者样式/交互检查](../../scripts/lib/consumer-style-verification.mjs)
- [扩展消费者浏览器验证](../../scripts/lib/unification-consumer-verification.mjs)
- [当前验证说明](../../README.md#validation)

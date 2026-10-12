# E2E 阶段 A 实施与验收记录

日期：2026-10-10。范围：统一已有五套浏览器测试、复用一次生产构建、接入 CI、保留失败证据。阶段 B/C 的新增组件交互与视觉回归不在本次范围内。

实施依据：[E2E 测试落地方案](2026-10-10-e2e-testing-plan.md)。

状态：阶段 A 的代码实现与本地验收完成，`main` 已要求 `checks` 成功；新工作流首次 GitHub 执行与附件下载待提交后验收。

## 1. 已实施内容

| 内容 | 落地位置 | 行为 |
| --- | --- | --- |
| 统一执行入口 | `scripts/run-e2e.mjs`、根目录 `package.json` | `pr` 顺序运行五套 Chromium 配置；`full` 额外运行 CodeBlock 已有的 Firefox 桌面和 WebKit 移动端项目 |
| 构建新鲜性 | `.next/e2e-build.json` | 关联源码输入指纹、锁文件、Git revision、Node/pnpm、公开构建环境和 BUILD_ID；构建前后输入变化或复用不匹配即失败 |
| 统一测试策略 | `playwright.shared.ts`、五份现有配置 | CI 禁止 `test.only`，不重试；失败保留 trace 和截图，flaky 不计入通过 |
| 独立结果与失败汇总 | `output/e2e/<mode>/<run>/<suite>/` | 每套保留 HTML、JUnit、JSON；失败后继续执行其他套件；零执行、缺失/损坏报告、非零退出码均导致整体失败 |
| PR 流程 | `.github/workflows/ci.yml` 的 `checks` job | 复用自身已完成的生产构建，执行五套 Chromium 测试，始终尝试上传报告，保留 14 天 |
| 扩展流程 | `.github/workflows/e2e-extended.yml` | 手动触发或每日北京时间 02:00 运行完整模式；同样只生产构建一次，并保留 14 天报告 |
| 执行器回归验证 | `tests/e2e-runner.test.mjs` | 15 项验证参数/项目选择、旧构建拒绝、失败汇总、报告隔离、SIGINT/SIGTERM 与子进程清理 |
| 使用说明 | `README.md` 的 Validation | 说明准备步骤、统一与专项命令、构建复用、报告和 trace 查看方式 |

原有 `agent-clean-checkout` 流程继续保留导航检查。新扩展流程仅运行已有浏览器项目，没有把全部测试展开到所有引擎。

## 2. 实跑发现并处理的问题

| 问题 | 修正 | 保留的验证目标 |
| --- | --- | --- |
| 文档导航和区块排序变化使旧期望失效 | 更新 AI 接入导航的键盘顺序及首个区块路径 | 仍检查焦点、集合切换和实际键盘翻页 |
| 导航竞态测试等待全站 network-idle，受到无关预取影响 | 明确等待被拦截请求完成或取消；切换前确认真实请求已被挂起 | 仍验证后发导航和历史导航不会被旧响应覆盖 |
| 详情测试仍依赖已移除的 Recharts 标记和旧页面包装结构 | 根据当前 AreaChart 标记发现实际构建依赖，检查 SVG 和稳定的 PageLayout 容器 | 保留资源延迟/失败恢复、高度、响应式和编辑断言 |
| WebKit 在 CodeView 尺寸回调中同步重建被观察容器，引发 ResizeObserver 循环错误 | 合并最新尺寸通知，在下一帧重建；reset/卸载时取消待处理回调 | 未忽略 pageerror，未增加跳过或重试；增加 2 项尺寸调度/卸载回归测试 |
| ContextWindow 使用原始字号类，导致既有语义字体检查失败 | 使用 `text-display`、`text-heading`，同步对应 Registry 和文档预览源码 | 保留原语义字体检查；展示字号采用现有语义定义 |

相关生成输出随源码更新：`public/r/code-engine.json`、`public/r/context-window-01.json`、ContextWindow 的文档源码资产及映射。工作区原有 FleetHealth、PersonalSettings 改动继续保留。

## 3. 验证环境与证据

使用 Node 22.17.0、pnpm 10.12.4、Playwright 1.55.1，在独立检出目录中进行冻结锁文件安装、生产构建及浏览器验证。验证目录没有复用当前开发服务器，也没有改写当前工作区的 `.next`。

### 3.1 通过结果

最终四次正常回归共用同一个生产构建，没有自动重试。下表耗时仅为本机测试执行时间，不包含生产构建，不代表 GitHub/Linux 耗时。

| 运行 | 通过 | 按配置跳过 | 失败 / flaky | 本地耗时 | 证据目录（仓库根目录下） |
| --- | ---: | ---: | --- | ---: | --- |
| full | 70 | 12 | 0 / 0 | 112 秒 | `output/e2e/full/2026-10-10T01-54-11-678Z-kV2pgz/` |
| pr 第 1 次 | 61 | 11 | 0 / 0 | 85 秒 | `output/e2e/pr/2026-10-10T01-56-03-887Z-OnYWPB/` |
| pr 第 2 次 | 61 | 11 | 0 / 0 | 86 秒 | `output/e2e/pr/2026-10-10T01-57-28-614Z-GjP5jK/` |
| pr 第 3 次 | 61 | 11 | 0 / 0 | 86 秒 | `output/e2e/pr/2026-10-10T01-58-54-457Z-qQS5aJ/` |

| 套件 | pr 通过 / 跳过 | full 通过 / 跳过 |
| --- | --- | --- |
| documentation | 6 / 0 | 6 / 0 |
| navigation | 14 / 0 | 14 / 0 |
| focus | 6 / 6 | 6 / 6 |
| code-block | 9 / 1 | 18 / 2 |
| detail | 26 / 4 | 26 / 4 |

跳过项均沿用既有设计：focus 的桌面键盘与移动抽屉场景按设备互斥；detail 的 4 个显式宽度场景不在移动项目重复；CodeBlock 的移动几何检查不在桌面项目执行。本次没有为失败场景新增 skip。CodeBlock 在完整模式中分别实际通过 Chromium 9 项、Firefox 4 项、WebKit 5 项。

其他验证：297 个单元测试文件、2,710 项测试全部通过；生产路由测试 3 项通过；lint、设计 lint、typecheck、162 项 Registry 闭包、50 项文档预览源码、Code Engine 生成资产及 Agent catalog 检查通过。单元测试包括 15 项执行器测试和 2 项新增尺寸调度测试。

构建关联：

```text
Git revision: e121ba551a15aa62859dd336f07d8f2b4e2d1f4a（基线；未提交输入由下列指纹区分）
Source input SHA-256: 0ef5eeed474ee37eef05c28d11f72897e29030d633e799803da9f17c124b8e87
Lockfile SHA-256: 9a8d8f76244be07de9065cc2e8b2e43cd9d28f98fc502ad9e0e5c4914b584384
Build ID: Q8xtgNihThJCNfeCgQSYd
Build recorded at: 2026-10-10T01:52:05.278Z
```

当前工作区与隔离检出的源码输入指纹一致。机器可读验收汇总为 `output/e2e/phase-a/acceptance.json`，构建记录为 `build-receipt.json`，正常/故障运行记录为 `positive.json`、`negative.json`；成功验证日志保存在该目录下的 `validation/`。

### 3.2 失败与清理验证

| 验证 | 实际结果 | 证据 |
| --- | --- | --- |
| 新增应用输入后复用 | 退出 1，五套均不执行，提示旧构建 | `output/e2e/pr/2026-10-10T01-52-30-236Z-vmZ0mQ/summary.json` |
| 修改锁文件后复用 | 退出 1，五套均不执行，提示旧构建 | `output/e2e/pr/2026-10-10T01-52-30-867Z-3Nx5i1/summary.json` |
| 仅文档套件注入失败断言 | 退出 1；文档失败，其余四套通过；60 项通过、1 项故意失败、11 项跳过 | `output/e2e/pr/2026-10-10T01-52-31-528Z-hKe6iF/` |
| 故障附件完整性 | 五套 JSON/JUnit/HTML 可读取；失败截图存在，trace ZIP 校验有效 | 上述故障目录的 `documentation/results/` |
| 缺失结果、零执行、flaky、构建失败/期间输入变化 | 执行器测试证明不能判成功 | `tests/e2e-runner.test.mjs` 与通过的单元测试日志 |
| SIGINT 中断真实 E2E | 退出 130，汇总标记 interrupted，后续套件不启动，测试端口释放 | `output/e2e/phase-a/interruption.json` |
| SIGINT/SIGTERM 子进程组 | 实际子进程及其派生进程被清理，已中断输入不启动进程 | 执行器单元测试 |
| 最终清理 | 3333、3334、3335、3345、3358、3399 均无遗留监听 | `output/e2e/phase-a/ports-after.json` |

构建指纹涵盖未忽略的应用、文档、包源码、公开资源、构建脚本及相关根目录配置；私有环境文件与凭据不进入指纹。修改这些私有文件后需要主动重建。工作区包含未提交改动，因此仅 Git revision 不能代表完整验证输入，需同时查看源码输入指纹。

每次运行的目录有独立 `summary.json`，模式根目录的 `summary.json` 指向最近一次运行。历史失败和中断证据保留，不会被后续成功清理。

### 3.3 分支保护与 GitHub 验收

已启用 `main` 的 required status check：`checks`，限定由 GitHub Actions 提供（App ID 15368），管理员也受已有保护规则约束。启用前后已读取并对比完整保护设置，其他字段没有变化。`strict=false`，本次不额外要求分支必须先更新到最新主分支。

保护设置通过 [GitHub 官方分支保护接口](https://docs.github.com/en/rest/branches/branch-protection#update-branch-protection)启用，本地前后记录保存在 `output/e2e/phase-a/branch-protection-before.json` 与 `branch-protection-after.json`。

10 月 10 日本地验收时，代码尚未提交或推送，**新工作流的 GitHub 首次执行、Linux 环境结果及附件下载尚未验收**。本节记录当时状态；后续 GitHub 结果以集成 PR 的检查记录为准。本地通过和分支保护配置不能代替这项证据。集成时需要：

1. 确认 `checks` 中五套 Chromium 均实际执行，并下载 `e2e-pr-evidence` 查看报告。
2. 手动运行 Extended E2E，确认 CodeBlock 的 Firefox/WebKit 项目执行并下载完整模式报告。
3. 在验证分支临时注入失败，确认 required check 阻止合并且下载的 trace 可打开，再恢复断言。

本次本地故障注入已经恢复；工作区不保留故意失败的断言。定时扩展流程需工作流进入默认分支后才会按日运行。

### 3.4 10 月 12 日 review 修正

- 构建环境指纹补充实际使用的提交版本、仓库身份及路由来源变量。修改这些非敏感变量会拒绝复用旧构建；GitHub 凭据仍不进入指纹。执行器新增环境变化回归验证。
- 焦点套件不再等待全站 `networkidle`；等待导航区域可见后验证实际控件行为，避免无关请求阻塞合并检查。
- CodeView 的尺寸调度修复与回归测试单独提交；统一执行器、五套配置、E2E 基线修正及两份工作流作为另一笔提交。
- 导航竞态修正和 ContextWindow 字体修正已由 Avatar PR 合入 main，本次沿用主分支实现。

## 4. 本地使用方式

```sh
nvm use
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
pnpm code-engine:build

# 构建一次，运行五套 Chromium 测试
pnpm test:e2e

# 另建一次生产构建，运行已有的全部浏览器项目
pnpm test:e2e:full

# 若要用同一个构建运行两种模式
pnpm test:e2e:build
pnpm test:e2e:run
pnpm test:e2e:full:run
```

构建复用被拒绝时，按错误提示重建，不要手工修改构建记录。已有专项命令仍用于单独调试，但不会生成可复用的验证记录。

```sh
pnpm exec playwright show-report output/e2e/pr/<run>/<suite>/html
pnpm exec playwright show-trace <失败附件目录>/trace.zip
```

本地证据目录属于忽略输出，不需要提交报告和截图。源码、配置、说明及对应生成文件需要一起提交。

## 5. 本阶段带来的收益与边界

- **覆盖已有检查的自动运行**：PR 流程从只运行导航专项，扩展为全部五套 Chromium 配置。收益覆盖现有场景；阶段 B 尚未新增 Dialog/Select 等组合用例。
- **减少重复构建**：五套专项串行执行可复用一次生产构建。新增 CI 覆盖会增加测试时间，不能把这项变化称为 CI 总耗时下降。
- **提高失败可信度**：旧构建、全部跳过、报告缺失与 flaky 均不能显示为成功；中断也返回非零退出码并清理测试服务器。
- **降低定位成本**：源码指纹、构建 ID、独立报告、截图和 trace 关联到同一次运行，能够复现失败步骤。本轮已用故障注入验证附件确实生成。
- **发现实际兼容性缺陷**：完整模式本轮发现并修复了 WebKit 的 CodeView 循环错误，体现已有兼容测试持续运行的价值。

这些结果不代表所有组件已覆盖、真实 iPhone 已验收或视觉回归已建立。现有消费者安装流程仍保留，阶段 B/C 按原方案另行推进。

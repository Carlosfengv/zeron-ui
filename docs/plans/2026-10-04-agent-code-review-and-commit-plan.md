# Agent / MCP 代码 Review 与 Commit 计划

日期：2026-10-04。基线：`c741626ce69436bf07da0d7e63f08a3d02cddd5e`，分支 `main`。

初次 review 发现两项需要提交前处理的问题，以及一处状态说明过期。用户随后授权按发现整改，分页实现、回归测试、main 自动部署配置和文档已调整；本轮验证状态见末尾整改记录。保留原 review 发现及当时的结果，未暂存、commit、push 或部署。

## 初次 Review 发现

### P1：按 MCP 自己提供的参数继续分页会失败

位置：`lib/agent-catalog/query.ts:186–187`，续页参数生成位置为 `lib/mcp/handler.ts` 的 `textSummary`。

首次调用 `list_components({limit: 1})` 或 `search_components({query: "resource", limit: 1})` 时通常没有 `catalogVersion`。查询指纹将这个“未提供版本”的输入纳入哈希。响应明确要求客户端在续页参数中加入当前 `catalogVersion`；第二次调用时，这个字段改变了指纹，同一目录的合法 cursor 因而返回 `INVALID_CURSOR`。

已通过真实 HTTP handler 在当前生成目录上复现两个工具的同一问题。复现保存在 `output/code-review-2026-10-04/pagination-reproduction.json`。

建议：计算指纹前将版本归一化为已选中的 `runtime.catalog.catalogVersion`，或从查询参数指纹中排除版本并继续使用 cursor 的独立版本校验。补两类回归：首次省略版本、照抄响应的完整参数成功续页；切换实际目录版本或筛选条件仍应拒绝原 cursor。查询层和 MCP 文本续页路径都应覆盖。

### P1：当前配置关闭 main 的 Git 自动部署

位置：`vercel.json:28–31`。

`git.deploymentEnabled.main=false` 会关闭该分支推送触发的 Vercel 部署，与当前希望“推送 main 后自动 build 并提供网站与 MCP”的交付方式冲突。这是原正式发布门槛方案中的主动控制，不是 JSON 格式错误；当前交付目标变更后，配置也必须同步。

建议：首次交付网站与只读 MCP 时，移除该分支禁用项或启用 main，并同步实施文档中的部署说明。保留现有 Skill / Registry 响应头。正式发布模式的资源验收应继续单独记录，不能因恢复 Git 自动部署就声称已经完成。

配置依据：[Vercel Git Configuration](https://vercel.com/docs/project-configuration/git-configuration)。

### P2：README 的 npm 元数据阻塞说明过期

位置：`README.md:179–184`。

README 仍称精确版本 npm 元数据目前无法通过 JSON 校验。但本项目已有后续成功读取、元数据身份与 tarball 完整性核对的记录，且已生成 `docs/agent-data/installation-config.json`。这种描述会让下一位维护者继续排查已解决的问题。

建议：将当前状态改为“CLI 来源和配置已准备，真实发布资源的安装矩阵、Blob 发布、正式模式部署尚未验收”。历史失败保留在证据附录中，不再作为 README 的当前阻塞。

## 初次 Review 验证

所有验证使用 Node `22.17.0`；干净检出安装记录显示 pnpm `10.12.4`。隔离目录使用当前工作区的非忽略源码覆盖 Git 基线，不复制本地依赖、构建缓存或凭据。

| 检查 | 结果 |
| --- | --- |
| 独立干净检出，仅冻结锁文件安装后直接执行 `pnpm build` | 通过；没有先运行 CI 的准备步骤 |
| `agents:verify:clean --core --keep` | 24 个阶段全部通过 |
| ESLint / design lint / 应用与测试 TypeScript / 公共组件类型 | 通过 |
| 单元测试 | 195 个文件，1,579 项通过 |
| CLI 测试 | 56 项通过 |
| 生产文档、国际化和 MCP HTTP 测试 | 3 个文件，3 项通过；直接构建产物上也通过 |
| Registry / Skill 候选、目录、指南与搜索评估 | 本地检查通过 |
| Next MCP 函数追踪文件 | 57 个文件，约 3.25 MiB |
| Next 指南函数追踪文件 | 80 个文件，约 3.03 MiB |
| Git diff 空白错误检查 | 通过 |
| 首次未传版本、按 MCP 完整参数续页 | 两个工具均复现 `INVALID_CURSOR` |

构建和回归测试通过没有覆盖上面的分页缺陷。函数大小是 Next 追踪文件的本地统计，不是 Vercel 部署报告。`--core` 没有执行完整的消费端迁移/browser 阶段；真实 Linux 发布资源安装矩阵、实际客户端和云端发布也不在本轮通过范围内。

主要证据：

- `output/agent-clean/zeron-agent-clean-lfkKsQ/report.json`：24 阶段报告，输入摘要 `6e0bf5727d1bb779b6536e0eeb96f9ff4d70a0ed7dc7db127383cc36539c00f7`。
- `output/code-review-2026-10-04/direct-build-report.json`、`vercel-build.log`：直接干净构建。
- `output/code-review-2026-10-04/function-traces.json`：函数追踪统计。
- `output/code-review-2026-10-04/pagination-reproduction.json`：分页缺陷复现。

这些证据为本地忽略文件，不纳入代码提交。此节记录整改前的代码，不能作为修复后测试的替代；后续结果另列。

## 修复后的 Commit 计划

当前审查快照含 31 个已跟踪修改文件和 169 个新增文件，另加本文。建议保留一次 coherent 的集成分支，完成以下顺序后再推送。共享文件按变更内容暂存，不能直接按目录全量暂存。

| 顺序与建议标题 | 内容范围 | 提交前检查 |
| --- | --- | --- |
| 1. `chore(tests): fix typecheck compatibility and isolate generated outputs` | commit-history、i18n placeholder、infinite-log 和 tree 测试的类型/解析修正；`tsconfig.json` 的 output 排除；code-engine host selector 的 lint 例外 | 对应测试、lint 和类型检查；design lint 的 Agent fixture 范围扩展留到第 2 笔 |
| 2. `feat(agents): add versioned catalog and release tooling` | Agent 数据与 schema/query/runtime，目录与上下文生成，指南/Skill 来源与分发，Registry 修改，发布/还原/消费者/示例/CI 信任工具及对应 fixture 和测试；两个手动 release workflow 与所依赖的策略/config；依赖和锁文件；必要构建入口。分页修复及查询层回归一起纳入 | 目录/指南生成校验、Registry/Skill 候选检查、相关单元测试和干净构建 |
| 3. `feat(mcp): expose readonly tools and AI usage pages` | `lib/mcp/handler.ts`、`app/api/mcp/route.ts`，指南 HTTP route、中英文 AI 页面与消息、站点入口、静态资源缓存配置，MCP 协议/生产路由测试；加入照抄续页参数的 HTTP 回归 | MCP 测试、双语消息校验、类型检查、生产构建和生产 HTTP 测试 |
| 4. `ci(agents): verify clean builds and production routes` | 普通 `.github/workflows/ci.yml` 的干净检出/生成/测试顺序；最终测试脚本和 CI 入口配置 | 完整 `agents:verify:clean` 与普通 CI；本轮仅执行了 `--core`，不能将它写成完整 CI 已通过 |
| 5. `docs(deploy): align Vercel delivery and release status` | `vercel.json` 中 main 自动部署控制修正；README 当前状态、实施方案和证据附录；本文 | 配置校验、现有响应头保持、文档链接和 Git diff 检查；最终提交树再验证生产构建 |

第 2 笔较大是现有模块依赖决定的：目录、Skill 分发、发布还原和示例验证存在交叉导入，不能简单按 `scripts/` 文件名前缀拆成缺依赖的提交。暂存时须按导入闭包核对；`package.json`、`eslint.design.config.mjs`、构建入口、测试 helpers 等共享文件需分 hunk。第 2 笔的应用构建要先生成 runtime，相关脚本不能等第 4 笔才补上。

第 3 笔涉及的 MCP 测试和指南 HTTP 路由测试随路由一起提交；第 2 笔不能提前加入依赖尚未存在路由的测试。已有 `.github/workflows/agent-release-*.yml` 被相关信任/工作流测试读取，因此与第 2 笔工具链一起提交，普通 CI 的集成顺序单独留到第 4 笔。

提交清单排除 `output/`、`.vercel/`、本地环境与凭据、生成的 `public/ai/`、`public/skills/`、`docs/generated/agent-runtime/` 和依赖目录。`docs/generated/agent-guide-loaders.generated.ts`、公开 llms 文本和版本配置属于需要提交的源码/生成索引，不能一概排除。

## 推送条件与交付范围

两项 P1 修复并通过相关回归，提交范围和依赖闭包已核对，最终树干净构建成功后，才进入 commit / push。

当前默认构建的目录模式是 `development`，生产构建可以部署网站、静态文档、Skill 下载与只读 MCP 查询，但 `get_install_command` 会按设计拒绝尚未验证的安装组合。要交付正式安装命令，还需完成真实发布资源验收并显式配置 release 模式；没有冻结记录时不能开启 release 模式。

恢复 Git 自动部署后，仍需确认 Vercel 项目关联、生产分支、构建设置和环境符合此次交付范围。部署到 `READY` 后复验实际域名下的 AI 页面、目录以及 MCP 初始化/工具调用；本地 build 成功不等于这份未提交代码已经上线。

## 按 Review 整改（2026-10-04）

| 发现 | 已做调整 | 验证状态 |
| --- | --- | --- |
| MCP 续页失败 | 从查询指纹排除 `catalogVersion`，继续用 cursor 内的独立版本校验；默认发现后显式指定同一版本不再改变筛选指纹 | 先补回归复现 6 项失败，再修复。查询和 HTTP 测试覆盖搜索／列表、省略→显式→省略版本、不同版本／语言／筛选拒绝，以及两种协议按文本续页遍历完整结果；5 文件 165 项定向回归通过 |
| main 禁用自动部署 | `git.deploymentEnabled.main` 改为 `true` | 本地配置解析通过，framework 和原有响应头与 HEAD 完全一致；未推送，不宣称平台已生效 |
| README 状态过期 | 改为 CLI 元数据和 tarball 已核验、四格配置已准备；真实发布安装矩阵仍未验收 | README 和实施方案同步区分当前网站／只读 MCP 初版与正式资源发布；不删除历史失败证据 |

生产 HTTP 测试新增两个工具照抄续页参数的验证。整改后的新隔离检出 `zeron-agent-clean-zxc9xS` 已通过前 22 个 core 阶段：lint、design lint、类型检查、1,587 项单元测试及 56 项 CLI 测试均通过。首次生产构建已编译成功，但因本地磁盘 `ENOSPC` 无法写入缓存／`.tsbuildinfo` 而失败；保留原报告和失败日志，不能将该次完整执行写为通过。

清理上一轮 review 自建的两份临时检出目录后，在同一份源码检出重跑 `pnpm build` 和 `pnpm test:production`，两者退出码均为 0，3 项生产路由测试通过。因此全部 core 检查内容已有本地通过结果，但不是一次未中断的 24 阶段运行。没有重跑 `--core` 范围以外的消费者迁移／浏览器阶段，也没有真实云端验收。

整改验证归档于 `output/agent-access/review-remediation-01/validation-summary.json`、`build-retry-report.json` 和对应日志；原隔离报告为 `output/agent-clean/zeron-agent-clean-zxc9xS/report.json`，输入摘要 `cfb28e493c96fc71f8dce1862ef43b9a115d072b676d5e72a1aa6b4f38b81bbb`。`validated-source-files.json` 绑定查询实现、三份相关测试、Vercel 配置及 README，测试结束后确认当前字节仍与该检出一致。最终状态文档在测试后整理。

三项 review 发现已按建议整改，既有五笔 commit 计划继续适用。本轮没有执行暂存、提交、推送或部署。

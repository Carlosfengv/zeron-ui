# Zeron AI 接入与 MCP：历史验收记录

创建日期：2026-10-03；文档更新：2026-10-04。  
对应方案：[实施方案](./2026-10-03-agent-access-and-mcp-plan.md)

阅读入口：正文保留逐次执行记录；[模块证据索引](#模块证据索引)集中列出报告路径，开发浏览器结果见[派生矩阵](#执行器与派生开发行为矩阵2026-10-04)，目录实现见[Catalog 范例绑定](#catalog-范例字节绑定与还原2026-10-04)，归档边界见[统一执行索引](#统一执行索引与-ci-zip-读取2026-10-04)，平台／工作流初次检查见[CI 本地检查](#ci-平台核验与验证工作流本地检查2026-10-04)，新增检查见[公开归档内容检查](#公开-ci-归档内容检查与原字节副本2026-10-04)。文档修订边界见[CI 交接修订](#ci-交接与文档修订2026-10-04)、[状态同步](#实施文档状态同步2026-10-04)及[发布交接优化](#发布交接与部署门槛文档优化2026-10-04)。本附录不维护实施顺序。

本附录保存此前实际执行结果，不代表当前工作区全部通过。迁移记录只调整存放位置，不改变原报告、来源哈希或覆盖范围。当前状态与剩余工作以实施方案第 12 节为准。

发布编排的本地结果见[发布工作流本地验收](#后续发布工作流与控制文件本地验收2026-10-04)，Git 输入基础见[部署 Git 与记录字节基础](#部署-git-与记录字节基础验证2026-10-04)，附件读取见[完成发布作业与审查附件读取](#完成发布作业与审查附件读取2026-10-04)；最新实现及真实配置变更见[发布环境核验与实际平台配置](#发布环境核验与实际平台配置2026-10-04)。此前文档修订见[G0 审查与构建边界整理](#g0-审查与构建边界整理2026-10-04)。历史记录保持原时点。

以下按原记录保留检查名称、结果及边界。各次 core、定向测试和字节校验绑定不同源码；不能拼接为当前完整验收。表内“最近一次”按该行所述阶段理解，判断最新覆盖应读取具体报告的输入哈希和范围。

此前文档优化依据已有源码及原始报告同步状态，没有重跑当时的产品验收，也没有更新旧报告来源。后续范例执行器和浏览器运行另列新记录；源码契约、全新安装、增量配置和派生行为检查各自留证，不追溯扩大旧报告范围。

| 检查 | 本地结果 | 能证明的范围／不能替代的检查 |
| --- | --- | --- |
| 模块回归 | Node 22 上 166 份文件、1009 个测试通过 | 包含 Skill 身份、ZIP 校验和发布 dry-run；绑定最近一次 core 输入，不覆盖此后变更，不证明实际 npm 发布组合 |
| 定向 MCP | 2 份文件、23 个测试通过；连同身份、上下文及生成器定向检查共 36 项通过 | 查询、协议、错误、并发、可用文本和合计预算；生产 HTTP 另测 |
| 生产 HTTP | 3 份文件、3 个测试通过 | 实际 Next 服务器、目录项 JSON／Markdown、全部已注册指南、路由及 trace；不是 Vercel 部署。新增指南后再次验证 |
| 搜索评测 | 15 条中文、15 条英文，30／30 Top-3 命中；所有预期 ID 真实存在 | `output/agent-access/search-evaluation.json`；已修正两条用例中的虚假 ID；不代表所有自然语言或最终页面质量 |
| 生成检查 | loader 23 份；目录 141 项；`agents:check` 通过 | 当前输入和已提交文本一致；新增六份指南示例类型检查通过 |
| 指南片段 | 6 份新指南、6 个自包含 TSX 片段类型检查通过 | `output/agent-access/guide-examples.json`；只证明当前仓库公共类型，不证明消费端安装、实际接口或视觉效果 |
| Node 22 | 22.23.3 上定向测试与 Next 生产构建通过，生成 329 个静态页面 | 本地 Node 22 路线可构建；套餐、部署保护和冷启动另验 |
| 基础工程检查 | 完整 lint、设计 lint、类型检查通过；CLI 56 个测试、Registry 133 项检查通过 | 检查各自范围；完整消费者安装与正式发布矩阵另验 |
| AI 页浏览器 | 中英文页面 390／1440 宽度检查；窄屏无页面横向溢出；语言切换、端点及资源列表提示词复制通过；6 个静态目标均 HTTP 200 | 截图位于 `output/playwright/ai-*.png`；其余任务提示词、键盘与实际 MCP 客户端仍需验收。本地 Vercel 统计脚本 404 与 CSS preload 提示单独记录 |
| 函数文件追踪 | 指南全部入 trace；未发现实际浏览器包或 Next 缓存被带入 | 本地文件追踪；逐文件 gzip 合计不是 Vercel 最终打包体积，不据此判定部署预算通过 |
| 独立完整流程 | Node 22.23.3 无缓存副本通过生成、全部工程检查、消费者安装、迁移、生产构建与 HTTP | `output/agent-clean/zeron-agent-clean-4MqHDI/report.json`；绑定输入哈希和当时 a0a096… 开发目录；更新后需要按受影响范围复验 |
| 最近一次独立 core | Skill 候选和两类 dry-run 加入后，Node 22.23.3 的 24 个阶段通过 | `output/agent-clean/zeron-agent-clean-mksNsO/report.json`；源码集合哈希 `0bb69e6a…`；166 份文件、1009 项模块测试，329 个静态页面与 3 项生产 HTTP 检查通过。内外清单和 dry-run 原始文件已保留；不覆盖随后新增的 Blob SDK／下载器，消费者／迁移也未在 core 重跑 |
| Registry 本地候选 | 134 个文件哈希及固定依赖闭包通过；三次实际构建验证首次生成、相同重试与不同源站冲突；dirty 正式候选被拒绝 | `output/agent-access/registry-candidate.json`；示例源站没有上传或访问。旧 `public/r` 与原合并文件逐字节保持一致；不替代公开回读或实际消费者验证 |
| Skill 本地候选 | Node 22.23.3 实际 CLI 与函数入口通过；24 个 ZIP 来源文件、27 个分发文件全部核对；同内容重试复用，源站／更新站点变化产生新身份；dirty 门槛通过 | `output/agent-access/skill-candidate.json`；内层 schema 2 与外层 artifacts 清单另存。旧 manifest、ZIP、指南字节不变；候选 skillVersion 为 `609ea634…`，ZIP 哈希为 `cbd64ea8…`，不得混用 |
| 发布 dry-run | Registry 136 个对象、9,538,902 字节；Skill 29 个对象、283,779 字节，均包含清单及最后的完成标记 | `output/agent-access/*-publication-plan.json`；计数／大小绑定该次候选，输入变化需重算。只证明本地语义与哈希校验，不证明 Blob 上传、公开 URL 或回读 |
| 上传与下载定向回归 | Node 22 上公开下载 6 项、发布 dry-run／控制器／入口门槛 15 项通过；连同资源与 Skill 相关回归 45 项通过 | 使用可控公开响应和注入写入器，验证同内容复用、中断续传、错误字节、完成标记最后写入、锁、超时和真实 CLI 来源拒绝；不证明实际 Blob 服务或 clean 发布端到端通过 |
| 上传阶段模块全集 | Node 22.23.3 上 167 份文件、1026 个模块测试通过；Registry 6 项、Skill 7 项候选检查再次通过 | `output/agent-access/publication-local-validation.json` 绑定输入 `faa8d896…` 与原始日志；此后入口失败报告调整另按定向测试复验，不反向改写该记录。没有重跑消费者、Next 生产构建或线上验收 |
| 冻结还原定向回归 | 还原 12 项，连同查询、上下文和下载共 36 项在 Node 22 上通过 | 三版本历史 Skill／指南、固定安装摘要、清单／完成计数、别名演进、错误字节／跳转／预算／超时、输出链接／锁、替换失败恢复与超大文本源字节均已验证；资源、npm 摘要和安装矩阵均为临时 fixture，不代表真实服务 |
| 冻结还原独立 core | Node 22.23.3 无缓存副本的 24 阶段通过；168 份文件、1038 个模块测试，329 页构建与 3 项生产 HTTP 回归通过 | `output/agent-clean/zeron-agent-clean-tGV3eI/report.json`，输入哈希 `ea094a56…`；覆盖新 schema、还原器、构建包装器和指南路由。Next 仍使用 development 目录，不能证明实际正式记录／Blob／npm 组合；README 和本行证据说明在运行后同步，不追溯改写来源哈希 |
| 安装输入定向回归 | Node 22.17.0 的输入、下载、还原、上传和查询 5 份文件共 62 项通过；受影响脚本／测试 lint 通过 | `output/agent-access/published-input-tests.json`；输入与资源使用临时 fixture。包括来源门槛、安全失败输出、目录复用拒绝、输出别名保护及重建器的隔离输入／清理；尚未执行真实四格消费者或正式输入全链路，不更新旧 core 的来源哈希 |
| 精确 npm 字节 | 实际读取 `zeron-ui@0.2.0-beta.17` 官方版本元数据及 19,329 字节 tarball，SHA-512 SRI 匹配 | `output/agent-access/published-input-npm-check.json` 记录包完整性、tarball／元数据哈希及校验器哈希；仅证明已发布包的下载字节，不证明它与新 Registry 组合可安装 |
| 发布配置核对 | 当前工作区未配置 Vercel 项目文件、资源源站或 Blob 写入／OIDC 环境项 | `output/agent-access/config-readiness.json`；只核对工作区与当前环境，没有读取令牌内容或审计全局 CLI 登录；不据此宣称账号没有权限 |
| 消费者历史证据 | 先前 784 个相关文件曾一致；Registry 构建器调整后的核对已记录差异 | `output/agent-access/consumer-evidence-binding.json` 状态为 requires-revalidation，且未涵盖此后锁文件变化；不可视为当前差异全集。原日志仍保留；core 和 legacy 字节检查均不替代真实发布矩阵 |

本附录此前记录的目录版本为 `d00e0dced430516f721b733e51a79c280925d49b85b912cadc682c424df2ca94`，属于开发快照；后续 R2 改动产生的新版本及定向结果见实施方案第 12.2 节。独立完整流程保留其实际执行的旧快照身份；后续三轮 core 分别绑定实际源码哈希，不反向改写旧报告。此前 Skill 包装与模板改造经验证保持 schema 1 分发字节不变，当时开发目录身份未变化；schema 2 候选没有被选为当前版本。CI 已增加独立作业及证据上传；本地作业通过不等于远端 GitHub CI 已运行。次数是对应运行结果，不是固定验收指标。

`output/` 是本地忽略目录。正式验收必须把原始报告和必要日志保存为可持久访问的 CI 附件，并在精简记录中绑定附件哈希、作业标识与来源；本文中的本地路径本身不是对外可追溯证据。

更早的 core 记录保留在 `output/agent-clean/zeron-agent-clean-7y0wrV/report.json`（22 阶段、输入 `8dcd9339…`）及 `output/agent-clean/zeron-agent-clean-mMUSpG/report.json`（23 阶段、输入 `183d050d…`）。它们仅供追溯，不与最近一次报告拼接成当前完整验收。

### R2 业务页面本地实施增量

本轮交付资源列表、资源详情、设置页、可注入的 API 边界及 `agents:examples` 开发运行入口。页面复用公开组件；适配器为确定性内存服务，没有真实后端、正式 Registry／Skill 或已发布 CLI 安装证明。

| 检查 | 本轮结果 | 证据与限制 |
| --- | --- | --- |
| 数据、页面与运行器回归 | 4 份文件、31 项通过 | `output/agent-access/example-pages-tests-final.json`；校验、失败保留输入、只读、拒绝访问、不存在、过期响应、重复提交、查询返回及模板边界 |
| Vite × pnpm 独立消费端 | 实际工作区 CLI 安装、类型和生产构建通过 | `output/agent-examples/vite-pnpm-r2-03/local-verification.json`；调用实际 `src/index.js`，源站为回环 Registry，开发组合而非正式安装证据 |
| 焦点修复增量构建 | 仅宿主 `examples/app.tsx` 发生消费端源码变更；当前源文件逐项匹配，类型／构建再次通过 | `output/agent-examples/vite-pnpm-r2-03/incremental-verification.json`；原安装记录保留，变更与新日志单独绑定，不能改称又完成一次全新安装 |
| 浏览器 | 三页面 390／1440 截图；列表搜索、分页、排序、方向键筛选、Enter 打开详情、Tab／Enter 返回、设置键盘保存、空库存、不存在、拒绝访问与重试已检查 | `output/playwright/agent-examples-r2/`；修复前截图与修复后键盘证据分开标识。没有执行完整状态矩阵、真实后端或跨框架浏览器矩阵；初次 favicon 404 保留为预览提示 |
| Next × npm／pnpm | 均在 bootstrap 超过五分钟，未进入页面类型／构建 | 两个 `output/agent-examples/next-*-r2-01/failure.json`；pnpm 原始超时日志已保存。Vite × npm 未执行 |
| 当前工程检查 | 受影响 lint、完整设计 lint、类型及开发目录生成检查通过 | 汇总见 `output/agent-access/example-pages-local-validation.json`；未重跑整站构建、全量模块测试、正式四格或 Vercel 验收 |

首次运行暴露消费端缺少独立工作区边界，安装过程进入了主工作区；已停止该进程，按原锁文件恢复依赖，并给模板加上自有 `pnpm-workspace.yaml`。下一次发现运行器错误调用可导入的 CLI 库，实际没有安装组件；其类型检查失败，不能把进程返回零计作安装通过。两个问题均已修复，本表只把后续实际安装及构建计为通过，失败／中止输出不覆盖。

### R3 指南路径映射增量

已持久登记 23 个指南地址到稳定条目 ID，开发生成器和新正式组装器要求显式映射。路径和归属纳入目录身份与分发文件，runtime 路由只使用所选快照；旧格式缺映射时保留其原地址约定，不能给新候选补推导映射。还原对历史版本逐项比较路径归属，删除／改绑时拒绝激活。

`output/agent-access/guide-routes-tests-final.json` 在 Node 22.17.0 上覆盖 9 份文件、98 项通过，包括改名／分类变化、缺失目标／覆盖、字节及版本漂移、历史自身映射、旧格式身份校验、冲突与安装／发布回归。受影响 lint、类型、生成检查及本地 Next 生产构建通过。`guide-routes-production.json` 的实际服务器检查逐字节核对 23 个指南路由、当前／固定版本映射和未登记路径的 404，并复验 MCP、条目和函数文件追踪。

新开发目录为 `bf28f3d3e56159b40ef656347d1cabc2e5e4367bd27b9d93483ccf7c40eafd67`；Skill 包未变。绑定来源与原始附件见 `output/agent-access/guide-routes-local-validation.json`。没有运行 Catalog 上传／冻结入口、公开上一版比较、正式还原记录或 Vercel 验收；本轮不更新此前 R2／core 报告的来源哈希。

### R2 范例源码与运行器增量

源码声明现核对实际导入图及稳定条目身份，清单包括宿主、三个页面、共享接口／适配器和 README 的原始字节。开发运行器据此解析 Registry 名称，记录复制后的字节与入口，并拒绝声明、源文件、消费端文件或来源集合漂移。类型导入与重导出纳入图；动态导入、未知外部模块、路径逃逸、未登记组件、不可达文件和链接目录被拒绝。

`output/agent-access/example-source-tests-final.json` 在 Node 22.17.0 上覆盖 5 份文件、56 项通过；受影响 lint 和工作区类型检查通过。首次测试报告 `example-source-tests-01.json` 保留一个测试夹具使用已存在目录导致的失败，修正夹具后通过；未覆盖原失败报告。这里只证明源码契约、运行器文件映射／漂移检查及原页面／数据回归，完整消费者组合、状态矩阵与正式公开证据分别验收。

首次全新 Vite 消费端分别保存在 `output/agent-examples/vite-{npm,pnpm}-source-contract-01/`。pnpm 的安装、类型和构建通过；npm 报告虽返回 passed，原始记录同时包含 npm 与 pnpm 锁文件，组件安装实际用了 pnpm，不能计为 npm 组合通过。`output/agent-access/example-consumer-manager-audit.json` 绑定原报告字节并拒绝其 npm 范围，原报告不改写。根因是 npm 模板没有精确包管理器声明，安装器优先识别工作区文件；两套 npm 模板现已补齐，开发与正式消费者统一拒绝声明漂移及混用锁文件。

`output/agent-access/example-source-and-manager-tests-02.json` 的 7 份文件、83 项通过覆盖该修复及安装输入／公开证据回归。前一报告保留原测试“npm 不得声明 packageManager”导致的失败，修正为必须使用精确版本后通过；不得覆盖失败报告。修正模板后的实际消费端结果另按其原始输出登记。

### R2 四格开发消费端与 Next 配置增量

以下直接核对各次原始报告。它们使用工作区 CLI、回环 Registry 和开发源码，均为 `sourceClean: false`；没有正式 Registry／Skill／已发布 CLI 安装证明，也没有完整逐例行为或跨组合浏览器证据。共享宿主包含三个页面，构建通过只计为宿主类型／构建结果。

各次范例源码清单哈希相同：`35d779d0746a3e1ae9ec13de8dd7d815da406411b5865a847c8bd21db415b809`，包括 10 个原始文件、9 个 TypeScript 文件及 11 个采用条目。来源 revision 为 `c741626ce69436bf07da0d7e63f08a3d02cddd5e`，实际未提交来源集合分别列于下表；相同基线提交和范例清单不表示全部运行输入相同。

| 运行 | 实际结果与原始文件 | 绑定的来源集合 SHA-256 |
| --- | --- | --- |
| Vite × npm，`source-contract-02` | npm 10.9.2／Vite 8.2.1；bootstrap、dry-run、安装、类型及构建通过，唯一 npm 锁文件。`output/agent-examples/vite-npm-source-contract-02/local-verification.json` | `028844075b3692ca0140209ce23dad2efb85d89dc7718575f407ebaf9c8b3409` |
| Vite × pnpm，`source-contract-02` | pnpm 10.12.4／Vite 8.2.1；相同五项检查通过，唯一 pnpm 锁文件。`output/agent-examples/vite-pnpm-source-contract-02/local-verification.json` | `028844075b3692ca0140209ce23dad2efb85d89dc7718575f407ebaf9c8b3409` |
| Next × npm，`source-contract-02` | npm 10.9.2／Next 15.5.9；相同五项检查通过，唯一 npm 锁文件。`output/agent-examples/next-npm-source-contract-02/local-verification.json` | `83b0e4b76a38033a971e4e5166f42f63ce6724127ff100148afbde69c7091412` |
| Next × pnpm，`source-contract-02` | bootstrap、dry-run、安装及类型通过；build 五分钟超时，错误 `COMMAND_TIMEOUT`。`output/agent-examples/next-pnpm-source-contract-02/failure.json` 及同目录日志 | `83b0e4b76a38033a971e4e5166f42f63ce6724127ff100148afbde69c7091412` |
| Next × npm，根目录配置增量 | 只替换消费端 `next.config.mjs`，类型／构建通过，祖先工作区识别警告消失。`output/agent-examples/next-npm-source-contract-02/config-fix-verification.json`；范围明确为无全新 bootstrap／安装 | `fa32f4685308510b7de5d722067d91d32ca1721878eb6f118b8fa023bc0f440f` |
| Next × pnpm，根目录配置增量 | 相同配置变更后 build 仍超时；`output/agent-examples/next-pnpm-source-contract-02/logs/config-fix/build.json`。没有成功增量报告，不计配置修复完成验收 | 失败构建日志不提供完整成功绑定；不得借用 npm 增量来源替代 |

Next 模板已设置自身 `outputFileTracingRoot`，定向回归使用实际物理目录核对，避免临时目录别名影响断言。`output/agent-access/example-source-and-manager-tests-05.json` 为 7 份文件、83 项通过，涵盖该配置及包管理器／源码契约、安装输入与证据回归；它不证明 Next × pnpm 能完成构建。受影响 lint 通过；既有工作区类型及开发生成检查属于各自执行时的结果，未重跑完整工程或线上验收。

预算变更有独立依据：`next-{npm,pnpm}-source-contract-01` 均在 bootstrap 五分钟超时；`output/agent-access/next-bootstrap-download-sample.json` 对锁定的官方包地址采样，Next／SWC 约 30／42 MB，下载约 1 MiB 分别约 19／13 秒。开发入口随后将 bootstrap 预算改为十分钟，其余步骤仍五分钟；`source-contract-02` 在新预算下执行。采样只解释下载耗时，不证明安装或编译成功，不用于放宽正式消费者门槛。

该轮文档修订只核对上述文件及状态，没有重跑消费端或修改原报告。当时失败的根因未确认，根目录警告消失不能作为 pnpm 编译问题已解决的证据。后续修复使用新输出或明确的增量范围；正式三例 × 四格验收须绑定同一干净内容提交和安装输入，不能拼接本表中不同来源的结果。

### 2026-10-04：Next 扫描边界修复与全新安装复验

定位到隔离消费端的 Tailwind 自动扫描边界。诊断使用真实消费端依赖及原样式，在父进程强制的 30 秒预算内执行；不以子进程自身定时器代替终止保障。完整自动扫描超时，单独排除 `.next` 的扫描输出在 4 MiB 预算内已包含超过六万处 `node_modules` 路径；单独排除依赖目录仍超时。同时排除两者后，扫描约 6 毫秒，61 个文件／3,362 个候选，保留组件、hooks 和 lib。只增加 `.gitignore` 的尝试仍超时，已删除该临时文件，不作为修复交付。

`tests/fixtures/published-consumers/next/app/globals.css` 现用 `@source not` 显式排除依赖及生成目录；业务源码仍自动扫描。相同消费端样式增加两条规则后，独立 PostCSS 处理约 75 毫秒完成，结果包含 69 个依赖消息。这是诊断结果；真实 Next 编译另留证。语法依据见 [Tailwind 源文件检测](https://tailwindcss.com/docs/detecting-classes-in-source-files)。

本轮验证来源集合为 `79bafca5f77184c47fa23d7e1370cf61fa3f2fe73a7ddd3c955d2270374b8da2`，基线 revision 与锁文件同上，仍为 dirty 开发源码。范例源码清单仍为 `35d779d0746a3e1ae9ec13de8dd7d815da406411b5865a847c8bd21db415b809`，没有改写页面业务源码。

| 检查 | 原始证据 | 实际范围 |
| --- | --- | --- |
| 扫描诊断 | `output/agent-access/next-scan-diagnostic-01/` 的 `pnpm-{scan,excluded,exclude-modules,exclude-build,gitignore,explicit,excluded-css}.json` | 失败／输出超限及成功分别保存；不能当作 Next build 或正式安装证明 |
| Next × npm／pnpm 增量 | 同目录 `npm-build/verification.json`、`pnpm-build/verification.json` 及类型／构建日志 | 在已安装的消费端只改样式两条排除规则；清空旧 `.next` 后重新构建，通过业务类和语义变量编译检查。范围明确无全新 bootstrap／安装 |
| Next × pnpm 全新运行 | `output/agent-examples/next-pnpm-source-contract-03/local-verification.json` 及独立日志 | Node 22、pnpm 10.12.4、Next 15.5.9；独立缓存、锁定依赖、CLI 预检／安装、类型与生产构建通过。编译约 12.7 秒，规则在安装后保留 |
| Next × npm 全新运行 | `output/agent-examples/next-npm-source-contract-03/local-verification.json` 及独立日志 | Node 22、npm 10.9.2、Next 15.5.9；相同开发检查通过，唯一对应锁文件；使用新模板根目录及扫描配置 |
| 受影响回归与目录 | `output/agent-access/next-scan-diagnostic-01/focused-tests.json` | 7 份文件、83 项通过；开发目录校验仍为 141 项／23 指南，版本 `bf28f3d3…` |

没有修改旧 `failure.json`、重用旧成功报告或延长构建预算。两份新报告的行为与浏览器证据仍为 null，`publishedInstallation: false`。Vite 结果保持其原始来源，不能与本轮 Next 报告拼成同一 S 的正式安装矩阵。当时公开附件契约尚未交付，后续实施见下一节；正式三例 × 四格的状态／键盘／视口和真实资源绑定仍未完成。

### 2026-10-04：范例证据契约及附件 I/O

新增 `scripts/agent-example-evidence.mjs`。正式报告和检查附件使用严格 schema；核对固定安装输入、来源、CLI／Registry／Skill、真实源码 manifest／原字节、宿主安装闭包、逐例采用项及适配后字节。当前三例四格要求 12 个独立结果，缺行、重复／换序、缺状态、不适用原因改变、错误命令／检查绑定、缺键盘操作及视口均拒绝。宿主入口生成抽为共享函数，开发复制与证据校验使用相同字节定义。

附件 URL 为固定源站的内容哈希路径，JSON 和 PNG 分别执行预算。PNG 检查完整分块、CRC、尺寸、压缩数据、Adler 校验及解码行数；只有文件头或缺失／超量图像数据不能通过。只追加上传先验证全批次；错误公开字节、返回错 URL、中断、未知确认、超时和预算均有回归，同字节重试可以复用。读取不携带发布凭据，所有实际读取和重试计入总预算。

`output/agent-access/example-evidence-tests-05.json` 在 Node 22.17.0 上为 8 份文件、99 项通过，其中新增契约测试 16 项，包含 Next／Vite 双向不兼容依赖拒绝。`-01`、`-02`、`-03`、`-04` 分别保留当时 10、93、98、99 项结果，未扩大其来源或范围。受影响四个脚本／测试的 lint、工作区类型检查及开发目录检查通过，目录仍为 141 项／23 指南、`bf28f3d3…`。

所有成功检查、空白 PNG 和公开存储均为明确的 fixture；没有实际 Blob 写入、官方 CLI 安装、范例状态执行或真实浏览器观察。契约、读取、发布函数的 scope 均说明不能证明实际执行；没有正式命令、SDK 入口或 Catalog 绑定，也没有提高 coverage。正式运行器必须生成实际检查记录及受控 CI 原始日志后，才可使用这些接口。此前 Next／Vite 的报告保持其原源码与验证范围；本轮没有重跑消费端或整站构建。

### 模块证据索引

2026-10-04 文档优化时从实施方案原第 12.2 节移入。以下表格原样保留各模块的历史结果，不新增测试结论；其中“本轮”“当前”按原记录范围理解，实际执行顺序与待完成项以主文档第 12.1、12.3–12.5 节为准。

| 证据 | 已有结果 | 当前适用边界 |
| --- | --- | --- |
| 开发目录与内容 | 141 项目录、23 份指南；30 条双语搜索评测全部 Top-3 命中；6 个新指南片段通过类型检查 | 属于开发快照；片段不计为三个完整业务范例 |
| 本地协议与页面 | 五个工具、版本／分页／并发及文本继续读取已有回归；AI 页曾检查 390／1440 宽度、语言切换与部分复制动作 | 不能证明真实客户端兼容、全部键盘路径或 Vercel 访问 |
| 最近一次独立 core | `output/agent-clean/zeron-agent-clean-tGV3eI/report.json`：24 阶段、168 份文件／1038 项模块测试、329 页构建、3 项生产 HTTP 检查通过 | 输入哈希 `ea094a56…`；使用 development 目录，未重跑消费者／迁移，不覆盖随后增加的安装输入及消费者执行代码 |
| 安装输入定向检查 | `output/agent-access/published-input-tests.json`：Node 22.17.0，5 份文件共 62 项通过；对应 lint 通过 | 资源和来源使用临时 fixture；不覆盖此后消费者实现，也不证明真实正式输入全链路 |
| 消费者执行链定向检查 | `output/agent-access/published-consumer-focused-tests.json`：Node 22.17.0，7 份文件共 89 项通过；受影响脚本／测试／模板 lint 通过 | 检查隔离、实际进程预算、包字节、输入／证据绑定、不可覆盖及失败恢复；公开资源和成功报告是显式 fixture，不是正式四格执行 |
| 四格模板／CLI 启动 | `output/agent-access/published-consumer-bootstrap.json` 的 Next × npm 已通过；修复 pnpm 包装文件后，`published-consumer-bootstrap-followup.json` 的其余三格通过 | 全新缓存、实际锁文件安装、类型及框架构建；CLI 启动使用此前核验的 pin 与本轮重新校验的官方 tarball。没有安装正式 Registry，不是消费者成功报告；首次整体运行状态为 failed，保留原样 |
| 上次 npm 元数据异常 | `output/agent-access/published-consumer-metadata-check.json`：精确版本接口返回 15 字节，JSON 无效 | 若正式执行仍返回相同响应，核验报 `NPM_METADATA_JSON`；R2 未重新读取该接口。不覆盖此前通过记录，也不以模板启动检查绕过此门槛 |
| 精确 npm 下载 | `output/agent-access/published-input-npm-check.json`：实际读取 `zeron-ui@0.2.0-beta.17` 元数据及 19,329 字节 tarball，SHA-512 SRI 匹配 | 只证明下载字节，尚不能将该版本标为已验证安装引擎 |
| 候选、上传与还原 | Registry／Skill 候选、dry-run、来源门槛、上传控制器和隔离还原已有本地结果 | 真实 Blob 上传、完整四格安装及正式记录仍无通过证据 |
| 配置核对 | `output/agent-access/config-readiness.json` 未发现工作区项目配置、资源源站或 Blob 认证环境项 | 仅代表该次工作区／环境检查，未审计全局 CLI 登录或账号权限 |
| 旧消费者结果 | `output/agent-access/consumer-evidence-binding.json` 为 `requires-revalidation` | 不适用于当前源码；不能与上述 core 拼接成完整消费者通过 |
| R2 Skill 文本与范例数据 | `output/agent-access/skill-text-final-tests.json`：10 份文件、96 项通过；源码与检查范围见 `skill-text-validation.json` | Node 22.17.0；26 份文本来源、当前／历史选择、原字节分页、两代协议预算，以及范例接口与竞态；不包含本轮页面实现。受影响 lint、类型、生成及两套 Skill 校验通过 |
| R2 三个业务页面（历史运行） | `output/agent-access/example-pages-tests-final.json`：4 份文件、31 项通过；范围与原始附件见 `example-pages-local-validation.json` | 该次 Vite × pnpm 的开发安装、类型／构建及增量焦点修复；截图与浏览器操作属于本地检查。该次 Next 两格启动超时，Vite × npm 未执行；后续四格进展见第 12.1 节，不改写此报告范围 |
| R3 指南路径映射 | `output/agent-access/guide-routes-tests-final.json`：9 份文件、98 项通过；`guide-routes-production.json`：1 项生产 HTTP 通过；完整绑定见 `guide-routes-local-validation.json` | 显式路径、名称／分类变化、历史自身映射、旧格式校验、目录身份与删除／改绑拒绝；实际 23 路由及映射字节核验。Node 22 本地站点构建通过，未执行 Catalog 上传／冻结、正式资源或 Vercel 验收 |
| R2 范例源码与运行器 | `output/agent-access/example-source-tests-final.json`：5 份文件、56 项通过 | Node 22.17.0；严格声明、实际导入图、稳定身份改名、原始 BOM／CRLF、安装范围、类型导入、复制与漂移拒绝及页面／数据边界回归。受影响 lint 和类型检查通过；不证明正式资源、完整状态或跨组合构建 |
| R1／R2 包管理器及项目边界 | `output/agent-access/example-source-and-manager-tests-05.json`：7 份文件、83 项通过 | 包括精确 npm／pnpm 声明、混用／缺失锁文件拒绝、Next 根目录限定及安装输入／公开证据回归。当前实际开发组合见第 12.1 节；历史报告保留原范围，不证明正式四格安装 |
| Next 扫描目录修复 | `output/agent-access/next-scan-diagnostic-01/focused-tests.json`：7 份文件、83 项通过；同目录两格增量类型／构建及业务 CSS 检查通过；Next 两个 `source-contract-03` 全新运行通过 | 固定来源集合 `79bafca5…`；安装器保留排除规则，开发目录检查通过。没有重跑整站、正式安装、完整状态或浏览器矩阵 |
| R2 范例证据契约与附件 I/O | `output/agent-access/example-evidence-tests-05.json`：8 份文件、99 项通过；受影响 lint、类型及开发目录校验通过 | 新增 16 项为明确的纯函数／注入存储 fixture，证明完整性、原字节、双向框架约束、绑定、预算、冲突及恢复；没有执行真实范例状态、真实浏览器、Blob 写入或正式 CLI 安装 |
| R2 执行器／实际浏览器 | `output/agent-access/example-runner-tests-05.json`：9 份文件、111 项通过；`output/playwright/example-runner-matrix-02/matrix-verification.json`：四格三例的开发行为通过 | 正式入口／SDK／本地索引已接入；实际行为来自复用组件及依赖的派生宿主，不含本轮全新安装。正式 Linux／公开资源／Blob／可信 CI 与 Catalog 仍待验收 |
| R3 Catalog 范例字节绑定 | `output/agent-access/catalog-examples-tests-04.json`：12 份文件、125 项通过；受影响 lint／类型及开发目录检查通过 | 完整源码图、输入／报告／附件字节、候选采用项推导、runtime 链接和隔离还原回读；正向数据／公开读取均为显式 fixture。实际来源重建／强制三例、可信 CI、发布／冻结及真实服务仍未完成 |

### 前次文档优化的边界

该次核对现有脚本、命令注册、MCP 适配器与官方部署资料，补充执行器、可信 CI 归档、coverage 推导和 Vercel 配置契约。该次只修改两份文档，未重新运行产品验收；不将随后执行的结果追加到该次旧报告。既有报告及其来源／附件哈希保持原样。

### 执行器与派生开发行为矩阵（2026-10-04）

本次实现 `test:examples:published`、自有预览进程管理器、独立 Playwright 浏览器 worker，以及从实际消费者／浏览器结果生成严格报告的组装路径。入口共享 R1 的来源重建、公开输入、官方 CLI 字节和隔离安装核心；只读取安装输入及全新输出目录，不开放 skip、fixture 或外部通过结果参数。确定性宿主增加显式启用的只读 API 调用快照，普通业务 API 接入不依赖该观察入口。

`--publish-evidence` 已接入实际 Blob SDK 的只追加上传／匿名回读；完整执行日志、浏览器观察、截图及输出字节进入本地 `execution-index.json`。此索引的 CI 环境字段仅用于定位，**没有完成实际 CI 作业及归档可信核验，也没有执行真实 Blob 写入**。默认结果是本地包装；严格报告仍须通过未完成的 R3／G0 门槛，不能直接用于发布 Catalog 或提升 coverage。

| 检查 | 原始结果 | 可证明范围 |
| --- | --- | --- |
| 定向回归 | `output/agent-access/example-runner-tests-05.json`：9 份文件、111 项通过、0 失败 | 源码／证据契约、严格组装、实际命令失败／超时日志、预览就绪／清理、观察快照与页面边界；正向报告组装仍使用明确标注的 fixture |
| 受影响 lint | `output/agent-access/example-runner-lint-05.log`：12 个文件通过 | 本次执行器、共享核心、开发入口、测试和适配器；不是整个仓库 lint |
| 范例设计 lint | `output/agent-access/example-runner-design-05.log`：通过 | `tests/fixtures/agent-examples/` 范围；不是整站设计验收 |
| 实际开发行为 | `output/playwright/example-runner-matrix-02/matrix-verification.json`：四格通过 | 每格重新类型／构建、三例独立状态上下文、键盘及 390／1440 视口；复用此前安装组件和依赖，不包含 bootstrap／CLI 安装 |

矩阵由 `output/playwright/example-runner-matrix-02/run.mjs` 生成；`source-at-start.json` 保存实际源码与清单。每格 `development-verification.json` 保存材料化文件、消费者清单、锁文件和最终哈希；`types.json`、`build.json`、`preview.json`、`browser-process.json` 保存实际进程结果，`browser/` 保存逐例观察、私有 API 调用快照和截图。执行后复核材料化源码、消费者清单、worker 与工作区来源未变。

| 固定输入 | 实际值 |
| --- | --- |
| 基线 revision | `c741626ce69436bf07da0d7e63f08a3d02cddd5e` |
| 执行时源码集合 | `b7285f4620eb3287b528a1b1eccf2c77f0761ef2c2048344d9a5cf2f30d03a3c`，`sourceClean: false` |
| 执行时根锁文件 | `e8ce91ee8568ae9045fe357e69ef0c939de6d31bcb74e88f1f236d81f8447b48` |
| 范例源码清单 | `df5fa41d5f0703309738db060677b86dca772372cff12241eec580d4001c9915` |
| 实际浏览器 worker | `0133bbf80e515cb32bff54a3c7ed3337b1ff5f2dd6a656cca0eefa00614faa52` |
| 运行时 | Node 22.17.0；Chromium 140.0.7339.186；Playwright 1.55.1 |
| 框架／包管理器 | Next 15.5.9、Vite 8.2.1；npm 10.9.2、pnpm 10.12.4 |

各格均为：详情 11 项状态通过及 1 项声明不适用；列表 10 项通过；设置 11 项通过及 1 项声明不适用；另外 3 条键盘流程及 6 个视口检查通过。合计 128 项状态通过、8 项不适用、12 条键盘流程、24 个视口检查和 24 张 PNG。不适用不计通过。共用宿主的类型／构建按格实际执行，每例行为独立记录。

此矩阵使用确定性业务接口、Chromium、英文／浅色模式和指定两种宽度；没有验证真实业务后端、其他浏览器或完整主题矩阵。返回上下文断言覆盖已执行的搜索／筛选和焦点路径，不宣称所有导航组合均已穷举。报告明确 `publishedInstallation: false`、`coveragePromoted: false`；历史安装来源各不相同，不拼接成同一正式 S。

失败与修复另存，未改写旧结果：

| 运行 | 失败与处理 | 后续证据 |
| --- | --- | --- |
| `output/playwright/example-runner-vite-pnpm-01/preview-01.json` | 就绪输出含颜色码，实际预览已启动但 banner 匹配失败；改为去除颜色码并同时核对 HTTP 可达 | 后续运行使用同一自有进程管理器并完成清理 |
| 同目录 `checks-02/` | 当前锁定 Chromium 未安装，浏览器启动失败；安装匹配的 headless shell，不借用其他版本 | 后续观察记录实际浏览器版本 |
| 同目录 `checks-03/` | 返回列表断言误以为搜索 `2` 有两页，实际匹配十条、共一页；修正检查假设 | 未作为业务页面缺陷或旧通过结果 |
| 同目录 `checks-04/`、`checks-05/` | Name 操作打开排序菜单；检查先误作切换按钮，再误用 menuitem，实际为 menuitemradio；按实际控件操作修正 | `checks-06/` 三例通过；随后四格矩阵独立运行 |
| `output/playwright/example-runner-matrix-01/next-npm/` | npm 执行预览未分隔工具参数，Next 将主机地址当项目目录；共享命令增加参数分隔 | `matrix-02` 的 npm／pnpm 两框架均通过 |

单元检查中 `example-runner-tests-02.json` 保留一项失败：正向参数测试使用了位于源码集合内的输出目录，被正确拒绝。改为全新隔离目录，并为负例使用有效基础输入后，`tests-03`、`tests-04` 和最新 `tests-05` 均通过；不删除失败记录。

本次归档为 `output/agent-access/example-runner-local-validation.json`：保留报告／原始附件哈希及归档时源码，执行时矩阵来源单列。文档更新改变非忽略源码集合，因此归档时来源不能替换上述已执行来源；后续正式运行须使用新的干净内容提交。完整正式 Linux 安装、真实资源／Blob、受控 CI／Catalog、实际客户端及 Vercel／回退仍为未完成。

### Catalog 范例字节绑定与还原（2026-10-04）

`agent-catalog-examples.mjs` 将范例原始源码／运行说明、声明、源码清单、规范化安装输入及报告加入候选的 `examples/` 文件集。runtime 的 descriptor 与内容身份纳入全部原字节哈希，详情仅保存固定源文件、说明、报告链接和声明组合；完整源码、PNG 和大报告不放入 MCP runtime。`get_component` 的 examples 章节及固定 Markdown 显示相同链接，并沿用分页预算。

纯组装拒绝输入中预填的 `example-verified`、范例链接和 descriptor；基线从已有 guide 计算，只有全套声明／原字节／检查附件核验后才为实际采用项生成候选标签。安装闭包中的 tokens、未采用的 Next-only Block 不因此升级。纯候选明确 `executionTrust: not-verified-by-pure-assembly`，目前正式入口及 CI 信任门槛尚未接入，不能把 fixture 候选作为正式成功记录。

来源校验增加可复用的原字节导入图重建：工作区与归档走同一 AST 核验，不执行范例模块。即使同时伪造声明、清单和报告，隐藏实际组件导入也会被拒绝。归档读取保留原源码和声明字节，核对 12 个声明结果及固定资源；还原时另外匿名回读实际相关 Registry 文件、全部 JSON 检查和 PNG，受原总时限／字节预算限制，全部通过才替换现有输出。

| 检查 | 原始结果 | 范围与限制 |
| --- | --- | --- |
| 定向回归 | `output/agent-access/catalog-examples-tests-04.json`：12 份文件、125 项通过、0 失败 | 11 项新增 Catalog 范例用例，加既有目录／身份／源码／证据／还原／协议及运行器回归；不包含全部旧 111 项，不能相加成完整工程通过 |
| 新增负例 | `tests/agent-catalog-examples.test.mjs` | 标签／链接注入、隐藏导入、报告缺行、来源／CLI／闭包替换、原字节或附件缺失、runtime 外源链接及错误声明；还原失败时原输出保持原样 |
| 正向完整还原 | 同一测试的内存资源存储与注入 fetcher | 真正调用还原实现，逐件读 fixture Registry／JSON／PNG 并核对恢复文件；不会访问真实源站、不运行官方 CLI 或浏览器、不建立可信 CI |
| 可审查的两版往返产物 | `output/agent-access/catalog-examples-roundtrip-01/roundtrip-verification.json`：两版各 3 例／12 行／10 个源文件，320 次注入资源读取通过 | `catalog/` 保留完整纯候选，`restored/` 保留固定记录还原结果及两版 MCP 链接检查；源 revision 为明确的 d／e 重复值，根目录 `scope.json` 标记 fixture，不代表实际提交或公开资源 |
| 受影响 lint | `output/agent-access/catalog-examples-lint-04.log`：13 个文件通过 | 新增与修改的 schema／query／渲染、组装／源码／还原及测试文件；不是全仓库 lint |
| 类型检查 | `output/agent-access/catalog-examples-types-04.log`：通过 | 工作区 `tsc --noEmit --incremental false`，不等于站点生产构建 |
| 开发目录 | `output/agent-access/catalog-examples-catalog-03.log`：141 项、23 份指南，仍为 `bf28f3d3…` | 当前开发目录未升级覆盖、安装仍为 null；没有发布新的 Catalog |

`catalog-examples-tests-01.json` 保留两项失败：提取共享 fixture 时遗漏已有负例使用的绑定函数导入；修复后回归恢复。`tests-02` 保留一项失败：预算负例预期上层错误码，但有界读取器将回调预算拒绝统一为 `TOTAL_BODY_TOO_LARGE`；修正期望且继续核对原输出未变。`lint-02` 保留一项未使用导入警告，移除后通过。`tests-03` 的 124 项及最终 `tests-04` 的 125 项均通过，新增项验证一致伪造元数据也不能隐藏实际导入。

本次归档为 `output/agent-access/catalog-examples-local-validation.json`，原始报告和日志哈希保留；`catalog-examples-source-after-checks.json` 记录检查完成后、文档状态更新前的实际来源，归档来源另列，不冒充执行开始快照或干净 S。前一浏览器矩阵的来源及附件不变，本轮没有重跑该矩阵、整站构建或实际发布。

剩余 R3 工作仍包括正式 CLI 的来源重建及强制三例、真实 CI 作业／归档核验、上一正式身份／路径比较、Catalog 上传和记录冻结。R4–R6 的真实资源、Linux 全新安装、实际客户端、Vercel 与回退继续按主方案门槛执行。

### 统一执行索引与 CI ZIP 读取（2026-10-04）

`agent-execution-index.mjs` 增加共用严格索引与写入器，R1 原直接输出报告的路径和 R2 原独立索引均改用它。绑定角色、来源四字段、安装输入、实际报告包装、执行器／worker 源码及全部输出原字节；公开附件副本也在完整文件清单中。非 CI 环境 locator 为 null，CI 环境要求完整字段及相同来源 SHA，字段仅帮助定位，不能认证平台作业。

归档读取校验精确文件集、规范化索引／报告、四格消费者原证据及三例声明组合、公开附件引用、源码与输入。必需安装／类型／构建／浏览器日志须存在并有正确实际退出记录；Vite 拒绝项检查非零及对应原因。索引与报告写入前先核验，旧结果碰撞、缺日志或错误附件不写严格报告；默认 local wrapper 明确不能用作发布输入。

`safe-ci-zip.mjs` 单独读取普通 ZIP 的目录、stored／deflate 及有／无签名数据描述符；先检查中央目录与本地头的一致性、路径／类型、连续范围、元数据预算，再按块解压核对实际大小／CRC。拒绝加密、ZIP64、分卷、链接／特殊文件、隐藏／重叠内容及文件／目录冲突，不解包到磁盘。文件数预算计入目录和索引，总解压预算包含索引原字节；Skill ZIP 原契约保持不变。

| 检查 | 原始结果 | 能证明的范围 |
| --- | --- | --- |
| 定向回归 | `output/agent-access/execution-index-tests-04.json`：9 份文件、112 项通过、0 失败 | 新增索引 17 项、CI ZIP 20 项，加受影响消费者／范例／Catalog／Skill ZIP 回归；不包含全项目测试或全部历史 125／111 项 |
| 两类完整流式往返 | `tests/agent-execution-index.test.mjs` | 各用 fflate 独立流式 ZIP 生成器打包完整报告、日志与附件，再经过新 ZIP／索引读取器逐字节校验；报告、日志、PNG 为明确 fixture，没有实际安装、浏览器、Blob 或 Actions 作业 |
| 负例 | 同索引测试及 `tests/safe-ci-zip.test.mjs` | 一致重签名的来源／报告替换、少范例行、缺必需日志、失败退出、旧结果、外源附件、文件替换、恶意路径／类型、CRC、声明及实际解压预算 |
| 受影响 lint | `output/agent-access/execution-index-lint-04.log`：通过 | 两个新脚本、两入口、两测试，共 6 个文件；不作为全仓库 lint |
| 类型检查 | `output/agent-access/execution-index-types-04.log`：通过 | 工作区类型检查，不等于整站构建或正式消费端执行 |

本地阶段记录保留 `tests-01` 的 32 项、`tests-02` 的 107 项、`tests-03` 的 109 项及最终 `tests-04` 的 112 项，均通过；递增来自新增日志／完整矩阵与流式往返用例，不把次数相加。

本次归档为 `output/agent-access/execution-index-local-validation.json`。`execution-index-source-before-checks.json` 记录最终定向检查前的实际源码，归档时来源另列；二者均为 dirty 工作区，不冒充正式 S。文档随后同步状态，没有重写测试或历史来源哈希。

尚未建立 GitHub API run／attempt／job 可信核验、真实归档下载、策略／两工作流及 Catalog 放行集成。本轮没有正式 Linux 全链路、公开证据发布或线上验收；字节自洽和日志格式正确仍不足以证明可信执行。

### CI 交接与文档修订（2026-10-04）

本次只修改实施方案与本附录。核对当前命令注册、普通 CI、安装输入准备入口、MCP 路由及新增 CI 草稿，并参照 GitHub／Vercel 官方文档修正交接约定；没有修改产品代码、补填通过报告、上传资源或部署应用。

| 修订 | 已核对的事实 | 仍待实现或验收 |
| --- | --- | --- |
| CI 草稿状态 | 工作区存在 `docs/agent-data/ci-trust.json`、`scripts/agent-ci-contract.mjs`、`scripts/agent-ci-github.mjs`；`agents:ci:check` 尚未注册，两发布工作流不存在 | 草稿测试、平台交叉核验及 CLI／工作流；不属于旧 112 项已验证范围 |
| 安装输入交接 | `agents:installation:prepare` 已注册，可从候选与实际完成标记组装规范化输入；当前上传器不支持通用输入文件发布 | 验证工作流准备 job，从 S 重建并按固定 artifact ID／原字节哈希交给两类 jobs |
| 平台保护与审查 | classic 分支保护 API 需要 Administration read；保护元数据与某提交人工 review 是不同证据 | 真实权限、生效规则、S 的来源关系与仓库既有审查记录；不因文档写了 protected 即放行 |
| CI 附件可见性 | 当前仓库公开；GitHub 登录用户有仓库读取权限即可下载工作流附件，`private-logs/` 名称不使其私有 | 上传前核对可发布性；持久副本的真实访问控制、原 ZIP／元数据／回执回读及冻结交接 |
| 时间与字节范围 | 已验证 ZIP 读取与草稿 HTTP 预算属于不同范围；源码构建、实际执行和平台核验不能共用一份未实现的通过结论 | 平台／归档／公开附件编排共用期限及累计字节回归；工作流作业超时分别核对 |

依据见[GitHub 归档读取](https://docs.github.com/en/rest/actions/artifacts)、[分支保护](https://docs.github.com/en/rest/branches/branch-protection#get-branch-protection)、[附件下载权限](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts)及[当前仓库](https://github.com/Carlosfengv/zeron-ui)。外部资料只支持平台行为，不证明本仓库已运行可信 CI 或完成发布。

本次文档检查记录保存在 `output/agent-access/document-optimization-2026-10-04/`，用于核对章节、表格、命令注册、链接与修订文件范围；它不是产品测试或正式发布证据。此前各份报告、源码哈希及通过／失败范围保持原样。文档改变非忽略源码输入，后续正式运行仍须固定新的干净 S。

### CI 平台核验与验证工作流本地检查（2026-10-04）

本节单独登记此前未列入 112 项索引／ZIP 回归的新增 CI 检查。`agent-ci-contract.mjs`、`agent-ci-github.mjs`、`agent-ci-trust.mjs` 和 `check-agent-ci-evidence.mjs` 已接入固定策略、Git S 来源核对、平台身份／步骤／归档交叉核验及匿名公开字节回读；`agents:ci:check` 已注册。另有 `prepare-agent-ci-input.mjs` 和验证 YAML，实现从固定配置准备输入及按 artifact ID／bytes／SHA-256 交接。

| 检查 | 原始结果 | 证明范围及限制 |
| --- | --- | --- |
| HTTP 读取 | `output/agent-access/ci-github-tests-01.json`：40 项通过；最终报告也包含这 40 项 | 注入响应验证固定 API、认证隔离、签名 URL 刷新、重试、超时、分页、原字节／累计预算及严格契约；不是实际 GitHub 归档下载 |
| 最终定向回归 | `output/agent-access/ci-trust-tests-04.json`：四份测试文件、93 项通过、0 失败 | HTTP 40／平台 42／CLI 5／工作流 6；不包含全项目测试，不与历史 112／125／111 项相加 |
| 平台与 ZIP 正例 | `tests/agent-ci-trust.test.mjs`、`tests/helpers/agent-ci-fixture.mjs` | 完整 ZIP 实际经过读取器／索引／报告及公开附件核验，但平台、源码 revision、日志、报告、PNG 和公开响应均为显式 fixture；未运行官方 CLI、真实浏览器、Blob 或 Actions |
| 生产入口拒绝路径 | `tests/agent-ci-cli.test.mjs`、`tests/agent-ci-workflow.test.mjs` | 实际调用入口，错误输入、dirty 来源或不符运行环境在网络前失败，只写安全失败结果；没有取得生产 CLI 的真实正向回执 |
| 工作流契约 | `tests/agent-ci-workflow.test.mjs` | YAML 与固定策略、步骤顺序、完整 Action SHA、锁文件安装、固定 artifact ID 与输入字节检查一致；不能证明 workflow 已运行或凭据已隔离 |
| Action 引用 | `output/agent-access/ci-action-pins-01.json` | 保存五个官方仓库 v4 引用及 pnpm 注释标签解析的原元数据；只证明当次固定 SHA 的来源，不证明执行通过 |

这些检查使用 Node 22.17.0 的本地环境。最终 JSON 的 `testResults` 包含四个文件；其汇总字段 `numTotalTestSuites: 8` 不作为测试文件数量。当前未保存可将全部正向检查绑定到干净正式 S 的运行开始来源记录；本次文档归档仅保存核对时的文件哈希，不能补称为执行开始快照。

旧失败保留：`ci-trust-tests-01.json` 为 42 项中 39 通过、3 失败，失败涉及测试期望与更早契约拒绝不一致；`ci-trust-tests-02.json` 的 82 项通过。`ci-trust-tests-03.json` 为 87 项中 86 通过、1 失败，生产入口先拒绝 dirty 来源，测试原先只接受来源绑定不匹配；最终用例保留两种门槛且断言未联网／未写回执。修正测试期望后 `tests-04` 的 93 项全部通过，旧失败报告不改写。

**仍未验收：** 实际保护规则与读取身份、干净 S 的真实准备／四格／三例执行、真实平台 ZIP 与公开附件核验、正式 CLI 正例、Blob 写入、Catalog 发布／冻结、实际客户端、Vercel 与回退。`docs/agent-data/installation-config.json` 和发布工作流尚不存在；当前验证 YAML 开启隐藏文件及失败时上传，却没有上传前内容检查，也没有 GitHub environment 绑定。需要先补齐检查与身份限制，不能凭这 93 项结果配置写入凭据后直接启用正式运行。

### 实施文档状态同步（2026-10-04）

本次只编辑实施方案与本附录。核对当前源码、命令注册、验证 YAML、实际测试 JSON 和官方附件／凭据说明后，同步 CI 实现状态、明确首次启用顺序及配置名称，并拆分本地实现与真实验收检查单。前次文档中“草稿未测试／命令未注册／两工作流均不存在”保留在该次历史记录内，当前状态以主文档第 12.1 节为准。

本次检查材料保存于 `output/agent-access/document-optimization-2026-10-04-02/`，包含修订前两份文档、非忽略文件和历史报告的原始字节描述符、修订差异及文档核对结果。本次不重跑产品测试、不变更工作流或代码、不发布资源，不为旧报告补写来源。Markdown 源文件校验不证明编辑器中的最终排版或线上渲染；文档更改后正式运行仍须使用新的干净 S。

### 公开 CI 归档内容检查与原字节副本（2026-10-04）

新增 `scripts/check-agent-ci-archive.mjs`，工作流仅在内容步骤成功后上传检查后的全新副本。读取固定执行器的报告、日志、观察及 PNG 路径，拒绝额外文件、链接／硬链接、非规范 JSON、已知凭据及常见编码、认证字段、签名／账号 URL 和 PNG 文本元数据。成功归档还须通过完整索引／正式报告核验，失败仅保留已有诊断，不补 pass。副本保持原字节并逐件回读，原目录不被改写，旧副本目录不可复用；此模块不联网或上传。

固定策略新增必需 `archiveCheckStep`，平台编排要求执行→内容检查→上传三步骤各自成功，序号与时间顺序匹配，artifact 创建不早于上传开始。平台下载 ZIP 后再运行相同内容规则，额外 `.env` 或重签索引后的凭据日志即使平台步骤成功也拒绝。两类验证 jobs 引用 `agent-artifact-publication` 环境；这仅是代码接入，环境的 main 限制、凭据范围和真实权限尚未核对。

| 检查 | 原始结果 | 范围及限制 |
| --- | --- | --- |
| 最终受影响回归 | `output/agent-access/ci-archive-publicability-01/tests-final.json`：14 份测试文件、273 项通过、0 失败 | CI 五份文件 151 项：内容 47／平台 53／HTTP 40／CLI 5／工作流 6；另覆盖索引、ZIP、安装输入、消费者／范例及 Catalog 受影响边界，不代表全仓库或真实发布通过 |
| 内容／副本正例 | `tests/agent-ci-archive.test.mjs` | 实际调用生产内容入口，在磁盘创建并逐件核对两类副本，无网络或原目录改写；报告、日志、平台与 PNG 为显式 fixture，不是实际安装／浏览器／CI 成功记录 |
| 平台负例 | `tests/agent-ci-trust.test.mjs` | 三必需步骤的 skipped／failure／cancelled、缺内容步骤、错误顺序、提前 artifact、重签凭据日志／额外文件均拒绝；平台响应仍是注入 fixture |
| 受影响 lint | `output/agent-access/ci-archive-publicability-01/lint-final.log`：12 个脚本／测试通过，0 警告 | 覆盖六个 CI 脚本、五个测试及共享 fixture，不是全仓库 lint |
| 工作区类型检查 | 同目录 `types-final.log`：通过 | `tsc --noEmit --incremental false`；没有重跑整站生产构建 |
| 历史 PNG 格式兼容 | 同目录 `png-compatibility.json`：24 张原截图／7 份去重字节通过 | 读取既有 `example-runner-matrix-02` 的 PNG 检查格式／元数据；没有启动浏览器、改变原图或新增状态覆盖 |

最终检查使用 Node 22.17.0、darwin。`source-before-final-checks.json` 和 `source-after-final-checks.json` 记录并复核来源四字段及 14 个相关文件字节一致：revision 为 `c741626ce69436bf07da0d7e63f08a3d02cddd5e`，实际输入为 `cbffa02a1be0a43ce32f96f800180e7b4943daf91e8146a90fc764f4ec259a99`，锁文件为 `e8ce91ee8568ae9045fe357e69ef0c939de6d31bcb74e88f1f236d81f8447b48`，`sourceClean: false`。这些是本地检查来源，不是正式 S；随后更新文档的归档来源另列。

`tests-01.json` 的 146 项中 145 通过、1 失败保留原样：硬链接负例与其他测试共用了安装输入，改变了其链接计数，后续隔离目录负例先被文件类型门槛拒绝。改用独立外部文件测试硬链接，没有放宽生产门槛。随后 `tests-02.json` 的 151 项及最终 273 项均通过；旧 93／112 项报告保持原范围。

内容检查是固定公开范例的辅助门槛，不能识别所有未知秘密或像素中的私密内容，也不能替代执行器环境隔离与源码审查。CI 作业控制台不由此文件检查器覆盖；执行器仅打印摘要／错误码，完整日志经过副本门槛再上传。未进行真实 Actions／Blob／Catalog 发布、实际客户端或 Vercel 验收。发布工作流、Catalog 候选／上传／冻结及持久归档交接仍待完成，实际配置不能用 fixture 填补。

### Review 问题逐项映射（2026-10-04）

以下从实施方案原第 17 节移入，保留逐项问题及必须保留的验证。该索引说明 review 意见如何进入实施契约，不证明相应代码已经实现或线上验收通过；当前状态以主文档第 12.1、17 节为准。

| 问题 | 修订位置 | 必须保留的验证 |
| --- | --- | --- |
| P1：应用回退会撤掉新静态文件 | 5.3–5.4、8、13.3–13.4 | A→B→A 后 B 的目录、Registry 闭包与 Skill URL 哈希不变 |
| P1：Preview 会访问未上线生产依赖 | 7.3、10.1、13.1 | 最终源站先发布；实际 npm 消费者与 Preview 不改写 URL |
| P2：测试早于运行时数据生成 | 10.2–10.3 | 无生成文件和缓存的临时 checkout 完整通过 |
| P2：本地打包不能验证已发布 CLI | 7.3、11、13.1 | 精确 npm 包完整性、最终快照哈希、适用矩阵与证据匹配 |
| 发布验证输入与目录冻结互相依赖 | 10.4、12.3–12.4 | 独立安装输入、证据先就绪、报告后计算 Catalog；失败不输出成功报告 |
| 状态描述落后于代码 | 2、5.1、5.5、10、12.1–12.4 | 已实现还原／演进／lint 与未实现发布入口分开；历史证据不改写 |
| Skill 参考读取与旧指南路径承诺超出现状 | 7、12.4 R2／R3 | 精确文本参考集、历史字节及显式旧路径映射；完成前不宣称已覆盖 |
| 文本参考与范例仍有未定实现选择 | 6.3、7、10.4、12.4 | 包内选择文件绑定既有 manifest；原字节分页；范例来源与证据先固定，再计算 Catalog 身份 |
| Preview 不能证明实际 Instant Rollback | 13.3–13.4 | 独立验收项目生产域名的两个合格版本、环境与域名状态及资源回读 |
| 正式记录提交可能提前触发生产 | 8.2、13.1–13.2 | 实际构建环境的提交读取；Preview 分支和生产发布门槛均验收 |
| 执行信息分散、安装输入无完整交接入口 | 10.4、12.3–12.5、13.1.1 | 实现／实测状态分开；清单到输入、四格报告到 Catalog 的产物逐步绑定 |
| 内容来源与冻结记录提交混用 | 13.1.2 | 内容提交 S 与记录提交 D 分开，部署前核对关系，重试不改写原 provenance |
| 工作包与线上阶段混用、Preview 门槛循环 | 12.3、13.2、13.4 | R4 运行 R1–R3 工具；G0→G1→G2→G3 顺序验收，生产启用与复验分别记录 |
| 开发矩阵进度过时、混用包管理器导致假通过 | 6.3、12.1–12.3、证据附录 | 核对实际管理器及唯一锁文件；保留被拒绝的 npm 报告；Next × pnpm 旧超时与修复后的新运行分别留证 |
| 宿主、增量配置与逐例验收范围混淆 | 6.3、12.1、12.4 R2、13.4 | 三例四格分别验收行为；配置增量只证明其列出的检查，不追溯升级原安装报告 |
| 附件完整性被误当成执行真实性 | 6.3、12.4 R2／R3、13.4 | 严格报告之外核对受控 CI 实际作业与日志；合法 JSON／PNG 或自填作业链接不放行 |
| 纯组装器接受手填覆盖标签 | 12.4 R3、12.5 | 固定来源重建基线，由完整范例证据推导采用项 coverage，组装和还原均防绕过 |
| 正式执行器缺少输入输出与失败出口 | 10.4、12.3–12.5 | 独立正式入口、12 行自动检查、默认本地／显式发布、失败清理及新目录重试 |
| 无状态与 Vercel 配置无法逐项交接 | 4.1、8、8.3、13.4 | 新实例／两代协议、正式构建模式、Git 预检、真实客户端访问和 Blob 授权隔离 |
| 主方案混入大量历史测试明细 | 12.2、证据附录 | 主文档保留模块摘要，报告路径与原始范围移入附录，旧证据不改写 |
| 发布检查未明确由谁在哪一阶段执行 | 12.3、13.1.1、13.4 | 每项检查映射 G0–G3 和责任角色；R3 fixture 开发可先行，完整首版发布必须等正式报告 |
| 可信 CI 只有原则，缺少可执行核验契约 | 10.4–10.5、12.3–12.5 | 固定策略／S／attempt／job，统一 R1／R2 索引，平台归档与公开检查逐字节对应；真实正例另验收 |
| 发布 job 等待同一 run 完成造成循环 | 10.5、13.1.1 | 验证工作流先完成，发布工作流随后核验；失败日志上传不推导作业成功 |
| 回退或前代读取失败导致历史身份遗漏 | 12.4 R3、13.5 | 无前代须显式确认；B→A 后 C 仍对照 B 的正式发布基线 |
| 内容提交进入主分支可能绕过发布门槛 | 8.3、13.2 | 核对 S 和 D 两者的自动部署入口，生产启用必须等 G0–G2 |
| CI 新实现被算入此前已验证范围 | 10.1、10.5、12.1–12.5 | 当前 151 项 CI／273 项受影响回归按本轮来源记录；不扩大旧 93／112 项，真实平台正例另计 |
| 安装输入无法交给两类 CI 作业 | 4.1、10.5、13.1.1 | 准备 job 从 S 重建输入，以固定 artifact ID／原字节哈希交接，不依赖尚不存在的任意输入上传命令 |
| 分支保护被误当成某提交已审查 | 10.5、13.4 | 平台规则、来源关系与仓库既有 review 流程分别留证，回执不自报人工审批通过 |
| 公开仓库归档被承诺为私有 | 10.5、12.4–12.5、13.4–13.5 | 上传前核对可发布性及真实读取权限，冻结前持久副本逐字节交接；目录名、token 或分支保护不提供隐私保证 |
| 十分钟核验预算混入构建及整个发布 | 5.6、10.5 | 输入核验／源码重建、平台核验、真实执行和 MCP 时限分别说明；平台阶段共用期限及累计字节限制 |
| 工作流存在即被当成可正式启用 | 4.1、10.5、12.1、12.5 | 实际测试配置、上传前内容检查及身份限制齐备后固定 S；真实 run 与持久交接不由静态契约测试替代 |

上述问题已补入实施契约。CI 前置顺序、部分还原保障及 R1 安装输入核验已有代码和对应本地结果；实际 npm 字节证据另列，不能替代四格消费者或线上验收。其余以 R1–R6 的实际退出条件判断。状态、证据摘要、任务与检查单见第 12.1–12.5 节，逐次历史结果保存在证据附录；文档修订不使未验收项变为通过。

### 实施顺序与 Review 索引整理（2026-10-04）

本次仅修改实施方案与本附录：压缩开篇并明确下一项为 Catalog 正式候选，合并重复任务表，固定候选→上传→冻结／持久交接→发布工作流的开发顺序，区分 R2 验证支持与 R3 发布编排。实际发布仍按原有 Registry／Skill→真实消费者／范例→CI 核验→Catalog／冻结→Preview→回退／生产流程执行，没有缩减 R1–R6、三例全部组合或 G0–G3 门槛。

核对命令注册及现有源码，修正证据摘要中将“真实平台待验收”写成“核验器待开发”的歧义。原 Review 逐项映射保留在本节上方，主文档改为整改状态摘要。历史测试报告及其来源不改写；本次文档核对不包含产品测试、Blob 写入、Actions 执行或部署。检查材料位于 `output/agent-access/document-optimization-2026-10-04-03/`；Markdown 源文件校验不证明最终渲染。

### Catalog 正式候选与前代检查（2026-10-04）

新增 `scripts/create-agent-catalog-release.mjs` 和 `scripts/agent-catalog-predecessor.mjs`，注册 `agents:catalog:release`。生产入口要求 Node 22、全新隔离目录和干净固定来源，复用真实安装输入核验与 CI 核验器；两份外部报告必须等于本次核验归档的原始字节。目录生成器可使用已核验的 Registry／Skill 文件，从维护的文档、语义、指南和导出类型重建基线，不读取开发 runtime 或回退到旧分发。正式入口强制当前三例全部四格／12 行，输出 payload、manifest 与独立 review 材料；失败删除可用 manifest／候选回执，不上传资源或激活应用。

前代检查读取 S 中全部合法记录及选择文件，核验原字节／历史引用，要求唯一连通的记录链；显式前代等于最新已批准记录，生产选择可指向更旧版本。B→A 后仍选 B 作为 C 的比较基线；`none`、分叉、缺记录／选择、错误哈希与乱序不能绕过。公开前代在临时目录复用完整还原器核验，再比较身份、别名及指南路径。来源和 CI 读取辅助函数复用，公开 payload 支持含冒号 ID 的原路径和单次编码 URL。

| 检查 | 原始结果 | 范围及限制 |
| --- | --- | --- |
| 受影响回归 | `output/agent-access/catalog-candidate-01/tests-final.json`：17 份文件、288 项通过、0 失败 | 候选／前代 11 项、实际来源重建 2 项、目录生成 2 项及此前 14 份受影响文件的 273 项；不与旧报告累计，不代表全仓库或真实发布通过 |
| 候选绑定与前代 | `tests/agent-catalog-candidate.test.mjs` | 实际 CI 编排读取明确的模拟平台／公开字节，纯组装检查报告、12 行、附件、历史身份与路径；在磁盘核对完整 payload 和含冒号路径。平台、成功报告和 PNG 均是 fixture，生产 CLI 没有真实正例 |
| 实际来源重建 | `tests/agent-catalog-source.test.mjs` | 从当前维护源码实际生成隔离 Registry 和 Skill，重建 141 项目录及公共导出；重复输入一致、缺固定字节不降级，原开发分发／runtime 不变。这是 dirty 本地候选，没有公开上传、真实 npm 消费或干净 S |
| 生产拒绝路径 | 候选测试及原 `tests/agent-ci-cli.test.mjs` | 正式入口实际拒绝 dirty／错误来源且未发出网络请求，输出安全 failure，不写候选 manifest／回执，旧输出拒绝复用；不证明生产成功路径已验收 |
| 受影响 lint | 同目录 `lint-final.log`：7 份脚本／测试通过、0 警告 | 五份实现／辅助文件及两份新增测试，不是全仓库 lint |
| 工作区类型检查 | 同目录 `types-final.log`：通过 | `tsc --noEmit --incremental false`；本轮未跑整站生产构建或浏览器 |

最终检查使用 Node 22.17.0、darwin。开始／结束的 `source-before-final-checks.json`、`source-after-final-checks.json` 确认来源四字段及 8 个相关文件相同：revision 为 `c741626ce69436bf07da0d7e63f08a3d02cddd5e`，实际来源集合为 `660eb4f04f5653414e5451f9dc3d25d9840bc4217151135d9fdbf3f2659396c4`，锁文件为 `e8ce91ee8568ae9045fe357e69ef0c939de6d31bcb74e88f1f236d81f8447b48`，`sourceClean: false`。随后文档状态同步属于归档时的新来源，未补写到旧报告中。

`tests-01.json` 的 18 项中 17 通过、1 失败保留：乱序历史用例先触发“记录链断开”，原测试只期待后续“历史顺序”错误。修正期望后最终 288 项通过，没有放宽生产门槛。Catalog 上传／冻结与发布工作流尚未完成；没有真实 Actions 正例、Blob 写入、正式候选成功、客户端、Vercel 或回退证据。原始 ZIP／元数据在本地 review 目录保存不等于持久交接，应用和线上验收仍归 R4–R6。

### Catalog 上传与审查材料重新核验（2026-10-04）

新增 `scripts/agent-catalog-publication.mjs` 并扩展现有 `agents:publish`，没有另设上传命令或绕过参数。本地 dry-run 要求候选 `payload/manifest.json`、同一目录树中的 `candidate-review.json` 及固定 `review/` 输入，逐字节绑定安装输入、两类报告、CI 定位、回执及前代；完整 payload 仍须满足三例全部四格／12 行。材料合法只证明本地绑定，不能证明真实 CI 可信。

正式上传在干净 Node 22 来源下捕获审查输入的原字节，在新临时目录调用现有正式候选入口，重新核验实际来源、公开资源、CI 归档及已提交前代。重建 manifest 与前代引用须等于原候选，旧回执不提供本次授权。控制器捕获上传内容后、首次存储请求前再次核对来源、review 和 manifest；缺门槛、孤立 manifest 或期间漂移均拒绝。完成标记继续最后写入，冲突不覆盖，相同字节可续传／重试；SDK 返回 URL 仅接受同源、同路径的一次编码等价表示。CI ZIP／API 材料不加入公开 payload。

| 检查 | 原始结果 | 范围及限制 |
| --- | --- | --- |
| 受影响回归 | `output/agent-access/catalog-publication-01/tests-final.json`：22 份测试文件、345 项通过、0 失败 | 新增上传 11 项及既有候选、来源重建、发布、还原、下载和 CI 等相关检查；不是全仓库或正式发布验收，不与历史 288／273 项累加 |
| 上传材料／存储控制器 | `tests/agent-catalog-publication.test.mjs` | 覆盖缺材料、改写绑定、定位不符、缺门槛、首次请求前复核、完成标记顺序、冲突、续传／同内容重试及 URL 编码；成功平台／报告、门槛回调和存储均为显式 fixture |
| 实际 CLI | 同一测试文件 | 实际子进程 dry-run 通过；实际生产上传入口拒绝 dirty／错误来源，未调用网络或写入凭据，并产生安全失败报告。没有正式上传成功路径 |
| 受影响 lint | 同目录 `lint-final.log`：3 份实现／测试文件通过、0 警告 | 新辅助模块、上传控制器和新增测试，不是全仓库 lint |
| 工作区类型检查 | 同目录 `types-final.log`：通过 | `tsc --noEmit --incremental false`；没有重跑整站生产构建或浏览器 |

最终检查使用 Node 22.17.0、darwin。`source-before-final-checks.json` 与 `source-after-final-checks.json` 确认来源四字段及 3 个相关文件一致：revision 为 `c741626ce69436bf07da0d7e63f08a3d02cddd5e`，实际来源集合为 `1fa292d7ee73249fe87984c2c58d0816d5dd2a3cee22356df56825030c32289c`，锁文件为 `e8ce91ee8568ae9045fe357e69ef0c939de6d31bcb74e88f1f236d81f8447b48`，`sourceClean: false`。随后文档同步的来源单独登记在 `local-validation.json`，不补写到原执行报告中。

`tests-01.json` 的 26 项中 25 通过、1 失败保留：定位负例把 consumer job ID 从 201 加至 202，与 examples job ID 重复，先触发 schema 拒绝。改为不重复的错误 ID 后按预期触发绑定拒绝；没有放宽生产门槛。检查期间磁盘不足，清理了可重建的 `.next/cache`，未删除源码或原始报告；最终检查全部通过。

本轮没有实际 Actions 正例、Blob 写入、正式消费者／范例安装、Vercel、客户端或回退验收。当前工作区未发现实际安装配置或 Vercel 项目文件，进程内也未配置发布所需环境项；这不证明账号没有权限。冻结入口、原 CI 归档持久交接及后续发布工作流仍待实现，完整交付继续按 R1–R6 和 G0–G3 判断。

### 冻结入口与 CI 原归档私有交接（2026-10-04）

新增 `scripts/freeze-agent-release.mjs`、`scripts/agent-ci-retention.mjs`，注册 `agents:release:freeze`。正式入口只有七组文档参数，不提供 receipt 导入、存储地址、skip 或 mock 参数。输入须与完整候选 review 原字节一致；干净 Node 22 来源下读取 S 的固定归档配置及已提交前代，再在新隔离目录复用正式候选入口重新核验来源、公开安装资源、CI／报告原字节和前代。草稿绑定完整三阶段 manifest／completion，使用临时目录完整还原当前及显式历史版本、公开范例检查／PNG；仓库应用输出不被激活。

私有交接使用独立 Vercel Blob 和专用 `AGENT_CI_ARCHIVE_BLOB_TOKEN`，配置固定在 S 的 `docs/agent-data/ci-archive-storage.json`。现有 SDK 2.8.0 的私有 `put`／`get`、`useCache: false` 及显式 token 已核对，与[官方私有存储说明](https://vercel.com/docs/vercel-blob/private-storage)、[SDK 说明](https://vercel.com/docs/vercel-blob/using-blob-sdk)一致。该实际配置文件及存储仍未建立，本轮没有使用真实凭据。

两份新核验的原 ZIP、API 原始响应、索引／报告、回执、输入／定位及确定性记录／选择草稿进入内容哈希 bundle。严格比较文件集、descriptor、ZIP 中的索引／报告字节及记录绑定；原 API 响应保持其实际格式。已有同字节复用、不同字节拒绝，认证回读和匿名拒绝检查在索引写入前逐件完成；索引最后按相同规则核验。索引绑定记录原字节哈希，冻结审查报告保存其 URL／bytes／SHA-256；产品记录 schema 不增加 CI 凭据或私有读取依赖。来源／候选复核及转存通过后才输出 `releases/` 草稿与 `freeze-review.json`，失败清理可用记录／选择。成功仍是 `draft-verified-not-approved-or-deployed`，工具不会提交记录或部署应用。

| 检查 | 原始结果 | 范围及限制 |
| --- | --- | --- |
| 受影响回归 | `output/agent-access/release-freeze-01/tests-final.json`：24 份测试文件、364 项通过、0 失败 | 新增冻结 9 项／私有留存 10 项及既有 22 份受影响文件的 345 项；不是全仓库或正式发布验收，不与历史报告累计 |
| 草稿与公开还原 | `tests/agent-release-freeze.test.mjs` | 确定性记录／选择、报告和完成标记哈希、来源／历史错误拒绝；实际调用完整还原器，在临时目录读取当前和前代的三阶段及完整范例证据。公开字节、成功报告和平台均是 fixture，没有真实安装／公开资源／CI 成功 |
| 私有副本与 SDK | `tests/agent-ci-retention.test.mjs` | 原 ZIP／API／回执等字节保持、文件／来源／角色绑定、认证回读和匿名拒绝先于索引、相同重试／续传、丢失写响应恢复、冲突及超时；SDK 还拒绝错误 token/store、返回位置、流式超量、公开读取及跳转。存储、SDK 和拒绝响应是注入 fixture |
| 实际生产入口 | 冻结测试的函数及子进程 | 当前正式入口实际在来源阶段拒绝 dirty 工作区，未联网或接触存储，输出安全 failure，未生成可用记录；旧输出拒绝复用。其他来源绑定差异另有纯契约负例，未取得干净来源的正式 CLI 成功冻结或晚期转存失败运行证据 |
| 受影响 lint | 同目录 `lint-final.log`：4 份实现／测试文件通过、0 警告 | 两个新增模块和两份测试，不是全仓库 lint |
| 工作区类型检查 | 同目录 `types-final.log`：通过 | `tsc --noEmit --incremental false`；没有整站生产构建或实际浏览器复验 |

最终检查使用 Node 22.17.0、darwin。`source-before-final-checks.json` 与 `source-after-final-checks.json` 确认来源四字段及 5 个相关文件一致：revision 为 `c741626ce69436bf07da0d7e63f08a3d02cddd5e`，实际来源集合为 `a1283782bb6dd15dc2f7125bd4e1fdb2fda1f36b07b8d3ebdde51158259459c1`，锁文件为 `e8ce91ee8568ae9045fe357e69ef0c939de6d31bcb74e88f1f236d81f8447b48`，`sourceClean: false`。随后文档更新属于归档时的新来源，不改写执行快照或旧报告。

`tests-01.json` 的 18 项中 8 通过、10 失败保留：8 项受错误的 API 元数据规范化要求阻断，2 项实际入口已经拒绝 dirty 来源但测试期待不同错误码。修正实现，允许解析合法的 API 原格式并继续核对原始哈希；执行索引／报告仍保持规范化要求。修正错误码期望后 `tests-02.json` 的 18 项通过，加入前代完整还原后 `tests-03.json` 的 19 项及最终 364 项通过。最初 lint 的一个未使用导入已移除；没有放宽来源、CI 或私有访问门槛。

当前仍缺实际归档配置、真实环境权限／留存安排、CI 正例、Blob 写入、正式冻结、客户端、Vercel 及回退验收。私有 store 及“不自动删除”配置是后续真实交付要求，SDK fixture 不能证明平台访问控制或不可删除。后续发布工作流尚未接入；下一项继续串联正式入口，完整目标和 R1–R6／G0–G3 保持不变。

### 发布交接与部署门槛文档优化（2026-10-04）

本次只修改实施方案和本附录。核对工作区代码、命令注册、已有 review 映射和冻结阶段原始报告；未修改产品代码、运行产品测试、写入 Blob、提交记录或部署应用。历史段落中的“当前／尚未接入”保留原记录时点；本次核对后的现状以主方案第 12.1 节为准。

| 修订 | 本次核对事实与处理 | 验证边界 |
| --- | --- | --- |
| 状态一致性 | 修正主方案第 5.1、6.1、10.1 节过时的 Catalog／指南前代比较待实现描述；这些入口已有代码 | 真实前代及公开资源比较仍归 R4，不追溯扩大本地报告 |
| 发布草稿 | 工作区存在 `.github/workflows/agent-release-publication.yml` 和 `scripts/agent-publication-workflow.mjs`；草稿串联身份解析、S／P 比较、核验、候选、上传、冻结与固定审查文件 | 未发现对应工作流专用测试文件或新的回归报告；共享冻结 schema、token 回退、输入准备和内容检查也有后续改动。旧 364 项不能证明这些当前字节通过 |
| 配置交接 | 主方案第 4.2 节集中列出真实 origin、两份规范化配置、平台身份、目标项目／客户端及核对时点 | 工作区仍无 `installation-config.json`、`ci-archive-storage.json` 或 `.vercel/project.json`；未审计平台账号权限 |
| 提交与输入交接 | 第 10.6 节定义六项手动输入、两作业、固定 descriptor 与四份公开审查 JSON；S 是资源来源，P 是发布启动提交 | 根据草稿源码整理的实施契约，未取得实际 GitHub run 或交接产物 |
| 部署门槛 | 第 13.1.2 节补齐 S→D 的输入、完整树差异、旧记录不可变、G0 选择／历史绑定、失败出口和本地负例要求 | 独立检查入口仍待实现；当前还原 CLI 只核对提交记录字节，不证明该门槛已落地 |
| 执行顺序 | 第 12.3、12.5、17 节同步为草稿及共享模块回归→部署差异入口→R4 实际资源／CI→R5 Preview→R6 回退／生产 | R1–R6 与 G0–G3 的完整首版范围保持不变，未将任何线上待验收项打勾 |

本次重新读取 [Arc AI 文档](https://uiarc.dev/docs/ai)，保留五类只读工具、Skill／Registry 与账号／Pro 访问的对照；该页面没有提供内部会话实现证据。核对 [Vercel MCP 部署指南](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)的 Next.js／Streamable HTTP 路线，以及 [GitHub 上下文](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)、[run attempt API](https://docs.github.com/en/rest/actions/workflow-runs#get-a-workflow-run-attempt)的来源字段。外部资料不证明本项目客户端、Actions 或 Vercel 服务已通过。

文档检查归档于 `output/agent-access/document-refinement-2026-10-04-01/`：检查章节与链接目标、命令注册、工作流草稿契约的引用和本次修改范围。它仅是文档一致性检查，不是新增产品测试、实际执行、人工批准或部署证据。旧原始报告、来源哈希及通过／失败范围保持原样；后续正式执行从新的干净 S 开始。

### 后续发布工作流与控制文件本地验收（2026-10-04）

`.github/workflows/agent-release-publication.yml` 和 `scripts/agent-publication-workflow.mjs` 已接入后续发布编排，并新增 `tests/agent-publication-workflow.test.mjs`。两个 job 分别在 P 解析平台身份、在 S 执行正式入口；六项手动输入严格解析，完成验证的 run／attempt 按固定角色解析 job／artifact。描述符通过固定 artifact ID 与原 bytes／SHA-256 交接，重新准备输入后依次核验 CI、生成候选、上传 Catalog、冻结／私有留存，再只整理四份审查 JSON。工作流不提交记录、部署或批准 G0。

本轮收紧缺失／额外角色输入、控制路径与 Buffer 类型检查。控制比较读取完整的 `scripts/`、`lib/`、Registry 构建脚本以及固定配置／两工作流／包清单／锁文件；S 必须为 P 的祖先，集合与字节不符即拒绝。新增的可选 repository root 仅供库函数的显式临时 Git fixture 使用，正式 CLI 不接受该选项。

审查交接除记录／选择原字节外，现严格比较前代的完整 descriptor 与 `record.history[0]`，拒绝同名但哈希不同的前代以及在已有历史时使用 `none`；实际应用选择可以不同于最新批准前代。冻结审查 schema 绑定当前目录和私有索引路径，拒绝外源、签名、目录错配及尾部换行。CI 读取 token 在 Actions 缺 secret 展开为空字符串时回退 workflow token；非空但含空白的无效身份仍拒绝。输入准备与公开 JSON 内容检查继续使用既有边界，未放宽 archive 的 32 MiB 单文件预算。

| 检查 | 原始结果 | 范围与限制 |
| --- | --- | --- |
| 受影响回归 | `output/agent-access/publication-workflow-01/tests-final.json`：25 份文件、404 项通过、0 失败 | 新发布编排 39 项、CI token 回退新增 1 项及旧受影响模块；CI 五份文件本轮为 152 项。不是全仓库或正式发布验收，历史 364／151 等不累计 |
| 平台定位与时序 | 新工作流测试的注入 HTTP | S=P／P 前进时解析固定身份且不下载 ZIP；缺权限、未完成／失败 run、attempt／角色混用、fork、错误工作流、时序、重复 job／artifact、过期和 skipped 均拒绝。所有平台响应为明确 fixture，没有真实 GitHub 请求 |
| 实际 Git 控制比较 | 同测试的临时仓库与实际 Git 提交对象 | 相同控制集合、仅无关文档变化时复用；非祖先、库文件变化、增加 Registry 构建依赖及链接类型均拒绝。提交是测试专用合成材料，不是正式 S／P，不修改工作区历史 |
| 固定审查文件 | 同测试的纯库函数 | 当前及显式前代／应用选择、规范化字节、四文件集合、来源／Registry／记录／选择／历史拒绝、已知凭据及签名 URL；成功报告和私有索引描述符为 fixture，没有读取实际私有 store，也不证明批准 |
| 实际闭合入口 | 函数与真实 Node 子进程 | Node 22 darwin 在 runtime 阶段拒绝，未调用 fetch，只写安全 failure；复用已有目录返回 `EEXIST`，子进程退出 1 且不挂起。没有 Node 22 Linux／干净来源的正式 CLI 正例或晚期失败执行 |
| YAML 绑定 | 同测试读取实际工作流 | 完整 Action SHA、main／仓库／环境、Node／包管理器／锁文件、P／S checkout、固定 artifact ID、步骤顺序、身份注入和最终上传目录；这是契约检查，不是 Actions 运行 |
| 受影响 lint | 同目录 `lint-final.log`：10 个实现／测试文件通过，0 警告 | 包含编排、冻结、CI 与输入／内容共享模块及两测试，不是全仓库 lint |
| 工作区类型检查 | 同目录 `types-final.log`：通过 | `tsc --noEmit --incremental false`；没有整站构建、浏览器、消费者安装或部署复验 |

最终检查使用 Node 22.17.0、darwin。`source-before-final-checks.json` 与 `source-after-final-checks.json` 的来源四字段和 11 个相关文件描述符完全一致：revision 为 `c741626ce69436bf07da0d7e63f08a3d02cddd5e`，实际来源集合为 `2612dcb9c59e159f7d919ecee99269dc9806d1f9bb16a7eb3270a1784c8878f7`，锁文件为 `e8ce91ee8568ae9045fe357e69ef0c939de6d31bcb74e88f1f236d81f8447b48`，`sourceClean: false`。随后文档更新属于归档时来源，不替换测试时快照。

`tests-01.json` 的 140 项中 138 通过、2 失败保留：权限拒绝实际为 `CI_HTTP_403`，目录复用实际为 `EEXIST`，测试误期待其他错误码。修正期望并增加真实临时 Git 比较后 `tests-02.json` 的 141 项通过；最终增加前代 descriptor／历史关系回归，完整受影响 404 项通过。没有把已正确拒绝的路径改为放行，也没有删除旧失败报告。

本轮没有真实 Actions 正例、产品或私有 Blob 写入、正式消费者／范例安装、客户端、Vercel 或回退结果。安装／私有归档配置和目标项目仍需落实；下一项工程为主方案第 13.1.2 节的 S→D 部署差异入口。完整目标继续保持 R1–R6 和 G0–G3，当前不能宣称已上线。

### G0 审查与构建边界整理（2026-10-04）

本次只优化实施方案和本附录。读取现有构建包装器、冻结／发布辅助脚本、工作流和命令注册，区分实现事实与待实现要求；没有运行产品回归或变更发布状态。原始 404 项报告、历史来源及失败记录保持不变。

| 修订 | 核对依据与处理 | 保留的未完成项 |
| --- | --- | --- |
| G0 审查交接 | 冻结成功状态明确为待批准；公开四份 JSON 的整理结果也不表示批准。新增主方案第 13.1.3 节，要求真实审查记录绑定 S、发布 run／attempt 及每件原字节 | 审查读取接口、允许批准者和可信字节绑定尚未实现；新增契约没有创建 schema 或命令 |
| 正式构建边界 | `scripts/build-site.mjs` 已调用正式还原，但没有 S→D／G0 门槛。同步第 8.2、10.4、12.1 节，防止将模式包装器当作完整部署放行 | 独立检查入口、可信审查接入、实际 D 和构建均待完成 |
| 配置时点 | 第 4.2 节按 S 固定、S 进入 main、R4 执行、R5 构建分别说明前置配置；生产自动部署控制前移到 S 进入 main 前 | 没有配置平台规则、凭据、Vercel 项目或真实源站 |
| 状态与验收 | 将冻结草稿核验和 G0 批准分为两个状态，同步下一步、检查单及 G0–G3 矩阵；第 6.3 节过时的发布核验待接入描述按现有代码修正 | R1–R6、四格安装、三例全部组合、两个真实客户端和实际回退范围均保留 |

文档一致性检查归档到 `output/agent-access/document-refinement-2026-10-04-02/`，核对章节引用、本地链接、命令注册、实际状态字面量及本次修改范围。该检查仅针对 Markdown 源文件，不证明页面渲染、人工批准、产品测试或线上服务通过；文档改动也不替换旧报告的执行时来源。

### 部署 Git 与记录字节基础验证（2026-10-04）

新增 `scripts/agent-deployment-git.mjs` 与 43 项测试；复用严格冻结／选择 schema、发布四件审查材料核验、前代链选择及来源哈希算法。共享控制读取函数增加显式 Git 环境参数，内部基础检查清除 Git／Node 注入，原工作流默认行为保持不变；正式 CLI 没有新增该选项。

基础模块读取实际 Git 对象、检查干净 D 及 S 祖先关系；逐项核对完整树中的目录、文件原字节和模式。拒绝 `assume-unchanged`／`skip-worktree` 标记，并在来源重算前后有界核对实际工作文件，避免 Git 状态隐藏改动。旧记录不可改写或删除，只允许本次记录和选择；最多两件历史必须对应 S 的最新前代链，回退时旧应用选择另行绑定。来源四字段在使用本地共享对象的临时 clone 中重算；有效链接只能指向其内已跟踪 blob，成功或失败均清理。报告状态为 `verified-inputs`，不含批准、构建放行或部署含义。

| 检查 | 原始结果 | 范围与限制 |
| --- | --- | --- |
| 定向及受影响回归 | `output/agent-access/deployment-git-01/tests-final.json`：6 份文件、126 项通过、0 失败 | 新 Git 基础 43 项、发布编排 39 项、候选 11 项、Catalog 上传 11 项、冻结 9 项、还原 13 项；不是全部旧 404 项或全仓库回归 |
| 实际 Git 正例 | 新测试的临时仓库、真实 S／D 对象及隔离来源重算 | 首版、三件历史／两件引用、回退后前代与应用选择分离、有效内部链接及忽略输出。运行／资源／审查均为明确模拟输入，没有真实 G0 批准 |
| Git 与记录负例 | 同一测试文件 | 未固定／缺失提交、错误 HEAD、dirty／untracked、非祖先、源码／锁文件／环境文件变化、删除、链接／权限模式、空树、任意 JSON／多余记录、旧记录改写／删除、选择／历史／前代／来源／控制摘要错配 |
| 来源与输入边界 | 同一测试文件 | 四件文件严格集合和规范化字节、未知批准字段、环境注入；外部文件／缺失目标／Git 元数据链接均拒绝；晚期来源失败后没有残留 clone。未执行 Blob、平台审批读取或正式 CLI |
| 受影响 lint | 同目录 `lint-final.log`：通过，0 警告 | 两个实现文件与新增测试；没有重跑工作区类型检查、整站构建、浏览器或正式安装 |

`tests-02.json` 保留 124 项中 123 通过、1 失败：macOS 的临时目录可经 `/private` 别名解析，内部链接使用未解析的 clone 根路径比较时被错误拒绝。修复后 `tests-03.json` 的 124 项通过；补上隐藏改动的两种 Git 索引标记与实际工作文件检查后，最终 126 项通过。没有放宽外部目标限制。`tests-01.json` 的两文件／74 项通过结果保留原范围，不与最终结果相加。

运行使用 Node 22.17.0／darwin。最终 `source-before-final-checks.json` 与 `source-after-checks.json` 的来源四字段及三个代码文件描述符完全一致，源码集合为 `91ecc79fa5e4df1bf1e35e8c0f67493ffc7bde50267582482e476dae8357e3df`，`sourceClean: false`；revision 和锁文件保持现有基线。早先的 `source-observed-final.json`／`source-after-checks-03.json` 只表示中间检查后观察，不能替换最终启动前快照。文档随后更新，归档时来源另列；未把当前 dirty checkout 或临时提交冒充正式 S／D。

本轮未实现 G0 的可信批准读取、正式检查 CLI 或构建接入，没有读取真实平台批准、写入 Blob、发布资源或部署应用。相应工作在主方案第 13.1.2–13.1.3 节继续保持未完成；下一步先落实审查来源与允许批准者，接入完整门槛后在实际 D 验收。R1–R6 和 G0–G3 的整体范围保持不变。

### 完成发布作业与审查附件读取（2026-10-04）

新增 `scripts/agent-publication-review.mjs` 及 45 项测试，提供完成发布作业的固定平台与草稿读取库，不创建 CLI、批准或构建放行。共享 CI 模块导出原 job schema，并抽出原工作流 Git blob／base64／原字节检查，既有信任策略保持固定。ZIP 读取器增加只能收紧的预算及固定文件集合回调，默认 CI 边界保持不变；未知配置和放宽预算均拒绝。

库按实际 run／attempt、固定工作流、main、仓库身份、Ubuntu 24.04 与必需步骤核对两 job，检查 resolver→publisher 时序。平台 run／job／artifact 均绑定 P；草稿来源及先前验证绑定 S，要求 S 为 P 祖先及验证在发布前完成。固定名称解析唯一 artifact ID，平台 bytes／digest 与下载 ZIP 对应，再核对四文件、规范化 JSON、控制摘要、来源四字段、冻结／记录／选择／前代关系及公开内容。返回状态明确为 `verified-platform-and-draft-bytes-not-approved`。

| 检查 | 原始结果 | 范围与限制 |
| --- | --- | --- |
| 首轮定向回归 | `output/agent-access/publication-review-01/tests-01.json`：4 份文件、169 项通过、0 失败 | 附件读取当时为 42 项；后续补输入边界及明确错误码断言。首轮没有启动前来源快照，不替代最终检查绑定 |
| 最终受影响回归 | 同目录 `tests-final.json`：14 份文件、367 项通过、0 失败 | 附件读取 45、CI ZIP 33、CI 五文件 152、留存 10、索引 17、Skill ZIP 6、发布编排 39、Git 基础 43、冻结 9、还原 13。不是全仓库回归，不与此前 126／404 项相加 |
| 发布读取正例 | 新测试的显式模拟 API 和 ZIP | S=P／P 前进，下载的真实 ZIP 字节经过生产读取器，四件原字节与描述符相同；API、成功作业、资源及草稿均为 fixture，没有真实发布或人工批准 |
| 平台拒绝 | 同测试 | 未完成／失败／attempt／fork／工作流／main 保护／祖先／YAML 改变、重复或缺 job／artifact、self-hosted、job 错用 S、必需步骤 skipped、错误序号／时序、过期、ZIP 过大／digest 错及验证晚于发布均拒绝；缺保护读取权限为 `CI_HTTP_403` |
| 附件拒绝 | 同测试，重新计算 fixture 平台 digest | 缺件、多余文件／空目录、非规范化字节、dispatch attempt／控制摘要、来源、选择错配、单 JSON 超预算及已知凭据仍拒绝。负例核对具体错误码，没有只凭任意异常算通过 |
| I/O 与预算边界 | 附件及 ZIP 测试 | 拒绝调用方批准字段、仓库／任意 URL／skip；null／数组／未知 I/O 配置在 HTTP 前拒绝。ZIP 的预算只能收紧，目录和文件都按固定集合检查；签名跳转下载不携带 API 读取身份 |
| 受影响 lint | 同目录 `lint-final.log`：5 文件通过，0 警告 | 新实现／测试与共享 CI、ZIP 及 ZIP 测试；未重跑工作区类型、整站构建、浏览器或正式安装 |
| 真实仓库配置 | 同目录 `platform-configuration.json`：4 次实际只读 API 响应及退出码 | main `protected: false`；classic 保护 API 返回 `Branch not protected`／404；生效分支规则 `[]`。当前正式核验会拒绝，不能写成规则待观察或已通过 |

真实读取时远端 main 为 `10aa272a349f66474d0f8e6bb1e5a3618f857674`，本地 HEAD 为 `c741626ce69436bf07da0d7e63f08a3d02cddd5e`。仓库为 public，当前读取身份显示 admin／maintain／push／pull 权限；这些权限不表示工作流身份拥有相同权限，也不构成人工批准。没有修改分支规则、拉取／重置工作区、推送、发起 Actions 或部署。读取只证明归档时配置，后续启用前须复验。

最终检查使用 Node 22.17.0／darwin，`source-before-final-checks.json` 与 `source-after-final-checks.json` 的来源四字段和五个相关文件描述符完全一致：源码集合 `f624845283a75358bf7e1481556317d7653d6088f2a1b9204f3e451576254e28`，锁文件 `e8ce91ee8568ae9045fe357e69ef0c939de6d31bcb74e88f1f236d81f8447b48`，`sourceClean: false`。文档更新发生在检查后，归档来源另列，不能把 dirty checkout 冒充正式 S。原始报告与配置读取的字节描述符登记于同目录 `local-validation.json`。

API 字段依据 [workflow run attempt](https://docs.github.com/en/rest/actions/workflow-runs#get-a-workflow-run-attempt)、[attempt jobs](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run-attempt)和 [artifact download](https://docs.github.com/en/rest/actions/artifacts#download-an-artifact)；外部文档不证明本项目实际发布通过。此库只下载公开审查 ZIP，先前 CI 归档仅重查元数据，没有重新验证两个 CI ZIP、读取私有留存内容或实际公开资源。将来正式调用方还须绑定实际 S、可信人工批准和 D，并接入构建。

G0 人工批准来源与允许批准者仍未定义，安装／私有归档配置及目标项目仍缺失。没有真实 Actions 正例、Blob 写入、正式消费者／范例、两个客户端、Vercel 或 A→B→A；下一步继续完成可信批准读取和闭合部署门槛，真实 main 保护及发布身份在正式启用前落实。完整目标仍按 R1–R6 与 G0–G3 判断。

### 发布环境核验与实际平台配置（2026-10-04）

`scripts/agent-ci-trust.mjs` 增加固定发布环境核验，并接入 `verifyProtectedSource`：在归档下载前读取实际环境身份、自定义分支限制、唯一 branch policy 标记及完整分页允许项。仅允许 main branch；同名 tag、未知类型、通配符、多余／缺失规则及权限失败均拒绝。原响应自动进入既有 CI metadata 清单及私有交接，不改变信任策略或回执 schema。发布身份解析和完成发布附件读取复用同一入口。

| 检查／实际变更 | 原始结果 | 范围与限制 |
| --- | --- | --- |
| 首轮回归 | `output/agent-access/publication-environment-01/tests-01.json`：4 文件、165 项通过、0 失败 | 新环境检查 18 项，CI 平台共 71 项，另含发布附件 45／编排 39／留存 10；首轮没有启动前来源快照，不替代最终绑定 |
| 最终受影响回归 | 同目录 `tests-final.json`：16 文件、407 项通过、0 失败 | CI 五文件 170、留存 10、索引 17、CI ZIP 33、Skill ZIP 6、附件读取 45、发布编排 39、Git 基础 43、冻结 9、还原 13、候选 11、Catalog 上传 11。平台／成功作业／资源均为 fixture，不是全仓库或真实 CI 通过 |
| 环境逻辑 | `tests/agent-ci-trust.test.mjs` 新增 18 项 | 实际生产入口在下载 ZIP 前拒绝不符环境；额外 reviewers 不被当作 G0 批准，多页规则完整读取后拒绝。平台响应是模拟输入，实际环境另核对 |
| 受影响 lint | 同目录 `lint-final.log`：3 文件通过，0 警告 | CI 实现、测试及共享 fixture；未重跑类型、整站构建、浏览器或正式安装 |
| 配置前真实读取 | 同目录 `platform-configuration.json`、`actual-environment-rejection.json` | 9 个历史环境中没有 `agent-artifact-publication`；精确 GET 为 404。生产库直接调用实际 GitHub API 返回 `CI_HTTP_404`，没有注入 fetch，也不是完整 CI 核验 |
| 发布环境实际创建／核验 | 同目录 `environment-configuration-result.json` 及两份 request JSON | 缺失确认后创建环境 ID `23396773521`，唯一 main branch policy ID `61887559`；`verifyPublicationEnvironment` 直接读取真实 API 通过，两个响应包含完整规则。此配置不表示某次人工批准或成功发布 |
| main 来源保护实际配置 | 同目录 `main-protection-result.json`、`main-protection-request.json` | 修改前确认未保护、无 ruleset／classic 配置，再创建 classic 保护并回读 `enforce_admins: true`、禁止强推／删除、main protected 为 true。前后 main SHA 均为 `10aa272a349f66474d0f8e6bb1e5a3618f857674`，没有修改代码或历史，也不表示 PR／G0 审查通过 |
| 最终实际设置原字节 | 同目录 `actual-configuration-final.json`、`platform/*.json` | 固定有界客户端再次实际读取环境／完整允许项及 main／classic／rules，五份 HTTP JSON 原 bytes／SHA-256 留存；环境校验函数直接通过。只证明当前平台设置，不是完整 CI、作业身份授权或批准 |
| 凭据／变量存在性 | 同目录 `secret-and-variable-presence.json` | 环境 secrets、仓库 Actions secrets 及仓库变量各自 `total_count: 0`；只读取名称／存在性，没有读取或写入 secret 值。不能据此判断 Vercel 项目或平台账号没有存储权限 |
| 历史 Vercel 关联 | 配置前读取的 deployment／status 响应 | 同一 main SHA 有 `Production – zeronui` 和 `Production – zeron-ui-6iw7` 的成功记录及各自实例 URL；记录的 `production_environment` 为 false。GitHub 环境名称、历史 status 或实例 URL 均不证明实际生产分支、正式域名、自动部署是否开启或本次目标项目 |

真实变更时点分别为 UTC `2026-10-04T00:35:15.456Z`（环境核验完成）与 `2026-10-04T00:36:59.759Z`（main 保护回读完成）。此前“main 未受保护／环境未配置”的原始读取保持历史状态；新结果只证明这两项当前配置。未设置 required reviewers 或 G0 批准者，没有配置写入／CI 读取凭据、发起 Actions、提交／推送或改变 Vercel 项目。

API 契约依据 [Get an environment](https://docs.github.com/en/rest/deployments/environments#get-an-environment)与 [deployment branch policies](https://docs.github.com/en/rest/deployments/branch-policies#list-deployment-branch-policies)。另核对 GitHub 官方 REST OpenAPI 中 list response 的 `type: branch|tag` 字段，同目录 `github-openapi-fields.json` 保存来源 URL、全文响应 bytes／SHA-256 和所用 schema 摘要，不冒充全文原字节副本。当前约束不证明历史作业执行时的环境配置或写入 token 权限。

最终检查使用 Node 22.17.0／darwin，`source-before-final-checks.json` 与 `source-after-final-checks.json` 的来源四字段和三个代码描述符完全一致：源码集合 `590ed03bff33134fd9bfa6503abf43cc409eb5ce71f6f040c0874a7472dd9c7b`，本地 revision `c741626ce69436bf07da0d7e63f08a3d02cddd5e`，锁文件 `e8ce91ee8568ae9045fe357e69ef0c939de6d31bcb74e88f1f236d81f8447b48`，`sourceClean: false`。文档更新发生在最终检查后，归档来源单列；各报告及实际配置响应的文件描述符登记于同目录 `local-validation.json`。旧 126／367／404 项和失败记录不改写、不累计。

剩余项仍为实际 origins、两份规范化配置、精确 CLI 输入、发布／CI 读取身份、目标 Vercel 项目、G0 可信人工批准与闭合部署入口。生产自动部署控制须在 S 进入 main 前确认，不能从上述历史部署记录推断已完成。没有真实资源／Blob 发布、正式四格／三例、两个客户端或 G0–G3 验收；整体目标继续保持 R1–R6。

### 平台接入与现有站点基线（2026-10-04）

本次核对当前接入条件及现有线上入口，未修改实现代码、GitHub／Vercel 项目配置或重跑本地产品测试。新结果不替换前轮 407 项及其来源快照，也不构成新版本正式验收。

| 核对 | 实际结果 | 边界／下一步 |
| --- | --- | --- |
| 源码已有站点 origin | README、页面 metadata 与 SEO 配置均使用 `https://zeron-ui.vercel.app` | 只能定位现有公开站点；仍需确认本次目标 Vercel 项目及正式配置 |
| 公开 HTTP 基线 | 首页和 `/llms.txt` 的 HEAD 为 200，`/api/mcp` 的 HEAD 为 404 | HEAD 不证明 MCP POST 是否可用，因此另外发起标准初始化 |
| MCP 初始化 | `2025-11-25`、JSON-RPC `initialize`、JSON／SSE Accept 的 POST 为 404，返回 5,319 bytes HTML；没有 JSON-RPC 或 protocolVersion，未截断 | 使用与本地协议用例相同的初始化版本；没有进行新发布、tools 调用或真实客户端验收 |
| 当前 Vercel 接入 | CLI 不可用，三个常见登录文件不存在，进程内 Vercel／Blob／origin／CI 身份项均未配置；Codex in-app browser 的 dashboard 导向登录页 | 只表示当前可用连接，不能断言其他浏览器或账号不存在权限；未发起登录、读取凭据或改变权限 |
| 插件发现 | 目录返回可用 Vercel 插件，`installed: false`，已建议安装／连接 | 建议不表示连接成功；实际授权仍需用户完成 |
| 正式输入 | 两份规范化配置和 `.vercel/project.json` 仍缺失 | 真实源站、目标项目和 G0 审批来源仍待确认，不能使用模拟配置或自填批准继续正式发布 |

归档目录为 `output/agent-access/platform-access-01/`：`access-and-required-inputs.json` 保存当前接入／缺失项和 HEAD 结果；`mcp-initialize-probe.json` 保存实际请求及响应描述符；`mcp-initialize-response.bin` 是完整响应原字节。探测使用无凭据的公开 origin，未发送用户数据。当前登录 UI 仅由浏览器观察确认，没有假称其截图或 DOM 已保存到目录。

G0 审批读取取决于仓库实际流程和允许批准者；连接 Vercel 不自动完成该项。下一步先完成平台连接／项目确认及审批契约，再继续正式配置、闭合部署门槛和 R4–R6。R1–R6、四格安装、三例全部组合、两个客户端及 G0–G3 的退出条件保持不变。

### 实施入口与前置条件优化（2026-10-04）

本次按“优化文档”请求仅修改实施方案和本附录。核对当前命令注册、MCP 路由／适配器、构建包装器、已有 Review 映射和历史证据；没有运行产品测试、提交源码、修改平台设置、写入 Blob 或部署应用。旧报告与上节原时点的“插件未安装”事实保持原样，当前接入状态按下表更新。

| 修订 | 具体处理与验证边界 |
| --- | --- |
| 阅读入口 | 压缩开篇重复测试摘要；当前状态集中第 12.1 节，原始数量／范围留在第 12.2 节及本附录 |
| 输入交接 | 新增第 4.3 节：项目、两源站、CLI／矩阵、G0 来源、CI 身份及客户端／回退分别写明责任、交付位置和最迟时点；不填造配置或批准 |
| 发布顺序 | 第 12.3 节显式列出发布前置；第 8.3、15 节统一为 S 进入 main 前核对所有关联项目的生产自动部署，R5 复核 |
| 构建放行 | 第 8.2 节明确平台构建和受控 CI 预构建均须执行 G0／S→D 门槛；第 8.3 节不再把现有 `pnpm build` 包装器描述为完整放行入口 |
| 状态一致性 | 第 12.2、12.5、16、17 节区分“main／环境规则已实际核对”与“真实作业身份／凭据／CI／应用隔离仍未验收”；没有新增完成勾选 |
| 官方资料复核 | 重新读取 [Arc AI 页面](https://uiarc.dev/docs/ai)、[Vercel MCP 部署](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)、[函数限制](https://vercel.com/docs/functions/limitations)、[预构建部署](https://vercel.com/docs/cli/deploy#prebuilt)。资料支持部署路线，项目 15 秒／20 MiB 为内部预算，不改变锁定依赖或已测协议 |
| 当前平台读取 | 插件目录返回 Vercel `installed: true`；以本仓库 URL 筛选的真实只读项目列表成功返回 `zeron-ui-6iw7` 与 `zeronui`，同属 `team_FNwuhRVEBYE8mv1kZUOLaJcS`。前者 ID 为 `prj_RO5bVz87A2PKO2u2BHD933d71eyL`，后者为 `prj_yKumdOJn6GkUnmvUNrE7LAyNauwc`；没有选择目标、读取 secret 值或变更项目 |

本次资料与文档检查归档于 `output/agent-access/document-optimization-2026-10-04-04/`：`vercel-readiness.json` 保存安装事实、实际列表和读取时点；`workspace-before.json`／`workspace-after.json` 与两份原文／diff 确认修改范围；`document-check.json` 核对本地链接／锚点、章节引用、表格列数、命令注册及 Review 索引／检查单范围。它们仅为文档与本次只读接入证据，不是 G0–G3、生产配置、Blob 权限或新源码测试通过证明。

R1–R6、四格真实安装、三例全部四格／12 行、两个实际客户端、独立项目生产域名 A→B→A 和业务生产复验的退出条件保持不变。批准接口、正式构建门槛及真实发布继续保持待完成。

### Vercel 项目准备与部署控制文件（2026-10-04）

本轮继续实施，不将前一轮文档优化当作发布完成。通过已连接 Vercel 工具读取两个关联项目、实际域名、最近部署和不解密的环境变量元数据。以项目 ID 加 teamId 的首批详情请求返回 `INVALID_ARGUMENT`；改用已列出的项目名称和最小参数后读取成功，原失败结果保留。工具输出为连接器返回的 JSON，不宣称是底层 HTTP 原响应。

| 实际核对或变更 | 结果与范围 |
| --- | --- |
| 业务站点归属 | 域名列表确认 `zeron-ui.vercel.app` 属于 `zeron-ui-6iw7`／`prj_RO5bVz87A2PKO2u2BHD933d71eyL`／`team_FNwuhRVEBYE8mv1kZUOLaJcS`；`zeron-ui-6iw7.vercel.app` 307 指向该域名。按现有业务域名准备本地部署目标，不新建或移动域名 |
| 两个生产基线 | 两项目最近部署均为 `source: git`、`target: production`、main 的 `10aa272a349f66474d0f8e6bb1e5a3618f857674`，READY。业务站点 ID 为 `dpl_3useix9jnQSG75SzdEpztYTkvh1C`，另一个为 `dpl_7c7TE5YRQsK7XgcSEoNCHdknusxs`；它们不含本次新代码，不是 G1–G3 验收 |
| Node 设置 | 业务站点项目由 `24.x` 改为 `22.x`，随后项目／域名读取确认 Node 22 生效、最近部署 ID 和域名清单不变。更新返回中的空部署／域名是该响应的字段形态，未据此推断资源丢失。另一个项目仍为 Node 24；没有重建或切换生产 |
| 应用身份与访问 | 业务项目环境列表只有 `NPM_TOKEN`（sensitive，production／preview），另一个为空；未解密、打印或保存其值。两项目 SSO 为 `all_except_custom_domains`。没有据此判断所有客户端可访问或 Blob OIDC 已隔离；套餐、存储连接和完整构建设置尚未核对 |
| 本地目标文件 | `.vercel/project.json` 使用真实项目／团队 ID，目录被 `.gitignore` 忽略。不含凭据、没有运行 `vercel link`／pull，不能证明 CLI 身份或部署授权可用 |
| main 自动 Git 部署 | 在既有根级 `vercel.json` 中增加 `git.deploymentEnabled.main=false`，保留原有 framework、Skill／Registry 响应头，不覆盖其他分支行为。文件尚未提交，没有触发部署或观察实际取消；正式 S 进入 main 前仍须核验对所有关联项目生效。手动部署／推广另由 G0–G3 控制 |
| 发布控制比较 | `vercel.json` 加入必需控制路径及 dispatch 严格描述符；S→P 原字节变化、缺失或非正规文件拒绝。未增加跳过项，不把配置存在或字节相同当成平台已生效 |
| 受影响回归 | `output/agent-access/vercel-project-01/tests-01.json`：Node 22.17.0，三份文件共 131 项通过／0 失败，含新增四项；发布编排为 43 项，原附件读取 45／Git 基础 43 项一并复验。临时 Git 正例和平台／附件正例为明确 fixture，不是实际发布／批准证据；四份受影响实现／测试 lint 通过 |
| 官方配置字段 | 保存 [官方 Vercel JSON schema](https://openapi.vercel.sh/vercel.json) 原字节和 [Git 配置说明](https://vercel.com/docs/project-configuration/git-configuration)依据。完整 schema 编译先后因 draft-04 元 schema 缺失及官方无关定义的混合语法失败；原失败独立保存。最后只核对本配置使用的 `$schema`／`git` 字段定义，字符串 `false` 的负例被拒绝；合并原有 framework／headers 后另做字段检查。不声称完整 schema 或平台验收通过 |

归档为 `output/agent-access/vercel-project-01/`。`platform-observations.json` 保存本轮工具结果、初始拒绝、精确 Node 更新请求、变更后读取和只记录键名／用途的环境摘要；`vercel-schema-observation.json` 与两件失败记录明确配置检查范围。首次回归在代码改动后执行，其启动时未单独捕获来源快照；最终执行及启动／结束来源、代码原字节绑定另登记于 `local-validation.json`，不追溯更改首次报告。

本轮尚未创建存储、配置 CI 凭据、提交／推送、启动真实发布作业、实现可信 G0 批准读取或进行 Vercel 新版本部署。G0 流程及允许批准者已提出交接问题；不能从现有唯一管理员或普通 PR 自动指定批准者。整体目标保持 R1–R6 和 G0–G3 全部验收。

配置复核纠正了首次改动覆盖既有 `vercel.json` 内容的问题：工作区修改前的 629 bytes／SHA-256 与 HEAD 原文件一致，现已恢复其全部 framework／headers 字段，再合并新 `$schema`／`git` 字段；不是新建原本不存在的文件。前述首轮及 `tests-final.json` 保留原来源绑定，修正后的检查、来源及配置字段结果分别另存，不回写旧报告。

### 安装配置前置核验与真实 npm 读取（2026-10-04）

本轮按第 4.3、12.4 节尝试准备实际安装配置，未使用历史 SRI 或 fixture 代替正式 pin。源码 CLI 为 `zeron-ui@0.2.0-beta.17`；当前身份登记的 button／card 为 React UI，login-01 为 Next template，计划代表项未更换。

| 检查或变更 | 结果及范围 |
| --- | --- |
| 实际 npm 元数据 | 对精确 URL `https://registry.npmjs.org/zeron-ui/0.2.0-beta.17` 使用生产有界公开下载函数，返回 15 bytes 的 `[object Object]`，无法解析为 JSON。另用独立 HTTP 工具读取同一 URL，记录 HTTP 200／application/octet-stream／15 bytes，原字节哈希相同；这只证明当前连接读取异常，不断言版本未发布或 npm 全局损坏 |
| 配置准备 | 保留 `npm-metadata-initial.json`、描述符和 `failure.json`，另保留第二次读取 headers／body／描述符。失败阶段为 metadata-binding，安全错误码为 `CONFIGURATION_PREPARATION_FAILED`；尚未执行 tarball 阶段，也未创建 `installation-config.json`、执行包代码或消费者 |
| 配置入口修正 | `installationConfigurationSchema` 原先仅从完整输入 schema 复用字段 shape，遗漏组合间约束；现于配置读取时拒绝重复四格、Next 缺少拒绝代表项及 Vite 正向包含该项。CI 准备、发布编排和安装准备均复用此 schema；完整身份／实际资源框架检查仍保留，未将配置合法当作安装通过 |
| 定向回归 | `output/agent-access/installation-configuration-01/tests-final.json`：Node 22.17.0／darwin，6 文件共 129 项通过、0 失败；消费者证据 16（新增 4）、安装输入 14、CI 工作流 6／CLI 5、发布编排 43／附件读取 45。所有成功形态数据和平台为明确 fixture；没有实际 Actions、Blob 或正式安装通过 |
| 受影响 lint | 同目录 `lint-final.log`：实现及测试两文件通过，0 警告 | 

测试启动／结束的来源四字段和两份代码描述符相同，见 `source-before-checks.json`／`source-after-checks.json`：本地 revision `c741626ce69436bf07da0d7e63f08a3d02cddd5e`，源码集合 `0443cb53f7a2b8262f89cb580b29270df9c544fc8670ba92ba87be2c3de9a85f`，锁文件 `e8ce91ee8568ae9045fe357e69ef0c939de6d31bcb74e88f1f236d81f8447b48`，`sourceClean: false`。随后更新两份文档，最终归档来源单列于 `local-validation.json`，不回写测试绑定。首次配置准备失败的来源另由 `source-before.json` 记录；不能把后来代码修正套到早先实际请求。

实际公开／私有 Blob origins 及创建情况已请求交接，未收到时不猜测现有 store 或重复创建。G0 来源／批准者、实际 CI 身份、客户端和独立回退项目仍待落实。本轮未提交／推送、配置 secret、修改平台项目或启动新部署；完整目标继续为 R1–R6、四格／三例全部组合、两个客户端及 G0–G3。

### 真实 CLI 与安装配置准备（2026-10-04）

本轮再次实际读取精确 npm URL，结果恢复为有效元数据。旧 15 bytes 异常及配置准备失败保持原样。新的公开字节检查通过后才首次写入 `docs/agent-data/installation-config.json`，状态为 `configuration-prepared-installation-unverified`。

| 交付／核对 | 实际结果与边界 |
| --- | --- |
| CLI pin | 源码版本与实际 npm 包均为 `zeron-ui@0.2.0-beta.17`，固定官方精确元数据／tarball URL。使用 `readPublishedCli` 的默认真实 fetch，重新检查名称、版本、URL、SRI 与实际 gzip 字节；未执行包代码 |
| 公开原字节 | `installation-configuration-02/npm-metadata-initial.json` 为 1,791 bytes，SHA-256 `a27e3cf837d046f8828b0f439b55182a1fc3d31ee3d258ba7478af23e9682a4f`；与生产核验器再次读取的元数据原字节 hash 一致。tarball 为 19,329 bytes，SHA-256 `b11403d2b9fe7506fd2b7bb6e046d3cd1f33f27bf57f0aefd097620300d41832`；SHA-512 与实际 metadata／配置 SRI 一致 |
| 安装配置 | 951 bytes，SHA-256 `466822e27a36db2a5281454d8bd59a07102d6c984d3e658b867b17daa7237328`；严格 schema 和规范化原字节检查通过。站点 origin 为已实际核对的 `https://zeron-ui.vercel.app`，不是资源源站替代值 |
| 四格与身份 | Next 的 npm／pnpm 采用 button／login-01，Vite 的 npm／pnpm 采用 button／card；拒绝项为 login-01。重新核对现有 active Registry 身份、名称及 React UI／Next template 元数据，保留对应原字节描述符。没有消费者进程或真实安装报告 |
| 平台读取 | `release-prerequisites-01/projects.json` 保存两项目本轮只读结果：Node 和部署 ID 未改变，详情没有返回存储 ID；当前连接器提供按已知 ID 查询／创建 store，没有 store 列表工具。不能据此断言平台不存在存储，未猜测 ID 或创建重复资源 |

归档为 `output/agent-access/installation-configuration-02/`，生产读取和配置准备结果见 `preparation-result.json`；此前入口 129 项回归及其来源绑定未改写，本轮只核验新增公开配置及真实字节，不重跑相同代码测试。最终工作区范围、文档检查、配置与已有测试代码描述符的比较另登记于 `local-validation.json`。

安装配置仍未提交，来源为 dirty checkout，不能当作正式 S 或 `installation-input.json`。公开 Registry／Skill 完成标记、Blob origins／私有归档配置、实际 CI 身份、G0 批准来源与允许批准者、两个客户端及独立回退项目仍未落实。本轮未写 Blob、提交／推送、启动 Actions 或新部署；完整 R1–R6 和 G0–G3 不变。

### CI 站点变量配置（2026-10-04）

本轮继续落实第 4.2 节实际 CI 变量。修改前重新读取固定仓库变量、发布环境／仓库 secret 名称及环境元数据：变量和两个 secret 列表均为零；只读取 secret 存在性，没有访问其值。紧邻写入前再次读取变量，确认仍为空后，按已核验安装配置创建 `SITE_BASE_URL=https://zeron-ui.vercel.app`。

GitHub API 返回 HTTP 201，精确变量 GET 回读名称／值一致；创建时点 UTC `2026-10-04T07:21:45Z`，随后完整列表为一项，只有 `SITE_BASE_URL`。归档于 `output/agent-access/ci-variables-01/`：`presence-observations.json` 记录只读请求；`create-site-variable-request.json`、`create-site-variable-response.txt` 和 observation 保存实际写入及返回；`site-variable-readback.json`／`variables-after.json` 保存实际配置结果。响应属于 GitHub CLI 返回的 API 结果；只读列表已选择安全名称／时点字段，不宣称保存 secret 值或所有底层 HTTP 原字节。

此变量是公开站点地址，没有写入身份或批准含义。没有修改 `ARTIFACT_BASE_URL`、secret、环境保护、代码／锁文件，亦未提交／推送、dispatch、写 Blob 或部署。正式发布仍缺公开／私有源站、私有归档配置、实际 CI 身份、G0 来源／批准者及后续客户端／回退验收。前述零变量记录保持原时点，当前方案改为部分已配置；文档和归档检查见同目录 `local-validation.json`。

### 代码 Review 整改与默认部署范围（2026-10-04）

用户授权按代码 review 发现整改。查询指纹排除可省略的 `catalogVersion` 字段，cursor 仍独立绑定实际目录版本；新增查询与真实 MCP HTTP 回归，覆盖搜索／列表默认发现后的显式版本续页、切换版本／筛选／语言的拒绝，以及新旧协议照抄文本续页参数遍历完整结果。修复前新增测试有 6 项失败，修复后 5 个文件共 165 项定向回归通过；生产 HTTP 测试另增加两个工具的实际续页验证。

根 `vercel.json` 将 main 自动 Git 部署调整为允许，framework 与原有 Skill／Registry 响应头均与 HEAD 保持一致；文件未提交，不代表平台已生效。README 更新为精确 CLI 元数据及 tarball 已通过检查、安装配置已准备，保留此前异常记录。方案新增当前交付范围：默认 development 模式先交付同一 Next.js 应用的网站、静态资料、Skill 下载与只读 MCP，正式 Blob／冻结记录／G0–G3 不作为本次默认模式上线的前置条件；正式模式启用前须另落实其推广控制。安装命令仍按设计拒绝未验证的组合。

| 验证 | 实际结果 |
| --- | --- |
| 新的干净隔离检出 | `output/agent-clean/zeron-agent-clean-zxc9xS/report.json`；前 22 个 core 阶段通过，含 lint、design lint、类型、1,587 项单元及 56 项 CLI 测试 |
| 首次生产构建 | 已编译成功，随后本地磁盘不足导致写入缓存／`.tsbuildinfo` 返回 `ENOSPC`；原失败日志保留，原 core 报告仍为 failed |
| 恢复与重试 | 仅清理上一轮 review 创建的 `zeron-vercel-build-review-irsjkar2`、`zeron-agent-clean-lfkKsQ` 临时检出目录，保留其报告／日志，并登记临时目录已删除。在当前同一份源码检出重试 build 和 production，均退出 0，3 项生产 HTTP 测试通过 |
| 配置／文档核对 | main 为 true，原响应头保持；README 及更新方案的本地文件链接、Git diff 空白检查通过。配置未推送，不宣称真实部署、实际客户端或正式安装链路已验收 |

整改归档为 `output/agent-access/review-remediation-01/`，包括 `validation-summary.json`、`build-retry-report.json`、重试日志及 `validated-source-files.json`。隔离检出的输入摘要为 `cfb28e493c96fc71f8dce1862ef43b9a115d072b676d5e72a1aa6b4f38b81bbb`；当前查询实现、三份测试、Vercel 配置和 README 字节在验证后仍匹配快照，最终状态文档随后整理。全部 core 检查内容已有通过结果，不记作一次未中断的 24 阶段执行；`--core` 之外的消费者迁移／浏览器检查未重跑。未暂存、commit、push、dispatch、写 Blob 或新部署；五笔提交计划见 [Review 与 Commit 计划](./2026-10-04-agent-code-review-and-commit-plan.md)。

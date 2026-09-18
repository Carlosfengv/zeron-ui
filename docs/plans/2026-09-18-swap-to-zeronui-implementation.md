# Swap to Zeron UI 首版实现报告

日期：2026-09-18。状态：可在本地使用的迁移 skill 与辅助工具原型；公开发布和真实消费者项目试点尚未执行。

## 已实现

- 新增 `swap-to-zeronui` skill，包含范围／完成契约、组件映射、迁移批次、验证与恢复、shadcn 来源指南。
- 与 `zeron-page-builder` 配套使用，明确全量迁移可替换 shell/theme 实现，同时保留业务与导航行为。
- 新增版本化 plan schema 与报告模板。CLI 与 skill 的 schema 副本由测试保证一致。
- 新增只读 `swap scan`：实际 React/Tailwind 版本、TS 路径解析、导入／重新导出／动态引用、JSX、CSS 引用、Next 路由候选及未知项。
- 新增只读 `swap check`：旧引用、实现、CSS 与选定旧直接依赖残留，managed 文件漂移、范围／路由遗漏、证据缺失或过期、例外处理。局部迁移保留范围外消费者并给出提示。
- 新增内部恢复模块：显式文件快照、封存、恢复前全批检查；保留用户后续编辑，拒绝通过符号链接写入。没有自动 apply 或 restore CLI。
- 修复安装预检：依据 TS 配置解析别名，并与固定安装器的 root/src 规则对照。不一致时提前拒绝写入，避免误建第二套组件目录。
- 新增成套 skill 分发脚本、使用说明、CLI 帮助与 CI 验证步骤。分发脚本检查引用完整性且拒绝覆盖已有输出目录。

## 消费者验证内容

两类独立消费者均使用实际打包 CLI、固定内存 Registry 快照和独立 node_modules，不通过工作区 UI 包链接绕过安装。快照同时保存在临时工作目录中以便复核。

| 样例 | 原 UI | 迁移后覆盖 |
| --- | --- | --- |
| Next 15 / React 19 | 本地定制的 default/outline Button、原生表格、表单与弹层 | Zeron Button/Input/Switch/Select/Dialog/Table/InlineNotice，AppShell/PageLayout/TopNav |
| Vite 8 / React 19 | onPress/primary 自建 Button 与原生表单 | 相同目标组件，额外验证不同按钮事件 API 的转换 |

迁移前后保存同一份业务模块并验证其文件内容不变。通过浏览器接口拦截验证请求契约：服务端分页参数、保存 payload、空值校验、接口失败反馈与成功反馈。另验证禁止删除的状态、锚点导航、Dialog Escape 与焦点恢复、明暗主题和宽窄屏。截图审查发现并修复了旧文字颜色继承和窄屏导航挤压问题。

这些请求使用测试桩，没有真实后端接入、真实账号权限或真实服务可用性的验证。样例当前使用顶部导航，没有证明复杂侧栏、嵌套路由或全部业务 Block 均可迁移。

重复覆盖安装检查主题 import 不重复、业务文件不被修改。恢复单测模拟部分写入和用户后续修改；没有把依赖安装当作可原子回退事务。

## 验证与证据

本次执行：

- 全仓 `pnpm lint`。
- CLI 原有及新增测试；新增测试覆盖扫描、静态检查、schema、文件边界、恢复和安装布局。
- `pnpm cli:check`，核对真实命令帮助。
- skill-creator 的 `quick_validate.py`。
- 成套 skill 打包与所有相对文档链接检查。
- `pnpm test:consumer:migrations`：Next/Vite 迁移前后构建、类型和浏览器流程。
- 受影响安装回归：Button 经 npm/pnpm 的 Next 安装，以及 Vite 安装和 Next-only Block 拒绝。

可复现入口：

```sh
pnpm cli:test
pnpm cli:check
pnpm skills:bundle --output /path/to/new/bundle
pnpm exec playwright install chromium
pnpm test:consumer:migrations
ZERON_CONSUMER_COMPONENTS=button ZERON_VITE_CONSUMER_COMPONENTS=button pnpm test:consumer:smoke
```

迁移脚本将命令日志、消费者目录、结果及截图写到 `output/swap-validation/`；CI 上传该目录作为 artifact。运行临时消费者保留 `.zeron/migrations/fixture/plan.json` 与 evidence，恢复快照保存在消费者目录外。生成证据不提交到组件 Registry。

脚本只把可自动证明的构建、类型、HTTP 契约和清理项标为 passed。视觉、契约、来源及范围审查仍保留显式 unchecked；扫描也会报告 managed 组件内部的 prop spread，需结合可信来源审查，不会按目录直接忽略。当前样例报告因此是 partial/awaiting-review，且要求旧 UI 残留为零、无失败诊断。设置 complete 标签不能绕过门槛。

## 尚未完成的发布门槛

官网分发功能已在本地实现：中英文介绍页提供复制安装提示词、ZIP 下载与
`/skills/install.md` 入口。`pnpm skills:build` 在开发和生产构建前自动生成两个
完整技能目录的 ZIP、以 ZIP SHA-256 为版本号的固定下载路径、逐文件校验清单。
安装说明覆盖未安装 Zeron 的项目、同名目录冲突、版本更新和 CLI 缺失时的边界。

官网分发验证：完整技能资源及相对引用、重复构建一致性、无 Zeron 临时项目解包、
中英文消息一致性共 5 项测试通过；最终生产构建通过。通过本地生产 HTTP 入口下载后，
校验并写入独立临时项目的 16 个文件，未安装应用依赖。浏览器验证了中英文复制、
剪贴板失败反馈、ZIP 下载，以及中英文窄屏无页面横向溢出；调整了移动端锚点定位，
避免标题被固定导航遮住。文件分发通过不代表其他 Agent 的自动发现已经验证。
全仓常规 lint、本次介绍页定向设计检查及最终全仓设计 lint 均通过。
中途构建和设计检查曾被并行账户示例改动阻塞，在该组改动修正后复验通过，
未修改这组账户示例代码。

1. 选择一个真实消费者项目并执行迁移；目前未指定目标项目，不能用本库自身替代。
2. 独立核对来源及完整路线／状态清单，补齐人工审查证据；两个自动化样例不等于通用完整迁移认证。
3. 按真实试点扩展原计划中的侧栏、更多表单／数据表、复杂路由、权限状态和来源组件矩阵。
4. 对外发布 skill/CLI。当前保持现有 CLI 包版本，未执行 npm 发布或站点部署。

## 已知边界

- 扫描是静态分析，动态模块、复杂 prop spread、Vite 路由仍需人工确认；隐藏目录、public、构建目录和依赖目录不作为普通源码扫描。
- managed 哈希和证据来源必须由执行者建立可信基线；工具不独立认证手工报告，也不防止同时伪造 plan 与证据。
- 框架升级、任意目录安装、Vue/Angular 转 React、专业编辑器完整替换不在首版承诺内。
- 安装器路径不兼容现在会提前报错，属于刻意收紧；需要按目标项目事实处理布局，不能通过关闭检查继续安装。
- 暂未发布消费者可直接安装的 `@zeron/lint`。

下一步应以真实项目试点和补齐审查证据为主，避免在尚无真实迁移数据时扩展通用自动转换引擎。

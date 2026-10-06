# Credit Usage 用量条提交计划

日期：2026-10-06。检查基线：`dd0d1c2`。本计划仅整理本次 credit-usage-01 样式修正。

## 最终改动

将用量条由 28px 高圆角条改为与 cost-estimate-01 费用构成条一致的 12px 高、直角、无间隙连续堆叠色条，并在 20px 高区域内垂直居中。模型颜色、容量分母、剩余额度、超额用量、周期切换和 progressbar 语义保持原有行为。

此前误加的 SegmentedBar 刻度属性、遮罩实现、相关指南与测试已经撤回；共享 chart-primitives 源码及 Registry 文件与基线一致，无需提交。

## Commit 方案

建议一个完整提交，让源码、契约、接入指南及发布产物同时更新。

标题：`fix(blocks): align credit usage bar with cost breakdown`

建议正文：

```text
Use a 12px square-edged continuous stacked bar inside a 20px region.
Preserve credit capacity semantics and model proportions.
Update the contract, guide, registry and preview source artifacts.
```

## 提交范围

功能变更共 8 条文件路径；本计划可作为第 9 条路径一并提交。

| 文件 | 暂存内容 |
| --- | --- |
| `packages/blocks/src/application/credit-usage-01/credit-usage.tsx` | 色条高度、直角与居中区域，共两处样式调整 |
| `tests/credit-usage-contract.test.ts` | 更新外观契约断言 |
| `docs/agent-guides/blocks/credit-usage-01.md` | 更新用量条的尺寸与布局说明 |
| `public/r/credit-usage-01.json` | 同步 Registry 内嵌组件源码 |
| `docs/lib/block-preview-sources.generated.ts` | 只暂存 credit-usage-01 的预览资源地址变更 |
| `public/docs-source/f5c92e90e461bdf0e977f4449eb2a3b743f8c46f0f16bf2126507f6f329e4de2.txt` | 删除旧预览源码 |
| `public/docs-source/1b6bcb87208162cdcf745c4bbff631c4b50c53ff76bd8e5df5787b9868e0616d.txt` | 添加新预览源码 |
| `public/llms-full.txt` | 只暂存 credit-usage-01 指南中用量条说明的替换 |

两个共享生成文件包含其他任务的修改，不能整文件暂存。预览清单中的 design-stack-01 条目，以及 llms-full 中的 design-stack、Avatar、Select 说明均不属于此提交。

当前工作区的 Avatar、Select、DataGrid、design-stack-01、预览工具栏及其文档、测试、目录和 Registry 产物保留给对应任务。已有其他计划文档及本地 output 检查报告、截图不并入此功能提交。

## 已有验证

以下检查已在上一轮修正后的工作区完成，并非仅含本次提交的隔离副本验证：

- 4 个相关测试文件、39 项测试通过：credit-usage-contract、credit-usage-interaction、chart-unification、resource-metric-list-contract。
- TypeScript、完整设计检查及差异空白检查通过。
- Registry 检查通过（146 项）；预览源码、Agent 目录生成及一致性检查通过。
- 浏览器检查：1440px 与 390px 视口；浅色、深色；实际色条高 12px、圆角为 0、无刻度遮罩，390px 下无横向溢出。
- 周期切换将 progressbar 数值从 3560 更新到 4284。
- 新预览资源的 SHA-256 与文件名匹配；内容为最终连续色条实现。

最终样式修正后没有重复执行独立消费者安装与完整项目生产构建，不将此前刻度方案的安装结果当作此次结果。文档预览容器在窄屏下会裁切长卡片，完整组件布局在独立演示页验证。

## 执行顺序

1. 确认 HEAD 与工作区没有新的相关改动，检查候选补丁仅包含上述范围。
2. 用独立 Git index 或临时副本暂存候选补丁，保留当前工作区和真实暂存区；两个共享生成文件只带入 credit-usage-01 部分。
3. 在隔离副本运行上述 4 个测试文件与 TypeScript 检查，并确认预览清单、资源哈希、Registry 源码及指南同步；检查暂存差异与文件清单。
4. 将确认后的相同范围暂存到真实 index，再执行建议标题的单个 commit。
5. 检查提交文件和剩余工作区，确保其他任务的修改仍保留。

计划整理阶段只生成候选补丁，未执行暂存或 commit；后续用户已授权将本次提交推送到 GitHub main。

候选补丁：`output/credit-usage-slider/credit-usage-stacked.commit.patch`（本地生成，不纳入版本管理）。它从上述基线构建，包含本计划和 8 条功能路径。执行前仍需检查基线是否变化。

## 提交前隔离验证

基于 `dd0d1c2` 导出临时副本，只应用上述候选补丁；工作区包导入指向副本内源码，复用已安装的第三方依赖。

- 4 个相关测试文件、39 项测试通过；TypeScript 检查通过。
- 相关源码和契约测试的设计／常规检查通过。
- Registry 完整性检查通过（146 项）；46 个预览源码一致性检查通过。
- 重建 Skill 分发和 Agent 目录后，一致性检查通过（154 项、52 篇指南）。
- 两个混合生成文件仅带入 credit-usage-01 的修改；未执行完整项目生产构建或再次安装独立消费者。

# Chart 色彩与分段条审查及提交计划

日期：2026-10-07

状态：审查及优化完成，用户已授权按清单提交并推送 GitHub main

基线：`1dcf2c2`

范围：[文件清单](./2026-10-07-chart-token-commit-files.json)

采用一笔 `feat(chart): unify chart tokens and segmented bar styling` 提交完整 Chart 修改。全局槽位、业务取色、共享几何、文档和生成产物共同构成可用契约；保留完整快照便于验收和回退。计划编写时未执行暂存、commit 或 push；用户随后明确授权提交到 GitHub main。

## 最终行为

- 五个槽位按主题蓝、青、琥珀、绿、紫排列，亮暗模式分别定义；与品牌和状态色独立。中性色用于文字、网格和剩余轨道，不参与默认系列色盘。
- 固定系列显式指定槽位；动态实体使用稳定 ID 兜底。取色优先级为有效 colorIndex、旧分类名适配、ID 哈希；有限槽位允许复用。保留旧必填字段及显式颜色、主题覆盖。
- Credit、Cost、Router、Storage、ProjectMonitor、Gateway、Availability、ModelDetail、PersonalSettings、Support、Security 的普通图表及通用日志时间线使用共享取色；两个资源图表采用同一类别映射。Logo、HTTP 结果和安全严重度保持独立。
- 共享 SegmentedBar 的容器、数据段、剩余轨道均采用 rounded-sm（默认 4px），段间 gap-0.5（默认 2px），间隙透出承载面。零值、未知、非法值及归一化为零的极小值不占间距；可读说明保留原始值。
- Cost 的无轴费用构成条采用 SegmentedBar distribution，其 Registry 移除直接 Recharts / Chart 依赖；金额、折扣、最低消费补差和百分比计算保持原有逻辑。

## 审查发现和优化

| 项目 | 原问题 | 已完成修正 |
| --- | --- | --- |
| 极小值绘制 | 正值可能归一化为零，但原可见性判断仍让它占一个间距 | 计算一次绘制权重，同时决定可见性和 flexGrow；增加 Number.MIN_VALUE 回归用例，保留真实数值说明 |
| 几何验收 | 圆角和间距检查只在被忽略的临时输出目录中，无法随源码复用 | 正式导出 verifySegmentedBarGeometry，接入业务浏览器检查和 Next / Vite 安装验证；检查变量解析、真实比例、段间距、隐藏段及要求存在的实际分段条 |
| 样式文档 | 圆角与间距只有描述，辅助变量表缺少对应项 | 中英 Foundations 表格明确 --radius-sm / rounded-sm 及 --spacing × 0.5 / gap-0.5 |
| 历史提案 | 六色建议的旧“当前源码”描述容易与实施后的五色契约混淆 | 标记为未采用的历史基线并链接当前实施记录 |

未发现尚未解决的阻断项。审查包括数值归属、未知与未覆盖总量、零值及超额、实体重排、状态边界、安装依赖、国际化、路由登记和生成一致性；没有新增绘图引擎或改变业务操作。

## 提交范围

文件清单记录 129 个新增、修改或删除路径。范围以清单为准，不按整个工作区提交。

| 分组 | 纳入内容 |
| --- | --- |
| 取色基础 | semantic-tokens、chart-primitives、Token 包与 CSS、UI Registry |
| 业务消费者 | 上述图表迁移文件、类型及示例槽位、Block Registry 依赖调整 |
| 文档 | Chart Tokens 页面、中英内容、Foundations 导航与登记、Chart / ChartPrimitives / SemanticTokens 示例、相关 Agent 指南、Chart 分析和实施记录、本计划与清单 |
| 验证 | 九份相关测试文件、Chart 浏览器脚本、共享颜色与几何验收器、消费者示例及安装验收接入 |
| 分发产物 | public/r、文档加载器、预览源码的哈希文件替换、Agent 目录、Chart Tokens 与 ChartPrimitives 亮暗封面 |

`docs/components/blocks/BlockPreview.tsx` 的 PreviewToolbarProvider 是任务开始前已有修改，保留在工作区。其他 Block 统一、反馈、演示设置、集成监控、支持分析和交易详情等历史任务文档不进入本次提交。逐项排除路径记录在文件清单中。

`.zeron/reports` 和 `output` 按仓库规则保存本地证据；可复用验收逻辑进入 scripts，测试进入 tests。生成的旧 public/docs-source 文件删除和新文件新增须共同暂存，确保预览引用有对应内容。

## 验证结果

| 检查 | 结果和边界 |
| --- | --- |
| 全量单元测试 | Node 22.17.0，261 份文件、2,333 项通过；随后增加极小值用例并复测最新相关范围 |
| 最新相关测试 | 4 份文件、55 项通过，包含新增边界用例、费用交互、国际化与文档登记 |
| 类型与 lint | typecheck、相关修改文件 ESLint 和两份优化界面文件的设计 lint 通过，0 错误、0 警告 |
| 生成一致性 | tokens、Registry、文档路由、加载器、预览源、Agent 指南及目录检查通过；28 个指南示例通过 |
| 业务浏览器 | 13 个入口、60 个亮暗／尺寸／页面视图通过，包含实际颜色覆盖与分段条几何；Hobby 零费用段不占间距 |
| Foundations | 中英、亮暗、390 / 1440 宽度共 8 个视图通过；变量表、系列色、实际圆角与间距及无横向溢出通过 |
| 最新独立安装 | CostEstimate 和 ChartPrimitives 各通过 Next / Vite npm 干净安装、生产构建和浏览器验证，共 4 个实例、20 个视图；包括真实分段条几何检查 |

独立安装的 Registry 依赖闭包与本次最终产物逐项核对。其他入口以类型、单元测试和本地真实图表验证为准；早期 25 个安装实例只代表对应历史阶段，不作为当前 Registry 的安装结论。

证据：[审查索引](../../.zeron/reports/chart-review/verification.json)、[业务检查](../../output/playwright/chart-review/after.json)、[Foundations 检查](../../output/playwright/chart-review/docs.json)、[设计检查](../../.zeron/reports/chart-review/usage.json)、[安装报告](../../.zeron/reports/chart-review/installed/)。

## 提交步骤

先确认 HEAD 仍匹配清单中的 baseCommit，按清单暂存全部新增、修改及删除文件，再检查 staged 差异与提交范围。以下是审核后的执行步骤。

```sh
python3 - <<'PY' > /tmp/zeron-chart-commit.paths
import json
import sys
from pathlib import Path

manifest = json.loads(Path("docs/plans/2026-10-07-chart-token-commit-files.json").read_text())
for path in manifest["files"]:
    sys.stdout.buffer.write(path.encode() + b"\0")
PY
git add --pathspec-from-file=/tmp/zeron-chart-commit.paths --pathspec-file-nul
git diff --cached --check
git diff --cached --stat
git commit -m "feat(chart): unify chart tokens and segmented bar styling"
```

推荐提交说明：

```text
Add five theme-aware chart series slots and migrate chart marks,
legends and related controls to a shared color mapping.

Unify horizontal segmented bars with sm corners and gap-0.5 spacing,
preserve numeric semantics, and exclude zero-weight segments from gaps.

Document the chart contract in Foundations and ship synchronized
Registry artifacts with reusable browser and installation checks.
```

提交后运行生成一致性检查，确认产物没有再次变化；工作区应保留清单中的排除项。按后续用户授权，将此提交推送到 origin/main；实际提交哈希以 Git 历史为准。

# FunnelChart 审查、优化与提交计划

日期：2026-10-07

状态：组件审查及修复完成；用户已授权按本清单提交并推送至 GitHub main，实际执行结果以 Git 历史为准。

基线：`main` / `8f8b4d96d51df0fe351b440fabbd395dd62e3669`。

范围：[逐文件清单](./2026-10-07-funnel-chart-commit-files.json)。包含最初实现和本轮修复，共 38 个路径；明确排除 18 个其他任务路径。

## 1. 审查结论与修复

横纵方向、曲线／直边、分层、默认 4px gap、标签布局、百分比相对首项、渐变／图案优先级及受控回调契约保持参考实现。默认颜色使用 Zeron 变量。本轮修复实际尺寸、交互和生命周期问题，没有新增绘图引擎或扩展公开 Props。

| 发现 | 修复 | 证据 |
| --- | --- | --- |
| P2：getBoundingClientRect 返回父容器 transform 后的尺寸，但段宽、gap 和标签使用 CSS 布局像素，缩放容器中的定位不一致 | 使用 ResizeObserver 的 contentRect；尺寸相同返回原状态，避免无变化通知重新绘图 | 回归用例原结果 149px、预期 300px，修复后通过；浏览器四段图宽 604px、父容器 scale(0.5)，视觉宽 302px，内部段宽 148px、第二段 left=152px，符合 (604−3×4)/4 |
| P2：入场完成在 motion.div 与 div 之间切换，重建全部 SVG、path 和 pattern 节点 | 保留同一个 motion.div，只把完成后的 scale 切换为 1；重播仍使用原节点 | 节点身份回归用例原先失败，修复后通过；真实浏览器观察 20 个 SVG，0 个脱离文档，图案定义同样保持 |
| P2：仅凭 activeElement 判断键盘焦点，鼠标点击图表后离开仍保留高亮 | 分别记录指针触发的焦点与键盘查看；鼠标离开清除，Tab / 方向键保留键盘高亮，失焦重置 | 单测与浏览器均验证点击→移出清除、方向键恢复首项、键盘聚焦移出保留 |
| P2：空数据、非法数据或越界阶段恢复后，旧内部高亮重新出现 | 渲染立即屏蔽无效高亮，清理内部失效下标；不隐式调用受控回调或改写宿主状态 | empty→ready、缩短→恢复、invalid→ready 回归通过；无效状态不播报旧阶段 |
| P3：基础复制代码缺少预览的反馈文字，预览又与组件内 live region 重复播报 | 复制代码补齐容器、数字格式和反馈；外部反馈改为普通段落，组件负责播报 | 复制代码契约通过；浏览器基础图只有一个 live region |
| 封面同步 | 入场容器稳定后 transform 为 none；封面等待逻辑兼容 none 和空值 | 亮暗封面重新生成，全部阶段完整展开 |

新增动画验证覆盖最新 transition 在重播时生效、重播／减少动态效果／卸载停止动画，以及 StrictMode 的动画和 ResizeObserver 清理。两份布局 demo 保持独立预览及独立复制代码。

## 2. 验证结果

| 检查 | 结果与边界 |
| --- | --- |
| 全量单元测试 | Node 22.17.0；263 个文件、2,385 项通过 |
| 专项测试 | 6 个文件、102 项通过，其中 FunnelChart 24 项；覆盖几何、状态、动画、复制代码、语言、文档清单、封面和语义变量 |
| 类型与静态检查 | typecheck、完整 lint、完整 lint:design 通过；未添加 lint 豁免 |
| 生成一致性 | Registry 148 项、路由 124 项、文档 loaders 128 项、预览源码 47 项；Agent loaders 55 个指南、示例 28 个指南／29 段 TSX、目录 162 项全部通过 |
| 独立安装 | 当前打包 CLI 和本地 Registry，Next / React 19 分别通过 npm、pnpm；Vite / React 19 通过 npm。实际组件导入、类型检查和生产构建通过 |
| 复制示例 | 四份完整复制代码在安装后的 Next / npm 消费者通过类型检查、生产构建；实际渲染 5 个图，并验证基础反馈与布局 |
| 安装产物浏览器 | Next / npm 与 Vite / npm 的生产产物各覆盖 1440 / 390px，点击→移出清除、End / Escape 导航、真实路径和无横向溢出通过；三个消费者的五文件闭包与最终 Registry 逐项比对一致，仅 utils 消费端别名按配置转换 |
| 文档浏览器 | 中文浅色 1440px、中文深色 390px、英文深色 1440px、英文浅色 390px；每页 5 个图、每图 12 条数据路径，SVG ID 唯一、入场完成、无横向溢出；两份手机视图同时验证减少动态效果 |
| 本轮问题浏览器 | SVG 节点身份、实际点击与移出、键盘恢复、父级缩放几何通过，0 个运行时错误 |

未运行整个文档站的生产构建。生产构建结论针对上表的独立消费者。初始非法值、长文本与零尺寸的浏览器证据见 [实施记录](./2026-10-07-funnel-chart-implementation.md)，本轮复用对应回归测试，不将历史截图记为新截图。

本地证据位于 `output/playwright/funnel-chart-review-*`；静态报告为 [JSON](../../.zeron/reports/funnel-chart-review/after.json) / [Markdown](../../.zeron/reports/funnel-chart-review/after.md)。这些目录按仓库规则忽略，不进入提交。

### 组件与样式盘点

本轮显式范围为 17 个 TS / TSX / MJS 文件，识别 10 类组件、60 次 JSX 使用，其中包含测试。实际页面仍为 5 个 FunnelChart、1 个 ChartDataTable、4 个 ComponentPreview。核心组件沿用独立 Motion / SVG 实现；ChartDataTable 复用现有数据表能力。

报告覆盖 15 / 17 个文件，0 错误、0 警告，但 inventory / lint 均为 unchecked：motion.path 的动态声明无法自动追溯，两个 MJS 脚本未被报告的设计 lint 纳入。人工追溯 Motion 的实际导入，完整 ESLint 和脚本实际执行补充验证。报告不能完整识别 shadcn 插件的规则名称；实际配置的 no-raw-colors / no-unknown-classes 为 error 并通过，不宣称被关闭的规则通过。未发现本轮受检范围内尚未修复的阻断问题。

## 3. Commit 计划

采用一笔原子提交：

```text
feat(funnel-chart): add layered chart and documentation
```

FunnelChart 尚未进入基线。公开入口、Registry、页面登记、指南目录和生成索引共同组成安装与发现契约，放在同一提交可保证生成检查及文档路由一致。按四组审阅文件，但不拆成缺少关联产物的部分提交。

| 文件组 | 数量 | 内容 |
| --- | --- | --- |
| 组件与安装 | 9 | 公共入口、绘图与三个动画文件、package exports、Registry 源及生成产物 |
| 文档与发现 | 20 | 中英文内容、四份可复制示例、两个布局 demo、路由与登记、指南、身份与搜索、loaders、LLM 目录和亮暗封面 |
| 验证 | 5 | 组件回归、复制代码和文档清单测试、独立消费者示例、封面等待逻辑 |
| 计划与记录 | 4 | 七类整体方案、Funnel 实施记录、本计划与逐文件清单 |

`docs/components/blocks/BlockPreview.tsx` 的既有 PreviewToolbarProvider 修改和 17 份其他任务文档保留在工作区，不进入本次提交。`.zeron/reports`、`output` 和临时消费者也不纳入。没有使用 git add .。

### 执行步骤

用户于 2026-10-07 明确要求提交到 GitHub main。执行提交前确认 HEAD 与基线一致、暂存区没有其他修改，再按清单暂存并检查完整差异。路径含 `[locale]`，采用 literal pathspec。

```sh
python3 - <<'PY' > /tmp/zeron-funnel-chart-commit.paths
import json
import subprocess
import sys
from pathlib import Path

manifest = json.loads(Path("docs/plans/2026-10-07-funnel-chart-commit-files.json").read_text())
assert subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip() == manifest["baseCommit"]
assert not subprocess.check_output(["git", "diff", "--cached", "--name-only"])
for path in manifest["commits"][0]["files"]:
    assert Path(path).is_file(), path
    sys.stdout.buffer.write(path.encode() + b"\0")
PY
GIT_LITERAL_PATHSPECS=1 git add --pathspec-from-file=/tmp/zeron-funnel-chart-commit.paths --pathspec-file-nul
git diff --cached --check
git diff --cached --stat
git diff --cached
git commit -m "feat(funnel-chart): add layered chart and documentation"
```

建议提交正文：

```text
Add horizontal and vertical layered funnels with reference geometry,
theme colors, gradients, patterns, controlled hover and keyboard access.

Keep layout measurements independent of parent transforms, preserve SVG
nodes across entrance completion, and clear stale internal highlights.

Ship four runnable documentation examples, bilingual API guidance and
synchronized Registry artifacts with regression and installation checks.
```

提交后复查 Registry / 文档 / Agent 生成一致性，并确认工作区只剩清单中明确排除的修改，再按用户授权推送至 origin/main 并核对远端提交。包与 Registry 发布不包含在本次授权中。

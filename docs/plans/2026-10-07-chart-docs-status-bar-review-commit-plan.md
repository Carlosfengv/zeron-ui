# 图表文档与 StatusBarChart 审查及提交计划

日期：2026-10-07

状态：审查和优化完成；用户已授权按本清单提交并推送至 GitHub main，执行结果以 Git 历史为准。

审查基线：`main` 的 `9042d75489f6d6bb9739ffd220461f0c5e7fad4c`。

范围：[逐文件清单](./2026-10-07-chart-docs-status-bar-commit-files.json)。共 69 个路径，按下述顺序拆成两笔提交；所有共享文档登记归第二笔，避免同一文件分段暂存。

## 提交顺序

| 顺序 | Commit | 文件数 | 内容和依赖 |
| --- | --- | --- | --- |
| 1 | `feat(status-overview): add status bar chart presentation` | 3 | StatusOverview 的 chart variant、默认圆角状态条、提示框与选中外圈、交互优化及测试，同步 Registry。可独立落在基线上。 |
| 2 | `docs(charts): organize chart types and status bar examples` | 66 | 图表分类、五个类型文档、渐变柱状图、StatusBarChart 示例、中英内容、来源说明、安装和复制代码、文档测试、路由及加载器、目录、封面、依赖、本计划和清单；按最新要求隐藏 Chart 汇总页的目录与导航入口。依赖第一笔提供的 chart variant。 |

第一笔包含且只包含：

- `packages/ui/src/components/status-overview.tsx`
- `tests/status-overview-interaction.test.tsx`
- `public/r/status-overview.json`

第二笔的详细路径见清单。它不新增 LineChart / AreaChart / BarChart / PieChart / DonutChart 的公开包装组件或独立 Registry 条目；这些是现有 Chart 的文档组合入口。

## 最终行为

- 组件目录新增“图表 / Charts”分类，展示五种类型、StatusBarChart、TimeRangeHistogram、Chart Primitives 和 Chart Tokens，共 9 个入口。Chart 汇总页暂时从目录、搜索列表、侧栏和上一页／下一页导航中隐藏，保留原路径、加载器、基础 API 和安装入口。
- 五种图表有独立文档和基础、进阶示例，统一使用现有 Chart、Chart Primitives、Recharts、语义色盘及可展开数据表。
- BarChart 的渐变示例沿用 `support-analytics-01` TicketTrend 的渐变、顶部圆角和柱间距，每个实例使用独立渐变 ID。
- StatusBarChart 是文档名称，安装名和导出仍为 `status-overview` / `StatusOverview`，原 URL 保持有效。新增的 chart variant 为无边框状态图；card 使用同样的圆角状态条，activity 保留紧凑细条形式。
- 基础示例展示 API / Website 的 48 天状态，节点按容器宽度均匀分布，间距为 gap-0.5，保留重播、模拟故障、恢复、选中外圈与表面提示框。入场动画遵循减少动态效果偏好。
- 移除独立的六节点快照示例；保留 72 小时可用性时间线、服务活动和 200 节点压力示例。加载、过期、空数据和失败案例共用基础图的 API 历史与 chart variant。

## 审查发现与修正

| 原问题 | 修正和依据 |
| --- | --- |
| 五种图表复制代码缺少客户端声明，不能直接作为 Next 客户端示例使用 | 15 个完整示例统一提供客户端声明、消费者别名与默认导出；增加复制代码契约测试，并在独立消费者中进行完整类型检查和生产构建。 |
| 部分复制代码与预览的图例、数据表位置、中心摘要及数字格式不同 | 统一宽窄屏布局、图例比例、数据表、数字格式和 Tooltip；补齐时间线的周三标记，替换 activity / 大节点示例的未定义占位变量。 |
| 状态图基础示例依赖 Button，但安装命令只装 StatusOverview | 安装区明确提供 `npx zeron-ui add status-overview button`，保留组件真实安装名与导出说明。 |
| `dataKey` 的说明误用了 Donut 总量说明 | 改为对应图形的数值字段说明；Pie 的数据表 API 对齐实际使用的 ChartDataTable。 |
| 200 节点示例摘要硬编码为 179，实际正常节点为 178 | 根据示例数据计算正常数量和总数，展示 178 / 200。 |
| 悬停每次测量全部节点，密集轨道有不必要的布局开销 | 利用等宽网格的首末节点中心定位最近节点；增加间隙、滚动后位置、反向排列、边界和布局读取次数的回归测试。 |
| chart variant 的数据状态缺少完整测试 | 加入加载、空数据、过期、不可用和失败状态测试，继续验证隐藏过期汇总值及单一键盘入口。 |
| 来源说明不足，容易把新增示例误认为已有独立 Block | 文档分别链接支持分析、AI 网关和项目监控；明确 Pie 为基于现有 Pie / PieChart 基元的新文档组合。 |
| 全量检查发现尺寸约定及目录输出遗漏 | 状态条恢复使用 h-control-md，默认仍为 32px；刷新 Registry 和 Agent 目录，复测全量单元测试通过。 |
| activity 说明称默认 card 样式未改变，与本次基础样式调整矛盾 | 移除过时说明，API 说明准确描述 card / chart 的共享样式和各自表面。 |

未发现尚未解决的阻断问题。公开导出和安装依赖保持兼容；默认 card 的状态条、Hover 和 Tooltip 外观会更新，这是本次请求的基础样式替换。调用方仍负责实际可用率计算和不规则时间采样归一化。

## 验证结果

| 检查 | 结果和覆盖边界 |
| --- | --- |
| 全量单元测试 | 隐藏汇总页前：Node 22.17.0，262 份文件、2,355 项全部通过；包含新复制代码、分类、密集定位和 chart 数据状态用例。其后隐藏改动通过相关 3 份文件、29 项复测，类型、ESLint、路由、加载器及目录检查通过。 |
| 类型与 lint | 最新 typecheck、相关源码 ESLint、完整设计 lint 及差异空白检查通过；相关检查 0 错误、0 警告。 |
| 生成一致性 | Tokens、Registry 147 项、文档路由 123 项、加载器 127 文档、预览源 47 项、Agent 目录 161 项检查通过。 |
| 图表文档浏览器 | 五个类型共 10 个视图：中文 / 1440px / 浅色，英文 / 390px / 深色；真实 SVG、进阶数据表、未分配总量、来源链接、渐变引用及页面无横向溢出通过。 |
| 隐藏汇总页 | 最新中英文目录均不列出 Chart，图表侧栏为 9 项，翻页跳过 Chart；直接访问原中英文路径均返回 200。页面登记仍覆盖隐藏的有效文档，不将其误判为孤立页面。 |
| 状态图浏览器 | 中文浅色 1440 / 390px、英文深色 1440px，检查 48 天均匀布局、2px 间距、故障切换、重播、键盘目标、Hover / Tooltip、四种数据状态、72 桶时间线和 200 节点摘要；无运行错误。 |
| 独立安装 | 使用打包后的 CLI，分别在独立 Next / npm 项目安装 StatusOverview 和 Chart。最后在 Chart 消费者通过 CLI 安装当前 StatusOverview 与 Button，核对最终 Registry 依赖闭包。 |
| 复制代码消费者 | 全部 15 个示例在独立消费者中通过类型检查和 Next 15 / React 19 生产构建；15 个示例实际渲染，1440 / 390px 下检查图形、状态图交互、提示框、实际尺寸和无横向溢出通过。 |
| 样式与来源人工复核 | 报告覆盖 8 个核心界面文件，识别 69 类组件、140 次 JSX 使用；3 处 ChartTooltip 值别名均追溯到现有 Chart 对 Recharts Tooltip 的公开导出。动态图形选择亦逐项核对。 |

未运行整个文档站的生产构建或 Vite 安装矩阵；生产构建结论针对上述独立 Next 消费者。静态报告未启用的内联样式、动态类名等规则由人工复核和浏览器检查补充，不将未启用规则记录成静态检查通过。

本地证据：[汇总](../../output/chart-docs-review/verification.json)、[样式报告](../../output/chart-docs-review/usage.md)、[状态图](../../output/chart-docs-review/status-browser.json)、[五种图表](../../output/chart-docs-review/types-browser.json)、[独立安装与代码构建](../../output/chart-docs-review/installed-snippets.json)、[消费者浏览器](../../output/chart-docs-review/installed-browser.json)、[最终单元测试](../../output/chart-docs-review/unit-final.log)。`output` 按仓库规则保留本地证据；可复用回归测试进入 tests。

## 提交范围与执行步骤

`docs/components/blocks/BlockPreview.tsx` 是任务开始前已有的 PreviewToolbarProvider 修改，不纳入提交。17 份其他 Block、反馈、工具栏、集成监控、支持分析、交易详情的任务文档也保留在工作区；逐项排除记录在文件清单中。

用户已明确要求提交至 GitHub main。执行前确认 HEAD 和清单基线一致，检查暂存区是否含其他改动，再按两个分组依次暂存并审阅。不要使用 `git add .`。路径包含 `[locale]`，使用 literal pathspec，防止路径被当作通配符。

第一笔使用以下方式暂存及提交：

```sh
python3 - <<'PY' > /tmp/zeron-chart-review-commit.paths
import json
import sys
from pathlib import Path

manifest = json.loads(Path("docs/plans/2026-10-07-chart-docs-status-bar-commit-files.json").read_text())
for path in manifest["commits"][0]["files"]:
    sys.stdout.buffer.write(path.encode() + b"\0")
PY
GIT_LITERAL_PATHSPECS=1 git add --pathspec-from-file=/tmp/zeron-chart-review-commit.paths --pathspec-file-nul
git diff --cached --check
git diff --cached --stat
git diff --cached
git commit -m "feat(status-overview): add status bar chart presentation"
```

第二笔采用同样步骤，改用 `commits[1].files` 和第二笔标题。提交后确认已通过的生成检查对应当前内容、暂存区为空、工作区只剩明确排除项，再推送至 `origin/main` 并核对远端提交。

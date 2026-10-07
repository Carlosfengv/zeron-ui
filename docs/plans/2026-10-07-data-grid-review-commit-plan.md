# DataGrid 审查修复与 commit 计划

日期：2026-10-07。源码基线：main / `f502214`。本次按下列三组提交 DataGrid、Dropdown、Select、Calendar 修复与优化，推送目标为 GitHub main。

## 已修复的问题

| 问题 | 修复 | 验证 |
| --- | --- | --- |
| 列 ID 与 accessorKey 不同，或使用 accessorFn 时，宿主替换数据后仍显示旧值 | DataGridCell 比较 TanStack 缓存的 accessor 结果，使用 Object.is | 别名列、计算列更新回归；浏览器验证展示与编辑后的计算值 |
| 别名列编辑写入列 ID 字段；嵌套 accessorKey 无法正确更新 | 按 accessorKey 解析写入路径，只复制被修改的路径；保留未修改字段、数组与记录引用 | 别名、嵌套批量更新、数组、原始数据不变、own __proto__ 字段测试；浏览器别名编辑 |
| checkbox 单元格点击后误进入编辑状态，双击或 F2 也会留下不存在的编辑器状态 | Wrapper 尊重 onClick 的取消；hook 阻止 checkbox 进入编辑状态 | 单元格及 hook 回归；浏览器 padding 点击、双击、F2、后续导航 |
| 输入法候选确认/取消会提交或关闭编辑器；全局 Escape 会清空选择 | cell wrapper、私有 Popover、原生键盘监听及全局快捷键均保护 isComposing / keyCode 229 | 文本、URL、长文本、多选 Backspace、选择范围、搜索快捷键回归；浏览器合成 composing 事件 |
| 多选搜索输入吞掉 Escape，弹层无法关闭 | 让 Escape 交给单元格的关闭逻辑 | 多选 Escape 回归；浏览器多选操作与退出 |
| 内部 cell 对象被输出为 DOM 属性 | Wrapper 在透传 HTML props 前消费 cell | DOM 属性回归与浏览器检查 |
| 已聚焦的单选单元格连续双击会误关闭新挂载的弹层 | 单元格接管触发器区域的 pointer/mousedown/click；保留 portal 选项和外部关闭 | 单选交互回归与连续双击、外部关闭验证 |
| 日期弹层挂载时重复处理初始焦点 | 初始焦点由 Calendar autofocus 负责 | 日期选中项焦点、键盘选日、Escape、undo/redo |
| 聚焦、拖选等状态更新重复渲染表头及提交空状态 | 稳定选择 Set、忽略无效状态写入；表头 memo 使用排序/固定/尺寸等原始值快照 | 渲染次数与实时状态回归，排序、固定、列宽、隐藏、拖选浏览器验证 |
| 弹层定位完成前动画已消耗大半；变换依赖主线程逐帧更新 | Dropdown / Select 按 primitive 定位状态启动完整 transform/opacity 原生动画，使用既有 moderate 动效档位 | 原生动画关键帧、快速重开、ref 清理、减少动效、键盘与碰撞处理 |
| Select 选中项需额外等两帧；Calendar 父级更新重建内部组件 | 选中索引直接来自既有 item discovery；固定 Calendar 组件身份并复用月份格式化器 | Select 交互、Calendar DOM/焦点与调用方覆盖测试 |

计算列的展示更新已修复。accessorFn 无法通用地反向推导源字段，因此仍保留原有按列 ID 写入的行为，未新增 setter API；此兼容行为有回归测试。

## commit 1：数据正确性和编辑语义

`fix(data-grid): preserve accessor writes and editor input semantics`

范围：

- `packages/ui/src/components/data-grid/data-grid-cell.tsx`：accessor 值比较。
- `packages/ui/src/components/data-grid/data-grid-cell-wrapper.tsx`：取消点击、IME 捕获、移除 cell DOM 属性。
- `packages/ui/src/components/data-grid/data-grid-popover.tsx`：保护 sibling portal 编辑器的 IME 操作。
- `packages/ui/src/components/data-grid/data-grid-cell-variants.tsx`：单选开启动作、多选 Escape、日期初始焦点。
- `packages/ui/src/hooks/use-data-grid.ts`：只选 accessor 写入、checkbox 编辑限制、IME 键盘保护的变更块。
- `tests/review-data-grid-cells.test.tsx`：本次全部编辑回归。
- `tests/review-data-grid.test.tsx`：只选 accessor、checkbox、IME 的新增回归块。
- 按该提交的源码重新生成 `public/r/data-grid.json` 及实际发生变化的 Registry 索引。

验收：单元格及 hook 回归、排序/过滤后的记录映射、类型检查、代码与设计 lint、Registry 一致性及独立 DataGrid 消费者安装。

## commit 2：DataGrid 渲染优化

`perf(data-grid): avoid redundant interaction renders`

范围：

- `packages/ui/src/hooks/use-data-grid.ts`：选择 Set 订阅、空状态复用及无效状态写入优化的剩余变更块。
- `packages/ui/src/components/data-grid/data-grid-column-header.tsx`：表头和列宽控制 memo，排序、固定、尺寸、能力与标签的快照。
- `tests/review-data-grid.test.tsx`：渲染次数及表头状态同步的剩余变更块。
- 重新生成该提交对应的 DataGrid Registry 内容和索引。

验收：聚焦与拖选不会额外刷新表头；排序、固定、列宽 ARIA、标签和可用操作仍实时更新；浏览器验证拖选、导航、排序、固定、调整列宽与隐藏。

## commit 3：共享弹层和日历优化

`perf(ui): synchronize popup motion and stabilize calendar rendering`

范围：

- `packages/ui/src/components/dropdown.tsx`、`select.tsx`：定位状态与原生动画、moderate 档位、减少动效、稳定 ref、退出重开保护、选中索引及测量整理。
- `packages/ui/src/components/data-grid/data-grid-calendar.tsx`：稳定组件身份与月份格式化器；保留调用方组件/formatter 覆盖。
- `packages/ui/registry.json`：Dropdown、Select 的 compose-refs 依赖。
- `tests/menu-item-activation.test.tsx`、`tests/select-interaction.test.tsx`、新增 `tests/calendar-interaction.test.tsx`。
- 重新生成 `public/r/dropdown.json`、`select.json`、`calendar.json`、`data-grid.json` 和 Registry 索引中实际变化的内容。
- 本计划文件。

验收：默认打开、animated=false、快速重开、React 19 ref 清理、键盘与指针激活、减少动效、宽/窄及低窗口碰撞处理；Next/Vite 安装、类型及样式构建通过。

## 拆分规则

1. hook 和 review-data-grid 测试文件包含跨提交内容，必须按变更块拆分。
2. 每笔从上一笔的源码状态重新生成 Registry。当前 data-grid.json 包含完整组合的修改，不能整份提前放入第一笔。
3. 每笔验证自己的中间状态和 Registry 闭包；不能把最终组合通过当作各笔单独通过。
4. 不整仓暂存：排除 `docs/components/blocks/BlockPreview.tsx` 的既有修改、其他未跟踪的计划文件和临时 harness/测量输出。
5. 未改包导出、依赖版本、公共 prop 或 token 定义；不需要携带无关 package/lockfile 修改。

## 验证与边界

三笔中间状态均已独立验证，且各自重新生成 Registry：

| 提交 | 组件/DataGrid 测试 | Registry 测试 | 安装验证 |
| --- | --- | --- | --- |
| commit 1：`40defb7` | 105 项通过 | 23 项通过 | Next DataGrid / Vite DesignStack 通过 |
| commit 2：`bd6a977` | 107 项通过 | 23 项通过 | Next DataGrid / Vite DesignStack 通过 |
| commit 3：共享弹层与日历 | 125 项通过 | 23 项通过 | Next DataGrid / Vite DesignStack 通过 |

各笔类型检查、完整设计 lint、受影响代码 lint 和 Registry 147 条目检查均通过。第二笔额外复验 10 项表格浏览器交互，第三笔额外复验 14 项日期弹层交互。

最终组合验证：125 项组件/DataGrid 回归、23 项 Registry 回归，共 148 项；类型检查、完整设计 lint、受影响代码 lint、Registry 147 条目检查，以及 Next DataGrid / Vite DesignStack 独立安装验证。

浏览器覆盖：accessor 刷新与编辑、checkbox 激活和导航、IME 标志保护、长文本及多选 portal、原有 DesignStack 编辑/删除/增行/历史、拖选/排序/固定/列宽/隐藏、日期键盘选择及窄屏/短窗口。

IME 浏览器验证使用合成 KeyboardEvent，未覆盖真实系统输入法或真机。共享弹层已确认使用原生 transform/opacity 动画；重复测量没有证明打开耗时稳定降低，不将某一轮的延时差写入 commit 的提速结论。

样式检查范围为 9 个 canonical 源文件，自动识别 67 种组件、127 处 JSX 使用，0 错误、0 警告。动态组件来源另行追踪；没有新增视觉 token 覆盖。

详细数据保存在 `.zeron/reports/design-stack/data-grid-review-after.json` 和 `.zeron/reports/design-stack/data-grid-review/verification.json`。临时测试日志位于 `/tmp/zeron-demo-reference/data-grid-review-*.log`，不纳入提交。

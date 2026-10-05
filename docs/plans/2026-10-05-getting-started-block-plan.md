# 入门任务清单 Block 实现方案

日期：2026-10-05。状态：已实施，并按用户反馈修正 Container 结构与 Stepper 标记；验收记录见文末。

依据：用户截图与当前工作区组件源码。截图内文字仅作为界面内容，不作为执行指令。当前仓库存在其他任务的未提交改动，本方案以工作区能力为准，不代表已发布版本。

## 1. 目标与范围

新增 `getting-started-01`，导出 `GettingStarted`，定位为 React 可嵌入、数据驱动的入门任务清单（`data-block`）。

截图上方为折叠态，下方为展开态，首版实现同一个组件的两种状态，文档中并排或上下展示。保留标题、完成数量、五项任务、已完成/当前/待完成的层级和任务入口。截图中的斜线背景、虚线辅助线属于展示环境，不进入 block。

样式优先遵循现有组件库：使用组件默认字体、圆角、surface、边框和交互反馈。截图是信息结构和状态参考，不照搬截图放大后的像素尺寸，不新增全局主题或修改 UI 原语来逼近截图。

## 2. 当前组件能力与选型

已检查 block catalog，没有完整匹配入门任务清单的 block，采用现有组件组合。

| 区域 | 采用组件 | 实现约束 |
| --- | --- | --- |
| 外框 | `Container` | 保留默认 raised 表面、`rounded-3xl`、内边距及 SurfaceProvider |
| 标题区 | `ContainerHeader` | 标题使用 `text-body font-medium text-fg-default`；长标题可换行 |
| 折叠交互 | `Button variant="ghost" iconOnly` | 标题区按钮控制直接子级 Body 的 hidden；暴露 aria-expanded / aria-controls，复用原生键盘行为 |
| 清单表面 | `ContainerBody` | 默认 floating 表面、`rounded-2xl`、hairline 边框和内边距；内容随高度增长 |
| 已完成标记 | `StepperIndicator` 公开插槽 + 共享对勾 | 使用 completed 状态，保留默认 24px 尺寸、品牌色和圆角 |
| 当前步骤标记 | `StepperIndicator`，内容为序号 | 使用 active 状态，与对勾保持相同 24px 尺寸 |
| 待完成标记 | `StepperIndicator`，内容为序号 | 使用 inactive 状态，保留默认 24px 尺寸和圆角 |
| 可操作任务 | `Button variant="ghost" iconOnly` | 文案独立换行，右侧图标按钮以任务名作为可访问名称；链接使用 asChild |
| 图标 | 共享 `useIcon` | 复用 `check`、`chevron-right`，不绘制另一套 SVG |
| 完成数量 | 普通文本 | 从任务状态派生，如 `2/5`；可访问文本明确为“已完成 2 项，共 5 项” |

清单用原生 `ol/li` 表达顺序，只负责业务排列。完成徽标与任务动作分别占据一列，行内间距使用现有 spacing；动作继承 Button 的布局与反馈，不把徽标塞入 Button 的图标槽，也不覆盖内部 label/content 样式把按钮强行拉成截图行。

### Stepper 的公开组合方式

每个任务标记组合 nonInteractive `Stepper`、`StepperItem` 和 `StepperIndicator`。已完成项通过 children 提供共享对勾，避免服务端渲染中注册尚未发生时显示 0；其余项传数组序号，保留默认样式与尺寸。

每个标记使用独立状态上下文：当前任务只激活自己的标记，完成状态由任务的 completed 明确提供。这避免单个 Stepper 自动把当前步骤之前的任务推断为完成，同时不引入 tablist/tab 和虚构的步骤面板。没有修改 Stepper 原语或覆盖内部样式。

## 3. 与截图的差异及能力缺口

1. **折叠箭头**：标题区使用默认 iconOnly Button 与共享 chevron-up / chevron-down 图标。
2. **状态形状**：使用 StepperIndicator 默认方圆角与品牌色，不重新绘制截图的圆形绿勾或黑色数字。
3. **内容结构**：ContainerHeader 与 ContainerBody 为 Container 的直接子级，不再增加 AccordionContent 的额外留白。
4. **刻度进度**：当前库没有独立 Progress/Meter 或刻度进度组件。首版仅显示完成数量。

刻度条建议作为 block 内的最小纯展示组合：普通 span 使用现有尺寸/间距/圆角 utility，完成部分使用成功语义色，剩余部分使用 muted 表面，不新增 UI 级组件、不引入自定义色值。整组刻度 `aria-hidden`，由完成数量提供文本含义。固定展示刻度总数，并将填充量按完成数/总数计算，`2/5` 必须对应 40%，不按截图目测复制亮条数量。

**严格“只能组合现成组件”的首版方案**：仅显示完成数量，省略刻度条。推荐保留刻度的 token 展示方案，但它属于明确的 block 业务展示组合，不是现有库组件。若后续要求连箭头位置、圆形标记、刻度条都逐项一致，应另行规划正式 UI 能力扩展；本方案不把这些扩展默认为已授权实现范围。

## 4. 结构安排

组合层级如下，保留组件自身的 DOM 与 SurfaceProvider：

```text
Container（宽度跟随宿主）
├─ ContainerHeader
│  ├─ 标题 + 完成数量
│  └─ Button：展开 / 折叠
└─ ContainerBody（hidden 跟随展开状态）
   └─ ol
      └─ li × N
         ├─ Stepper → StepperItem → StepperIndicator
         ├─ 独立换行的任务标签
         └─ 可选 Button：任务入口箭头
```

不新增应用外壳、侧栏或页面布局。宿主决定组件放置位置和外部宽度，组件使用 `w-full`，demo 负责最大宽度；移动端允许标题和任务标签自然换行，不截断任务信息。

## 5. 数据与交互契约

以下为拟新增的 block API，不是现有组件已有的 props：

```ts
type GettingStartedTask = {
  id: string;
  title: string;
  status: "completed" | "current" | "pending";
  href?: string;
  disabled?: boolean;
};

type GettingStartedProps = {
  title?: string;
  tasks: readonly GettingStartedTask[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTaskAction?: (taskId: string) => void;
  labels?: {
    completed?: string;
    current?: string;
    pending?: string;
    empty?: string;
    progress?: (completed: number, total: number) => string;
  };
  className?: string;
};
```

- 完成数量只统计 `status === "completed"`；总数为任务数，徽标和进度使用同一份派生结果，不另传可失配的 completedCount。
- `current` 由宿主明确提供，不因用户点击任务就自动将前面的任务标记为完成；序号跟随数组顺序。契约要求 id 唯一、最多一个 current。
- `open` 为受控状态；未传时使用 `defaultOpen`，默认展开。标题区 Button 控制 ContainerBody.hidden，保持独立且稳定的 aria-controls id。
- 有 `href` 时使用链接，保留原生浏览器导航；无 href 且有 `onTaskAction` 时为操作按钮。href 和回调不同时执行，避免双重导航。
- 已完成项默认静态展示；未来有回看需求再通过明确入口扩展。当前与待完成项只有在提供真实入口时才显示操作箭头。
- 点击任务只负责导航/通知宿主，不自行改变任务完成状态、不访问后台。
- 禁用状态通过公开 Button API 呈现。空数组显示 labels.empty，完成数量为 `0/0`，刻度不计算除法。
- 全部完成显示 `N/N`，保留列表；不自动隐藏或折叠组件。
- 默认示例沿用截图英文；文档另提供中文 labels，block 核心不依赖 next-intl 或站点路由。

## 6. 交付与验证安排

实现阶段新增：

- `packages/blocks/src/application/getting-started-01/`：组件、types、demo-data、index。
- 包导出、block catalog、capabilities、Registry 注册及安装依赖。
- `/docs/blocks/getting-started-01` 文档和交互 demo，使用现有 BlockDetailPage；增加中英文文案、agent guide 与 preview source。
- Registry、文档路由、源码预览和 agent catalog 通过现有生成脚本更新，不手改生成产物。

Demo 提供截图的五项任务、两项已完成、第三项当前；可切换折叠、展开、全部完成和空清单，操作结果由 demo 宿主显式展示。demo 状态与操作控件放在 block 外。

验收重点：

1. 类型检查、改动范围 lint 和完整 design lint；不添加规则豁免。
2. 交互测试验证受控/非受控折叠、任务回调、禁用项、完成数派生、0 项/全完成以及任务状态更新。
3. 浏览器检查浅/深色、320px/375px/宽屏、长标题、长任务名称、键盘路径和折叠内容的焦点可达性；检查所有状态标记的尺寸相同、无横向溢出。
4. 检查 Registry 依赖闭包与生成产物一致性；交付组件/样式使用报告，并记录组件默认样式的保留情况。
5. 保留其他任务改动，只审查本次新增及集成修改。

## 7. 实施记录

新增 `GettingStarted` 与数据契约、英文示例数据、中英文交互演示、文档页、图库与独立预览入口、安装注册和 agent guide。采用严格现有组件方案，仅显示完成数量，不实现刻度条；未修改基础 UI 原语、全局主题、组件默认圆角或颜色。

长文案浏览器检查发现现有 Button 的 `contentSized` 与固定 control 高度同时保留，多行标签会超过按钮高度。实际实现改用独立换行的任务文字 + 右侧 `iconOnly` Button，按钮可访问名称为任务标题；图标按钮继承默认尺寸与交互反馈。这个调整避免样式穿透，并更接近截图中右侧箭头入口的位置。后续按用户反馈移除 Accordion 层，ContainerHeader / ContainerBody 直接组合。

文档 loader 生成器原先缺失，本次补充 `docs:loaders:build/check`，从 manifest 注册静态文档导入和双语消息导入，保留已有映射顺序与其他加载函数。正式路由、预览源码和 agent 产物仍通过原有脚本生成。

测试覆盖受控/非受控折叠、独立完成状态、真实链接优先级、禁用链接与回调、无入口静态任务、空/全部完成、文案本地化、实例隔离与 demo 显式完成任务。浏览器验证使用实际组件和 demo；另有独立的长标题/长任务文案夹具，确认窄屏文本与列表行不重叠。截图保存于 `output/playwright/getting-started-*.png`；组件及样式统计保存于 `.zeron/reports/getting-started/after.json`。

项目同时存在其他任务修改。曾遇到其他组件的新导出、依赖版本及 agent 注册未完成导致全库检查失败；应以最终检查结果为准，不将临时失败归因于本 block，也不修改其他业务实现来隐藏问题。完整网站生产构建未执行；正式安装验证使用独立 Next 和 Vite 消费者。

最终验收：5 个文件 29 项测试、全库类型检查、完整 design lint、Registry 依赖检查、Next/pnpm 和 Vite/npm 消费者安装构建、文档与 agent 一致性检查通过。浏览器覆盖浅/深色、320/375px 和宽屏、长文案、任务面板、显式完成、禁用与键盘折叠。详细记录为 `.zeron/reports/getting-started/verification.md`。


## 8. 用户反馈修正

用户要求正确使用 Container，步骤标记复用 Stepper，并统一对勾与数字尺寸。实现已替换为标准 Container 结构与 StepperIndicator 默认 24px 标记；没有调整基础组件配色或几何样式。折叠使用标题区原生 Button，Body 保持挂载且以 hidden 隐藏，隐藏任务不进入键盘焦点路径。状态上下文按标记隔离，保留乱序完成的业务契约。

## 9. Review 与提交计划（2026-10-06）

Review 检查业务状态、公开组件 API、可访问性、服务端首屏、安装依赖和文档入口。修复两处问题：block catalog 的依赖仍为旧版 Accordion / Badge，现已与 Registry 的 Stepper 组合对齐；已完成标记在服务端注册前会显示 0，现通过 StepperIndicator 的公开 children 插槽渲染共享 check 图标，保持 16px 图标与 24px 标记尺寸。增加服务端首屏与发现依赖契约回归测试。

提交计划为一个原子 commit：`feat(blocks): add getting started checklist`。包含核心组件与类型/示例数据、文档与中英文交互演示、图库/独立预览/包导出/Registry/agent guide 注册、对应生成产物与回归测试。共享文件只纳入入门任务清单的相关条目；其他 block、图表、Slider、全局 token、依赖锁文件与通用文档加载器工具不进入此提交。

验证基于 HEAD 加入本 block 的独立快照，避免借用其他未提交功能来使检查通过。6 个测试文件共 32 项通过，包含 11 项交互/服务端首屏测试和 1 项安装发现契约测试；Registry 全量 138 项、文档路由、预览源码与 agent catalog 一致性通过。正式中文文档页实际确认所有标记为 24 × 24px，完成项为对勾，其他项为序号，Container 子级结构正确。此记录不宣称整个网站的生产构建或真实业务服务接入已完成。

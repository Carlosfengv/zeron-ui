# Zeron 设计 Token 与 Design Lint 治理方案

日期：2026-09-15
状态：已实施。
前置分析：[shadcn lint 原理分析与 Zeron 初版](./zeron-design-lint.md)

## 1. 方案结论

本轮治理沿用已接入的 `@shadcn/lint@0.1.0` 分析引擎，由 `@zeron/lint` 管理 Zeron 的语义与组件契约。先修复样式基础设施，再校准规则，最后分批迁移使用点。

确定以下决策：

1. **0.5px 边框成为正式 token。** 新增 `hairline` 边框宽度，标准写法为 `border-hairline`，支持方向和响应式变体，同时适配类名合并工具。
2. **保留 `duration-fast`、`duration-moderate` 等语义名称。** 修复生成器的 Tailwind 命名空间，继续使用现有动效时长数据源。
3. **CSS 进出场动画使用 `tw-animate-css`。** 参考 shadcn 的接入与状态驱动方式，补齐依赖和 CSS 导入；继续保留 Zeron 已有的 JavaScript spring 动效。
4. **修正规则对有效 token 的误判。** 阴影、字号、边框宽度分别按真实类别处理，不放开整类前缀，也不把无效类名加入白名单。
5. **按组件真实 API 收敛 `no-restyle`。** 区分控件自身外观、内容排版和布局定制，避免以清空报告数量为目标改变页面设计。
6. **与现有 builder skill 形成验证闭环。** 使用同一套 token、契约和检查入口；先对完成治理的范围设置门禁，再覆盖全仓库。

本阶段不发布 npm 包，不重写 lint 引擎，不整体替换动画库，也不新增与实际需求无关的设计 token。

### 1.1 实施结果

截至 2026-09-15，本方案的 P0–P3 已完成：

- 全量设计检查由基线的 1,491 条诊断降至 0，检查范围覆盖 `app`、`docs/pages`、`packages/ui/src` 和 `packages/blocks/src`。
- `hairline` 已进入 token 元数据、CSS/JavaScript/类型导出、Tailwind 主题、类名合并器与 Registry；源码中的 0.5px 边框工具类已迁移为 `border-hairline`，CSS module 使用 `var(--border-width-hairline)`。
- 六种语义时长已映射到 Tailwind 的 `--transition-duration-*` 命名空间；`tw-animate-css` 已接入根应用与 Registry 安装流程。
- `@zeron/lint`、独立 ESLint 配置、CI 门禁和 builder skill 验证闭环已经启用。
- Registry 共 128 个条目通过闭包检查；Next/Vite、npm/pnpm 的消费者安装矩阵验证了依赖、CSS 导入、重复安装和生产构建。
- 完整单元/契约测试为 132 个文件、812 个用例通过；CLI 24 个用例、UI/Blocks 类型检查、生产构建和 Chromium 桌面/移动端焦点回归通过。

浏览器产物中 `.border-hairline` 的声明值为 `.5px`，`duration-fast` 的计算值为 `0.08s`，`animate-in` 解析为 `enter`。Chromium 会把普通元素边框的 used/computed width 量化为 `1px`，DPR 1/2 均如此；因此 `hairline` 保证统一的设计意图和 CSS 声明，不承诺所有浏览器将普通 border 呈现为半个 CSS 像素。

## 2. 审计基线与问题分类

基线来自本工作区的 `output/design-lint.json`：扫描 477 个文件，140 个文件有报告，共 1,491 条错误级诊断。该文件是本地产物，不作为必须提交的源文件。

| 规则 | 诊断数 | 本方案的处理方式 |
| --- | ---: | --- |
| `no-restyle` | 1,208 | 校准组件契约，再判断具体使用点是否应迁移 |
| `no-unknown-classes` | 135 | 修复时长映射、动画导入，登记有效状态标记 |
| `no-arbitrary-values` | 99 | 正式化半像素边框，其余按用途逐项处理 |
| `no-raw-colors` | 49 | 区分真实色彩问题、未定义名称、分类误报和图形例外 |

目录分布：`packages/blocks` 1,066 条，`docs/pages` 262 条，`packages/ui` 136 条，`app` 27 条。

### 2.1 已核实的细分结果

| 分类 | 数量 | 判断 |
| --- | ---: | --- |
| 未生成的 `duration-*` | 118 | 真实的主题映射问题 |
| 未加载的进出场动画工具类 | 16 | 真实的 CSS 接入问题 |
| `is-active` | 1 | 被后代选择器引用的合法状态标记 |
| 半像素边框 arbitrary 诊断 | 47 | 用户已确定应正式化为 token |
| 其他 arbitrary 诊断 | 52 | 需要区分通用尺度、组件配方和运行时计算 |
| 有效阴影类被当作颜色 | 23 | 分类误报 |
| `text-caption` / `text-display` | 6 | 当前没有定义，不能生成 CSS |
| 旧名称或未定义的语义名称 | 9 | 迁移到现有、用途匹配的 token |
| 原始色板工具类 | 4 | 按业务含义改用语义 token 或已有分类配色 API |
| SVG 原始颜色 | 7 | 品牌图形 4 处、遮罩渐变白色 3 处，保留必要常量并限定例外 |

**修正此前对字号问题的判断：** `text-caption` 和 `text-display` 不是“已有字号尚未加入适配”，而是当前 token 与 CSS 中均未定义。不能采用添加白名单的方式修复。

以上数量是诊断数量，不是已确认 UI 缺陷数量。组件实现层已有部分规则例外，47 条半像素报告并不等于全仓库只有 47 个迁移位置。不同规则可能报告同一使用点，不能将各项预计减少量简单相加作为最终验收。

### 2.2 本轮已完成的可行性验证

以下实验在内存中调整 CSS 或合并配置，没有修改生产源码：

| 验证项 | 结果 |
| --- | --- |
| Tailwind 4.1.18 加入 `--border-width-hairline: 0.5px` | 能生成 `border-hairline`、方向类及变体 |
| 将主题 `--duration-*` 改为 `--transition-duration-*` | `duration-fast` 等能生成有效 CSS |
| 加载本地 `tw-animate-css@1.4.0` 的 CSS | 本次缺失的动画工具类可以解析 |
| 当前合并器处理 `border-hairline border-border` | 会丢失宽度类，必须同步适配 |
| 合并器补充边框宽度与时长分组 | 保留宽度与颜色，并正确解决同类别冲突 |

## 3. 正式化 hairline 边框 token

### 3.1 数据与命名契约

在 `packages/ui/src/tokens/semantic-tokens.mjs` 新增独立的边框宽度集合：

```js
export const borderWidthTokens = [
  {
    name: "hairline",
    value: "0.5px",
    usage: "细分隔线与轻量边界；不替代控件强调边框和焦点指示器",
  },
];
```

同时暴露 `semanticTokens.borderWidths`，在 token 包导出 `borderWidthTokens`，补齐 TypeScript 声明、生成文档与 Registry 数据。

采用 Tailwind 原生边框宽度命名空间，生成如下主题值：

```css
@theme inline {
  --border-width-hairline: 0.5px;
}
```

需要独立 CSS 变量的导出入口也由同一元数据生成 `--border-width-hairline: 0.5px`。主题映射使用具体值，禁止生成 `--border-width-hairline: var(--border-width-hairline)` 这样的自引用。

不额外引入一套手写方向 `@utility`。已用仓库安装的 Tailwind 4.1.18 验证原生支持；实现依据见 [Tailwind v4.1.18 utilities 源码](https://github.com/tailwindlabs/tailwindcss/blob/v4.1.18/packages/tailwindcss/src/utilities.ts)。

### 3.2 类名迁移

| 现有写法 | 目标写法 |
| --- | --- |
| `border-[0.5px]` | `border-hairline` |
| `border-b-[0.5px]` | `border-b-hairline` |
| `border-t-[0.5px]` | `border-t-hairline` |
| `sm:even:border-l-[0.5px]` | `sm:even:border-l-hairline` |
| `xl:border-l-[0.5px]` | `xl:border-l-hairline` |

按实际类名迁移，保留响应式、状态和选择器前缀。统一支持 `t/r/b/l/x/y/s/e` 等 Tailwind 已支持的方向，并验证方向间覆盖关系。

只替换表达细边界宽度的 0.5px，不全局替换数字；保留已有 1px、2px 边框、spinner 描边和 focus ring 宽度。文档中的历史写法、负例及展示源码需按内容用途分别处理。

### 3.3 类名合并必须同步修复

`packages/ui/src/system/utils.ts` 的 `extendTailwindMerge` 需要登记：

- `border-hairline` 属于 `border-w`，各方向类进入对应宽度分组。
- `duration-fast` 等六种时长名称属于 `duration` 分组。
- 保留当前已有的语义字号扩展。

合并契约至少包括：

```text
border-hairline border-border       → 两者均保留
border-hairline border-2            → border-2
border-t-hairline border-t-border   → 两者均保留
duration-fast duration-300         → duration-300
duration-300 duration-fast         → duration-fast
```

测试还需覆盖相反顺序、方向间覆盖和相同变体下的冲突。边框宽度、颜色和实线/虚线样式应能够共存。

应用的 `cn()` 配置不会自动改变上游 lint 内部使用的分类器，二者需分别适配与验证。Registry 分发的 utils 必须包含相同能力。

### 3.4 验收

- CSS、JavaScript、类型声明、Registry 和文档均包含同一 token。
- 编译结果是 `0.5px`，不依赖 arbitrary value 才能生效。
- 浅色、深色、DPR 1 与 DPR 2 下检查表格、卡片、分隔线，无边界丢失。
- 保持 CSS 像素语义；不承诺各种缩放与设备上都恰好渲染为一个物理像素。

## 4. 动效处理方案

### 4.1 保留现有语义时长，修复生成器

当前时长来源正确，问题位于 `scripts/generate-semantic-tokens.mjs` 的主题映射：生成了 `--duration-fast`，而安装版本的 Tailwind 时长解析使用 `--transition-duration-fast`。

| 级别 | 进入 | 退出 | 现有 bounce |
| --- | ---: | ---: | ---: |
| fast | 80ms | 60ms | 0 |
| moderate | 160ms | 120ms | 0 |
| slow | 240ms | 160ms | 0.12 |

生成器调整为：

```js
theme[`transition-duration-${token.name}`] =
  `var(--motion-duration-${token.name})`;
```

保留底层 `--motion-duration-*` 变量和全部六种工具类名称：`fast`、`fast-exit`、`moderate`、`moderate-exit`、`slow`、`slow-exit`。

修复后 `duration-fast` 会设置 `--tw-duration` 和 `transition-duration`。它只指定时长，不会自动选择过渡属性或创建动画；组件仍需使用适当的 `transition-*` 或动画类。命名空间行为以本地 4.1.18 编译验证和[该版本源码](https://github.com/tailwindlabs/tailwindcss/blob/v4.1.18/packages/tailwindcss/src/utilities.ts)为准。

生成的 `springs.ts` 继续读取相同 motion 元数据。CSS 使用毫秒、JavaScript 动效使用秒的转换关系需要测试，不另建两份数值表。

### 4.2 采用 shadcn 的 CSS 动画接入方式

shadcn 当前手动安装文档明确要求安装并导入 `tw-animate-css`；其 Popover 实现通过状态选择器组合进入、退出、淡入和位移动画。Zeron 采用这两项做法。[安装文档](https://ui.shadcn.com/docs/installation/manual)、[Popover 源码](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/popover.tsx)

实施内容：

1. 根应用显式声明 `tw-animate-css` 依赖，与当前已验证的 1.4.0 版本保持一致并更新锁文件。只有 UI 子包声明依赖，不能保证根 CSS 在 pnpm 下可解析它。
2. 在根 CSS 入口导入 `tw-animate-css`，补齐 `animate-in/out`、`fade-in/out`、`zoom-in/out`、`slide-in/out` 等实际使用的工具类。
3. 保留 Zeron 的 Base UI 状态属性。例如现有 `data-open`、`data-closed` 应继续遵循组件真实输出，不机械复制 Radix 的 `data-[state=open]`。
4. 为需要语义时长的 CSS 动画明确指定对应 `duration-*`；退出使用适当的 `*-exit`。不把全部组件统一改成同一个时长。

本地 `tw-animate-css@1.4.0` 的进入动画会读取 `--tw-animation-duration`，随后回退到 `--tw-duration`，因此可以复用修复后的语义时长。专用动画时长变量若已设置，需要验证其优先级。[项目实现与用法](https://github.com/Wombosvideo/tw-animate-css)

只引入需要的动画 CSS，不附带导入整套 shadcn 主题，也不因本次修复升级整个安装器。

### 4.3 CSS 动画与 spring 的职责

| 场景 | 处理方式 |
| --- | --- |
| hover、focus、颜色和透明度反馈 | CSS transition + Zeron 时长 |
| 已使用 CSS 状态类的浮层进出场 | `tw-animate-css` + 实际状态属性 + Zeron 时长 |
| 已有 spring、布局位移、手势和 presence 管理 | 保留原有 JavaScript 动效实现 |
| 加载指示器 | 保留必要的运行状态反馈，单独处理减少动态效果偏好 |

同一元素的同一属性不同时交给 CSS 进出场动画和 JavaScript 动效控制。不要为消除诊断增加重复动画，也不要移除退出阶段所需的挂载生命周期管理。

减少动态效果模式按组件应用 `motion-reduce:duration-0`、`motion-reduce:animate-none` 或等效 JS 策略。若停止 spinner 动画，仍需有文本或可访问状态表达“正在加载”。

### 4.4 三种消费路径均需验证

| 消费路径 | 必须提供的能力 |
| --- | --- |
| 本仓库应用 | 根依赖可解析，CSS 已导入，真实页面能生成和使用动画类 |
| 仅消费 token 包 | 可获得边框与时长 token，不强制加载无关的动画 CSS |
| Registry 安装 UI 的项目 | 安装动画依赖，CSS 入口实际导入动画，主题和 utils 同步可用 |

**Registry 声明依赖不等于导入 CSS。** 当前生成器为 UI 条目声明了动画依赖，但这不能证明消费项目已经加载动画样式。

实施时先验证仓库使用的安装器是否支持通过 Registry CSS 数据可靠注入包导入。若支持，使用其标准方式；若不支持，由现有 CLI 的 CSS 安装流程增加限定范围、可重复执行的导入操作。保留宿主其他样式与配置，禁止覆盖整个 CSS 文件。

这一接入细节尚需消费项目实测才能定案，验收结果必须是“安装后真实生效”，不能只检查依赖列表或提供手动补救说明。重复安装不得重复插入 import。

## 5. 校准 lint 的语义识别

### 5.1 建立有依据的 token 词表

`@zeron/lint` 对需要适配的字号、阴影、边框宽度等名称，从权威元数据导出或生成精确词表，并用同步测试约束。避免在不同位置独立维护互相漂移的名称清单。

- 有效阴影类按阴影处理，解决当前 23 条颜色误报。
- 四种现有字号 `text-label/body/title/heading` 保持正确识别。
- `border-hairline` 识别为宽度，不作为颜色或未知类。
- `duration-*` 必须依靠真实 CSS 生成通过检查，不设置逃避编译验证的白名单。

优先使用上游公开规则配置表达精确许可；同时为各组件限制允许的类别。确需补充分类能力时，在适配层进行最小扩展并固定兼容版本，不直接依赖未公开的 collector 内部路径。

不能使用 `text-*`、`shadow-*`、`border-*` 整体放行来处理误报。测试必须同时证明合法名称通过、拼错名称失败、合法 token 的错误组件用途仍被拒绝。

### 5.2 合法状态标记

`is-active` 是表格行供 `group-[.is-active]/row` 选择器使用的状态标记，不要求自身生成 CSS。仅登记这个精确名称，附上生产者与消费者验证；不加入空 CSS 规则伪装成工具类，也不放行所有未知类。

### 5.3 项目发现

根 `components.json` 的 `aliases.ui` 当前指向不存在的 `@/components/ui`。实施时核对所有读取方后，将仓库开发元数据指向真实 UI 源码路径，并保留明确的 `@zeron/ui` 导入识别。

开发仓库的实际路径与消费项目的安装目录是两种配置。不得把仓库私有路径写进消费项目，也不创建一份复制的组件目录来消除警告。

验收必须包含组件成功发现和 Tailwind 查询成功加载；“没有 ESLint warning 诊断”不能代替检查进程输出中的发现或降级提示。

## 6. 其余颜色与字号诊断的处理

| 使用情况 | 处理决策 |
| --- | --- |
| `text-caption`，5 处 | 元信息、辅助文案迁移到现有 `text-label`，核对行高和换行 |
| `text-display`，1 处 | 图标文档页标题使用现有 `text-heading`；本次不增加没有独立设计需求的 display token |
| `text-danger-fg`，1 处 | 错误提示改为 `text-fg-danger` |
| `border-t-muted-foreground`，1 处 | spinner 前景描边改用 `border-t-fg-muted`，保留原宽度 |
| `bg-surface`，3 处 | 根据实际承载面选择现有 surface token，不新增含义模糊的 `surface` 别名 |
| `bg-border-strong` 及 hover 写法，4 处 | 表格调整列宽手柄使用现有边界 token；默认 `bg-border`，悬停按现有交互边界语义评估 `bg-input-hover` 并做可见性验收 |
| 原始 neutral/emerald/blue/lime 色板，4 处 | 状态反馈使用匹配状态的前景/表面 token；分类或头像配色使用已有分类配色 API，不根据色相猜业务状态 |

`bg-*` 有时用于绘制一条边界，`border-*` 有时用于绘制 spinner 前景。将来实现 token 通道检查时，必须允许这些有明确用途的情况，不能只根据工具类前缀判错。

### 6.1 SVG 遮罩与品牌资产

- `empty.tsx` 中 3 个白色渐变 stop 用于遮罩，是图形透明度计算的一部分。保持白色常量；替换为随主题变化的前景色可能破坏深色模式下的遮罩。
- `model-detail-02` 的 `OmpLogo` 包含 4 处品牌颜色。作为品牌图形保留，可整理为随 block 分发的私有图标资产，不扩充全局 UI 色板。
- 对这两类使用最小范围的规则例外，并写明用途。SVG 属性例外与类名 allow 配置不同，不能假定添加类名词表会处理 SVG。
- 优先为具体属性使用带原因的局部规则抑制；只有整理成真实资产有复用或分发价值时再拆文件。避免关闭整个业务文件的颜色检查。

## 7. `no-restyle` 组件契约治理

1,208 条报告需要先经过契约校准。`className` 可传入不意味着允许覆盖所有状态；同样，使用了公共样式槽位也不应一律被认定违规。

| 组件族 | 使用方可以负责 | 组件/API 应负责 |
| --- | --- | --- |
| Button、Input、InputGroup、SelectTrigger | 外部位置、合理宽度、容器布局 | 高度、内部 padding、状态色、焦点反馈；Select 尺寸在父级配置 |
| TableHead、TableCell | 列宽、对齐、截断、数字排版和适当的文字语义 | 默认行密度、选中/悬停状态、固定列的承载面一致性 |
| Card、MetricCard | 业务内容、公开槽位和已有外观 API | 默认表面、边界、阴影及交互状态；必要的重复外观需求再提炼共享变体 |
| AppShell、PageLayout、页面列布局 | 内容区布局和组合 | 外框尺寸、gutter、滚动归属等已有公开契约 |
| Sidebar 各槽位 | header/content/footer 的合理内容布局 | 导航触发器的交互、焦点和密度一致性 |
| 标题、描述、内容槽位 | 合理排版与内容间距 | 对应角色的基础语义与可访问结构 |

实施步骤：

1. 查看真实组件、现有文档和高频调用点，确认哪些是已有公开能力。
2. 区分根 `className` 与 `contentClassName`、`surfaceClassName` 等槽位，避免将所有覆盖都归属到根组件。
3. 可以由现有 props 表达的迁移到 props；重复出现且确有设计意义的缺口才新增共享 API。
4. 合理的内容布局定制修改契约；真实破坏控件或状态的覆盖修改业务代码。
5. 每项契约加入通过/失败对照用例，包括导入别名、包装组件和可静态追踪的类值。

若上游公开配置无法表达必要的槽位差异，再实现小范围的 Zeron 专用检查；不得为了适配一个槽位而全目录关闭规则。也不为每条报告创造一个新 variant 或一次性包装组件。

优先抽样 TableCell（102 条）、Card（77 条）、MetricCard（71 条）、TableHead（52 条）、Button（46 条），验证规则调整后再推广。最重的个人设置页和 agent trace 页面作为回归样本，不直接对 1,208 条诊断执行批量删样式。

## 8. 剩余 52 条 arbitrary 诊断

| 用途 | 处理原则 |
| --- | --- |
| 能由现有间距、字号、圆角尺度准确表达 | 迁移到现有工具类，验证 computed style 和排版 |
| 普通辅助文字中的自定义小字号 | 优先统一为语义字号；图形内部标签按可读性与图形用途单独判断 |
| 大数字指标的特殊字号、行高与字距 | 保留有意设计的比例，收敛到 block 私有配方并登记精确例外；只有跨组件复用成立时才升为公共 token |
| 安全区域、运行时测量、动态计算 | 保留必要表达，限制允许范围并验证变量存在与回退值 |
| 图形、装饰渐变和品牌绘制 | 使用局部配方或资产例外，避免污染全局设计尺度 |
| 无法证明必要性的零散覆盖 | 用现有 API/尺度替代，并进行视觉回归 |

例如 credit usage 大数字中的 52/56px 字号、特殊行高与字距，先作为该 block 的展示配方管理，不直接替换成近似数字字号导致视觉变化。不能为每个 arbitrary 值都新增 token，也不能把合法的计算表达式全部删除。

现有 arbitrary 规则允许部分布局类别，且核心实现有例外。因此本轮 52 条只是当前报告范围，不应声称已检查所有布局计算和实现内部的任意值。

## 9. 需要修改的文件与产物

以下范围已按本方案完成实施。

| 文件或范围 | 计划变更 |
| --- | --- |
| `packages/ui/src/tokens/semantic-tokens.mjs` | hairline 元数据与聚合导出，保留现有 motion 数值 |
| `scripts/generate-semantic-tokens.mjs` | 边框生成、时长主题命名修复、同步 Registry/包/文档 |
| `packages/tokens/index.d.ts` | 新增边框宽度导出和 `semanticTokens.borderWidths` 类型 |
| `packages/ui/src/system/utils.ts` | 边框宽度、语义时长的合并分组 |
| `app/globals.css` | CSS 动画导入；生成区只通过生成器更新 |
| 根 `package.json`、`pnpm-lock.yaml` | 根应用动画依赖 |
| `components.json` | 核实并修正仓库开发发现路径 |
| `packages/lint/index.mjs`、README | token 适配、组件契约、精确例外与能力说明 |
| `eslint.design.config.mjs` | 经验证的范围配置，保持默认代码检查有效 |
| `packages/ui/src`、`packages/blocks/src`、`app`、`docs/pages` | 分批迁移实际使用点 |
| `tests/design-lint.test.mjs` | 分类、契约、状态标记及正反用例 |
| `tests/semantic-tokens.test.mjs` | token 同步与真实 Tailwind CSS 生成验证 |
| `tests/color-token-consumers.test.mjs` | 更新依赖旧写法的断言，保留语义保护 |
| utils 测试（新增或放入现有测试） | 宽度/颜色共存、方向覆盖和时长冲突 |
| Registry 与消费安装测试 | CSS 导入、依赖、重复安装、安装后工具类可用 |
| `.agents/skills/zeron-page-builder` | 在现有验证流程补充新 token、动效和迁移指导 |
| `.github/workflows/ci.yml` | 按治理进度接入设计检查门禁 |

生成产物包括 `packages/tokens/tokens.css`、`packages/tokens/index.mjs`、根 CSS 的生成区、`packages/ui/registry.json`、`packages/ui/src/system/springs.ts`、`SEMANTIC-TOKENS.md`，以及 Registry 构建出的 `public/r`。以生成器为源修改，按现有 Git 跟踪策略提交，不手改生成结果绕过检查。

## 10. 实施批次与退出条件

### P0：让 token 和 CSS 真正可用

- 实施 hairline、时长命名修复、动画 CSS 接入、类名合并适配。
- 同步生成产物与类型，完成 Registry 消费路径验证。
- 补充真实编译和合并测试；校准精确 token 分类。
- 退出条件：新类可生成、可合并、可分发；不通过白名单掩盖缺失 CSS。

### P1：治理核心组件与代表性页面

- 修复 UI 层未定义名称，保留遮罩/品牌合理例外。
- 迁移 hairline 使用点，审查高频组件契约。
- 选择表格、卡片、Sidebar、浮层各一个代表页面完整验证，再推广契约。
- 退出条件：代表页面设计检查通过，关键外观与交互不退化；例外均有明确原因。

### P2：推广到 blocks、应用与文档

- 按组件族迁移其余 blocks，再覆盖 app 与 docs。
- 优先处理个人设置、agent trace、集群环境、ZLR 等报告集中的页面。
- 文档的实际运行示例遵循同一规范；明确的错误示例仅在其最小 fixture 范围例外。
- 退出条件：扫描范围中的真实违规全部解决，剩余合法情况已由契约或精确例外表达。

### P3：设置 CI 门禁并完善 builder 流程

- 迁移过程中持续输出完整报告，对已治理目录启用严格门禁。
- 新增或修改文件不得用历史基线豁免新增违规；修改公共 token/契约时扫描全部受影响调用方。
- 全量治理完成后，将 `pnpm lint:design` 纳入默认 CI，保留原 `pnpm lint`。
- 退出条件：全量设计检查通过、无检查器降级，消费安装与关键浏览器场景通过。

基线只用于展示迁移进度，不把“诊断数没有增长”作为最终质量标准。某条旧错误消失不能抵消另一条新错误。

## 11. 与 zeron-page-builder skill 的配合

项目内 builder skill 已接入设计 lint 的验证步骤，后续在这个流程中补充约束：

1. 构建前读取真实组件 API 和 token，细边界使用 `border-hairline`，动效使用既有语义时长。
2. 生成或修改页面后，对变更文件运行设计检查。
3. 根据反馈区分代码错误、契约不足与必要例外：优先修代码；改契约必须说明公共依据并补充正反测试。
4. 涉及 token、utils 或组件公共契约时，扩大到受影响范围，不能只验证新页面。
5. lint 通过后验证运行时交互与页面表现，尤其是滚动、浮层、焦点和响应式布局。

lint 提供确定性的静态反馈，builder 负责根据语义和真实 API 修改代码。skill 不得把建议的最近颜色自动视为正确业务颜色，也不得为让自己生成的代码通过而降低规则。

本次后续更新针对仓库内 `.agents/skills/zeron-page-builder`，不自动同步或覆盖用户全局 skill。

## 12. 验证与验收标准

| 验证层 | 必须证明 |
| --- | --- |
| 元数据与生成 | 单一来源，生成幂等，类型/JS/CSS/Registry 一致 |
| Tailwind 编译 | hairline 全部方向、六种时长、实际动画状态类生成有效 CSS；错误拼写仍失败 |
| 类名合并 | 边框宽度不吞颜色，同类覆盖遵循顺序，变体和方向行为正确 |
| lint | 合法 token 通过；未定义类、原始色板和违反组件契约的写法失败 |
| 组件行为 | 控件尺寸、焦点、固定列、选中/悬停状态、滚动归属保持正确 |
| 动画行为 | 打开、关闭、快速反复切换、退出卸载和减少动态效果均正确 |
| 视觉 | 代表页面浅/深色、窄/宽屏、DPR 1/2；半像素边界及指标排版不退化 |
| 消费项目 | Next/Vite、npm/pnpm 安装可用；CSS 实际加载，重复安装无重复导入 |

仓库当前 Tailwind 为 4.1.18，现有消费安装脚本使用 4.3.3。两条路径都需验证，不能只依据最新版文档推断旧版行为。消费样例至少包含 hairline 组件和一个实际使用进出场 CSS 类的组件。

建议执行顺序：

```sh
pnpm tokens:build
pnpm tokens:check
pnpm exec vitest run tests/design-lint.test.mjs tests/semantic-tokens.test.mjs tests/color-token-consumers.test.mjs
pnpm lint
pnpm lint:design
pnpm --filter @zeron/ui typecheck
pnpm --filter @zeron/blocks typecheck
pnpm registry:build
pnpm registry:check
pnpm test:consumer:smoke
pnpm build
```

新增的 utils 测试需一并运行；涉及 CLI 安装流程时执行 CLI 测试；涉及焦点时执行现有 focus E2E。最终按项目 CI 完成完整测试，浏览器场景单独记录结果。迁移阶段全量设计检查仍可能失败，应报告剩余范围，不将预期失败写成“全部通过”。

## 13. 风险控制与交付完成定义

主要风险是主题已生成但消费端未加载、合并器丢失样式、宽泛契约误伤业务布局，以及退出动画和减少动态效果行为发生变化。分别用消费安装、合并单测、代表页面回归和状态切换测试验证。

按基础设施、契约、使用点迁移分成可评审变更。相互依赖的 token 与消费者需要一起验证；如需回退，应成组恢复源数据、生成产物和使用点，不留下只存在于某个入口的类名。已有底层 motion 变量保留，避免无必要地破坏外部消费者。

最终完成条件：

- [x] `hairline` 已成为可消费、可分发、可合并的正式 token。
- [x] 六种 `duration-*` 使用正确映射，数值继续来自现有 motion 数据。
- [x] CSS 进出场动画在仓库和安装后的项目均实际生效。
- [x] 未定义名称已迁移；阴影误报已修复；SVG、状态标记等例外有明确范围。
- [x] 组件契约符合真实 API，全部纳入治理范围的设计诊断已解决。
- [x] 真实编译、类名合并、单元测试、安装测试和关键浏览器回归通过。
- [x] builder 使用相同规范，全量设计检查进入 CI，检查器无发现/编译降级。

达到以上条件后，再单独评估发布 lint 包、扩展 token 用途检查和更严格动态样式规则。本轮不把这些后续能力作为修复现有问题的前置条件。

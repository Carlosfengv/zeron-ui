# shadcn lint 原理分析与 Zeron 初版

## 结论

可以实现。当前最合适的路线是 **复用 `@shadcn/lint` 的分析引擎，维护 Zeron 的规则配置，再逐步补充 Zeron 特有的语义检查**。

本次已完成私有 workspace 包 `packages/lint`、独立检查配置 `eslint.design.config.mjs` 和 `pnpm lint:design`。它复用上游引擎，没有重写引擎，也没有发布 npm 包。后续治理已将全量设计诊断降至 0，并把新命令接入默认 CI；完整实施结果见[治理方案](./zeron-design-lint-remediation-plan.md)。

研究日期：2026-09-15。上游源码版本：[`53de86f`](https://github.com/shadcn-ui/lint/tree/53de86f0e7dcc341a9cb45c383a9f2c454d1e958)。实测 npm 版本：`@shadcn/lint@0.1.0`。

## 1. 它是什么

这是面向 Tailwind v4 设计系统的 ESLint / Oxlint 插件。“Agent-first”指错误信息能指导编码 Agent 修正设计系统用法，并不表示 lint 内部调用大模型。

它把“不要随意改变 Button 的外观”变成机器可检查的约定。例如页面可以给 Button 加外边距，但内部 padding 应交给 `size` 属性。错误可以携带组件名、变体列表、尺寸选项、定义文件和项目自己的说明。

运行过程不需要打开页面，也不要求使用 shadcn/ui 组件。上游采用 MIT 许可证；当前包需要 Node.js >=20.19，ESLint >=9.30；Oxlint 入口需要 >=1.80，相关 JS 插件 API 仍有实验性限制。Zeron 本次仅验证 ESLint 适配。

参考：[项目说明](https://github.com/shadcn-ui/lint)、[公开 API](https://github.com/shadcn-ui/lint/blob/53de86f0e7dcc341a9cb45c383a9f2c454d1e958/docs/api.md)。

## 2. 工作原理

```text
JS/TS/JSX/TSX 源码 + components.json + Tailwind CSS 主题
                         ↓
ESLint 提供语法树，插件发现项目、组件来源和主题
                         ↓
收集 className、cn/clsx/cva、可读取的变量、style 等用法
                         ↓
拆解 Tailwind 类名，识别类别，匹配组件契约
                         ↓
查询主题 token / 组件变体 / Tailwind 是否能生成该类
                         ↓
输出文件位置、违规原因、允许的 API 和编辑器修改建议
                         ↓
开发者或 Agent 修改代码并重新运行 lint
```

### 项目与组件发现

`project/*` 读取 `components.json`、TypeScript 路径、package imports / exports，追踪组件导入、别名和重导出。包装组件转发 `className` 时，上游能追踪到其底层组件契约。单纯同名的其他组件不应被当作 Zeron Button。

### 样式收集

`sites/collect.ts` 收集 JSX 类属性、已知合并函数与变体函数、可读取的对象展开等。对同文件变量进行有限的一跳分析；它不是完整的 JavaScript 执行器，也不会追踪所有跨文件运行时数据。

### 类名分类与契约

`grammar/classifier.ts` 使用 `cn/config` 的类分组，将工具类区分为颜色、字体、间距、形状、效果、动画和布局。这里的 `cn` 是上游依赖的 npm 包，不要求 Zeron 更换现有 `cn()` 工具函数。

`rules/contracts.ts` 应用 `allow`、`deny`、组件名正则和消息模板。规则可按组件细分，例如内容容器允许 padding、标题允许排版，但控件由自身 API 管理高度。

### 主题与真实 Tailwind 查询

`project/theme.ts` 读取 `@theme` 和 CSS 导入链，发现 token 名称，尝试解析颜色、字号、圆角等值。

`tailwind/oracle.ts` 调用项目安装的 Tailwind `__unstable__loadDesignSystem()`，通过 `candidatesToCss()` 验证候选类能否生成 CSS。因为 ESLint 规则同步运行，而 Tailwind 加载异步，上游通过 worker thread、消息端口和同步等待衔接两者，并缓存主题和查询结果。加载失败会警告并降级到内置语法，降级后的检查覆盖更弱。

### 建议而非自动设计决策

颜色建议利用可解析颜色的 OKLab 距离；尺寸建议使用主题刻度。源码使用 ESLint 的编辑器 suggestions；不能把“有建议”理解为 `eslint --fix` 会自动完成设计修正。颜色看起来接近，也不意味着语义正确。

参考：[实现机制与边界](https://github.com/shadcn-ui/lint/blob/53de86f0e7dcc341a9cb45c383a9f2c454d1e958/docs/how-it-works.md)、[Tailwind 查询实现](https://github.com/shadcn-ui/lint/blob/53de86f0e7dcc341a9cb45c383a9f2c454d1e958/packages/lint/src/tailwind/oracle.ts)。

## 3. 能做什么

| 规则 | 能检查的情况 | 重要边界 |
| --- | --- | --- |
| `no-restyle` | 给组件添加未经允许的颜色、padding、圆角等 | 不会追踪父元素选择器最终改写了哪个子组件 |
| `no-raw-colors` | 原始 Tailwind 色板、未声明的颜色 token、部分 SVG 原始颜色 | 默认允许 white / black；`bg-[#fff]` 属于 arbitrary 检查；不验证颜色用途 |
| `no-arbitrary-values` | `p-[13px]`、`rounded-[10px]` 等 | `allow: ["layout"]` 会允许任意布局值；CSS 变量引用不等于已验证变量存在 |
| `no-inline-styles` | 普通内联样式、无法读取的 style 对象、style 标签 | 动态 CSS 自定义属性有允许路径；动画和测量场景需精确例外 |
| `no-unknown-classes` | 无法由当前 Tailwind 生成的类，如 `hovr:flex` | 需配合颜色规则；外部 CSS、加载降级和部分特殊类存在边界 |
| `require-static-classes` | 组件上无法静态读取的 class 值 | 不能证明所有 props 展开、导入值和运行时路径都已检查 |

它不能判断页面是否好看、布局是否忠于设计图、运行时是否出现嵌套滚动、portal 是否被遮挡，也不能代替无障碍与浏览器测试。它能约束可静态表达的设计系统用法。

参考：[规则选项](https://github.com/shadcn-ui/lint/blob/53de86f0e7dcc341a9cb45c383a9f2c454d1e958/docs/rules.md)。

## 4. Zeron 实测发现

### 直接兼容的部分

- 当前仓库使用 Tailwind v4、ESLint 9、React 和 CVA，基本条件匹配。
- 能通过 `@zeron/ui/button` 找到 Button，并识别其六个 `variant`。
- 能读取 `app/globals.css` 的 82 个颜色 token。
- `h-control-md` 和 `text-body` 可由实际 Tailwind 生成 CSS。
- 能检查响应式类、导入别名、`cn()` 中的静态值；测试覆盖了这些路径。

### 必须适配的部分

1. **控件高度。** 上游 `allow: ["layout"]` 默认允许 `h-20`。Zeron 初版为 Button、Input、InputGroup 和 SelectTrigger 增加高度类分组限制。SelectTrigger 的 `size` 实际在父级 Select 上，提示必须指向正确 API。
2. **间接定义的 size。** Zeron Button/Input 的 CVA size 引用了单独的 map；上游 0.1.0 只读取该位置的对象字面量，漏掉尺寸轴。初版明确列出 xs/sm/md/lg/xl，并用测试对齐源尺寸表。
3. **语义字号。** 内置分类器将 `text-label/body/title/heading` 误判为颜色。初版在颜色规则中加入四个精确例外，在标题契约中允许它们。不能放开全部 `text-*`，否则会漏掉实际颜色问题。
4. **light-dark。** 当前颜色解析不支持 `light-dark()`，因此多数 Zeron token 可验证名称，但无法给出可靠的最近颜色建议。应优先使用 token 的语义分类和 usage 文案。
5. **导入位置。** 根 `components.json` 的 `@/components/ui` 不存在，上游仍会输出发现警告。显式 `componentImports` 已让实测 `@zeron/ui` 路径有效；未来应独立整理安装器元数据与仓库开发路径。
6. **分层例外。** 核心组件允许实现内部样式，仍检查颜色和未知类。ColorPicker、Badge 私有调色板有明确例外。页面层保留内容布局空间，严格模式下再检查动态 class/style。

### 原有检查的两个问题已修正

- 原来的 `primary` 后使用单词边界，会误伤合法的 `bg-primary-action` / `bg-secondary-action`；已避免把 token 前缀当成完整 token。
- 核心组件的 `no-restricted-syntax` 数组会覆盖此前的保留 token 和 focus 规则；已显式保留两组检查。

## 5. 当前扫描基线

对 app、docs/pages、packages/ui/src、packages/blocks/src 的 477 个文件进行扫描，去除上述字号误报后，共报告 1,491 条设计检查错误，涉及 140 个文件：

| 规则 | 报告数 |
| --- | ---: |
| `no-restyle` | 1,208 |
| `no-raw-colors` | 49 |
| `no-unknown-classes` | 135 |
| `no-arbitrary-values` | 99 |

这是 **候选问题和契约调整工作的基线，不是 1,491 个已确认 UI bug**。目前宽泛的组件外观保护会报告合理的业务定制、文档演示和确实应迁移到公共 API 的写法，需要逐项判断。不要为了清空数字而全局豁免。

一个值得优先处理的实际发现：`duration-fast`、`duration-moderate` 在当前 Tailwind 主题查询中返回 null。绕过 lint，直接调用项目 Tailwind 也复现了同样结果；对照的 `h-control-md`、`text-body` 返回有效 CSS。这提示 motion token 到 CSS utility 的映射值得单独修复。未在本任务中改动动画实现。

复现扫描：

```sh
pnpm lint:design
```

新命令当前以错误状态退出，符合迁移检查预期。原有 `pnpm lint` 通过。新增 12 项 lint 测试与已有 20 项语义颜色消费测试合计 32 项通过。本次没有把所有页面迁移到新规则，也没有验证整个站点的视觉表现。

## 6. 后续怎样成为完整的 Zeron lint

### 第一阶段：审查与收敛现有契约

已具备可运行入口。先修复真正无法生成 CSS 的类，再按 Button/Input、布局、导航、数据展示等组件族审查 `no-restyle`。对文档代码示例和产品页面分别配置，保留必要的局部例外与原因。收敛后按目录加入 CI 门禁。

### 第二阶段：补充 Zeron 语义规则

| 拟新增规则 | 示例 | 判断依据 |
| --- | --- | --- |
| `token-channel` | `text-primary-action` 应改用适当 `fg-*` | semantic-tokens.mjs 的 foreground/fill/boundary 分类；先明确 SVG 和特殊槽位例外 |
| `focus-token` | 焦点 ring / outline 绕开 `focus-ring` | 区分焦点指示器、错误状态边框、ring 宽度和 ring 颜色 |
| `prefer-component-api` | 控件改高度、PageLayout 改外边距、PageColumns 手写列宽 | 组件真实 API；包括 arbitrary property 和别名等漏检路径 |
| `surface-role` | 使用点覆盖 Container / overlay 的承载面与阴影 | surface context 与组件公开属性；不能只靠颜色前缀 |
| `layout-children` | DOM wrapper 破坏 PageLayout/PageColumns 的直接子元素 slot | JSX 可证明的静态路径；Fragment 不产生 DOM，未知包装组件需谨慎 |
| `public-imports` | 页面依赖组件内部文件和私有 token | workspace exports 与 Registry 安装后的公开入口 |

token-channel 的核心价值是检查“token 存在但用错用途”。上游原有规则主要检查是否使用了主题中的 token，不知道 Zeron 前景、填充、边界的语义区别。

规则应从 Zeron token / recipe 元数据生成建议；不要靠颜色距离猜业务意图。新增 JSX 规则需要有可测试的导入解析和样式收集层；上游 collector 目前不是公开 API，不建议 deep import。

### 第三阶段：消费项目与分发

稳定后再将私有适配包转为发布包，补类型声明、版本兼容范围、消费项目 fixtures 和安装文档。CLI 可增加生成 lint 配置的能力；不要在安装组件时自动覆写整个宿主 ESLint 配置。使用标准 ESLint JSON 已能支持 Agent 与 CI，初期无须另建检查协议。

## 7. 相关文件

- `packages/lint/index.mjs`：规则配置工厂与 Zeron 契约。
- `packages/lint/README.md`：使用方式、例外和已知限制。
- `eslint.design.config.mjs`：仓库扫描范围与组件实现例外。
- `tests/design-lint.test.mjs`：兼容性、正反用例和旧规则回归验证。
- `eslint.config.mjs`：原有保留 token / focus 检查的修正。

初版的定位是将设计约定变成可执行反馈，并通过真实扫描完善契约；完成迁移后，再将其变成稳定的质量门禁。

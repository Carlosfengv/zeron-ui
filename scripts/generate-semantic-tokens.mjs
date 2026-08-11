import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  colorTokens,
  foregroundColorTokens,
  fillColorTokens,
  boundaryColorTokens,
  interactionColorTokens,
  supportColorTokens,
  surfaceTokens,
  shadowSupportTokens,
  shadowTokens,
  typographyTokens,
  motionDurationTokens,
  fontTokens,
  controlHeightTokens,
  radiusRoles,
  shapeModes,
  layerTokens,
} from "../src/system/tokens/semantic-tokens.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const GLOBALS_PATH = `${ROOT}/app/globals.css`;
const REGISTRY_PATH = `${ROOT}/registry.json`;
const RUNTIME_PATH = `${ROOT}/src/system/design-tokens.ts`;
const DOC_PATH = `${ROOT}/SEMANTIC-TOKENS.md`;
const START = "/* BEGIN GENERATED SEMANTIC TOKENS — DO NOT EDIT */";
const END = "/* END GENERATED SEMANTIC TOKENS */";

const indentLines = (value, spaces = 2) =>
  value.split("\n").map((line) => `${" ".repeat(spaces)}${line}`).join("\n");

const cssDeclaration = (name, value) => `--${name}: ${value};`;

export function registryCssVars() {
  const theme = {
    "font-sans": "var(--font-family-sans)",
  };
  const light = {
    "font-family-sans": fontTokens.family,
  };
  const dark = {
    "font-family-sans": fontTokens.family,
  };

  for (const token of colorTokens) {
    theme[`color-${token.name}`] = `var(--${token.name})`;
    light[token.name] = token.light;
    dark[token.name] = token.dark;
  }
  for (const token of supportColorTokens) {
    theme[`color-${token.name}`] = `var(--${token.name})`;
    light[token.name] = token.light;
    dark[token.name] = token.dark;
  }

  for (const token of surfaceTokens) {
    theme[`color-surface-${token.name}`] = `var(--surface-${token.name})`;
    light[`surface-${token.name}`] = token.light;
    dark[`surface-${token.name}`] = token.dark;
  }
  Object.assign(light, shadowSupportTokens);
  Object.assign(dark, shadowSupportTokens);
  for (const token of shadowTokens) {
    theme[`shadow-${token.name}`] = `var(--shadow-${token.name})`;
    light[`shadow-${token.name}`] = token.light;
    dark[`shadow-${token.name}`] = token.dark;
  }

  for (const token of typographyTokens) {
    theme[`text-${token.name}`] = `var(--font-size-${token.name})`;
    theme[`text-${token.name}--line-height`] = `var(--line-height-${token.name})`;
    for (const target of [light, dark]) {
      target[`font-size-${token.name}`] = token.size;
      target[`line-height-${token.name}`] = token.lineHeight;
    }
  }
  for (const token of motionDurationTokens) {
    theme[`duration-${token.name}`] = `var(--motion-duration-${token.name})`;
    light[`motion-duration-${token.name}`] = token.value;
    dark[`motion-duration-${token.name}`] = token.value;
  }
  for (const token of controlHeightTokens) {
    theme[`spacing-control-${token.name}`] = `var(--control-height-${token.name})`;
    light[`control-height-${token.name}`] = token.value;
    dark[`control-height-${token.name}`] = token.value;
  }

  for (const role of radiusRoles) {
    theme[`radius-${role.name}`] = `var(--${role.name}-radius)`;
    light[`${role.name}-radius`] = `${shapeModes.rounded[role.name]}px`;
    dark[`${role.name}-radius`] = `${shapeModes.rounded[role.name]}px`;
  }
  for (const token of layerTokens) {
    light[`layer-${token.name}`] = String(token.value);
    dark[`layer-${token.name}`] = String(token.value);
  }

  return { theme, light, dark };
}

export function registryCssRules() {
  return Object.fromEntries(
    layerTokens.map((token) => [`.z-${token.name}`, { "z-index": `var(--layer-${token.name})` }])
  );
}

function renderThemeDeclarations() {
  const vars = registryCssVars().theme;
  return Object.entries(vars).map(([name, value]) => cssDeclaration(name, value)).join("\n");
}

function renderRootDeclarations() {
  const lines = [];
  for (const token of surfaceTokens) {
    lines.push(cssDeclaration(`surface-${token.name}`, `light-dark(${token.light}, ${token.dark})`));
  }
  for (const token of colorTokens) {
    lines.push(cssDeclaration(
      token.name,
      token.light === token.dark ? token.light : `light-dark(${token.light}, ${token.dark})`
    ));
  }
  for (const token of supportColorTokens) {
    lines.push(cssDeclaration(
      token.name,
      token.light === token.dark ? token.light : `light-dark(${token.light}, ${token.dark})`
    ));
  }
  for (const [name, value] of Object.entries(shadowSupportTokens)) {
    lines.push(cssDeclaration(name, value));
  }
  for (const token of shadowTokens) {
    lines.push(cssDeclaration(`shadow-light-${token.name}`, token.light));
    lines.push(cssDeclaration(`shadow-dark-${token.name}`, token.dark));
    lines.push(cssDeclaration(`shadow-${token.name}`, `var(--shadow-light-${token.name})`));
  }

  lines.push(cssDeclaration("font-family-sans", fontTokens.family));
  for (const token of typographyTokens) {
    lines.push(cssDeclaration(`font-size-${token.name}`, token.size));
    lines.push(cssDeclaration(`line-height-${token.name}`, token.lineHeight));
  }
  for (const token of motionDurationTokens) lines.push(cssDeclaration(`motion-duration-${token.name}`, token.value));
  for (const token of controlHeightTokens) lines.push(cssDeclaration(`control-height-${token.name}`, token.value));
  for (const role of radiusRoles) {
    lines.push(cssDeclaration(`${role.name}-radius`, `${shapeModes.rounded[role.name]}px`));
  }
  for (const token of layerTokens) lines.push(cssDeclaration(`layer-${token.name}`, token.value));
  return lines.join("\n");
}

function renderModeSelection(mode) {
  return [
    ...shadowTokens.map((token) =>
      cssDeclaration(`shadow-${token.name}`, `var(--shadow-${mode}-${token.name})`)
    ),
  ].join("\n");
}

export function renderGlobalsBlock() {
  const layerClasses = layerTokens
    .map((token) => `.z-${token.name} { z-index: var(--layer-${token.name}); }`)
    .join("\n");
  return `${START}
/* Generated from src/system/tokens/semantic-tokens.mjs by scripts/generate-semantic-tokens.mjs. */

@custom-variant dark (&:is(.dark *));

@font-face {
  font-family: "Inter";
  src: url("/fonts/InterVariable.ttf") format("truetype");
  font-weight: 100 900;
  font-display: swap;
}

:root { color-scheme: light dark; }

:root,
.light,
.dark {
${indentLines(renderRootDeclarations())}
}

@media (prefers-color-scheme: dark) {
  :root:not(.light) {
${indentLines(renderModeSelection("dark"), 4)}
  }
}

.light {
  color-scheme: light;
${indentLines(renderModeSelection("light"))}
}

.dark {
  color-scheme: dark;
${indentLines(renderModeSelection("dark"))}
}

@theme inline {
${indentLines(renderThemeDeclarations())}

  /* Reserved for the canonical-shadcn comparison page only. */
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
}

@layer utilities {
${indentLines(layerClasses)}
}
${END}`;
}

export function renderRuntimeTokens() {
  const classes = Object.fromEntries(
    Object.entries(shapeModes).map(([mode, values]) => [
      mode,
      Object.fromEntries(
        Object.entries(values).map(([role, value]) => [role, `rounded-[${value}px]`])
      ),
    ])
  );
  return `// Generated from src/system/tokens/semantic-tokens.mjs. Do not edit directly.\n\nexport const shapeTokenValues = ${JSON.stringify(shapeModes, null, 2)} as const;\n\nexport const shapeTokenClasses = ${JSON.stringify(classes, null, 2)} as const;\n\nexport type GeneratedShapeVariant = keyof typeof shapeTokenValues;\n`;
}

const table = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.join(" | ")} |`),
].join("\n");

export function renderDocumentation() {
  const tokenRows = (tokens) => tokens.map((t) => [
    `\`--${t.name}\``, `\`${t.light}\``, `\`${t.dark}\``, t.usage,
  ]);
  const foregroundRows = tokenRows(foregroundColorTokens);
  const fillRows = tokenRows(fillColorTokens);
  const boundaryRows = tokenRows(boundaryColorTokens);
  const interactionRows = tokenRows(interactionColorTokens);
  const supportRows = tokenRows(supportColorTokens);
  const surfaceRows = surfaceTokens.map((t) => [
    `\`--surface-${t.name}\``, `\`bg-surface-${t.name}\``, `\`${t.light}\``, `\`${t.dark}\``, t.usage,
  ]);
  const typeRows = typographyTokens.map((t) => [
    `\`text-${t.name}\``, `\`--font-size-${t.name}\``, `${t.px}px / ${t.linePx}px`, t.usage,
  ]);
  const motionRows = motionDurationTokens.map((t) => [
    `\`--motion-duration-${t.name}\``, `\`duration-${t.name}\``, t.value, t.usage,
  ]);
  const controlRows = controlHeightTokens.map((t) => [
    `\`--control-height-${t.name}\``, `\`h-control-${t.name}\``, `${t.px}px`, t.usage,
  ]);
  const radiusRows = radiusRoles.map((t) => [
    `\`--${t.name}-radius\``, `\`rounded-${t.name}\``, `${shapeModes.rounded[t.name]}px`, `${shapeModes.pill[t.name]}px`, t.usage,
  ]);
  const shadowRows = shadowTokens.map((t) => [
    `\`--shadow-${t.name}\``, `\`shadow-${t.name}\``, t.usage,
  ]);
  const layerRows = layerTokens.map((t) => [
    `\`--layer-${t.name}\``, `\`z-${t.name}\``, String(t.value), t.usage,
  ]);

  return `# Zeron Design 语义设计令牌（Semantic Tokens）

> 本文档由 \`src/system/tokens/semantic-tokens.mjs\` 自动生成。请勿直接修改本文档、\`app/globals.css\` 的生成区块或 \`registry.json\` 的主题数据。

## 阅读约定

- 本文使用“设计令牌”指代 Design Token，使用“承载面”指代 Surface。
- CSS 变量、Tailwind 类名和组件 API 均保留英文原名，便于设计与研发逐项对照。
- 浅色与深色模式分别对应表格中的 \`Light\` 与 \`Dark\`；数值是实现基准，语义角色才是组件选择令牌的依据。

## 设计原则

1. 组件只引用语义角色，不直接引用品牌色值或孤立的像素值。
2. CSS 变量是运行时主题 API；Tailwind 类是组件实现 API。
3. 浅色与深色模式只改变设计令牌的值，不改变组件结构。
4. 需要增加新的视觉角色时，应新增设计令牌；不要为了复用某个数值而误用已有角色。
5. \`surfaces\` 保留为组件注册表的主题安装名；其内容已覆盖完整的语义设计令牌，以兼容现有安装地址。
6. 颜色设计令牌必须提供明确的浅色与深色绝对值；不要在 CSS 运行时混合语义颜色。

## Reference 与 Semantic

\`src/system/tokens/reference-colors.mjs\` 是内部参考调色板：它只提供中性色、Danger 和 Warning 的可复用色阶，
不生成 CSS 变量、Tailwind 颜色或组件 API。组件只能消费本文件列出的语义角色，例如
\`text-fg-danger\`、\`bg-danger-surface\` 和 \`border-danger-border\`，不能引用 \`neutral.500\`、
\`danger.500\` 等参考色阶。这样可以在不改变组件含义的前提下调整具体配方。

## 修改与生成

\`\`\`bash
# 1. 修改唯一源
src/system/tokens/semantic-tokens.mjs

# 2. 生成 CSS、组件注册表、运行时圆角数据和本文档
npm run tokens:build

# 3. 生成可安装的 public/r 产物
npm run registry:build

# 4. 验证没有漂移
npm run tokens:check
\`\`\`

## 前景颜色

${table(["CSS 令牌", "浅色", "深色", "用途"], foregroundRows)}

- \`fg-default / muted / subtle\` 表达前景的强调程度，不由字号决定。
- \`fg-brand / fg-danger\` 用于普通承载面上的彩色文字和图标，不能直接复用填充色。
- \`fg-on-*\` 中的 \`on\` 表示背景配对关系，只能与名称对应的高强调填充共同使用。
- 完整控件禁用时使用组件级 \`opacity-50\`。

\`fg\` 是 Foreground（前景）的缩写，同时覆盖文字和继承 \`currentColor\` 的图标。\`fg-brand\` 表示
“普通承载面上的品牌色前景”，\`fg-on-brand\` 表示“品牌色填充上的对比前景”；两者不能互换。
设计端使用 \`color/fg/default\`、\`color/fg/on/brand\` 路径，研发端对应
\`--fg-default\`、\`--fg-on-brand\` 和 \`text-fg-*\` Tailwind 类。

浅色与深色模式下的 Default、Muted、Subtle 均须在五级承载面上达到普通文字 4.5:1 的最低对比度。

## 填充颜色

${table(["CSS 令牌", "浅色", "深色", "用途"], fillRows)}

合法的高对比填充配对：

\`\`\`text
brand              + fg-on-brand
destructive        + fg-on-danger
secondary-action   + fg-default
inverse-background + fg-on-inverse
\`\`\`

状态信息不使用高强调“Warning 操作”填充：错误状态组合 \`danger-surface + fg-danger + danger-border\`；
警告状态组合 \`warning-surface + fg-warning + warning-border\`。

\`brand\` 与 \`focus-ring\` 是两个独立语义。运行时修改品牌色不得同时修改焦点环。
自定义品牌色时，必须以完整配色包的方式覆盖 \`brand / brand-hover / brand-active / fg-on-brand / fg-brand\`；
运行时派生结果也必须写入绝对十六进制颜色，不依赖浏览器混色。

## 边界颜色

${table(["CSS 令牌", "浅色", "深色", "用途"], boundaryRows)}

- 表单和选择控件使用 \`input / input-hover\`。
- 卡片、分隔线和普通容器使用 \`border\`；更轻的紧凑边界使用 \`border-subtle\`。
- 无效状态使用 \`danger-border\`；警告状态使用 \`warning-border\`；焦点环始终使用独立的 \`focus-ring\` 语义。

## 交互颜色

${table(["CSS 令牌", "浅色", "深色", "用途"], interactionRows)}

\`hover\` 表示悬停或预高亮；\`active\` 表示按下、拖拽或展开；\`selection\` 表示持久选择。三者不得混用。

滚动条使用 \`scrollbar-thumb / hover / active\` 三个支持色，保证原生和自定义滚动条共享相同的状态配方。

## 支持颜色

${table(["CSS 令牌", "浅色", "深色", "用途"], supportRows)}

## 承载面（Surface）

${table(["CSS 令牌", "Tailwind", "浅色", "深色", "用途"], surfaceRows)}

### 承载面的命名与层级决策

以上 5 个与组件类型无关的视觉角色构成唯一的承载面 API。运行时、CSS、Tailwind、组件注册表、
文档和组件源码均不再发布或引用数字化的承载面层级。嵌套关系由语义角色顺序计算，不需要暴露中间插值层。

#### 为什么不使用 Card、Dialog 等组件名称作为基础承载面名称

组件类型不等于视觉高度。同一个卡片可以位于页面、弹出框或对话框内；同一个下拉菜单
也可能从页面或模态内容中打开。固定的 \`--surface-card\` 或 \`--surface-dialog\` 无法正确表达
这些嵌套关系，暗色模式下还可能让子容器比父容器更暗，产生错误的下沉感。

#### 相对层级规则

- 页面默认从 \`surface-base\` 开始。
- 静态容器优先使用 \`surface-raised\`；没有视觉抬升需求时，继续继承父级承载面。
- 下拉菜单、选择器和弹出框以 \`surface-floating\` 为最低角色；位于模态承载面中时解析为
  \`surface-top\`，避免与父级融合。
- 对话框、抽屉和侧滑面板使用 \`surface-overlay\`；其内部弹层可提升至 \`surface-top\`。
- \`surface-top\` 是上限，不用于通过“再升一级”修复结构或遮挡问题。
- 不支持无限嵌套；超过 5 个可感知层级通常意味着交互架构需要简化。

#### 分离承载面、阴影与 z-index

三者表达不同维度，不应通过相同编号强制绑定：

| 维度 | 回答的问题 | 推荐语义 |
| --- | --- | --- |
| 承载面 | 容器相对于其承载环境处于什么视觉高度 | \`base / raised / floating / overlay / top\` |
| 阴影 | 元素需要多强的边缘与空间分离感 | \`raised / floating / overlay\` |
| z-index | 元素在浏览器堆叠上下文中的绘制顺序是什么 | 继续使用现有层级令牌 |

嵌套的下拉菜单可以使用 \`surface-top\` 背景，同时继续使用 \`shadow-floating\`。背景随承载面
变化，不代表阴影必须不断增强。\`Elevated\` 独立接受语义化的阴影角色，背景承载面和
空间分离强度不会被同一个编号绑死。

## 字号与行高

${table(["Tailwind", "CSS 令牌", "字号 / 行高", "用途"], typeRows)}

字号和行高成对发布；组件优先使用 \`text-body\` 这类语义类，不再使用 \`text-[13px]\`。字体族为 \`font-sans\`。

### 字重

| 实现工具类 | Tailwind 默认值 | 推荐用途 |
| --- | ---: | --- |
| \`font-normal\` | 400 | 默认正文、未选中标签和输入值 |
| \`font-medium\` | 500 | 控件标签、徽标、工具提示和轻度强调 |
| \`font-semibold\` | 600 | 标题、选中项、展开项和重要标签 |
| \`font-bold\` | 700 | 页面主标题和少量强强调内容 |

字重直接使用 Tailwind 原生类，不发布 \`typography/font-weight/*\` 设计令牌、\`--type-weight-*\` CSS 变量或运行时辅助函数。以上数值是 Zeron 默认主题；消费项目显式覆盖 Tailwind \`--font-weight-*\` 时，组件将跟随宿主主题。

## 动效时长

${table(["CSS 令牌", "Tailwind", "时长", "用途"], motionRows)}

CSS transition 使用以上时长层级；Framer Motion 使用同名的 \`spring\` tier，或从该 tier 派生的退出时长。组件不得直接写入通用时长数值；描边路径等特殊微动效可在组件内保留独立时长。

## 间距

### 间距策略决策

项目不提供运行时密度切换、间距主题或品牌级缩放，因此普通布局间距直接使用 Tailwind CSS
默认间距刻度，不再为相同数值维护第二套语义别名。Tailwind 的间距刻度本身就是
统一的设计刻度；使用 \`gap-4\`、\`px-3\` 并不等于使用无约束的原始像素值。

项目不发布普通间距设计令牌、\`--space-*\` CSS 变量或自定义间距工具类。
组件直接使用宿主 Tailwind 主题的原生刻度。

| Tailwind 刻度 | 默认值 | 示例 |
| --- | --- | --- |
| \`1\` | 4px | \`gap-1\` / \`p-1\` |
| \`2\` | 8px | \`gap-2\` / \`p-2\` |
| \`3\` | 12px | \`gap-3\` / \`px-3\` |
| \`4\` | 16px | \`gap-4\` / \`px-4\` |
| \`5\` | 20px | \`gap-5\` / \`px-5\` |
| \`6\` | 24px | \`gap-6\` / \`px-6\` |
| \`8\` | 32px | \`gap-8\` / \`px-8\` |
| \`12\` | 48px | \`gap-12\` / \`py-12\` |
| \`16\` | 64px | \`gap-16\` / \`py-16\` |

#### 使用规则

- Flex、Grid 布局和组件内部同级元素的间距优先使用 \`gap-*\`。
- 容器内边距直接使用 \`p-*\`、\`px-*\`、\`py-*\`。
- 页面边距使用响应式组合，例如 \`px-4 md:px-6 lg:px-8\`，而不是专用的页面边距令牌。
- \`space-x-*\` / \`space-y-*\` 只用于简单、不会换行的线性文档流；复杂布局优先使用 \`gap-*\`。
- 避免任意值，例如可以使用 \`gap-3\` 时不要使用 \`gap-[12px]\`。
- 控件高度、圆角、字号、承载面和层级仍属于跨组件设计契约，应继续使用语义设计令牌。

推荐示例：

\`\`\`tsx
<main className="px-4 py-8 md:px-6 lg:px-8">
  <section className="grid gap-4 lg:gap-6">...</section>
</main>
\`\`\`

## 控件高度

${table(["CSS 令牌", "Tailwind", "值", "用途"], controlRows)}

图标按钮和文字按钮应共享同一高度令牌。图标按钮的宽度可复用同一控件尺寸，例如 \`w-control-sm\`。

## 圆角

${table(["CSS 令牌", "Tailwind", "圆角模式", "胶囊模式", "用途"], radiusRows)}

\`ShapeProvider\` 会在运行时更新这些 CSS 变量，因此通过 Portal 渲染的内容与普通 DOM 内容能够保持相同形态。必须保持圆形的元素应使用 \`rounded-full\` / \`--full-radius\`，不跟随形态模式切换。

## 阴影

### 阴影策略决策

承载面与阴影有关联，但不一一绑定。承载面表达背景相对于承载环境的视觉高度；阴影
表达元素边缘需要多强的空间分离感。嵌套会改变承载面背景，但不会自动改变组件的阴影类型。

公开 API 包含以下语义角色：

${table(["CSS 令牌", "Tailwind", "用途"], shadowRows)}

\`shadow-none\` 继续用于没有空间分离需求的页面和扁平容器。不增加 \`shadow-base\` 或
\`shadow-top\`：基础承载面默认没有阴影；顶层承载面是背景层级的上限，不代表阴影必须最强。\`control\`
与 \`knob\` 是控件内部的局部投影，不表示承载面高度。

#### 承载面与阴影的组合

| 组件场景 | 承载面 | 阴影 |
| --- | --- | --- |
| 页面 | \`surface-base\` | \`none\` |
| 普通工具区 | \`surface-raised\` | \`none\` 或 \`raised\` |
| 扁平或描边卡片 | \`surface-raised\` | \`none\`，通过边框分离 |
| 抬升卡片 | \`surface-raised\` | \`raised\` |
| 下拉菜单 / 菜单 / 弹出框 | \`surface-floating\` | \`floating\` |
| 对话框 / 抽屉 / 侧滑面板 | \`surface-overlay\` | \`overlay\` |
| 对话框内的下拉菜单 | \`surface-top\` | \`floating\` |

嵌套的下拉菜单是关键约束：背景提升至 \`surface-top\` 以避免与对话框融合，但仍保持
\`shadow-floating\`，因为组件与承载面的空间距离没有变成“最高级阴影”。

#### 浅色 / 深色模式配方规则

- 浅色模式下，多个承载面可能同为白色，主要通过阴影与边框表达空间分离。
- 深色模式下，承载面已通过亮度变化表达层级，阴影应更克制，避免黑边过重或层层发光。
- 焦点环、边框和选中描边不属于阴影等级，不应并入上述三个角色。
- 阴影的具体配方只在设计令牌源中维护，组件不得内联自定义投影。

\`Elevated\` 使用 \`shadow="raised" | "floating" | "overlay"\`。组件不得传入或推导数字阴影。

## 层级

${table(["CSS 令牌", "CSS 类", "值", "用途"], layerRows)}

层级具有局部语义，不应通过不断增加任意 z-index 值来解决遮挡问题。组件内部装饰使用 \`content/raised/action\`，全局浮层使用 \`overlay/popover/tooltip/toast\`。

## 目标组件示例

以下示例展示完成承载面与阴影语义迁移后的目标 API：

\`\`\`tsx
<button className="h-control-md px-4 text-body rounded-control bg-brand text-fg-on-brand">
  保存更改
</button>

<section className="flex flex-col gap-4 rounded-container bg-surface-raised p-4 shadow-raised">
  <h2 className="text-title text-fg-default">账户</h2>
  <p className="text-body text-fg-muted">管理你的账户设置。</p>
</section>
\`\`\`

## 组件注册表合约

- 每个 \`registry:ui\` 条目都依赖 \`surfaces\`，安装任意组件时都会安装完整的设计令牌。
- \`registry.json\` 中的 \`cssVars\` 和层级 CSS 类由生成器写入。
- \`public/r\` 是发布产物，不是设计令牌源。
- 如果消费项目已有自己的主题，可在分支版本中移除 UI 条目的 \`surfaces\` 依赖，但必须实现本文档列出的同名 CSS/Tailwind 合约。
`;
}

function replaceBlock(source, block) {
  if (source.includes(START) && source.includes(END)) {
    const pattern = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    return source.replace(pattern, block);
  }
  const start = source.indexOf('@custom-variant dark');
  const endMarker = "/* ============================================================================\n   4. BASE STYLES";
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1) throw new Error("Could not locate the existing token section in app/globals.css");
  return `${source.slice(0, start)}${block}\n\n${source.slice(end)}`;
}

export function updateRegistry(registry) {
  registry.items = registry.items.filter((entry) => entry.name !== "font-weight");
  for (const entry of registry.items) {
    if (!Array.isArray(entry.registryDependencies)) continue;
    entry.registryDependencies = entry.registryDependencies.filter(
      (dependency) => dependency !== "font-weight"
    );
  }

  const item = registry.items.find((entry) => entry.name === "surfaces");
  if (!item) throw new Error('registry.json is missing the "surfaces" theme item');
  item.title = "Semantic Design Tokens";
  item.description = "Complete semantic token system: color, typography, control sizes, radii, shadows, surfaces, and layers. Ordinary layout spacing uses Tailwind's native scale. The historical surfaces slug is retained for compatibility.";
  item.cssVars = registryCssVars();
  item.css = registryCssRules();

  const shapeContext = registry.items.find((entry) => entry.name === "shape-context");
  if (!shapeContext) throw new Error('registry.json is missing the "shape-context" item');
  shapeContext.registryDependencies ??= [];
  shapeContext.registryDependencies = [
    "surfaces",
    ...shapeContext.registryDependencies.filter((dependency) => dependency !== "surfaces"),
  ];
  const runtimeTokenPath = "src/system/design-tokens.ts";
  if (!shapeContext.files.some((file) => file.path === runtimeTokenPath)) {
    shapeContext.files.push({
      path: runtimeTokenPath,
      type: "registry:lib",
      target: "lib/design-tokens.ts",
    });
  }

  for (const entry of registry.items) {
    if (entry.type !== "registry:ui") continue;
    entry.registryDependencies ??= [];
    entry.registryDependencies = [
      "surfaces",
      ...entry.registryDependencies.filter((dependency) => dependency !== "surfaces"),
    ];
  }
  return registry;
}

async function expectedArtifacts() {
  const globals = await readFile(GLOBALS_PATH, "utf8");
  const registry = JSON.parse(await readFile(REGISTRY_PATH, "utf8"));
  return {
    globals: replaceBlock(globals, renderGlobalsBlock()),
    registry: `${JSON.stringify(updateRegistry(registry), null, 2)}\n`,
    runtime: renderRuntimeTokens(),
    documentation: renderDocumentation(),
  };
}

async function main() {
  const check = process.argv.includes("--check");
  const expected = await expectedArtifacts();
  const targets = [
    [GLOBALS_PATH, expected.globals],
    [REGISTRY_PATH, expected.registry],
    [RUNTIME_PATH, expected.runtime],
    [DOC_PATH, expected.documentation],
  ];

  if (check) {
    const stale = [];
    for (const [path, content] of targets) {
      const current = await readFile(path, "utf8").catch(() => "");
      if (current !== content) stale.push(path.replace(`${ROOT}/`, ""));
    }
    if (stale.length) {
      throw new Error(`Generated semantic-token artifacts are stale: ${stale.join(", ")}. Run npm run tokens:build.`);
    }
    console.log("✓ semantic-token artifacts are up to date");
    return;
  }

  for (const [path, content] of targets) await writeFile(path, content);
  console.log("✓ generated app/globals.css token block");
  console.log("✓ generated registry.json semantic theme");
  console.log("✓ generated src/system/design-tokens.ts");
  console.log("✓ generated SEMANTIC-TOKENS.md");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

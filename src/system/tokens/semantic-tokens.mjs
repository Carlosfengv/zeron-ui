/**
 * Zeron Design semantic design tokens.
 *
 * This is the only hand-edited source for CSS/registry design tokens.
 * Run `npm run tokens:build` after editing it. The generator updates:
 *   - the generated token block in app/globals.css
 *   - the `surfaces` registry:theme item in registry.json
 *   - src/system/design-tokens.ts (runtime shape values)
 *   - SEMANTIC-TOKENS.md
 */

export const foregroundColorTokens = [
  { name: "fg-default", light: "#171717", dark: "#F5F5F5", usage: "普通承载面上的默认标题、正文、表单值和主要图标" },
  { name: "fg-muted", light: "#525252", dark: "#C0C0C0", usage: "普通承载面上的辅助说明、标签、元数据和次要图标" },
  { name: "fg-subtle", light: "#737373", dark: "#ADADAD", usage: "普通承载面上的占位文字、时间戳、快捷键提示和低强调图标" },
  { name: "fg-disabled", light: "#A3A3A3", dark: "#737373", usage: "不能通过组件级透明度表达时使用的独立禁用文字和图标" },
  { name: "fg-brand", light: "#0060D2", dark: "#80B0E9", usage: "普通承载面上的品牌色链接、文字和图标；不得用于品牌色填充之上" },
  { name: "fg-danger", light: "#B42318", dark: "#FCA5A5", usage: "普通承载面上的错误、失败或危险文字和图标；不得用于危险操作填充之上" },
  { name: "fg-on-brand", light: "#FFFFFF", dark: "#FFFFFF", usage: "品牌色默认、悬停和按下填充上的文字与图标；须与对应填充配对使用" },
  { name: "fg-on-danger", light: "#171717", dark: "#171717", usage: "危险操作默认、悬停和按下填充上的文字与图标；须与对应填充配对使用" },
  { name: "fg-on-inverse", light: "#FAFAFA", dark: "#171717", usage: "反色背景上的文字和图标；仅与反色填充配对使用" },
];

export const fillColorTokens = [
  { name: "brand", light: "#0060D2", dark: "#0060D2", usage: "主要操作和明确的选中标记" },
  { name: "brand-hover", light: "#0055BC", dark: "#0055BC", usage: "品牌色填充的悬停状态；须与 fg-on-brand 保持可读对比度" },
  { name: "brand-active", light: "#004DAC", dark: "#004DAC", usage: "品牌色填充的按下或展开状态；须与 fg-on-brand 保持可读对比度" },
  { name: "muted", light: "#F4F4F5", dark: "#1E1E1E", usage: "弱化容器、轨道和次要区域" },
  { name: "accent", light: "#E5E5E5", dark: "#525252", usage: "次要按钮和强调背景" },
  { name: "accent-subtlest", light: "#F3F3F3", dark: "#292929", usage: "最低强调度的重点背景；用于排队消息等弱化的临时容器" },
  { name: "accent-subtle", light: "#EEEEEE", dark: "#363636", usage: "低强调度的重点背景；用于消息气泡等静态容器" },
  { name: "accent-hover", light: "#CDCDCD", dark: "#5E5E5E", usage: "重点填充的悬停状态" },
  { name: "accent-active", light: "#BBBBBB", dark: "#686868", usage: "重点填充的按下或展开状态" },
  { name: "selection-background", light: "#D4D4D4", dark: "#525252", usage: "持久选中状态背景" },
  { name: "destructive", light: "#EF4444", dark: "#F87171", usage: "错误、删除和危险操作填充" },
  { name: "destructive-hover", light: "#F35854", dark: "#FA7E7C", usage: "危险操作填充的悬停状态；须与 fg-on-danger 保持可读对比度" },
  { name: "destructive-active", light: "#F5655F", dark: "#FC8784", usage: "危险操作填充的按下状态；须与 fg-on-danger 保持可读对比度" },
  { name: "destructive-subtle", light: "#FEF2F2", dark: "#450A0A", usage: "低强调错误背景" },
  { name: "inverse-background", light: "var(--fg-default)", dark: "var(--fg-default)", usage: "工具提示等高对比度的反色填充" },
];

export const boundaryColorTokens = [
  { name: "border", light: "rgb(23 23 23 / 0.12)", dark: "rgb(245 245 245 / 0.12)", usage: "普通分隔线和结构边界" },
  { name: "input", light: "#E5E5E5", dark: "#404040", usage: "输入和选择控件的静止边界" },
  { name: "input-hover", light: "rgb(23 23 23 / 0.24)", dark: "rgb(245 245 245 / 0.24)", usage: "输入和选择控件的悬停边界" },
  { name: "ring", light: "#E5E5E5", dark: "#404040", usage: "非焦点装饰环" },
  { name: "focus-ring", light: "#6B97FF", dark: "#6B97FF", usage: "全局键盘焦点指示器；与品牌色保持独立" },
];

export const interactionColorTokens = [
  { name: "hover", light: "rgb(0 0 0 / 0.04)", dark: "rgb(255 255 255 / 0.06)", usage: "任意承载面上的悬停覆盖层" },
  { name: "active", light: "rgb(0 0 0 / 0.07)", dark: "rgb(255 255 255 / 0.1)", usage: "任意承载面上的按下、拖拽或展开覆盖层" },
];

export const compatibilityColorTokens = [
  { name: "background", light: "var(--surface-base)", dark: "var(--surface-base)", usage: "页面画布" },
  { name: "foreground", light: "var(--fg-default)", dark: "var(--fg-default)", usage: "默认前景" },
  { name: "card", light: "var(--surface-raised)", dark: "var(--surface-raised)", usage: "静态容器背景" },
  { name: "card-foreground", light: "var(--fg-default)", dark: "var(--fg-default)", usage: "卡片默认前景" },
  { name: "muted-foreground", light: "#737373", dark: "#A3A3A3", usage: "旧版弱化内容；新组件应选择明确的内容强调层级" },
  { name: "accent-foreground", light: "var(--fg-default)", dark: "var(--fg-default)", usage: "重点填充上的前景" },
  { name: "selected", light: "var(--selection-background)", dark: "var(--selection-background)", usage: "选中背景" },
  { name: "brand-foreground", light: "var(--fg-on-brand)", dark: "var(--fg-on-brand)", usage: "品牌色填充上的前景" },
  { name: "destructive-light", light: "var(--destructive-subtle)", dark: "var(--destructive-subtle)", usage: "低强调错误背景" },
  { name: "destructive-foreground", light: "var(--fg-on-danger)", dark: "var(--fg-on-danger)", usage: "危险操作填充上的前景" },
];

export const colorTokens = [
  ...foregroundColorTokens,
  ...fillColorTokens,
  ...boundaryColorTokens,
  ...interactionColorTokens,
  ...compatibilityColorTokens,
];

export const supportColorTokens = [
  { name: "checker-a", light: "#BBBBBB", dark: "#1F1F1F", usage: "透明色棋盘格深色块" },
  { name: "checker-b", light: "#FFFFFF", dark: "#2A2A2A", usage: "透明色棋盘格浅色块" },
];

export const interactionOverlayRgb = {
  light: "0 0 0",
  dark: "255 255 255",
};

export const surfaceTokens = [
  { name: "base", light: "#FAFAFA", dark: "#171717", usage: "应用的最低承载面；用于页面和应用画布" },
  { name: "raised", light: "#FCFCFC", dark: "#1E1E1E", usage: "相对基底轻微抬升；用于工具区和低强调容器" },
  { name: "floating", light: "#FFFFFF", dark: "#252525", usage: "脱离普通文档流；用于菜单、下拉菜单和弹出框" },
  { name: "overlay", light: "#FFFFFF", dark: "#333333", usage: "位于遮罩或主要内容之上；用于对话框、抽屉和侧滑面板" },
  { name: "top", light: "#FFFFFF", dark: "#414141", usage: "最高临时承载面；用于模态框内的下拉菜单和工具提示" },
];

const lightShadowColor = "rgb(0 0 0 / 0.06)";
const lightShadowParts = {
  edge: `0 0 0 1px var(--shadow-color)`,
  close: `0 1px 1px -0.5px var(--shadow-color)`,
  near: `0 3px 3px -1.5px var(--shadow-color)`,
  mid: `0 6px 6px -3px var(--shadow-color)`,
  far: `0 12px 12px -6px var(--shadow-color)`,
};

const lightShadowRecipes = {
  raised: [lightShadowParts.edge, lightShadowParts.close].join(", "),
  floating: [lightShadowParts.edge, lightShadowParts.close, lightShadowParts.near].join(", "),
  overlay: Object.values(lightShadowParts).join(", "),
};

const darkShadowRecipes = {
  raised: `inset 0 1px 0 0 var(--dm-hi-base), inset 0 0 0 1px var(--dm-ring-base), 0 1px 1px -0.5px var(--dm-drop)`,
  floating: `inset 0 1px 0 0 var(--dm-hi-mid), inset 0 0 0 1px var(--dm-ring-base), 0 0 0 1px rgba(0,0,0,0.12), 0 1px 1px -0.5px var(--dm-drop), 0 3px 3px -1.5px var(--dm-drop)`,
  overlay: `inset 0 1px 0 0 var(--dm-hi-high), inset 0 0 0 1px var(--dm-ring-mid), 0 0 0 1px rgba(0,0,0,0.16), 0 1px 1px -0.5px var(--dm-drop), 0 3px 3px -1.5px var(--dm-drop), 0 6px 6px -3px var(--dm-drop), 0 12px 12px -6px var(--dm-drop)`,
};

export const shadowSupportTokens = {
  "shadow-color": lightShadowColor,
  "dm-hi-base": "rgba(255,255,255,0.01)",
  "dm-hi-mid": "rgba(255,255,255,0.02)",
  "dm-hi-high": "rgba(255,255,255,0.04)",
  "dm-ring-base": "rgba(255,255,255,0.02)",
  "dm-ring-mid": "rgba(255,255,255,0.04)",
  "dm-drop": "rgba(0,0,0,0.18)",
};

export const shadowTokens = [
  {
    name: "raised",
    light: lightShadowRecipes.raised,
    dark: darkShadowRecipes.raised,
    usage: "低高度容器的轻微边缘分离",
  },
  {
    name: "floating",
    light: lightShadowRecipes.floating,
    dark: darkShadowRecipes.floating,
    usage: "菜单、下拉菜单、弹出框等临时浮层",
  },
  {
    name: "overlay",
    light: lightShadowRecipes.overlay,
    dark: darkShadowRecipes.overlay,
    usage: "对话框、抽屉、侧滑面板等模态承载面",
  },
];

export const typographyTokens = [
  { name: "micro", size: "0.5625rem", px: 9, lineHeight: "0.75rem", linePx: 12, usage: "极小辅助标记，仅用于空间严格受限的场景" },
  { name: "overline", size: "0.625rem", px: 10, lineHeight: "0.875rem", linePx: 14, usage: "上标、键盘提示和密集元数据" },
  { name: "caption", size: "0.6875rem", px: 11, lineHeight: "1rem", linePx: 16, usage: "说明、时间戳和辅助标签" },
  { name: "label", size: "0.75rem", px: 12, lineHeight: "1rem", linePx: 16, usage: "紧凑控件标签和徽标" },
  { name: "body-sm", size: "0.875rem", px: 14, lineHeight: "1.25rem", linePx: 20, usage: "默认控件文字和紧凑正文" },
  { name: "body", size: "0.875rem", px: 14, lineHeight: "1.25rem", linePx: 20, usage: "默认正文" },
  { name: "body-md", size: "0.9375rem", px: 15, lineHeight: "1.375rem", linePx: 22, usage: "强调正文和舒适密度控件" },
  { name: "body-lg", size: "1rem", px: 16, lineHeight: "1.5rem", linePx: 24, usage: "大号正文和小标题" },
  { name: "title", size: "1.125rem", px: 18, lineHeight: "1.625rem", linePx: 26, usage: "卡片或面板标题" },
  { name: "title-lg", size: "1.375rem", px: 22, lineHeight: "1.75rem", linePx: 28, usage: "页面区块标题" },
  { name: "heading", size: "1.5rem", px: 24, lineHeight: "2rem", linePx: 32, usage: "页面标题" },
  { name: "heading-lg", size: "1.75rem", px: 28, lineHeight: "2.125rem", linePx: 34, usage: "展示型页面标题" },
  { name: "display", size: "2rem", px: 32, lineHeight: "2.5rem", linePx: 40, usage: "营销或关键展示标题" },
];

export const fontTokens = {
  family: `"Inter", system-ui, sans-serif`,
};

export const controlHeightTokens = [
  { name: "xs", value: "1.75rem", px: 28, usage: "超紧凑按钮、徽标操作" },
  { name: "sm", value: "2rem", px: 32, usage: "紧凑按钮、导航项和分段控件" },
  { name: "md", value: "2.25rem", px: 36, usage: "默认输入框、菜单项和按钮" },
  { name: "lg", value: "2.5rem", px: 40, usage: "大按钮和触控友好控件" },
  { name: "xl", value: "2.75rem", px: 44, usage: "主要触控控件" },
];

export const radiusRoles = [
  { name: "control", usage: "按钮、输入框和独立交互项" },
  { name: "focus", usage: "位于控件外侧的焦点环" },
  { name: "selection", usage: "合并选区和动态背景" },
  { name: "container", usage: "卡片、菜单组和大容器" },
  { name: "overlay", usage: "对话框、弹出框等浮层" },
  { name: "full", usage: "圆形头像、圆点和必须保持胶囊的元素" },
];

export const shapeModes = {
  rounded: {
    control: 8,
    focus: 10,
    selection: 8,
    container: 12,
    overlay: 12,
    full: 9999,
  },
  pill: {
    control: 20,
    focus: 22,
    selection: 16,
    container: 24,
    overlay: 20,
    full: 9999,
  },
};

export const layerTokens = [
  { name: "underlay", value: -10, usage: "组件内部背景和分隔线" },
  { name: "base", value: 0, usage: "普通文档流" },
  { name: "decoration", value: 1, usage: "组件内部最低层装饰" },
  { name: "indicator", value: 2, usage: "组件内部轨道、标记和状态背景" },
  { name: "control", value: 3, usage: "组件内部可操作视觉层" },
  { name: "foreground", value: 4, usage: "组件内部标签和值等前景内容" },
  { name: "content", value: 10, usage: "局部装饰背景之上的内容" },
  { name: "raised", value: 20, usage: "焦点环、拉伸点击层和局部浮动元素" },
  { name: "action", value: 30, usage: "卡片操作等必须高于点击覆盖层的内容" },
  { name: "overlay", value: 40, usage: "遮罩和抽屉背景" },
  { name: "popover", value: 50, usage: "菜单、选择器、对话框和普通浮层" },
  { name: "tooltip", value: 60, usage: "工具提示、颜色选择器等最高优先级提示" },
  { name: "toast", value: 70, usage: "全局通知" },
];

export const semanticTokens = {
  colors: colorTokens,
  foregrounds: foregroundColorTokens,
  fills: fillColorTokens,
  boundaries: boundaryColorTokens,
  interactions: interactionColorTokens,
  compatibilityColors: compatibilityColorTokens,
  supportColors: supportColorTokens,
  interactionOverlayRgb,
  surfaces: surfaceTokens,
  shadows: shadowTokens,
  typography: typographyTokens,
  fonts: fontTokens,
  controlHeights: controlHeightTokens,
  radiusRoles,
  shapeModes,
  layers: layerTokens,
};

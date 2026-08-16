/**
 * Zeron Design semantic design tokens.
 *
 * This is the hand-edited semantic source for CSS/registry design tokens.
 * Reference color primitives live in reference-colors.mjs.
 * Run `pnpm tokens:build` after editing it. The generator updates:
 *   - the generated token block in app/globals.css
 *   - the `surfaces` registry:theme item in packages/ui/registry.json
 *   - SEMANTIC-TOKENS.md
 */

import { referenceColors } from "./reference-colors.mjs";

const { neutral, danger, warning, info } = referenceColors;
const { optical: neutralOptical } = neutral;

function intentFor(name) {
  if (name.includes("brand")) return "brand";
  if (name.includes("danger") || name.includes("destructive")) return "danger";
  if (name.includes("warning")) return "warning";
  if (name.includes("success")) return "success";
  if (name.includes("info")) return "info";
  if (name.includes("neutral-status")) return "neutral-status";
  if (name.includes("selection")) return "selection";
  if (name.includes("focus")) return "focus";
  if (name.includes("inverse")) return "inverse";
  return "neutral";
}

function classify(tokens, channel) {
  return tokens.map((token) => ({
    ...token,
    classification: {
      channel,
      intent: intentFor(token.name),
      variant: token.name.endsWith("-hover") || token.name === "hover"
        ? { interaction: "hover" }
        : token.name.endsWith("-active") || token.name === "active"
          ? { interaction: "active" }
          : undefined,
    },
  }));
}

export const foregroundColorTokens = classify([
  { name: "fg-default", light: "#00030A", dark: "#F9F9F9", usage: "普通承载面上的默认标题、正文、表单值和主要图标" },
  { name: "fg-muted", light: "#00030AD9", dark: "#C7CBCE", usage: "普通承载面上的辅助说明、标签、元数据和次要图标" },
  { name: "fg-subtle", light: "#00030A99", dark: "#B6BABC", usage: "普通承载面上的占位文字、时间戳、快捷键提示和低强调图标" },
  { name: "fg-brand", light: "#0060D2", dark: "#72B9FE", usage: "普通承载面上的品牌色链接、文字和图标；不得用于品牌色填充之上" },
  { name: "fg-danger", light: "#B0140C", dark: "#FEBEAC", usage: "普通承载面上的错误、失败或危险文字和图标；不得用于危险操作填充之上" },
  { name: "fg-warning", light: "#A74A00", dark: "#FFDDA1", usage: "普通承载面上的警告文字和图标；不得用于警告操作填充之上" },
  { name: "fg-success", light: "#176B3A", dark: "#9DE7B4", usage: "普通承载面上的成功、完成或正向结果文字和图标；不得用于高强调操作填充之上" },
  { name: "fg-info", light: "#004DAF", dark: "#A1D2FE", usage: "普通承载面上的说明、提示和信息文字与图标；不得用于信息填充之上" },
  { name: "fg-neutral-status", light: "#555B61", dark: "#C7CBCE", usage: "普通承载面上的中性状态文字和图标；不得用于高强调操作填充之上" },
  { name: "fg-on-brand", light: neutral[0], dark: "#00040D", usage: "品牌色默认、悬停和按下填充上的文字与图标；须与对应填充配对使用" },
  { name: "fg-on-danger", light: "var(--fg-on-brand)", dark: "var(--fg-on-brand)", usage: "危险操作默认、悬停和按下填充之上的文字与图标；复用 fg-on-brand 并须与对应填充配对使用" },
  { name: "fg-on-inverse", light: neutral[0], dark: "#00040D", usage: "反色背景上的文字和图标；仅与反色填充配对使用" },
], "foreground");

export const fillColorTokens = classify([
  { name: "brand", light: "#0060D2", dark: "#1483FD", usage: "主要操作和明确的选中标记" },
  { name: "warning", light: "#FA8801", dark: "#FF9314", usage: "告警、警告和需突出可视化状态的高强调填充" },
  { name: "neutral", light: "#6B7075", dark: "#8B9095", usage: "未知、一般状态和低强调可视化状态的填充" },
  { name: "brand-hover", light: "#004DAF", dark: "#439FFD", usage: "品牌色填充的悬停状态；须与 fg-on-brand 保持可读对比度" },
  { name: "brand-active", light: "#003B8B", dark: "#72B9FE", usage: "品牌色填充的按下或展开状态；须与 fg-on-brand 保持可读对比度" },
  { name: "muted", light: "#F6F8FB", dark: "#2F3136", usage: "弱化容器、轨道和次要区域" },
  { name: "secondary-action", light: "#F6F8FB", dark: "#2F3136", usage: "次要操作的默认填充" },
  { name: "secondary-action-hover", light: "#F1F4F9", dark: "#42444A", usage: "次要操作的悬停填充" },
  { name: "secondary-action-active", light: "#EAEEF5", dark: "#585B62", usage: "次要操作的按下或展开填充" },
  { name: "emphasis", light: "#F1F4F9", dark: "#42444A", usage: "低强调度的静态强调容器" },
  { name: "selection", light: "rgb(234 238 245 / 0.4)", dark: "rgb(88 91 98 / 0.16)", usage: "持久选中状态背景" },
  { name: "destructive", light: "#F73920", dark: "#FC4932", usage: "错误、删除和危险操作填充" },
  { name: "destructive-hover", light: "#F9654B", dark: "#FD725B", usage: "危险操作填充的悬停状态；须与 fg-on-danger 保持可读对比度" },
  { name: "destructive-active", light: "#FA8F78", dark: "#FD9983", usage: "危险操作填充的按下状态；须与 fg-on-danger 保持可读对比度" },
  { name: "danger-surface", light: danger[100], dark: danger[800], usage: "错误、失败和风险信息的低强调背景" },
  { name: "danger-surface-raised", light: danger[200], dark: danger[700], usage: "错误、失败和风险信息内的次级强调背景；用于嵌套告警内容" },
  { name: "warning-surface", light: warning[100], dark: warning[800], usage: "警告信息的低强调背景" },
  { name: "warning-surface-raised", light: warning[200], dark: warning[700], usage: "警告信息内的次级强调背景；用于嵌套告警内容" },
  { name: "success-surface", light: "#EAF8EF", dark: "#123B25", usage: "成功、完成和正向结果信息的低强调背景" },
  { name: "info-surface", light: info[100], dark: info[800], usage: "说明、提示和信息反馈的低强调背景" },
  { name: "info-surface-raised", light: info[200], dark: info[700], usage: "说明、提示和信息反馈内的次级强调背景；用于嵌套状态内容" },
  { name: "neutral-status-surface", light: neutral[100], dark: neutral[800], usage: "一般状态信息的低强调背景" },
  { name: "neutral-status-surface-raised", light: neutral[200], dark: neutral[700], usage: "一般状态信息内的次级强调背景；用于嵌套状态内容" },
  { name: "scrim", light: "rgb(0 0 0 / 0.4)", dark: "rgb(0 0 0 / 0.8)", usage: "抽屉和对话框背后的遮罩层" },
  { name: "inverse-background", light: "#00030A", dark: "#DEE5EF", usage: "工具提示和中性高强调操作的反色填充" },
  { name: "inverse-background-hover", light: "#001033", dark: "#B6C6DF", usage: "中性高强调操作的悬停状态；不跟随品牌主题色" },
  { name: "inverse-background-active", light: "#001748", dark: "#7994BF", usage: "中性高强调操作的按下或展开状态；不跟随品牌主题色" },
], "fill");

export const boundaryColorTokens = classify([
  { name: "border", light: "rgb(52 57 71 / 0.12)", dark: "rgb(255 255 255 / 0.08)", usage: "普通分隔线和结构边界" },
  { name: "border-subtle", light: "rgb(52 57 71 / 0.07)", dark: "rgb(255 255 255 / 0.05)", usage: "低强调分隔线和紧凑组件的弱边界" },
  { name: "input", light: neutral[200], dark: neutral[700], usage: "输入和选择控件的静止边界；随主题保持低强调层级" },
  { name: "input-hover", light: "rgb(23 23 23 / 0.24)", dark: "rgb(245 245 245 / 0.24)", usage: "输入和选择控件的悬停边界；在静止边界之上提供临时反馈" },
  { name: "danger-border", light: "#F73920", dark: "#FC4932", usage: "错误、失败和风险状态的边界；在普通与 Danger Surface 上保持 3:1 非文本对比度" },
  { name: "warning-border", light: "#D06700", dark: "#FF9314", usage: "警告状态的边界；在普通与 Warning Surface 上保持 3:1 非文本对比度" },
  { name: "success-border", light: "#23864B", dark: "#55C779", usage: "成功、完成和正向结果状态的边界；在普通与 Success Surface 上保持 3:1 非文本对比度" },
  { name: "info-border", light: "#0060D2", dark: "#1483FD", usage: "说明、提示和信息状态的边界；在普通与 Info Surface 上保持 3:1 非文本对比度" },
  { name: "neutral-status-border", light: "#6B7075", dark: "#8B9095", usage: "一般状态信息的边界；在普通与 Neutral Status Surface 上保持 3:1 非文本对比度" },
  { name: "focus-ring", light: "#6088E8", dark: "#6088E8", usage: "可见焦点指示器；Action 通常在键盘焦点时显示，文本编辑控件可在指针聚焦后显示；与品牌色保持独立并在全部承载面上保持 3:1 非文本对比度" },
], "boundary");

export const overlayColorTokens = classify([
  { name: "hover", light: "rgb(220 227 239 / 0.25)", dark: "rgb(220 227 239 / 0.08)", usage: "任意承载面上的悬停覆盖层" },
  { name: "active", light: "rgb(220 227 239 / 0.4)", dark: "rgb(220 227 239 / 0.18)", usage: "任意承载面上的按下、拖拽或展开覆盖层" },
], "overlay");

/** @deprecated Use overlayColorTokens. Kept as a source compatibility alias. */
export const interactionColorTokens = overlayColorTokens;

export const colorTokens = [
  ...foregroundColorTokens,
  ...fillColorTokens,
  ...boundaryColorTokens,
  ...overlayColorTokens,
];

export const supportColorTokens = classify([
  { name: "checker-a", light: neutralOptical[350], dark: neutralOptical[840], usage: "透明色棋盘格深色块" },
  { name: "checker-b", light: neutral[0], dark: neutralOptical[770], usage: "透明色棋盘格浅色块" },
  { name: "scrollbar-thumb", light: "rgb(0 0 0 / 0.08)", dark: "rgb(255 255 255 / 0.08)", usage: "滚动条滑块的静止状态" },
  { name: "scrollbar-thumb-hover", light: "rgb(0 0 0 / 0.12)", dark: "rgb(255 255 255 / 0.12)", usage: "滚动条滑块的悬停状态" },
  { name: "scrollbar-thumb-active", light: "rgb(0 0 0 / 0.16)", dark: "rgb(255 255 255 / 0.16)", usage: "滚动条滑块的拖拽或按下状态" },
], "support");

export const surfaceTokens = classify([
  { name: "base", light: "#F6F8FB", dark: "#24252B", usage: "应用的最低承载面；用于页面和应用画布" },
  { name: "raised", light: "#F0F3F8", dark: "#28292F", usage: "相对基底轻微抬升；用于工具区和低强调容器" },
  { name: "floating", light: neutral[0], dark: "#31353B", usage: "脱离普通文档流；用于菜单、下拉菜单和弹出框" },
  { name: "overlay", light: neutral[0], dark: "#373A41", usage: "位于遮罩或主要内容之上；用于对话框、抽屉和侧滑面板" },
  { name: "top", light: neutral[0], dark: "#3D4147", usage: "最高临时承载面；用于模态框内的下拉菜单和工具提示" },
], "surface");

const lightShadowColor = "rgb(0 0 0 / 0.06)";
const lightShadowParts = {
  edge: `0 0 0 1px var(--shadow-color)`,
  close: `0 1px 1px -0.5px var(--shadow-color)`,
  near: `0 3px 3px -1.5px var(--shadow-color)`,
  mid: `0 6px 6px -3px var(--shadow-color)`,
  far: `0 12px 12px -6px var(--shadow-color)`,
};

const lightShadowRecipes = {
  control: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  knob: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  raised: [lightShadowParts.edge, lightShadowParts.close].join(", "),
  "floating-drop": [lightShadowParts.close, lightShadowParts.near].join(", "),
  floating: [lightShadowParts.edge, lightShadowParts.close, lightShadowParts.near].join(", "),
  overlay: Object.values(lightShadowParts).join(", "),
};

const darkShadowRecipes = {
  control: "0 1px 2px 0 rgb(0 0 0 / 0.25)",
  knob: "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
  raised: `inset 0 1px 0 0 var(--dm-hi-base), inset 0 0 0 1px var(--dm-ring-base), 0 1px 1px -0.5px var(--dm-drop)`,
  "floating-drop": "0 1px 1px -0.5px var(--dm-drop), 0 3px 3px -1.5px var(--dm-drop)",
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
    name: "control",
    light: lightShadowRecipes.control,
    dark: darkShadowRecipes.control,
    usage: "输入、选择和键盘提示等描边控件的轻微边缘分离",
  },
  {
    name: "knob",
    light: lightShadowRecipes.knob,
    dark: darkShadowRecipes.knob,
    usage: "开关、滑块等可移动圆形控件的轻微投影",
  },
  {
    name: "raised",
    light: lightShadowRecipes.raised,
    dark: darkShadowRecipes.raised,
    usage: "低高度容器的轻微边缘分离",
  },
  {
    name: "floating-drop",
    light: lightShadowRecipes["floating-drop"],
    dark: darkShadowRecipes["floating-drop"],
    usage: "已使用明确边框的菜单、下拉菜单和弹出框的纯投影",
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
  { name: "label", size: "0.75rem", px: 12, lineHeight: "1rem", linePx: 16, usage: "紧凑控件标签和徽标" },
  { name: "body", size: "0.875rem", px: 14, lineHeight: "1.25rem", linePx: 20, usage: "默认正文" },
  { name: "title", size: "1.125rem", px: 18, lineHeight: "1.625rem", linePx: 26, usage: "卡片或面板标题" },
  { name: "heading", size: "1.5rem", px: 24, lineHeight: "2rem", linePx: 32, usage: "页面标题" },
];

export const motionDurationTokens = [
  { name: "fast", value: "80ms", usage: "图标、颜色和短距离状态反馈" },
  { name: "moderate-exit", value: "120ms", usage: "中等层级的退出过渡" },
  { name: "moderate", value: "160ms", usage: "控件状态与面板的默认过渡" },
  { name: "slow", value: "240ms", usage: "较大内容区的进入过渡" },
];

export const fontTokens = {
  family: `"Inter", system-ui, sans-serif`,
};

export const controlHeightTokens = [
  { name: "xs", value: "1.5rem", px: 24, usage: "极致紧凑、非触控优先操作" },
  { name: "sm", value: "1.75rem", px: 28, usage: "紧凑按钮、导航项和数据工具栏" },
  { name: "md", value: "2rem", px: 32, usage: "默认输入框、选择器和按钮" },
  { name: "lg", value: "2.25rem", px: 36, usage: "宽松按钮、菜单项和表单控件" },
  { name: "xl", value: "2.5rem", px: 40, usage: "大型控件和宽松交互界面" },
];

export const badgeHeightTokens = [
  { name: "sm", value: "1.25rem", px: 20, usage: "紧凑状态标签" },
  { name: "md", value: "1.5rem", px: 24, usage: "默认状态标签" },
  { name: "lg", value: "1.75rem", px: 28, usage: "强调状态标签" },
];

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
];

export const semanticTokens = {
  colors: colorTokens,
  foregrounds: foregroundColorTokens,
  fills: fillColorTokens,
  boundaries: boundaryColorTokens,
  overlays: overlayColorTokens,
  supportColors: supportColorTokens,
  surfaces: surfaceTokens,
  shadows: shadowTokens,
  typography: typographyTokens,
  motionDurations: motionDurationTokens,
  fonts: fontTokens,
  controlHeights: controlHeightTokens,
  badgeHeights: badgeHeightTokens,
  layers: layerTokens,
};

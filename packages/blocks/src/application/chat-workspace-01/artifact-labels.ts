import type { ArtifactLabels } from "./chat-workspace-types";

export const artifactEnLabels: ArtifactLabels = {
  panel: "Content preview", resources: "Open content", more: "More open content", empty: "Open something to take a closer look",
  emptyDescription: "Select a file, image or page from the conversation.",
  preview: "Preview", source: "Source", diff: "Changes", unified: "Unified", split: "Split",
  copy: "Copy", copied: "Copied", copyFailed: "Could not copy. Try again.", download: "Download",
  reference: "Add to conversation", referenced: "Added to your draft", referenceFailed: "Could not add this reference. Try again.",
  openExternal: "Open externally", refresh: "Refresh", close: (name) => `Close ${name}`,
  closeOthers: "Close other tabs", closeAll: "Close all tabs",
  loading: "Loading preview…", failed: "This content could not be loaded.", retry: "Retry",
  unsupported: "A preview is not available for this file.", unavailableUrl: "A valid preview address is not available.",
  webNotice: "Some websites prevent embedded previews. You can open the page externally at any time.",
  zoomIn: "Zoom in", zoomOut: "Zoom out", fit: "Fit", accept: "Accept", reject: "Reject",
  actualSize: "Actual size", panImage: "Drag to pan, or use the arrow keys to scroll.",
  acceptAll: "Accept all", rejectAll: "Reject all", pending: "Pending", accepted: "Accepted", rejected: "Rejected",
  reviewing: "Saving review…", reviewFailed: "Some changes could not be reviewed. Retry the remaining changes.",
  reviewActions: "Batch review actions", reviewList: "Pending review items", previousPending: "Previous pending item", nextPending: "Next pending item", startReview: "Review pending items",
  remaining: (count) => `${count} ${count === 1 ? "change" : "changes"} to review`,
  workspace: "Conversation workspace", conversation: "Conversation", showPanel: "Show content", hidePanel: "Hide content",
  resize: "Resize conversation and content",
};

export const artifactZhLabels: ArtifactLabels = {
  panel: "内容预览", resources: "已打开内容", more: "更多已打开内容", empty: "打开内容，查看详情", emptyDescription: "从对话中选择文件、图片或网页。",
  preview: "预览", source: "源码", diff: "变更", unified: "统一视图", split: "并排视图",
  copy: "复制", copied: "已复制", copyFailed: "复制失败，请重试。", download: "下载",
  reference: "引用到对话", referenced: "已添加到草稿", referenceFailed: "引用失败，请重试。",
  openExternal: "外部打开", refresh: "刷新", close: (name) => `关闭 ${name}`,
  closeOthers: "关闭其他标签", closeAll: "关闭全部标签",
  loading: "正在加载预览…", failed: "内容加载失败。", retry: "重试", unsupported: "此文件暂不支持预览。",
  unavailableUrl: "没有可用的预览地址。", webNotice: "部分网站不允许内嵌预览，你可以随时在外部打开。",
  zoomIn: "放大", zoomOut: "缩小", fit: "适应窗口", accept: "接受", reject: "拒绝", acceptAll: "全部接受", rejectAll: "全部拒绝",
  actualSize: "原始尺寸", panImage: "拖动平移，也可使用方向键滚动。",
  pending: "待审阅", accepted: "已接受", rejected: "已拒绝", reviewing: "正在保存审阅…",
  reviewFailed: "部分变更审阅失败，请重试剩余变更。", remaining: (count) => `${count} 项变更待审阅`,
  reviewActions: "批量审阅操作", reviewList: "待审阅列表", previousPending: "上一项待审阅内容", nextPending: "下一项待审阅内容", startReview: "查看待审阅内容",
  workspace: "对话工作区", conversation: "对话", showPanel: "查看内容", hidePanel: "收起内容", resize: "调整对话与内容的宽度",
};

export function resolveArtifactLabels(locale?: string, overrides?: Partial<ArtifactLabels>): ArtifactLabels {
  return { ...(locale?.toLowerCase().startsWith("zh") ? artifactZhLabels : artifactEnLabels), ...overrides };
}

import type { ArtifactPreviewLabels } from "./artifact-types";

export const artifactPreviewEnLabels: ArtifactPreviewLabels = {
  panel: "Artifact preview", code: "Code", preview: "Preview", changes: "Changes", versions: "Version history",
  version: (index, count) => `Version ${index} of ${count}`, latest: "Latest", restore: "Restore this version",
  restoring: "Restoring…", restoreFailed: "Could not restore this version. Try again.", writing: "Writing…", ready: "Ready",
  stopped: "Generation stopped", failed: "Could not display this content.", retry: "Retry", copy: "Copy code", copied: "Copied",
  copyFailed: "Could not copy. Try again.", download: "Download", downloadFailed: "Could not download. Try again.",
  refresh: "Reload preview", expand: "Expand preview", collapse: "Exit full screen", expandFailed: "Full screen is unavailable.",
  close: "Close preview", empty: "Your next idea starts here", emptyDescription: "Open an artifact from the conversation to preview it.",
  loading: "Loading content…", lines: (count) => `${count} lines`,
};

export const artifactPreviewZhLabels: ArtifactPreviewLabels = {
  panel: "生成内容预览", code: "代码", preview: "预览", changes: "变更", versions: "版本历史",
  version: (index, count) => `第 ${index} 版，共 ${count} 版`, latest: "最新", restore: "恢复此版本",
  restoring: "恢复中…", restoreFailed: "未能恢复此版本，请重试。", writing: "正在生成…", ready: "已就绪",
  stopped: "已停止生成", failed: "未能显示内容。", retry: "重试", copy: "复制代码", copied: "已复制",
  copyFailed: "复制失败，请重试。", download: "下载", downloadFailed: "下载失败，请重试。",
  refresh: "刷新预览", expand: "展开预览", collapse: "退出全屏", expandFailed: "当前无法进入全屏。",
  close: "关闭预览", empty: "让想法在这里成形", emptyDescription: "从对话中打开生成内容，即可在此预览。",
  loading: "正在加载内容…", lines: (count) => `${count} 行`,
};

export function resolveArtifactPreviewLabels(locale?: string, labels?: Partial<ArtifactPreviewLabels>) {
  return { ...(locale?.startsWith("zh") ? artifactPreviewZhLabels : artifactPreviewEnLabels), ...labels };
}

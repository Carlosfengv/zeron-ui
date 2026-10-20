import type { ArtifactResource } from "./chat-workspace-types";

/** Local fixtures. URL/image hosts may replace these two asset addresses. */
export function createChatWorkspaceDemoResources(locale = "en", assetBase = "/demos/chat-workspace"): ArtifactResource[] {
  const zh = locale.toLowerCase().startsWith("zh");
  return [
    {
      id: "theme", version: "1", kind: "code", name: "theme.ts", path: "src/lib/theme.ts", messageId: "result", review: "pending",
      previousContent: `export type Theme = "light" | "dark";\n\nexport function readTheme(): Theme {\n  return "light";\n}\n\nexport function applyTheme(theme: Theme) {\n  document.documentElement.classList.toggle("dark", theme === "dark");\n}\n`,
      content: `export type Theme = "light" | "dark" | "system";\n\nconst storageKey = "workspace-theme";\n\nexport function readTheme(): Theme {\n  if (typeof window === "undefined") return "system";\n  const saved = localStorage.getItem(storageKey);\n  return saved === "light" || saved === "dark" ? saved : "system";\n}\n\nexport function applyTheme(theme: Theme) {\n  const dark = theme === "system"\n    ? matchMedia("(prefers-color-scheme: dark)").matches\n    : theme === "dark";\n  document.documentElement.classList.toggle("dark", dark);\n  localStorage.setItem(storageKey, theme);\n}\n`,
    },
    {
      id: "readme", version: "1", kind: "markdown", name: "README.md", path: "docs/README.md", messageId: "result", review: "pending",
      previousContent: "# Appearance\n\nChoose a light or dark theme.\n",
      content: zh ? `# 外观设置\n\n让工作区跟随你的习惯。现在支持 **浅色、深色、跟随系统** 三种主题。\n\n## 使用方式\n\n1. 打开「设置 → 外观」。\n2. 选择喜欢的主题。\n3. 选择会保存在当前浏览器，下次访问自动应用。\n\n| 主题 | 行为 |\n| --- | --- |\n| 浅色 | 始终使用浅色外观 |\n| 深色 | 始终使用深色外观 |\n| 跟随系统 | 打开页面时读取系统偏好 |\n\n## 验收清单\n\n- [x] 主题切换即时生效\n- [x] 刷新后保留选择\n- [x] 首次访问默认跟随系统\n\n> 右侧可以预览文档、阅读源码，也可以检查本次变更。\n` : `# Appearance\n\nA workspace that feels like yours. Choose **Light, Dark or System** and keep your preference between visits.\n\n## Getting started\n\n1. Open **Settings → Appearance**.\n2. Choose your preferred theme.\n3. Your choice is saved in this browser and restored on the next visit.\n\n| Theme | Behavior |\n| --- | --- |\n| Light | Always use the light appearance |\n| Dark | Always use the dark appearance |\n| System | Read your system preference when the page opens |\n\n## Acceptance checklist\n\n- [x] Theme changes apply immediately\n- [x] Your choice survives a refresh\n- [x] First visits default to the system preference\n\n> Preview the document, read its source, or review the changes in this panel.\n`,
    },
    { id: "design", version: "1", kind: "image", name: "appearance.svg", path: "design/appearance.svg", url: `${assetBase}/appearance.svg`, size: 2883, alt: zh ? "外观设置设计稿，展示浅色、深色与跟随系统三种选项" : "Appearance design showing light, dark and system options", messageId: "result" },
    { id: "website", version: "1", kind: "url", name: zh ? "页面预览" : "Live preview", url: `${assetBase}/preview.html`, messageId: "result" },
    { id: "archive", version: "1", kind: "file", name: "release-notes.zip", mimeType: "application/zip", size: 24576, messageId: "result" },
  ];
}

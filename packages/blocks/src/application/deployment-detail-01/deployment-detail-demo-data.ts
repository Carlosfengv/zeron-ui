import type { DeploymentDetailData } from "./deployment-detail-types";
import type { StatusOverviewSegment } from "@zeron/ui/status-overview";

export const deploymentDetailDemoNow = Date.parse("2026-10-05T04:00:00Z");
const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
<defs><pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="#bbb"/></pattern><linearGradient id="fade"><stop stop-color="#080808"/><stop offset="1" stop-color="#080808" stop-opacity="0"/></linearGradient></defs>
<rect width="640" height="400" fill="#080808"/><rect x="20" y="16" width="600" height="368" fill="none" stroke="#292929"/>
<text x="40" y="34" font-family="Arial,sans-serif" font-size="11" fill="#fff">Axiom Zero</text><text x="210" y="34" font-family="monospace" font-size="7" fill="#888">PROTOCOL / DEVELOPERS / INTEGRATIONS / TELEMETRY</text><path d="M20 49H620" stroke="#292929"/>
<text x="40" y="95" font-family="monospace" font-size="8" fill="#888">Layer-0 connectivity →</text>
<text x="40" y="142" font-family="Arial,sans-serif" font-size="30" font-weight="600" fill="#fff">The Coordination</text><text x="40" y="175" font-family="Arial,sans-serif" font-size="30" font-weight="600" fill="#fff">Layer for All Chains</text>
<rect x="470" y="152" width="120" height="28" fill="#bdff32"/><text x="494" y="170" font-family="Arial,sans-serif" font-size="10" fill="#080808">Launch Demo</text><path d="M40 198H600" stroke="#292929"/>
<text x="40" y="218" font-family="Arial,sans-serif" font-size="8" fill="#888">Automate your multi-chain workflows with rules.</text><text x="360" y="218" font-family="Arial,sans-serif" font-size="8" fill="#888">Get real-time visibility across every chain.</text>
<path d="M40 250H600V384H40Z" fill="url(#dots)"/><path d="M40 250H600V384H40Z" fill="url(#fade)"/><path d="M315 384L420 272L476 272L368 384Z" fill="#ddd" opacity=".25"/></svg>`;
const segments = (id: string, count: number, checked = false): StatusOverviewSegment[] => Array.from({ length: count }, (_, index) => {
  const status = checked && index === count - 1 ? "down" : checked && [count - 8, count - 5, count - 3].includes(index) ? "degraded" : "operational";
  return { id: `${id}-${index}`, status, ariaLabel: `${checked ? "检查项" : "构建任务"} ${index + 1}：${status === "down" ? "失败" : status === "degraded" ? "警告" : "通过"}` };
});
export const deploymentDetailDemoData: DeploymentDetailData = {
  id: "deploy-8f3c2a1", name: "main-8f3c2a1", environment: "Preview", status: "ready",
  url: "/zh-CN/block-demo/deployment-detail-01", shareUrl: "/zh-CN/block-demo/deployment-detail-01",
  preview: { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(previewSvg)}`, alt: "Axiom Zero 网站部署预览" },
  createdAt: deploymentDetailDemoNow - 9 * 3600000, completedAt: deploymentDetailDemoNow - 25 * 60000, durationMs: 747000,
  creator: { name: "Lily Hayes" },
  domains: [
    { id: "custom", name: "axiom.xyz", kind: "custom", url: "/zh-CN/block-demo/deployment-detail-01" },
    { id: "www", name: "www.axiom.xyz", kind: "custom" },
    { id: "app", name: "app.axiom.xyz", kind: "custom" },
    { id: "docs", name: "docs.axiom.xyz", kind: "custom" },
    { id: "branch", name: "main.axiom-zero.pages.dev", kind: "branch" },
    { id: "commit", name: "8f3c2a1.axiom-zero.pages.dev", kind: "commit" },
  ],
  source: { branch: "main", commit: "8f3c2a1", message: "Track error events to web analytics", pullRequest: { number: 1425 } },
  stages: [
    { id: "build", kind: "build", label: "构建日志", status: "success", durationMs: 537000, segments: segments("build", 28), actionLabel: "运行摘要" },
    { id: "summary", kind: "summary", label: "部署摘要", status: "success", durationMs: 161000, segments: [], metrics: [
      { id: "modules", label: "模块", value: 12, icon: "square-library" }, { id: "functions", label: "函数", value: 189, icon: "rocket" },
      { id: "files", label: "文件", value: 5128, icon: "file" }, { id: "assets", label: "静态资源", value: 792, icon: "folder" },
    ] },
    { id: "checks", kind: "checks", label: "运行检查", status: "error", durationMs: 24000, segments: segments("checks", 20, true), issues: [
      { id: "analytics", severity: "error", message: "分析事件上报失败", detail: "预览环境缺少 ANALYTICS_ENDPOINT，错误事件未能发送。" },
      { id: "bundle", severity: "warning", message: "主包体积超过建议值", detail: "主包为 512 KB，建议拆分统计面板的依赖。" },
      { id: "cache", severity: "warning", message: "静态资源缺少缓存策略", detail: "两个字体资源未设置长期缓存。" },
      { id: "sourcemap", severity: "warning", message: "Source map 未上传", detail: "运行时错误无法关联到原始源码位置。" },
    ] },
    { id: "domains", kind: "domains", label: "分配域名", status: "success", durationMs: 4000, segments: segments("domains", 4), actionLabel: "查看详情" },
  ],
};

"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArtifactPreviewPanel, type ArtifactDocument } from "@zeron/ui/artifact-preview-panel";
import { Button } from "@zeron/ui/button";
import previewDocument from "./preview-document.generated.json";

function document(zh: boolean, kind: "html" | "markdown" = "html"): ArtifactDocument {
  if (kind === "markdown") return {
    id: "guide", title: zh ? "项目指南" : "Project guide", filename: "README.md", kind,
    revisions: [
      { id: "v1", content: zh ? "# 项目指南\n\n手动恢复会话。" : "# Project guide\n\nRestore the session manually." },
      { id: "v2", content: zh ? "# 项目指南\n\n自动恢复会话。\n\n```ts\nexport const restoreSession = true;\n```" : "# Project guide\n\nRestore the session automatically.\n\n```ts\nexport const restoreSession = true;\n```" },
    ],
  };
  const html = (updated: boolean) => `<!doctype html>
<html lang="${zh ? "zh-CN" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${previewDocument.css}
</style>
</head>
<body>
${previewDocument.bodies[zh ? "zh-CN" : "en"][updated ? 1 : 0]}
</body>
</html>`;
  return { id: "welcome", title: zh ? "欢迎页面" : "Welcome page", filename: "welcome.html", kind: "html", revisions: [{ id: "v1", content: html(false) }, { id: "v2", content: html(true) }] };
}

export function ArtifactPreviewPanelExample({ kind = "html" }: { kind?: "html" | "markdown" }) {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [artifact, setArtifact] = useState<ArtifactDocument | null>(() => document(zh, kind));
  return <div className="flex h-96 w-full min-w-0 flex-col">
    <div className="min-h-0 flex-1"><ArtifactPreviewPanel artifact={artifact} locale={locale} onClose={() => setArtifact(null)}
      onRestore={async (source, revision) => {
        setArtifact((current) => current?.id === source.id ? { ...current, revisions: [...current.revisions, { id: crypto.randomUUID(), content: revision.content, label: zh ? "恢复的版本" : "Restored revision" }] } : current);
      }} /></div>
    <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2"><Button size="sm" variant="ghost" onClick={() => setArtifact(document(zh, kind))}>{zh ? "重置文档" : "Reset document"}</Button><p className="text-label text-fg-muted">{zh ? "恢复会追加本地修订，不覆盖历史。" : "Restore appends a local revision and preserves history."}</p></div>
  </div>;
}

export function ArtifactPreviewStatesExample() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [status, setStatus] = useState<"streaming" | "ready" | "error">("streaming");
  const artifact = document(zh);
  artifact.revisions = [{ ...artifact.revisions[1], status, error: zh ? "本地示例：内容暂时不可用。" : "Local example: this content is temporarily unavailable." }];
  return <div className="flex h-96 w-full min-w-0 flex-col">
    <div className="min-h-0 flex-1"><ArtifactPreviewPanel artifact={artifact} locale={locale} onRetry={() => setStatus("ready")} /></div>
    <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
      <Button size="sm" variant="secondary" onClick={() => setStatus("ready")}>{zh ? "完成生成" : "Finish generation"}</Button>
      <Button size="sm" variant="ghost" onClick={() => setStatus("error")}>{zh ? "模拟失败" : "Simulate failure"}</Button>
      <Button size="sm" variant="ghost" onClick={() => setStatus("streaming")}>{zh ? "重置生成状态" : "Reset generation"}</Button>
    </div>
  </div>;
}

"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ArtifactPanel, type ArtifactResource } from "@zeron/ui/artifact-panel";
import { Button } from "@zeron/ui/button";

function resources(zh: boolean): ArtifactResource[] {
  return [
    { id: "guide", version: "2", name: "README.md", kind: "markdown", review: "pending", previousContent: "# Project guide", content: zh ? "# 项目指南\n\n预览与审阅使用同一份资源快照。\n\n- 切换标签查看内容\n- 审阅后由宿主更新状态\n- 关闭标签不会删除资源" : "# Project guide\n\nPreview and review use one resource snapshot.\n\n- Switch tabs to inspect content\n- The host commits review decisions\n- Closing tabs does not delete resources" },
    { id: "settings", version: "1", name: "settings.ts", path: "src/settings.ts", previousPath: "src/config.ts", kind: "code", content: "export const restoreSession = true;", previousContent: "export const restoreSession = false;", review: "pending" },
  ];
}

export function ArtifactPanelExample({ failFirstReview = false }: { failFirstReview?: boolean }) {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [items, setItems] = useState(() => resources(zh));
  const [activeId, setActiveId] = useState("guide");
  const [notice, setNotice] = useState("");
  const failed = useRef(false);
  const reset = () => { setItems(resources(zh)); setActiveId("guide"); setNotice(""); failed.current = false; };
  return <div className="flex h-96 w-full min-w-0 flex-col">
    <div className="min-h-0 flex-1"><ArtifactPanel resources={items} activeId={activeId} onActiveIdChange={setActiveId} locale={locale}
      addAction={<Button size="sm" variant="ghost" onClick={reset}>{zh ? "重置资源" : "Reset resources"}</Button>}
      onCloseMany={(closed) => { const ids = new Set(closed.map((item) => item.id)); setItems((current) => current.filter((item) => !ids.has(item.id))); }}
      onReference={(item) => setNotice(zh ? `已将 ${item.name} 加入本地草稿引用。` : `Added ${item.name} to the local draft references.`)}
      onReview={async (resource, decision) => {
        if (failFirstReview && resource.id === "guide" && !failed.current) { failed.current = true; throw new Error("Local review failure"); }
        setItems((current) => current.map((item) => item.id === resource.id && item.version === resource.version && (item.kind === "code" || item.kind === "markdown") ? { ...item, review: decision === "accept" ? "accepted" : "rejected" } : item));
      }} /></div>
    <p role="status" className="shrink-0 px-3 py-2 text-label text-fg-muted">{notice || (zh ? "示例仅更新本地资源快照。" : "This example updates local resource snapshots only.")}</p>
  </div>;
}

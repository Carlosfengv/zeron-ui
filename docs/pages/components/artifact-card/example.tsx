"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArtifactCard, type ArtifactCardItem } from "@zeron/ui/artifact-card";
import { Button } from "@zeron/ui/button";

interface DemoArtifact extends ArtifactCardItem { summary: string }

export function ArtifactCardExample() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [selected, setSelected] = useState<DemoArtifact | null>(null);
  const resources: DemoArtifact[] = [
    { id: "page", name: "pricing.html", kind: "code", description: "HTML · 2.4 KB", review: "pending", summary: zh ? "套餐页面草稿，等待审阅。" : "A draft pricing page awaiting review." },
    { id: "notes", name: "release-notes.md", kind: "markdown", description: "Markdown · 1.2 KB", review: "accepted", summary: zh ? "发布说明与变更记录。" : "Release notes and change history." },
    { id: "image", name: "hero.png", kind: "image", description: "PNG · 86 KB", summary: zh ? "首屏插图，尚未连接文件服务。" : "Hero artwork; no file service is connected." },
  ];
  return <div className="w-full min-w-0 max-w-lg space-y-3">
    <ArtifactCard resources={resources} onOpen={setSelected} locale={locale} title={zh ? "本次生成" : "Created in this turn"} />
    {selected && <section aria-label={zh ? "所选内容" : "Selected content"} className="rounded-lg border-hairline border-border p-3">
      <h3 className="break-words text-body font-medium text-fg-default">{selected.name}</h3>
      <p className="mt-1 text-body text-fg-muted">{selected.summary}</p>
      <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>{zh ? "关闭" : "Close"}</Button>
    </section>}
  </div>;
}

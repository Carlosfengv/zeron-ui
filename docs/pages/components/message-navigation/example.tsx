"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageNavigation } from "@zeron/ui/message-navigation";
import { cn } from "@zeron/ui/system/utils";

export function MessageNavigationExample({ side = "right" }: { side?: "left" | "right" }) {
  const t = useTranslations("messageNavigation");
  const [activeId, setActiveId] = useState("turn-7");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(["turn-2", "turn-9", "turn-16"]);
  const items = Array.from({ length: 32 }, (_, index) => ({
    id: `turn-${index + 1}`,
    label: t(`prompt${index % 3 + 1}`),
    description: t(`reply${index % 3 + 1}`),
    bookmarked: bookmarkedIds.includes(`turn-${index + 1}`),
  }));
  const selected = items.find((item) => item.id === activeId)!;
  return (
    <div className={cn("relative flex min-h-80 w-full items-center justify-center", side === "left" ? "pl-14" : "pr-14")}>
      <div className="max-w-sm space-y-3 px-4">
        <p className="text-label text-fg-muted">{t("turn", { index: Number(activeId.split("-")[1]) })}</p>
        <h3 className="text-body font-medium text-fg-default">{selected.label}</h3>
        <p className="text-body text-fg-muted">{selected.description}</p>
        <p className="text-label text-fg-subtle">{t("savedCount", { count: bookmarkedIds.length })}</p>
      </div>
      <MessageNavigation items={items} activeId={activeId} onSelect={setActiveId} label={t("navLabel")}
        onBookmarkChange={(id, bookmarked) => setBookmarkedIds((current) => bookmarked
          ? [...new Set([...current, id])] : current.filter((item) => item !== id))}
        bookmarkLabels={{ bookmark: t("bookmark"), unbookmark: t("unbookmark"), bookmarked: t("bookmarked") }}
        align={side} previewSide={side === "left" ? "right" : "left"}
        getItemLabel={(item, index) => `${t("turn", { index: index + 1 })}: ${item.label}`}
        className={cn("absolute top-1/2 max-h-56 -translate-y-1/2", side === "left" ? "left-0" : "right-0")} />
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  FileManager,
  type FileManagerItem,
  type FileManagerView,
} from "@zeron/blocks/file-manager-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

const initialFiles: FileManagerItem[] = [
  { id: "design", kind: "folder", name: "Design", parentId: null, path: "Design", modifiedAt: "2026-08-18" },
  { id: "reports", kind: "folder", name: "Reports", parentId: null, path: "Reports", modifiedAt: "2026-08-14" },
  { id: "media", kind: "folder", name: "Media", parentId: null, path: "Media", modifiedAt: "2026-08-12" },
  { id: "brief", kind: "file", name: "Project brief.pdf", parentId: null, path: "Project brief.pdf", extension: "pdf", size: 2_450_000, modifiedAt: "2026-08-20" },
  { id: "roadmap", kind: "file", name: "Roadmap.xlsx", parentId: null, path: "Roadmap.xlsx", extension: "xlsx", size: 645_000, modifiedAt: "2026-08-19" },
  { id: "logo", kind: "file", name: "Zeron lockup.svg", parentId: "design", path: "Design/Zeron lockup.svg", extension: "svg", size: 42_000, modifiedAt: "2026-08-18" },
  { id: "palette", kind: "file", name: "Palette.png", parentId: "design", path: "Design/Palette.png", mimeType: "image/png", extension: "png", size: 1_230_000, modifiedAt: "2026-08-17" },
  { id: "quarterly", kind: "folder", name: "Quarterly", parentId: "reports", path: "Reports/Quarterly", modifiedAt: "2026-08-10" },
  { id: "metrics", kind: "file", name: "Q2 metrics.csv", parentId: "reports", path: "Reports/Q2 metrics.csv", extension: "csv", size: 387_000, modifiedAt: "2026-08-14" },
  { id: "launch", kind: "file", name: "Launch notes.md", parentId: "reports", path: "Reports/Launch notes.md", extension: "md", size: 18_000, modifiedAt: "2026-08-13" },
  { id: "session", kind: "file", name: "Session recording.mp4", parentId: "media", path: "Media/Session recording.mp4", mimeType: "video/mp4", extension: "mp4", size: 38_120_000, modifiedAt: "2026-08-12" },
];

export function FileManagerBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("fileManagerBlock");
  const [items, setItems] = useState<FileManagerItem[]>(initialFiles);
  const [view, setView] = useState<FileManagerView>("icon");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="file-manager-01"
      title={t("title")}
      preview={
        <div className="h-full min-h-0 bg-surface-raised">
          <FileManager
            actions={{
              createFolder: ({ parentId, name }) => setItems((current) => [
                ...current,
                { id: `folder-${Date.now()}`, kind: "folder", name, parentId, path: name, modifiedAt: new Date() },
              ]),
              rename: ({ item, name }) => setItems((current) => current.map((entry) =>
                entry.id === item.id ? { ...entry, name, modifiedAt: new Date() } : entry
              )),
              move: ({ items: movingItems, destinationId }) => {
                const movingIds = new Set(movingItems.map((item) => item.id));
                setItems((current) => current.map((item) =>
                  movingIds.has(item.id) ? { ...item, parentId: destinationId, modifiedAt: new Date() } : item
                ));
              },
              remove: ({ items: removedItems }) => {
                const removedIds = new Set(removedItems.map((item) => item.id));
                setItems((current) => current.filter((item) => !removedIds.has(item.id)));
              },
            }}
            className="h-full"
            items={items}
            view={view}
            onViewChange={setView}
          />
        </div>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}

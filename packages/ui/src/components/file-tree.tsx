"use client";

import { forwardRef, useMemo, type ForwardedRef } from "react";
import { Tree } from "#components/tree/tree";
import type { TreeAccessibleName, TreeBaseProps, TreeChangeDetails, TreeNode, TreeProps } from "./tree/tree-types";
import { useIcon } from "#system/icon-context";

type FileBase = {
  key: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  selectable?: boolean;
  keywords?: readonly string[];
};

export type FileNode =
  | (FileBase & {
      type: "folder";
      children?: readonly FileNode[];
    })
  | (FileBase & {
      type: "file";
      mimeType?: string;
      extension?: string;
      sizeBytes?: number;
      children?: never;
    });

type FileSelectionState = {
  selectedKeys?: readonly string[];
  defaultSelectedKeys?: readonly string[];
  onSelectionChange?: (keys: readonly string[], details: TreeChangeDetails<FileNode>) => void;
};

type FileSelectionProps =
  | (FileSelectionState & {
      selectionMode?: "single";
      selectionIndicator?: "highlight";
      checkStrategy?: never;
      selectableTypes?: readonly FileNode["type"][];
    })
  | (FileSelectionState & {
      selectionMode: "multiple";
      selectionIndicator?: "highlight";
      checkStrategy?: "independent";
      selectableTypes?: readonly FileNode["type"][];
    })
  | (FileSelectionState & {
      selectionMode: "multiple";
      selectionIndicator: "checkbox";
      checkStrategy?: "independent";
      selectableTypes?: readonly FileNode["type"][];
    })
  | (FileSelectionState & {
      selectionMode: "multiple";
      selectionIndicator: "checkbox";
      checkStrategy: "cascade";
      selectableTypes?: readonly "file"[];
    })
  | {
      selectionMode: "none";
      selectionIndicator?: never;
      checkStrategy?: never;
      selectedKeys?: never;
      defaultSelectedKeys?: never;
      onSelectionChange?: never;
      selectableTypes?: readonly FileNode["type"][];
    };

export type FileTreeProps = Omit<TreeBaseProps<FileNode>, "items" | "selectionScope" | "renderIcon"> & TreeAccessibleName & FileSelectionProps & {
  items: readonly FileNode[];
  allowedExtensions?: readonly string[];
};

function normalizedExtension(item: Extract<FileNode, { type: "file" }>) {
  const fromProp = item.extension?.replace(/^\./, "");
  if (fromProp) return fromProp.toLocaleLowerCase();
  const dot = item.label.lastIndexOf(".");
  return dot > 0 && dot < item.label.length - 1 ? item.label.slice(dot + 1).toLocaleLowerCase() : undefined;
}

function fileIconKind(item: Extract<FileNode, { type: "file" }>) {
  const mime = item.mimeType?.toLocaleLowerCase();
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  if (mime?.startsWith("audio/")) return "audio";
  if (mime === "application/pdf" || mime?.startsWith("text/")) return "text";
  if (mime?.includes("spreadsheet") || mime === "text/csv") return "spreadsheet";
  if (mime?.includes("zip") || mime?.includes("compressed") || mime?.includes("archive")) return "archive";
  const extension = normalizedExtension(item);
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension ?? "")) return "image";
  if (["xls", "xlsx", "csv"].includes(extension ?? "")) return "spreadsheet";
  if (["zip", "rar", "7z"].includes(extension ?? "")) return "archive";
  if (["mp4", "mov", "webm"].includes(extension ?? "")) return "video";
  if (["mp3", "wav", "m4a"].includes(extension ?? "")) return "audio";
  if (["md", "txt", "doc", "docx", "pdf"].includes(extension ?? "")) return "text";
  return "file";
}

function normalizeNodes(
  items: readonly FileNode[],
  selectableTypes: readonly FileNode["type"][],
  allowedExtensions: ReadonlySet<string> | null,
): readonly TreeNode<FileNode>[] {
  return items.map((item) => {
    const allowed = item.type !== "file" || !allowedExtensions || allowedExtensions.has(normalizedExtension(item) ?? "");
    return {
      key: item.key,
      label: item.label,
      keywords: item.keywords,
      disabled: item.disabled || !allowed,
      disabledReason: item.disabledReason ?? (!allowed ? "This file type cannot be selected" : undefined),
      selectable: item.selectable !== false && selectableTypes.includes(item.type) && allowed,
      data: item,
      children: item.type === "folder" && item.children
        ? normalizeNodes(item.children, selectableTypes, allowedExtensions)
        : undefined,
    };
  });
}

function FileTreeInner(
  { items, selectableTypes = ["file"], allowedExtensions, selectionMode, selectionIndicator, checkStrategy, ...props }: FileTreeProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const Folder = useIcon("folder");
  const File = useIcon("file");
  const Image = useIcon("file-image");
  const Spreadsheet = useIcon("file-spreadsheet");
  const Archive = useIcon("file-archive");
  const Video = useIcon("file-video");
  const Audio = useIcon("file-audio");
  const Text = useIcon("file-text");
  const normalizedAllowedExtensions = useMemo(
    () => allowedExtensions ? new Set(allowedExtensions.map((extension) => extension.replace(/^\./, "").toLocaleLowerCase())) : null,
    [allowedExtensions],
  );
  const normalized = useMemo(
    () => normalizeNodes(items, selectableTypes, normalizedAllowedExtensions),
    [items, normalizedAllowedExtensions, selectableTypes],
  );
  const isInvalidCascade = checkStrategy === "cascade" && selectableTypes.some((type) => type !== "file");
  if (isInvalidCascade) {
    throw new Error("FileTree cascade selection only supports selectableTypes={[\"file\"]}.");
  }
  const resolvedSelectionMode = selectionMode ?? "single";
  const resolvedSelectionIndicator = resolvedSelectionMode === "multiple"
    ? (selectionIndicator ?? "highlight")
    : resolvedSelectionMode === "single" ? "highlight" : undefined;
  const treeProps = {
    ...props,
    ref,
    items: normalized,
    selectionMode: resolvedSelectionMode,
    selectionIndicator: resolvedSelectionIndicator,
    checkStrategy: resolvedSelectionMode === "multiple" && resolvedSelectionIndicator === "checkbox" ? (checkStrategy ?? "independent") : undefined,
    renderIcon: ({ node }: { node: TreeNode<FileNode> }) => {
        const item = node.data;
        const kind = item?.type === "file" ? fileIconKind(item) : undefined;
        const Icon = item?.type === "folder" ? Folder
          : kind === "image" ? Image
            : kind === "spreadsheet" ? Spreadsheet
              : kind === "archive" ? Archive
                : kind === "video" ? Video
                  : kind === "audio" ? Audio
                    : kind === "text" ? Text
                      : File;
        return <span aria-hidden className="grid size-4 shrink-0 place-items-center text-fg-muted"><Icon size={16} /></span>;
    },
  } as TreeProps<FileNode> & { ref: ForwardedRef<HTMLDivElement> };
  return <Tree<FileNode> {...treeProps} />;
}

export const FileTree = forwardRef(FileTreeInner);
FileTree.displayName = "FileTree";

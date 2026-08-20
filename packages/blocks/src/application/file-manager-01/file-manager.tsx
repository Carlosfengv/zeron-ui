"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@zeron/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zeron/ui/dialog";
import { Input } from "@zeron/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@zeron/ui/select";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
import { cn } from "@zeron/ui/system/utils";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import {
  defaultFileManagerLabels,
  type FileItemRenderState,
  type FileManagerActionContext,
  type FileManagerColumn,
  type FileManagerItem,
  type FileManagerLabels,
  type FileManagerProps,
  type FileManagerSort,
  type FileManagerView,
} from "./file-manager-types";

type FileManagerIndex<TData> = {
  byId: Map<string, FileManagerItem<TData>>;
  children: Map<string | null, FileManagerItem<TData>[]>;
};

type TreeRow<TData> = {
  item: FileManagerItem<TData>;
  depth: number;
  hasChildren: boolean;
};

const DEFAULT_SORT: FileManagerSort = { field: "name", direction: "asc" };

function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void
) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const resolvedValue = value === undefined ? internalValue : value;
  const setValue = React.useCallback(
    (next: T) => {
      if (value === undefined) setInternalValue(next);
      onChange?.(next);
    },
    [onChange, value]
  );
  return [resolvedValue, setValue] as const;
}

function createIndex<TData>(items: FileManagerItem<TData>[]): FileManagerIndex<TData> {
  const byId = new Map<string, FileManagerItem<TData>>();
  const children = new Map<string | null, FileManagerItem<TData>[]>();

  for (const item of items) {
    byId.set(item.id, item);
    const siblings = children.get(item.parentId) ?? [];
    siblings.push(item);
    children.set(item.parentId, siblings);
  }
  return { byId, children };
}

function timestamp(value: Date | string | undefined) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function compareItems<TData>(
  left: FileManagerItem<TData>,
  right: FileManagerItem<TData>,
  sort: FileManagerSort
) {
  if (left.kind !== right.kind) return left.kind === "folder" ? -1 : 1;
  let result = 0;
  switch (sort.field) {
    case "kind":
      result = left.kind.localeCompare(right.kind);
      break;
    case "size":
      result = (left.size ?? -1) - (right.size ?? -1);
      break;
    case "createdAt":
      result = timestamp(left.createdAt) - timestamp(right.createdAt);
      break;
    case "modifiedAt":
      result = timestamp(left.modifiedAt) - timestamp(right.modifiedAt);
      break;
    default:
      result = left.name.localeCompare(right.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
  }
  return sort.direction === "asc" ? result : -result;
}

function displayName<TData>(item: FileManagerItem<TData>, showExtensions: boolean) {
  if (showExtensions || item.kind === "folder") return item.name;
  const lastDot = item.name.lastIndexOf(".");
  return lastDot > 0 ? item.name.slice(0, lastDot) : item.name;
}

function formatSize(size: number | undefined) {
  if (size === undefined) return "—";
  if (size === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function formatDate(value: Date | string | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

function kindLabel<TData>(item: FileManagerItem<TData>) {
  if (item.kind === "folder") return "Folder";
  if (item.mimeType?.startsWith("image/")) return "Image";
  if (item.mimeType?.startsWith("video/")) return "Video";
  if (item.mimeType?.startsWith("audio/")) return "Audio";
  if (item.mimeType?.includes("spreadsheet") || item.extension === "xlsx") return "Spreadsheet";
  if (item.mimeType?.includes("zip") || item.extension === "zip") return "Archive";
  return item.extension?.toUpperCase() || "File";
}

function extension<TData>(item: FileManagerItem<TData>) {
  if (item.extension) return item.extension.toLowerCase();
  const lastDot = item.name.lastIndexOf(".");
  return lastDot > -1 ? item.name.slice(lastDot + 1).toLowerCase() : "";
}

type StorageUIFileIconKind = "default" | "text" | "table" | "image" | "markdown" | "svg";

function storageUIFileIconKind<TData>(item: FileManagerItem<TData>): StorageUIFileIconKind {
  const ext = extension(item);
  if (ext === "svg") return "svg";
  if (["md", "mdx"].includes(ext)) return "markdown";
  if (
    item.mimeType?.startsWith("image/") ||
    item.mimeType?.startsWith("video/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "tif", "tiff"].includes(ext)
  ) {
    return "image";
  }
  if (
    item.mimeType?.includes("spreadsheet") ||
    ["xls", "xlsx", "csv", "tsv", "numbers"].includes(ext)
  ) {
    return "table";
  }
  if (["txt", "doc", "docx", "pdf", "rtf", "odt"].includes(ext)) return "text";
  return "default";
}

/**
 * File glyph paths adapted from StorageUI's @pierre/trees complete icon set
 * (Apache-2.0). Color is deliberately supplied by this project's semantic
 * tokens, so the glyphs inherit every active Zeron theme.
 */
function StorageUIFileTypeIcon<TData>({
  item,
  className,
}: {
  item: FileManagerItem<TData>;
  className?: string;
}) {
  const kind = storageUIFileIconKind(item);
  const tone =
    kind === "image" || kind === "svg"
      ? "text-fg-brand"
      : kind === "table"
        ? "text-fg-default"
        : "text-fg-muted";

  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", tone, className)}
      fill="none"
      viewBox="0 0 16 16"
    >
      {kind === "image" ? (
        <>
          <path
            fill="currentColor"
            d="M12.5 2A2.5 2.5 0 0 1 15 4.5v4.67l-4.05-3.54-4.08 4.08-3-2L1 10.6V4.5A2.5 2.5 0 0 1 3.5 2z"
            opacity=".3"
          />
          <path
            fill="currentColor"
            d="M15 10.5v1a2.5 2.5 0 0 1-2.5 2.5h-9a2.5 2.5 0 0 1-2.46-2.04L4 9l3 2 4-4zm-7-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"
          />
        </>
      ) : kind === "markdown" ? (
        <path fill="currentColor" d="M1 12V4h2l2 2.5L7 4h2v8H7V7.5l-2 2-2-2V12zm9-3 3 3.5L16 9h-2V4h-2v5z" />
      ) : kind === "svg" ? (
        <>
          <path fill="currentColor" d="M5 7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
          <path fill="currentColor" d="M6 1a5 5 0 0 1 4.58 3H7a3 3 0 0 0-3 3v3.58A5 5 0 0 1 6 1" opacity=".5" />
        </>
      ) : kind === "table" ? (
        <>
          <path fill="currentColor" d="M8 4a3 3 0 0 0 3 3h3v5.5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 12.5v-9A2.5 2.5 0 0 1 4.5 1H8z" opacity=".4" />
          <path fill="currentColor" d="M11.5 8a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5zM5 12h2.5v-1H5zm3.5 0H11v-1H8.5zM5 10h2.5V9H5zm3.5 0H11V9H8.5zm1-9a.5.5 0 0 1 .354.146l4 4A.5.5 0 0 1 14 5.5V6h-3a2 2 0 0 1-2-2V1z" />
        </>
      ) : kind === "text" ? (
        <>
          <path fill="currentColor" fillRule="evenodd" d="M8 4a3 3 0 0 0 3 3h3v5.5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 12.5v-9A2.5 2.5 0 0 1 4.5 1H8z" opacity=".4" />
          <path fill="currentColor" d="M8.5 11a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1zm2-2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1zm-1-8a.5.5 0 0 1 .354.146l4 4A.5.5 0 0 1 14 5.5V6h-3a2 2 0 0 1-2-2V1z" />
        </>
      ) : (
        <>
          <path fill="currentColor" d="M8 1v3a3 3 0 0 0 3 3h3v5.5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 12.5v-9A2.5 2.5 0 0 1 4.5 1z" opacity=".4" />
          <path fill="currentColor" d="M9.5 1a.5.5 0 0 1 .354.146l4 4A.5.5 0 0 1 14 5.5V6h-3a2 2 0 0 1-2-2V1z" />
        </>
      )}
    </svg>
  );
}

/**
 * Folder silhouette adapted from StorageUI. Its two layers use currentColor
 * with opacity rather than the source gradient, preserving Zeron's theme tokens.
 */
function StorageUIFolderIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0 text-fg-brand", className)}
      fill="none"
      viewBox="0 0 64 50"
    >
      <path
        fill="currentColor"
        d="M5 10c0-3.31 2.69-6 6-6h10.9c1.6 0 3.13.7 4.18 1.9l1.5 1.73a3.5 3.5 0 0 0 2.64 1.22H54c2.76 0 5 2.24 5 5V40c0 3.87-3.13 7-7 7H12c-3.87 0-7-3.13-7-7V10Z"
        opacity=".72"
      />
      <path
        fill="currentColor"
        d="M5 15.5h54V40c0 3.87-3.13 7-7 7H12c-3.87 0-7-3.13-7-7V15.5Z"
      />
    </svg>
  );
}

function isItemOrDescendant<TData>(
  candidateId: string | null,
  ancestorId: string,
  index: FileManagerIndex<TData>
) {
  let cursor = candidateId;
  while (cursor) {
    if (cursor === ancestorId) return true;
    cursor = index.byId.get(cursor)?.parentId ?? null;
  }
  return false;
}

export function FileItemVisual<TData>({
  item,
  selected,
  pending,
  view,
  renderIcon,
  renderThumbnail,
  className,
}: {
  item: FileManagerItem<TData>;
  selected: boolean;
  pending: boolean;
  view: FileManagerView;
  renderIcon?: (
    item: FileManagerItem<TData>,
    state: FileItemRenderState
  ) => React.ReactNode;
  renderThumbnail?: (
    item: FileManagerItem<TData>,
    options: { width: number; height: number; view: FileManagerView }
  ) => React.ReactNode;
  className?: string;
}) {
  const custom = renderIcon?.(item, { selected, pending, view });
  const isLarge = view === "icon";
  const preview =
    item.kind === "file"
      ? renderThumbnail?.(item, {
          width: isLarge ? 76 : 32,
          height: isLarge ? 60 : 32,
          view,
        })
      : null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        isLarge ? "h-16 w-20 rounded-lg" : "size-8 rounded-md",
        item.kind === "folder" ? "text-fg-brand" : "text-fg-muted",
        className
      )}
    >
      {preview ??
        (item.thumbnailUrl ? (
          // A generic file manager accepts arbitrary, often signed thumbnail
          // URLs; consuming products can replace this with renderThumbnail to
          // use their framework image pipeline.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            src={item.thumbnailUrl}
            className="size-full rounded-[inherit] border border-border-subtle bg-surface-floating object-cover shadow-control"
          />
        ) : custom ? (
          custom
        ) : item.kind === "folder" ? (
          <StorageUIFolderIcon className={cn(isLarge ? "h-11 w-14" : "h-4 w-5")} />
        ) : (
          <StorageUIFileTypeIcon item={item} className={cn(isLarge ? "size-11" : "size-5")} />
        ))}
      {pending ? (
        <span className="absolute inset-0 grid place-items-center bg-surface-floating/75">
          <span className="size-4 animate-spin rounded-full border-2 border-border border-t-fg-brand" />
        </span>
      ) : null}
    </span>
  );
}

export function useFileManager<TData>({
  items,
  currentFolderId,
  defaultCurrentFolderId = null,
  breadcrumbItems,
  onCurrentFolderChange,
  selectedIds,
  defaultSelectedIds = [],
  onSelectionChange,
  sort,
  defaultSort = DEFAULT_SORT,
  onSortChange,
  query,
  defaultQuery = "",
  onQueryChange,
  view,
  defaultView = "icon",
  onViewChange,
}: Pick<
  FileManagerProps<TData>,
  | "items"
  | "currentFolderId"
  | "defaultCurrentFolderId"
  | "breadcrumbItems"
  | "onCurrentFolderChange"
  | "selectedIds"
  | "defaultSelectedIds"
  | "onSelectionChange"
  | "sort"
  | "defaultSort"
  | "onSortChange"
  | "query"
  | "defaultQuery"
  | "onQueryChange"
  | "view"
  | "defaultView"
  | "onViewChange"
>) {
  const index = React.useMemo(() => createIndex(items), [items]);
  const foldersById = React.useMemo(() => {
    const next = new Map(index.byId);
    for (const folder of breadcrumbItems ?? []) next.set(folder.id, folder);
    return next;
  }, [breadcrumbItems, index.byId]);
  const [resolvedView, setView] = useControllableState(view, defaultView, onViewChange);
  const [resolvedFolderId, setFolderId] = useControllableState(
    currentFolderId,
    defaultCurrentFolderId,
    (next) => onCurrentFolderChange?.(next, next ? foldersById.get(next) ?? null : null)
  );
  const [resolvedSelectedIds, setSelectedIds] = useControllableState(
    selectedIds,
    defaultSelectedIds,
    (next) => onSelectionChange?.(next, next.flatMap((id) => {
      const item = index.byId.get(id);
      return item ? [item] : [];
    }))
  );
  const [resolvedSort, setSort] = useControllableState(sort, defaultSort, onSortChange);
  const [resolvedQuery, setQuery] = useControllableState(query, defaultQuery, onQueryChange);

  const selectedSet = React.useMemo(() => new Set(resolvedSelectedIds), [resolvedSelectedIds]);
  const selectedItems = React.useMemo(
    () => resolvedSelectedIds.flatMap((id) => {
      const item = index.byId.get(id);
      return item ? [item] : [];
    }),
    [index, resolvedSelectedIds]
  );

  const breadcrumbs = React.useMemo(() => {
    if (breadcrumbItems) return breadcrumbItems;
    const chain: FileManagerItem<TData>[] = [];
    let cursor = resolvedFolderId;
    while (cursor) {
      const item = foldersById.get(cursor);
      if (!item) break;
      chain.unshift(item);
      cursor = item.parentId;
    }
    return chain;
  }, [breadcrumbItems, foldersById, resolvedFolderId]);

  return {
    index,
    view: resolvedView,
    setView,
    currentFolderId: resolvedFolderId,
    currentFolder: resolvedFolderId ? foldersById.get(resolvedFolderId) ?? null : null,
    setCurrentFolderId: setFolderId,
    selectedIds: resolvedSelectedIds,
    selectedSet,
    selectedItems,
    setSelectedIds,
    sort: resolvedSort,
    setSort: setSort,
    query: resolvedQuery,
    setQuery,
    breadcrumbs,
  };
}

export function FileManager<TData>({
  items,
  view,
  defaultView = "icon",
  onViewChange,
  currentFolderId,
  defaultCurrentFolderId = null,
  breadcrumbItems,
  onCurrentFolderChange,
  selectionMode = "multiple",
  selectedIds,
  defaultSelectedIds = [],
  onSelectionChange,
  sort,
  defaultSort = DEFAULT_SORT,
  onSortChange,
  query,
  defaultQuery = "",
  onQueryChange,
  dataMode = "client",
  loading = false,
  loadingFolderIds,
  error,
  onError,
  onOpen,
  onRequestData,
  onRequestChildren,
  actions,
  getItemActions,
  renderIcon,
  renderThumbnail,
  renderDetails,
  renderEmptyState,
  renderErrorState,
  toolbarStart,
  toolbarEnd,
  columns,
  labels: labelsProp,
  showToolbar = true,
  showSearch = true,
  showSort = true,
  showViewSwitcher = true,
  showFileExtensions = true,
  className,
}: FileManagerProps<TData>) {
  const labels = { ...defaultFileManagerLabels, ...labelsProp };
  const manager = useFileManager({
    items,
    view,
    defaultView,
    onViewChange,
    currentFolderId,
    defaultCurrentFolderId,
    breadcrumbItems,
    onCurrentFolderChange,
    selectedIds,
    defaultSelectedIds,
    onSelectionChange,
    sort,
    defaultSort,
    onSortChange,
    query,
    defaultQuery,
    onQueryChange,
  });
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => new Set());
  const [selectionAnchor, setSelectionAnchor] = React.useState<string | null>(null);
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(() => new Set());
  const [dialog, setDialog] = React.useState<"create" | "rename" | "move" | null>(null);
  const [draftName, setDraftName] = React.useState("");
  const [destinationId, setDestinationId] = React.useState<string | null>(null);
  const requestControllers = React.useRef(new Map<string, AbortController>());
  const loadingFolders = React.useMemo(() => new Set(loadingFolderIds), [loadingFolderIds]);

  React.useEffect(() => () => {
    requestControllers.current.forEach((controller) => controller.abort());
    requestControllers.current.clear();
  }, []);

  const reportError = React.useCallback(
    (requestError: unknown, operation: string, folderId: string | null, affectedItems: FileManagerItem<TData>[] = []) => {
      onError?.(requestError, { operation, folderId, items: affectedItems });
    },
    [onError]
  );

  const matchesQuery = React.useCallback(
    (item: FileManagerItem<TData>) => {
      if (!manager.query.trim() || dataMode === "server") return true;
      return `${item.name} ${item.path ?? ""}`.toLocaleLowerCase().includes(manager.query.trim().toLocaleLowerCase());
    },
    [dataMode, manager.query]
  );

  const sortedChildren = React.useCallback(
    (parentId: string | null) =>
      [...(manager.index.children.get(parentId) ?? [])]
        .filter(matchesQuery)
        .sort((left, right) => compareItems(left, right, manager.sort)),
    [manager.index, manager.sort, matchesQuery]
  );

  const currentEntries = React.useMemo(
    () => sortedChildren(manager.currentFolderId),
    [manager.currentFolderId, sortedChildren]
  );

  const treeRows = React.useMemo(() => {
    const rows: TreeRow<TData>[] = [];
    const visit = (parentId: string | null, depth: number) => {
      for (const item of sortedChildren(parentId)) {
        const children = manager.index.children.get(item.id) ?? [];
        const hasChildren = item.kind === "folder" && (children.length > 0 || item.hasChildren === true);
        rows.push({ item, depth, hasChildren });
        if (hasChildren && expandedIds.has(item.id)) visit(item.id, depth + 1);
      }
    };
    visit(manager.currentFolderId, 0);
    return rows;
  }, [expandedIds, manager.currentFolderId, manager.index.children, sortedChildren]);

  const select = React.useCallback(
    (item: FileManagerItem<TData>, event?: Pick<React.MouseEvent, "metaKey" | "ctrlKey" | "shiftKey">, orderedItems = currentEntries) => {
      if (selectionMode === "none" || item.disabled) return;
      const toggling = event?.metaKey || event?.ctrlKey;
      const ranging = event?.shiftKey && selectionMode === "multiple" && selectionAnchor;
      let next: string[];
      if (ranging) {
        const start = orderedItems.findIndex((entry) => entry.id === selectionAnchor);
        const end = orderedItems.findIndex((entry) => entry.id === item.id);
        if (start !== -1 && end !== -1) {
          next = orderedItems.slice(Math.min(start, end), Math.max(start, end) + 1).map((entry) => entry.id);
        } else {
          next = [item.id];
        }
      } else if (toggling && selectionMode === "multiple") {
        next = manager.selectedSet.has(item.id)
          ? manager.selectedIds.filter((id) => id !== item.id)
          : [...manager.selectedIds, item.id];
        setSelectionAnchor(item.id);
      } else {
        next = [item.id];
        setSelectionAnchor(item.id);
      }
      manager.setSelectedIds(next);
    },
    [currentEntries, manager, selectionAnchor, selectionMode]
  );

  const requestData = React.useCallback(
    async (folderId: string | null, folder: FileManagerItem<TData> | null) => {
      if (!onRequestData) return false;
      const key = folderId ?? "__root__";
      requestControllers.current.get(key)?.abort();
      const controller = new AbortController();
      requestControllers.current.set(key, controller);
      try {
        await onRequestData({
          folderId,
          folder,
          query: manager.query,
          sort: manager.sort,
          signal: controller.signal,
        });
      } catch (requestError) {
        if (!controller.signal.aborted) reportError(requestError, "load", folderId, folder ? [folder] : []);
      } finally {
        if (requestControllers.current.get(key) === controller) requestControllers.current.delete(key);
      }
      return true;
    },
    [manager.query, manager.sort, onRequestData, reportError]
  );

  React.useEffect(() => {
    if (dataMode !== "server" || !onRequestData) return;
    void requestData(manager.currentFolderId, manager.currentFolder);
  }, [dataMode, manager.currentFolderId, onRequestData, requestData]);

  const requestChildren = React.useCallback(
    async (folder: FileManagerItem<TData>) => {
      if ((manager.index.children.get(folder.id)?.length ?? 0) > 0) return;
      if (await requestData(folder.id, folder)) return;
      if (!onRequestChildren || !folder.hasChildren) return;
      const key = folder.id;
      requestControllers.current.get(key)?.abort();
      const controller = new AbortController();
      requestControllers.current.set(key, controller);
      try {
        await onRequestChildren(folder, { signal: controller.signal });
      } catch (requestError) {
        if (!controller.signal.aborted) reportError(requestError, "load", folder.id, [folder]);
      } finally {
        if (requestControllers.current.get(key) === controller) requestControllers.current.delete(key);
      }
    },
    [manager.index.children, onRequestChildren, reportError, requestData]
  );

  const open = React.useCallback(
    (item: FileManagerItem<TData>) => {
      if (item.disabled) return;
      if (item.kind === "folder") {
        manager.setCurrentFolderId(item.id);
        if (dataMode !== "server") void requestChildren(item);
      }
      onOpen?.(item);
    },
    [dataMode, manager, onOpen, requestChildren]
  );

  const toggleExpanded = React.useCallback((item: FileManagerItem<TData>) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
    void requestChildren(item);
  }, [requestChildren]);

  const runAction = React.useCallback(async (key: string, task: () => void | Promise<void>) => {
    setPendingIds((current) => new Set(current).add(key));
    try {
      await task();
    } catch (actionError) {
      reportError(actionError, key, manager.currentFolderId, manager.selectedItems);
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }, [manager.currentFolderId, manager.selectedItems, reportError]);

  const openCreate = () => {
    setDraftName("");
    setDialog("create");
  };
  const openRename = () => {
    const item = manager.selectedItems[0];
    if (!item) return;
    setDraftName(item.name);
    setDialog("rename");
  };
  const openMove = () => {
    setDestinationId(manager.currentFolderId);
    setDialog("move");
  };

  const currentCustomActions = manager.selectedItems.length === 1
    ? getItemActions?.(manager.selectedItems[0]) ?? []
    : [];
  const defaultColumns: FileManagerColumn<TData>[] = [
    { id: "name", label: labels.name, sortable: true, value: (item) => displayName(item, showFileExtensions) },
    { id: "modifiedAt", label: labels.modified, sortable: true, width: "8rem", value: (item) => formatDate(item.modifiedAt) },
    { id: "kind", label: labels.kind, sortable: true, width: "7rem", value: kindLabel },
    { id: "size", label: labels.size, sortable: true, width: "5rem", className: "text-right", value: (item) => item.kind === "folder" ? "—" : formatSize(item.size) },
  ];
  const activeColumns = columns ?? defaultColumns;

  const actionContext: FileManagerActionContext<TData> = {
    items: manager.selectedItems,
    currentFolderId: manager.currentFolderId,
  };

  return (
    <section
      aria-label={labels.files}
      className={cn(
        "flex size-full min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-hidden bg-surface-floating text-fg-default",
        className
      )}
      data-slot="file-manager"
    >
      {showToolbar ? (
        <FileManagerToolbar
          labels={labels}
          manager={manager}
          showSearch={showSearch}
          showSort={showSort}
          showViewSwitcher={showViewSwitcher}
          toolbarStart={toolbarStart}
          toolbarEnd={toolbarEnd}
          hasCreate={Boolean(actions?.createFolder)}
          onCreate={openCreate}
          onRename={openRename}
          onMove={openMove}
          onRemove={() => actions?.remove && void runAction("remove", () => actions.remove!({ items: manager.selectedItems }))}
          onDownload={() => actions?.download && void runAction("download", () => actions.download!({ items: manager.selectedItems }))}
          customActions={currentCustomActions}
          actionContext={actionContext}
          runAction={runAction}
        />
      ) : null}
      <div className="relative min-h-0 flex-1">
        {error ? (
          renderErrorState?.(error) ?? <FileManagerState>{error}</FileManagerState>
        ) : loading ? (
          <FileManagerState>{labels.loading}</FileManagerState>
        ) : manager.view === "icon" ? (
          <IconView
            entries={currentEntries}
            selectedSet={manager.selectedSet}
            pendingIds={pendingIds}
            select={select}
            open={open}
            labels={labels}
            renderIcon={renderIcon}
            renderThumbnail={renderThumbnail}
            showFileExtensions={showFileExtensions}
          />
        ) : manager.view === "list" ? (
          <ListView
            rows={treeRows}
            columns={activeColumns}
            selectedSet={manager.selectedSet}
            pendingIds={pendingIds}
            select={select}
            open={open}
            toggleExpanded={toggleExpanded}
            expandedIds={expandedIds}
            labels={labels}
            renderIcon={renderIcon}
            renderThumbnail={renderThumbnail}
            showFileExtensions={showFileExtensions}
            sort={manager.sort}
            onSortChange={manager.setSort}
          />
        ) : (
          <ColumnView
            index={manager.index}
            breadcrumbs={manager.breadcrumbs}
            sortedChildren={sortedChildren}
            selectedSet={manager.selectedSet}
            pendingIds={pendingIds}
            select={select}
            open={open}
            labels={labels}
            renderIcon={renderIcon}
            renderThumbnail={renderThumbnail}
            renderDetails={renderDetails}
            showFileExtensions={showFileExtensions}
            loadingFolders={loadingFolders}
          />
        )}
        {!loading && !error && currentEntries.length === 0 ? (
          renderEmptyState?.() ?? (
            <FileManagerState>
              {manager.query.trim() ? labels.noResults : labels.emptyFolder}
            </FileManagerState>
          )
        ) : null}
      </div>
      <FileManagerDialog
        dialog={dialog}
        onDialogChange={(open) => !open && setDialog(null)}
        labels={labels}
        draftName={draftName}
        onDraftNameChange={setDraftName}
        folders={items.filter((item) => item.kind === "folder")}
        destinationId={destinationId}
        onDestinationChange={setDestinationId}
        selection={manager.selectedItems}
        currentFolderId={manager.currentFolderId}
        isInvalidDestination={(id) => manager.selectedItems.some((item) => isItemOrDescendant(id, item.id, manager.index))}
        onConfirm={() => {
          if (dialog === "create" && actions?.createFolder && draftName.trim()) {
            void runAction("create", async () => {
              await actions.createFolder!({ parentId: manager.currentFolderId, name: draftName.trim() });
              setDialog(null);
            });
          }
          if (dialog === "rename" && actions?.rename && manager.selectedItems[0] && draftName.trim()) {
            void runAction(`rename:${manager.selectedItems[0].id}`, async () => {
              await actions.rename!({ item: manager.selectedItems[0], name: draftName.trim() });
              setDialog(null);
            });
          }
          if (dialog === "move" && actions?.move) {
            void runAction("move", async () => {
              await actions.move!({ items: manager.selectedItems, destinationId });
              setDialog(null);
            });
          }
        }}
      />
    </section>
  );
}

function FileManagerToolbar<TData>({
  labels,
  manager,
  showSearch,
  showSort,
  showViewSwitcher,
  toolbarStart,
  toolbarEnd,
  hasCreate,
  onCreate,
  onRename,
  onMove,
  onRemove,
  onDownload,
  customActions,
  actionContext,
  runAction,
}: {
  labels: FileManagerLabels;
  manager: ReturnType<typeof useFileManager<TData>>;
  showSearch: boolean;
  showSort: boolean;
  showViewSwitcher: boolean;
  toolbarStart?: React.ReactNode;
  toolbarEnd?: React.ReactNode;
  hasCreate: boolean;
  onCreate: () => void;
  onRename: () => void;
  onMove: () => void;
  onRemove: () => void;
  onDownload: () => void;
  customActions: ReturnType<NonNullable<FileManagerProps<TData>["getItemActions"]>>;
  actionContext: FileManagerActionContext<TData>;
  runAction: (key: string, task: () => void | Promise<void>) => Promise<void>;
}) {
  const SearchIcon = useIcon("search");
  const SortIcon = useIcon("chevrons-up-down");
  const PlusIcon = useIcon("plus");
  const PencilIcon = useIcon("pencil");
  const TrashIcon = useIcon("trash");
  const DownloadIcon = useIcon("arrow-right");
  const MoveIcon = useIcon("corner-down-right");
  const GridIcon = useIcon("doc-data-grid");
  const ListIcon = useIcon("list");
  const ColumnsIcon = useIcon("doc-page-layout");
  const hasSelection = manager.selectedItems.length > 0;
  const viewOptions: Array<{ value: FileManagerView; label: string; Icon: IconComponent }> = [
    { value: "icon", label: labels.iconView, Icon: GridIcon },
    { value: "list", label: labels.listView, Icon: ListIcon },
    { value: "column", label: labels.columnView, Icon: ColumnsIcon },
  ];

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface-raised px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {toolbarStart ?? <Breadcrumb labels={labels} manager={manager} />}
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        {showSearch ? (
          <label className="relative hidden w-44 sm:block">
            <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" />
            <Input
              aria-label={labels.search}
              className="pl-8"
              placeholder={labels.search}
              value={manager.query}
              onChange={(event) => manager.setQuery(event.target.value)}
            />
          </label>
        ) : null}
        {showSort ? (
          <Select
            value={manager.sort.field}
            onValueChange={(field) => manager.setSort({ field, direction: manager.sort.direction })}
          >
            <SelectTrigger aria-label={labels.sort} className="w-36" icon={SortIcon} />
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="modifiedAt">Modified</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
        {showViewSwitcher ? (
          <Tabs
            aria-label="View mode"
            color="neutral"
            value={manager.view}
            variant="segment"
            onValueChange={(value) => manager.setView(value as FileManagerView)}
          >
            <TabsList labelVisibility="active">
              {viewOptions.map(({ value, label, Icon }) => (
                <TabItem key={value} icon={Icon} label={label} value={value} />
              ))}
            </TabsList>
          </Tabs>
        ) : null}
        {hasCreate ? (
          <Button leadingIcon={PlusIcon} variant="primary" onClick={onCreate}>
            {labels.newFolder}
          </Button>
        ) : null}
        {hasSelection ? (
          <>
            <Button aria-label={labels.download} iconOnly title={labels.download} variant="ghost" onClick={onDownload}>
              <DownloadIcon size={16} className="rotate-90" />
            </Button>
            <Button aria-label={labels.move} iconOnly title={labels.move} variant="ghost" onClick={onMove}>
              <MoveIcon size={16} />
            </Button>
            {manager.selectedItems.length === 1 ? (
              <Button aria-label={labels.rename} iconOnly title={labels.rename} variant="ghost" onClick={onRename}>
                <PencilIcon size={16} />
              </Button>
            ) : null}
            <Button aria-label={labels.remove} iconOnly title={labels.remove} variant="ghost" className="text-fg-danger hover:text-fg-danger" onClick={onRemove}>
              <TrashIcon size={16} />
            </Button>
            {customActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.id}
                  aria-label={action.label}
                  disabled={action.disabled}
                  iconOnly
                  title={action.label}
                  variant="ghost"
                  onClick={() => void runAction(action.id, () => action.onAction(actionContext))}
                >
                  {ActionIcon ? <ActionIcon size={16} /> : <span className="text-label">{action.label.slice(0, 1)}</span>}
                </Button>
              );
            })}
          </>
        ) : null}
        {toolbarEnd}
      </div>
    </header>
  );
}

function Breadcrumb<TData>({ labels, manager }: { labels: FileManagerLabels; manager: ReturnType<typeof useFileManager<TData>> }) {
  const ChevronRight = useIcon("chevron-right");
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-body">
      <button
        type="button"
        className="shrink-0 rounded-md px-1 text-fg-muted outline-none transition-colors hover:bg-hover hover:text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring"
        onClick={() => manager.setCurrentFolderId(null)}
      >
        {labels.root}
      </button>
      {manager.breadcrumbs.map((folder) => (
        <React.Fragment key={folder.id}>
          <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-fg-subtle" />
          <button
            type="button"
            className="min-w-0 truncate rounded-md px-1 text-fg-default outline-none transition-colors hover:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring"
            onClick={() => manager.setCurrentFolderId(folder.id)}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

function IconView<TData>({
  entries,
  selectedSet,
  pendingIds,
  select,
  open,
  labels,
  renderIcon,
  renderThumbnail,
  showFileExtensions,
}: {
  entries: FileManagerItem<TData>[];
  selectedSet: Set<string>;
  pendingIds: Set<string>;
  select: (item: FileManagerItem<TData>, event?: React.MouseEvent, orderedItems?: FileManagerItem<TData>[]) => void;
  open: (item: FileManagerItem<TData>) => void;
  labels: FileManagerLabels;
  renderIcon?: FileManagerProps<TData>["renderIcon"];
  renderThumbnail?: FileManagerProps<TData>["renderThumbnail"];
  showFileExtensions: boolean;
}) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = React.useState(1);
  React.useLayoutEffect(() => {
    const element = parentRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const update = () => {
      // 104px is the visual minimum tile width from the source explorer;
      // the measured count keeps virtual row math aligned with CSS layout.
      setColumnCount(Math.max(1, Math.floor((element.clientWidth - 24 + 4) / 108)));
    };
    const observer = new ResizeObserver(update);
    update();
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const rowCount = Math.ceil(entries.length / columnCount);
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 108,
    overscan: 4,
  });
  const itemRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const selectAndFocus = (index: number) => {
    const item = entries[index];
    if (!item) return;
    select(item, undefined, entries);
    requestAnimationFrame(() => itemRefs.current.get(item.id)?.focus());
  };

  return (
    <div
      ref={parentRef}
      aria-label={labels.files}
      className="h-full overflow-auto p-3 outline-none"
      role="grid"
      tabIndex={0}
      onKeyDown={(event) => {
        const activeIndex = entries.findIndex((item) => selectedSet.has(item.id));
        if (event.key === "Enter" && activeIndex >= 0) {
          event.preventDefault();
          open(entries[activeIndex]);
          return;
        }
        const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columnCount, ArrowDown: columnCount };
        if (event.key in deltas) {
          event.preventDefault();
          selectAndFocus(Math.max(0, Math.min(entries.length - 1, (activeIndex < 0 ? 0 : activeIndex) + deltas[event.key])));
        }
      }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowItems = entries.slice(virtualRow.index * columnCount, virtualRow.index * columnCount + columnCount);
          return (
            <div
              key={virtualRow.key}
              className="absolute inset-x-0 grid gap-x-1 gap-y-3"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowItems.map((item) => {
                const selected = selectedSet.has(item.id);
                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      if (node) itemRefs.current.set(item.id, node);
                      else itemRefs.current.delete(item.id);
                    }}
                    type="button"
                    role="gridcell"
                    aria-selected={selected}
                    className={cn(
                      "group flex h-[96px] min-w-0 flex-col items-center gap-1.5 rounded-lg px-1 py-1 outline-none transition-colors duration-fast hover:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring",
                      selected && "bg-selection"
                    )}
                    onClick={(event) => select(item, event, entries)}
                    onDoubleClick={() => open(item)}
                  >
                    <FileItemVisual
                      item={item}
                      pending={pendingIds.has(item.id)}
                      renderIcon={renderIcon}
                      renderThumbnail={renderThumbnail}
                      selected={selected}
                      view="icon"
                    />
                    <span className={cn("line-clamp-2 max-w-full rounded-sm px-1 text-center text-label leading-4", selected ? "font-medium text-fg-default" : "text-fg-default")}>
                      {displayName(item, showFileExtensions)}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView<TData>({
  rows,
  columns,
  selectedSet,
  pendingIds,
  select,
  open,
  toggleExpanded,
  expandedIds,
  labels,
  renderIcon,
  renderThumbnail,
  showFileExtensions,
  sort,
  onSortChange,
}: {
  rows: TreeRow<TData>[];
  columns: FileManagerColumn<TData>[];
  selectedSet: Set<string>;
  pendingIds: Set<string>;
  select: (item: FileManagerItem<TData>, event?: React.MouseEvent, orderedItems?: FileManagerItem<TData>[]) => void;
  open: (item: FileManagerItem<TData>) => void;
  toggleExpanded: (item: FileManagerItem<TData>) => void;
  expandedIds: Set<string>;
  labels: FileManagerLabels;
  renderIcon?: FileManagerProps<TData>["renderIcon"];
  renderThumbnail?: FileManagerProps<TData>["renderThumbnail"];
  showFileExtensions: boolean;
  sort: FileManagerSort;
  onSortChange: (sort: FileManagerSort) => void;
}) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const gridTemplateColumns = React.useMemo(
    () => columns.map((column, index) => index === 0 ? "minmax(15rem, 1fr)" : column.width ?? "minmax(8rem, 1fr)").join(" "),
    [columns]
  );
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 12,
  });
  const ChevronRight = useIcon("chevron-right");
  const treeItems = rows.map((row) => row.item);
  const moveFocus = (offset: number) => {
    const selectedIndex = rows.findIndex((row) => selectedSet.has(row.item.id));
    const nextIndex = Math.max(0, Math.min(rows.length - 1, (selectedIndex < 0 ? 0 : selectedIndex) + offset));
    const next = rows[nextIndex]?.item;
    if (next) select(next, undefined, treeItems);
  };

  return (
    <div className="flex h-full min-h-0 flex-col" role="treegrid" aria-label={labels.files}>
      <div className="grid shrink-0 border-b border-border bg-surface-raised px-3 text-label text-fg-muted" style={{ gridTemplateColumns }}>
        {columns.map((column) => (
          <button
            key={column.id}
            type="button"
            disabled={column.sortable === false}
            className={cn("flex h-7 items-center gap-1 text-left font-medium outline-none hover:text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring disabled:pointer-events-none", column.className)}
            onClick={() => {
              const sameField = sort.field === column.id;
              onSortChange({ field: column.id, direction: sameField && sort.direction === "asc" ? "desc" : "asc" });
            }}
          >
            {column.label}
            {sort.field === column.id ? <span aria-hidden="true">{sort.direction === "asc" ? "↑" : "↓"}</span> : null}
          </button>
        ))}
      </div>
      <div
        ref={parentRef}
        className="min-h-0 flex-1 overflow-auto outline-none"
        tabIndex={0}
        onKeyDown={(event) => {
          const currentIndex = rows.findIndex((row) => selectedSet.has(row.item.id));
          const current = rows[currentIndex];
          if (event.key === "ArrowDown") { event.preventDefault(); moveFocus(1); }
          if (event.key === "ArrowUp") { event.preventDefault(); moveFocus(-1); }
          if (event.key === "Enter" && current) { event.preventDefault(); open(current.item); }
          if (event.key === "ArrowRight" && current?.hasChildren) { event.preventDefault(); if (!expandedIds.has(current.item.id)) toggleExpanded(current.item); }
          if (event.key === "ArrowLeft" && current?.hasChildren) { event.preventDefault(); if (expandedIds.has(current.item.id)) toggleExpanded(current.item); }
        }}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const item = row.item;
            const selected = selectedSet.has(item.id);
            return (
              <div
                key={item.id}
                aria-expanded={row.hasChildren ? expandedIds.has(item.id) : undefined}
                aria-level={row.depth + 1}
                aria-selected={selected}
                className={cn(
                  "absolute inset-x-0 grid h-10 items-center border-b border-border-subtle px-3 text-body outline-none transition-colors duration-fast hover:bg-hover focus-within:bg-hover",
                  selected && "bg-selection"
                )}
                role="row"
                style={{ gridTemplateColumns, transform: `translateY(${virtualRow.start}px)` }}
                onDoubleClick={() => open(item)}
              >
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-1.5 rounded-sm text-left outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
                  role="gridcell"
                  onClick={(event) => select(item, event, treeItems)}
                >
                  <span style={{ width: row.depth * 16 }} />
                  {row.hasChildren ? (
                    <span
                      role="button"
                      aria-label={expandedIds.has(item.id) ? "Collapse folder" : "Expand folder"}
                      tabIndex={-1}
                      className="grid size-4 shrink-0 place-items-center rounded text-fg-subtle hover:bg-active"
                      onClick={(event) => { event.stopPropagation(); toggleExpanded(item); }}
                    >
                      <ChevronRight className={cn("size-3 transition-transform duration-fast", expandedIds.has(item.id) && "rotate-90")} />
                    </span>
                  ) : <span className="size-4 shrink-0" />}
                  <FileItemVisual item={item} pending={pendingIds.has(item.id)} renderIcon={renderIcon} renderThumbnail={renderThumbnail} selected={selected} view="list" />
                  <span className="truncate font-medium text-fg-default">{displayName(item, showFileExtensions)}</span>
                </button>
                {columns.slice(1).map((column) => (
                  <span key={column.id} role="gridcell" className={cn("truncate text-sm text-fg-muted", column.className)}>{column.value(item)}</span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ColumnView<TData>({
  index,
  breadcrumbs,
  sortedChildren,
  selectedSet,
  pendingIds,
  select,
  open,
  labels,
  renderIcon,
  renderThumbnail,
  renderDetails,
  showFileExtensions,
  loadingFolders,
}: {
  index: FileManagerIndex<TData>;
  breadcrumbs: FileManagerItem<TData>[];
  sortedChildren: (parentId: string | null) => FileManagerItem<TData>[];
  selectedSet: Set<string>;
  pendingIds: Set<string>;
  select: (item: FileManagerItem<TData>, event?: React.MouseEvent, orderedItems?: FileManagerItem<TData>[]) => void;
  open: (item: FileManagerItem<TData>) => void;
  labels: FileManagerLabels;
  renderIcon?: FileManagerProps<TData>["renderIcon"];
  renderThumbnail?: FileManagerProps<TData>["renderThumbnail"];
  renderDetails?: FileManagerProps<TData>["renderDetails"];
  showFileExtensions: boolean;
  loadingFolders: Set<string>;
}) {
  const folders = [null, ...breadcrumbs.map((folder) => folder.id)];
  const breadcrumbById = React.useMemo(() => new Map(breadcrumbs.map((folder) => [folder.id, folder])), [breadcrumbs]);
  const selection = Array.from(selectedSet).map((id) => index.byId.get(id)).find(Boolean) ?? null;
  const ChevronRight = useIcon("chevron-right");

  return (
    <div className="flex h-full min-w-max overflow-auto" aria-label={labels.files} role="group">
      {folders.map((folderId) => {
        const columnItems = sortedChildren(folderId);
        const folder = folderId ? index.byId.get(folderId) ?? breadcrumbById.get(folderId) : null;
        return (
          <section key={folderId ?? "root"} aria-label={folder?.name ?? labels.root} className="flex w-60 shrink-0 flex-col border-r border-border last:border-r-0">
            <header className="flex h-8 items-center border-b border-border bg-surface-raised px-2 text-label font-medium text-fg-muted">
              <span className="truncate">{folder?.name ?? labels.root}</span>
              {folderId && loadingFolders.has(folderId) ? <span className="ml-auto size-3 animate-spin rounded-full border border-border border-t-fg-brand" /> : null}
            </header>
            <div className="min-h-0 flex-1 overflow-auto p-1" role="listbox">
              {columnItems.map((item) => {
                const selected = selectedSet.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn("flex h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left outline-none transition-colors duration-fast hover:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring", selected && "bg-selection")}
                    onClick={(event) => select(item, event, columnItems)}
                    onDoubleClick={() => open(item)}
                  >
                    <FileItemVisual item={item} pending={pendingIds.has(item.id)} renderIcon={renderIcon} renderThumbnail={renderThumbnail} selected={selected} view="column" />
                    <span className="min-w-0 flex-1 truncate text-label text-fg-default">{displayName(item, showFileExtensions)}</span>
                    {item.kind === "folder" ? <ChevronRight className="size-3.5 shrink-0 text-fg-subtle" /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {selection ? (
        <aside className="w-72 shrink-0 overflow-auto bg-surface-raised p-4" aria-label={labels.details}>
          {renderDetails?.(selection) ?? <FileDetails item={selection} labels={labels} renderIcon={renderIcon} renderThumbnail={renderThumbnail} />}
        </aside>
      ) : null}
    </div>
  );
}

function FileDetails<TData>({
  item,
  labels,
  renderIcon,
  renderThumbnail,
}: {
  item: FileManagerItem<TData>;
  labels: FileManagerLabels;
  renderIcon?: FileManagerProps<TData>["renderIcon"];
  renderThumbnail?: FileManagerProps<TData>["renderThumbnail"];
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <FileItemVisual item={item} pending={false} renderIcon={renderIcon} renderThumbnail={renderThumbnail} selected={false} view="icon" />
      <div className="min-w-0">
        <p className="wrap-break-word text-body font-medium text-fg-default">{item.name}</p>
        <p className="mt-1 text-label text-fg-muted">{kindLabel(item)}</p>
      </div>
      <dl className="w-full divide-y divide-border-subtle border-y border-border-subtle text-left text-label">
        <DetailRow label={labels.size} value={item.kind === "folder" ? "—" : formatSize(item.size)} />
        <DetailRow label={labels.modified} value={formatDate(item.modifiedAt)} />
        {item.path ? <DetailRow label="Path" value={item.path} /> : null}
      </dl>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex gap-3 py-2"><dt className="shrink-0 text-fg-subtle">{label}</dt><dd className="min-w-0 break-words text-right text-fg-default">{value}</dd></div>;
}

function FileManagerState({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 grid place-items-center p-8 text-center text-body text-fg-muted">{children}</div>;
}

function FileManagerDialog<TData>({
  dialog,
  onDialogChange,
  labels,
  draftName,
  onDraftNameChange,
  folders,
  destinationId,
  onDestinationChange,
  selection,
  currentFolderId,
  isInvalidDestination,
  onConfirm,
}: {
  dialog: "create" | "rename" | "move" | null;
  onDialogChange: (open: boolean) => void;
  labels: FileManagerLabels;
  draftName: string;
  onDraftNameChange: (value: string) => void;
  folders: FileManagerItem<TData>[];
  destinationId: string | null;
  onDestinationChange: (id: string | null) => void;
  selection: FileManagerItem<TData>[];
  currentFolderId: string | null;
  isInvalidDestination: (id: string | null) => boolean;
  onConfirm: () => void;
}) {
  if (!dialog) return null;
  const isMove = dialog === "move";
  const title = isMove ? labels.move : dialog === "rename" ? labels.rename : labels.newFolder;
  const valid = isMove ? !isInvalidDestination(destinationId) : draftName.trim().length > 0;
  return (
    <Dialog open onOpenChange={onDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isMove ? `Move ${selection.length} selected item${selection.length === 1 ? "" : "s"}.` : dialog === "rename" ? "Choose a new name for this item." : "Create a folder in the current location."}
          </DialogDescription>
        </DialogHeader>
        {isMove ? (
          <label className="grid gap-1.5 text-label text-fg-muted">
            Destination
            <select
              value={destinationId ?? ""}
              className="h-control-md rounded-lg border border-border bg-transparent px-2 text-body text-fg-default outline-none hover:border-input-hover focus-visible:ring-1 focus-visible:ring-focus-ring"
              onChange={(event) => onDestinationChange(event.target.value || null)}
            >
              <option value="">{labels.root}</option>
              {folders.filter((folder) => folder.id !== currentFolderId).map((folder) => (
                <option key={folder.id} disabled={isInvalidDestination(folder.id)} value={folder.id}>{folder.path ?? folder.name}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="grid gap-1.5 text-label text-fg-muted">
            {labels.folderName}
            <Input autoFocus value={draftName} onChange={(event) => onDraftNameChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && valid) onConfirm(); }} />
          </label>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onDialogChange(false)}>{labels.cancel}</Button>
          <Button disabled={!valid} onClick={onConfirm}>{isMove ? labels.move : dialog === "rename" ? labels.rename : labels.create}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

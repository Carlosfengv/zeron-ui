import type { ReactNode } from "react";
import type { IconComponent } from "@zeron/ui/system/icon-context";

export type FileManagerItemKind = "file" | "folder";
export type FileManagerView = "icon" | "list" | "column";
export type FileManagerSelectionMode = "none" | "single" | "multiple";
export type FileManagerDataMode = "client" | "server";

export interface FileManagerItem<TData = unknown> {
  /** A stable, tree-wide identifier. Paths are display data, never identity. */
  id: string;
  kind: FileManagerItemKind;
  name: string;
  parentId: string | null;
  path?: string;
  mimeType?: string;
  extension?: string;
  size?: number;
  createdAt?: Date | string;
  modifiedAt?: Date | string;
  thumbnailUrl?: string | null;
  /** True when the directory has unloaded children. */
  hasChildren?: boolean;
  disabled?: boolean;
  data?: TData;
}

export interface FileManagerSort {
  field: "name" | "kind" | "size" | "createdAt" | "modifiedAt" | string;
  direction: "asc" | "desc";
}

/** The request shape for a product-owned, server-backed file listing. */
export interface FileManagerDataRequest<TData = unknown> {
  folderId: string | null;
  /** Present when the folder is available in the client cache or breadcrumb trail. */
  folder: FileManagerItem<TData> | null;
  query: string;
  sort: FileManagerSort;
  signal: AbortSignal;
}

export interface FileManagerErrorContext<TData = unknown> {
  operation: "load" | "create" | "rename" | "move" | "remove" | "download" | string;
  folderId: string | null;
  items: FileManagerItem<TData>[];
}

export interface FileItemRenderState {
  selected: boolean;
  pending: boolean;
  view: FileManagerView;
}

export interface FileManagerActionContext<TData = unknown> {
  items: FileManagerItem<TData>[];
  currentFolderId: string | null;
}

export interface FileManagerActions<TData = unknown> {
  createFolder?: (input: {
    parentId: string | null;
    name: string;
  }) => void | Promise<void>;
  rename?: (input: {
    item: FileManagerItem<TData>;
    name: string;
  }) => void | Promise<void>;
  move?: (input: {
    items: FileManagerItem<TData>[];
    destinationId: string | null;
  }) => void | Promise<void>;
  remove?: (input: { items: FileManagerItem<TData>[] }) => void | Promise<void>;
  download?: (input: { items: FileManagerItem<TData>[] }) => void | Promise<void>;
}

export interface FileManagerCustomAction<TData = unknown> {
  id: string;
  label: string;
  icon?: IconComponent;
  disabled?: boolean;
  onAction: (context: FileManagerActionContext<TData>) => void | Promise<void>;
}

export interface FileManagerColumn<TData = unknown> {
  id: string;
  label: string;
  /** CSS grid track width in List View. The first column always fills remaining space. */
  width?: string;
  className?: string;
  sortable?: boolean;
  value: (item: FileManagerItem<TData>) => ReactNode;
}

export interface FileManagerLabels {
  files: string;
  search: string;
  sort: string;
  iconView: string;
  listView: string;
  columnView: string;
  newFolder: string;
  folderName: string;
  create: string;
  cancel: string;
  rename: string;
  move: string;
  remove: string;
  download: string;
  name: string;
  kind: string;
  modified: string;
  size: string;
  emptyFolder: string;
  noResults: string;
  loading: string;
  root: string;
  details: string;
}

export const defaultFileManagerLabels: FileManagerLabels = {
  files: "Files",
  search: "Search files",
  sort: "Sort",
  iconView: "Icon view",
  listView: "List view",
  columnView: "Column view",
  newFolder: "New folder",
  folderName: "Folder name",
  create: "Create",
  cancel: "Cancel",
  rename: "Rename",
  move: "Move",
  remove: "Delete",
  download: "Download",
  name: "Name",
  kind: "Kind",
  modified: "Modified",
  size: "Size",
  emptyFolder: "This folder is empty.",
  noResults: "No matching files.",
  loading: "Loading files…",
  root: "Files",
  details: "Details",
};

export interface FileManagerProps<TData = unknown> {
  items: FileManagerItem<TData>[];
  view?: FileManagerView;
  defaultView?: FileManagerView;
  onViewChange?: (view: FileManagerView) => void;
  currentFolderId?: string | null;
  defaultCurrentFolderId?: string | null;
  /**
   * Ordered root-to-current folder trail for server responses that do not keep
   * every ancestor in `items`. Include the current folder as the final entry.
   */
  breadcrumbItems?: FileManagerItem<TData>[];
  onCurrentFolderChange?: (
    folderId: string | null,
    folder: FileManagerItem<TData> | null
  ) => void;
  selectionMode?: FileManagerSelectionMode;
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[], items: FileManagerItem<TData>[]) => void;
  sort?: FileManagerSort;
  defaultSort?: FileManagerSort;
  onSortChange?: (sort: FileManagerSort) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  dataMode?: FileManagerDataMode;
  loading?: boolean;
  loadingFolderIds?: Iterable<string>;
  error?: ReactNode;
  /** Receives rejected fetches and mutations; the Block never leaves them unhandled. */
  onError?: (error: unknown, context: FileManagerErrorContext<TData>) => void;
  onOpen?: (item: FileManagerItem<TData>) => void;
  /**
   * Fetches one directory from a server. In server mode it runs for the
   * current directory whenever its folder, query, or sort changes.
   */
  onRequestData?: (
    request: FileManagerDataRequest<TData>
  ) => void | Promise<void>;
  /** @deprecated Prefer onRequestData, which also receives query and sort. */
  onRequestChildren?: (
    folder: FileManagerItem<TData>,
    options: { signal: AbortSignal }
  ) => void | Promise<void>;
  actions?: FileManagerActions<TData>;
  getItemActions?: (
    item: FileManagerItem<TData>
  ) => FileManagerCustomAction<TData>[];
  renderIcon?: (
    item: FileManagerItem<TData>,
    state: FileItemRenderState
  ) => ReactNode;
  renderThumbnail?: (
    item: FileManagerItem<TData>,
    options: { width: number; height: number; view: FileManagerView }
  ) => ReactNode;
  renderDetails?: (item: FileManagerItem<TData>) => ReactNode;
  renderEmptyState?: () => ReactNode;
  renderErrorState?: (error: ReactNode) => ReactNode;
  toolbarStart?: ReactNode;
  toolbarEnd?: ReactNode;
  columns?: FileManagerColumn<TData>[];
  labels?: Partial<FileManagerLabels>;
  showToolbar?: boolean;
  showSearch?: boolean;
  showSort?: boolean;
  showViewSwitcher?: boolean;
  showFileExtensions?: boolean;
  className?: string;
}

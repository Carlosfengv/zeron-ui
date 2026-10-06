import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface FileUploadItem {
  id: string;
  name: string;
  size: number;
  uploadedBytes: number;
  status: "queued" | "uploading" | "complete" | "error";
  error?: string;
}

export interface FileUploadLabels {
  title: string;
  drop: string;
  browse: string;
  maxSize: (size: string) => string;
  complete: string;
  uploading: string;
  uploadingAction: string;
  queued: string;
  failed: string;
  removeAll: string;
  remove: (name: string) => string;
  cancel: (name: string) => string;
  retry: (name: string) => string;
  done: string;
  tooLarge: (name: string, size: string) => string;
  selectionFailed: string;
}

export interface FileUploadProps extends Omit<ComponentPropsWithoutRef<"div">, "onDrop" | "onError"> {
  /** Controlled queue. The host owns transport, progress, completion and cancellation. */
  items: readonly FileUploadItem[];
  onFilesSelected?: (files: File[]) => void | Promise<void>;
  onRemove?: (id: string) => void;
  onRemoveAll?: () => void;
  onRetry?: (id: string) => void;
  onDone?: () => void;
  maxFileSize?: number;
  disabled?: boolean;
  labels?: Partial<FileUploadLabels>;
  /** Optional host-owned menu. No inert menu is rendered when omitted. */
  footerActions?: ReactNode;
}

import type { HTMLAttributes, ReactNode, RefObject } from "react";
import type { ChatMessageBranch, ChatMessageFile, ChatMessageMetrics } from "#components/chat-message";
import type { MessageNavigationBookmarkLabels } from "#components/message-navigation";

/** @deprecated Compatibility type alias. Use ChatMessageFile from @zeron/ui/chat-message. */
export type ChatFile = ChatMessageFile;

/** @deprecated Compatibility type alias. Use ChatMessageBranch from @zeron/ui/chat-message. */
export type ChatBranch = ChatMessageBranch;
/** @deprecated Compatibility type alias. Use ChatMessageMetrics from @zeron/ui/chat-message. */
export type ChatResponseMetrics = ChatMessageMetrics;

export interface ChatCheckpointData {
  id: string;
  label?: string;
  files?: readonly string[];
}

export interface ChatRestoreResult {
  /** Restore the host's complete snapshot, including draft, files and queue. */
  undo?: () => void | Promise<void>;
}

export interface ChatThreadLabels {
  conversation: string;
  navigation: string;
  empty: string;
  loadOlder: string;
  loadingOlder: string;
  loadFailed: string;
  latest: string;
  copy: string;
  copied: string;
  copyFailed: string;
  edit: string;
  cancel: string;
  save: string;
  saveFailed: string;
  retry: string;
  stopped: string;
  good: string;
  bad: string;
  rated: string;
  previous: string;
  next: string;
  checkpoint: string;
  restore: string;
  restoreTitle: string;
  restoreCode: string;
  restoreConversation: string;
  restoring: string;
  restored: string;
  restoreFailed: string;
  undo: string;
  undone: string;
  undoFailed: string;
  streaming: string;
  message: (index: number, text: string) => string;
  version: (index: number, count: number) => string;
  changedFiles: (count: number) => string;
  restoreImpact: (messages: number, files: number) => string;
}

/** Conversation-level slots and coordination; message data and persistence belong to the host. */
export interface ChatThreadProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Registered ChatUserMessage/ChatAssistantMessage entries, optionally separated by ChatDivider. */
  children?: ReactNode;
  /** Host-owned input UI. Its DOM identity is retained across empty/message states. */
  composer: ReactNode;
  empty?: ReactNode;
  busy?: boolean;
  hasOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void | Promise<void>;
  /** Logical user-message IDs; the host owns bookmark persistence. */
  bookmarkedIds?: readonly string[];
  onBookmarkChange?: (messageId: string, bookmarked: boolean) => void;
  bookmarkLabels?: Partial<MessageNavigationBookmarkLabels>;
  /** Resolve only after the host has committed the restore; reject on failure. */
  onRestore?: (
    checkpointId: string,
    options: { code: boolean },
  ) => void | ChatRestoreResult | Promise<void | ChatRestoreResult>;
  composerRef?: RefObject<HTMLTextAreaElement | null>;
  labels?: Partial<ChatThreadLabels>;
  locale?: string;
}

export interface ChatUserMessageProps
  extends Omit<HTMLAttributes<HTMLElement>, "id" | "onChange"> {
  id: string;
  text: string;
  files?: readonly ChatMessageFile[];
  attachments?: ReactNode;
  time?: Date;
  pin?: boolean;
  branch?: ChatMessageBranch;
  checkpoint?: ChatCheckpointData;
  onEdit?: (text: string) => void | Promise<void>;
}

export interface ChatAssistantMessageProps
  extends Omit<HTMLAttributes<HTMLElement>, "id" | "children"> {
  id: string;
  children?: ReactNode;
  text?: string;
  streaming?: boolean;
  last?: boolean;
  /** Additional metadata beside the response actions and metrics. */
  meta?: ReactNode;
  /** Snapshot of the model used for this response, displayed above its content. */
  model?: string;
  modelLogo?: ReactNode;
  provider?: string;
  metrics?: ChatMessageMetrics;
  branch?: ChatMessageBranch;
  feedback?: "up" | "down" | null;
  onFeedback?: (feedback: "up" | "down" | null) => void;
  onRetry?: () => void;
  error?: string | null;
  stopped?: boolean;
}

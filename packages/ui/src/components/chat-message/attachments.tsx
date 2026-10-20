"use client";

import { FileThumbnail } from "#components/file-thumbnail";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";

function safeFileUrl(url?: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, "https://local.invalid");
    return ["http:", "https:", "blob:"].includes(parsed.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

export interface ChatMessageFile {
  id: string;
  name: string;
  /** File size in bytes. */
  size?: number;
  type?: string;
  /** HTTP(S), blob or relative URL; other protocols are ignored. */
  url?: string;
}

export interface ChatMessageAttachmentProps {
  file: ChatMessageFile | File;
  /** Shared square size for image previews and file icons. */
  thumbnailSize?: number;
}

export interface ChatMessageAttachmentsProps {
  files: readonly (ChatMessageFile | File)[];
  align?: "start" | "end";
  label?: string;
  thumbnailSize?: number;
}

function isLocalFile(file: ChatMessageFile | File): file is File {
  return "lastModified" in file;
}

/** One border owns the preview and visible file details, for local and persisted files. */
export function ChatMessageAttachment({ file, thumbnailSize = 64 }: ChatMessageAttachmentProps) {
  const FileIcon = useIcon("file");
  const local = isLocalFile(file);
  const url = local ? undefined : safeFileUrl(file.url);
  const image = file.type?.startsWith("image/") && url;
  const body = (
    <span data-slot="chat-message-attachment" className="flex min-w-0 max-w-64 items-center gap-3 rounded-lg border border-border bg-surface-raised p-2 text-label">
      <span data-slot="chat-message-attachment-preview" className="flex shrink-0 items-center justify-center overflow-hidden rounded-md" style={{ width: thumbnailSize, height: thumbnailSize }}>
        {local && (file.type.startsWith("image/") || file.type === "application/pdf") ? (
          <FileThumbnail file={file} size={thumbnailSize} bordered={false} />
        ) : image ? (
          // Persisted attachments are URLs, not synthetic browser File objects.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={file.name} width={thumbnailSize} height={thumbnailSize}
            className="size-full object-cover" />
        ) : (
          <FileIcon size={thumbnailSize} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate" title={file.name}>{file.name}</span>
        {file.size != null && Number.isFinite(file.size) && file.size >= 0 && (
          <span className="block text-fg-muted">{Math.ceil(file.size / 1024)} KB</span>
        )}
      </span>
    </span>
  );
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={file.name}
      className="block max-w-full rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-focus-ring">
      {body}
    </a>
  ) : body;
}

export function ChatMessageAttachments({ files, align = "end", label = "Attachments", thumbnailSize = 64 }: ChatMessageAttachmentsProps) {
  return (
    <ul className={cn("flex max-w-full flex-wrap gap-2", align === "end" ? "justify-end" : "justify-start")} aria-label={label}>
      {files.map((file, index) => (
        <li key={isLocalFile(file) ? `${file.name}-${file.size}-${file.lastModified}-${index}` : file.id} className="min-w-0 max-w-full">
          <ChatMessageAttachment file={file} thumbnailSize={thumbnailSize} />
        </li>
      ))}
    </ul>
  );
}

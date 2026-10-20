import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "#system/utils";

export interface ChatMessageAuthorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  model?: ReactNode;
  /** Decorative model artwork. The visible model name provides its text alternative. */
  logo?: ReactNode;
  provider?: ReactNode;
}

/** Persistent response identity, independent of the hover-revealed action row. */
export function ChatMessageAuthor({ model, logo, provider, className, ...props }: ChatMessageAuthorProps) {
  if (model == null && logo == null && provider == null) return null;
  return (
    <div data-slot="chat-message-author" className={cn("flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-body", className)} {...props}>
      {logo != null && (
        <span aria-hidden="true" inert className="inline-flex size-4 shrink-0 items-center justify-center [&>svg]:size-full [&>img]:size-full [&>img]:object-contain">
          {logo}
        </span>
      )}
      {model != null && <span className="min-w-0 break-words font-medium text-fg-default">{model}</span>}
      {provider != null && <span className="min-w-0 break-words text-fg-muted">{provider}</span>}
    </div>
  );
}

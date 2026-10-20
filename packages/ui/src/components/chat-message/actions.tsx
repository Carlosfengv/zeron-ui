"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "#components/button";
import { Tooltip } from "#components/tooltip";
import { useIcon } from "#system/icon-context";

export interface ChatMessageActionProps {
  label: string;
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
}

export interface ChatMessageCopyProps {
  text: string;
  disabled?: boolean;
  labels?: Partial<{ copy: string; copied: string; copyFailed: string }>;
}

export function ChatMessageAction({
  label,
  children,
  onClick,
  pressed,
  disabled,
}: ChatMessageActionProps) {
  return (
    <Tooltip content={label}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={label}
        aria-pressed={pressed}
        active={pressed}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

export function ChatMessageCopy({ text, disabled, labels: overrides }: ChatMessageCopyProps) {
  const labels = { copy: "Copy message", copied: "Copied", copyFailed: "Copy failed", ...overrides };
  const [notice, setNotice] = useState("");
  const request = useRef(0);
  const Copy = useIcon("copy");
  const Check = useIcon("check");
  useEffect(() => {
    setNotice("");
    return () => { request.current += 1; };
  }, [text]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2000);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <>
      <ChatMessageAction
        label={labels.copy}
        disabled={disabled}
        onClick={async () => {
          const current = ++request.current;
          try {
            await navigator.clipboard.writeText(text);
            if (current === request.current) setNotice(labels.copied);
          } catch {
            if (current === request.current) setNotice(labels.copyFailed);
          }
        }}
      >
        {notice === labels.copied ? <Check /> : <Copy />}
      </ChatMessageAction>
      <span className="sr-only" role="status">
        {notice}
      </span>
    </>
  );
}


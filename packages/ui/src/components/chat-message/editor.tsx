"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "#components/button";
import { Textarea } from "#components/textarea";
import { InlineNotice, InlineNoticeContent } from "#components/inline-notice";

export interface ChatMessageEditorProps {
  text: string;
  onSave: (text: string) => void | Promise<void>;
  /** Called on cancellation, unchanged text, or successful save. */
  onCancel: () => void;
  /** Freeze an existing draft while the host changes conversation history. */
  disabled?: boolean;
  labels?: Partial<{ edit: string; cancel: string; save: string; saveFailed: string }>;
}

export function ChatMessageEditor({
  text,
  onSave,
  onCancel,
  disabled = false,
  labels: overrides,
}: ChatMessageEditorProps) {
  const labels = { edit: "Edit message", cancel: "Cancel", save: "Save", saveFailed: "Could not save. Try again.", ...overrides };
  const [draft, setDraft] = useState(text);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const lock = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.setSelectionRange(text.length, text.length);
  }, [text]);
  const save = async () => {
    if (disabled || !draft.trim() || lock.current) return;
    if (draft.trim() === text) {
      onCancel();
      return;
    }
    lock.current = true;
    setPending(true);
    setError(false);
    try {
      await onSave(draft.trim());
      onCancel();
    } catch {
      setError(true);
    } finally {
      lock.current = false;
      setPending(false);
    }
  };
  return (
    <div className="w-full space-y-2">
      <Textarea
        ref={ref}
        aria-label={labels.edit}
        value={draft}
        rows={3}
        disabled={disabled || pending}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          if (event.key === "Escape" && !pending) {
            event.preventDefault();
            onCancel();
          }
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void save();
          }
        }}
      />
      {error && (
        <InlineNotice role="alert" variant="emphasized" tone="danger">
          <InlineNoticeContent>{labels.saveFailed}</InlineNoticeContent>
        </InlineNotice>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" disabled={pending} onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button
          variant="neutral"
          size="sm"
          disabled={disabled || !draft.trim()}
          loading={pending}
          onClick={() => void save()}
        >
          {labels.save}
        </Button>
      </div>
    </div>
  );
}

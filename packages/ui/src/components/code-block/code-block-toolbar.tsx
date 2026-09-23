'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '#components/button';
import { Tooltip } from '#components/tooltip';
import { useIcon } from '#system/icon-context';
import { cn } from '#system/utils';

import {
  resolveCodeBlockMessages,
  type CodeBlockMessages,
} from './code-block-messages';
import type { CodeHighlightState } from '#system/code-engine/types';

export interface CodeBlockToolbarProps {
  filename?: string;
  contents: string;
  overflow: 'scroll' | 'wrap';
  messages: CodeBlockMessages;
  highlightState?: CodeHighlightState;
  showHighlightLoading?: boolean;
  onHighlightRetry?(): void;
  className?: string;
  onOverflowChange?(overflow: 'scroll' | 'wrap'): void;
  onCopy?(contents: string): void;
  onCopyError?(error: unknown): void;
}

export function CodeBlockToolbar({
  filename,
  contents,
  overflow,
  messages: inputMessages,
  highlightState,
  showHighlightLoading = false,
  onHighlightRetry,
  className,
  onOverflowChange,
  onCopy,
  onCopyError,
}: CodeBlockToolbarProps): React.JSX.Element {
  const messages = resolveCodeBlockMessages(inputMessages);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    if (highlightState?.status !== 'loading') setRetrying(false);
  }, [highlightState]);
  const copyButton = useRef<HTMLButtonElement>(null);
  const retryButton = useRef<HTMLButtonElement | null>(null);
  const retryRef = useCallback((node: HTMLButtonElement | null) => {
    const previous = retryButton.current;
    if (
      node == null &&
      previous != null &&
      previous.ownerDocument.activeElement === previous
    ) {
      copyButton.current?.focus();
    }
    retryButton.current = node;
  }, []);
  const CopyIcon = useIcon('copy');
  const WrapIcon = useIcon('baseline');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle'
  );

  useEffect(() => {
    if (copyState === 'idle') return;
    const timeout = window.setTimeout(() => setCopyState('idle'), 1600);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const copyLabel =
    copyState === 'copied'
      ? messages.copied
      : copyState === 'failed'
        ? messages.copyFailed
        : messages.copy;
  const wrapLabel = overflow === 'wrap' ? messages.scroll : messages.wrap;

  async function copyContents(): Promise<void> {
    try {
      if (navigator.clipboard == null) {
        throw new Error('Clipboard API is unavailable');
      }
      await navigator.clipboard.writeText(contents);
      setCopyState('copied');
      onCopy?.(contents);
    } catch (error) {
      setCopyState('failed');
      onCopyError?.(error);
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-9 items-center gap-2 border-b border-border bg-surface-subtle px-2',
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate text-label font-medium text-fg-default">
        {filename}
      </span>
      <span
        role="status"
        aria-live="polite"
        className="min-w-0 truncate text-label text-fg-muted"
      >
        {highlightState?.status === 'error'
          ? messages.highlightFailed
          : showHighlightLoading
            ? messages.highlightLoading
            : null}
      </span>
      {(highlightState?.status === 'error' ||
        (highlightState?.status === 'loading' && retrying)) &&
      onHighlightRetry != null ? (
        <Button
          ref={retryRef}
          type="button"
          size="xs"
          variant="ghost"
          aria-disabled={highlightState.status === 'loading'}
          onClick={() => {
            if (highlightState.status === 'error') {
              setRetrying(true);
              onHighlightRetry();
            }
          }}
        >
          {messages.highlightRetry}
        </Button>
      ) : null}
      <Tooltip content={wrapLabel}>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          iconOnly
          active={overflow === 'wrap'}
          aria-label={wrapLabel}
          aria-pressed={overflow === 'wrap'}
          onClick={() =>
            onOverflowChange?.(overflow === 'wrap' ? 'scroll' : 'wrap')
          }
        >
          <WrapIcon aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip content={copyLabel} forceOpen={copyState !== 'idle'}>
        <Button
          ref={copyButton}
          type="button"
          size="xs"
          variant="ghost"
          iconOnly
          aria-label={copyLabel}
          onClick={() => void copyContents()}
        >
          <CopyIcon aria-hidden />
        </Button>
      </Tooltip>
    </div>
  );
}

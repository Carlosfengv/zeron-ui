'use client';

import { useEffect, useState } from 'react';

import { File } from '#system/code-engine/react/File';
import type { CodeHighlightState } from '#system/code-engine/types';
import { useStableCallback } from '#system/code-engine/react/utils/useStableCallback';
import { cn } from '#system/utils';

import { resolveCodeBlockMessages } from './code-block-messages';
import { getCodeBlockStyle } from './code-block-theme';
import { CodeBlockToolbar } from './code-block-toolbar';
import type { CodeBlockProps } from './code-block-types';

export function CodeBlock<LAnnotation = undefined, Caret = undefined>({
  appearance = 'zeron',
  themeMode = 'inherit',
  toolbar = true,
  messages,
  onCopy,
  onCopyError,
  onOverflowChange,
  className,
  style,
  file,
  options,
  renderCustomHeader,
  highlightFeedback = true,
  highlightRetryKey,
  onHighlightStateChange,
  ...props
}: CodeBlockProps<LAnnotation, Caret>): React.JSX.Element {
  const [highlightState, setHighlightState] = useState<CodeHighlightState>();
  const [showHighlightLoading, setShowHighlightLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const handleHighlight = useStableCallback((state: CodeHighlightState) => {
    setHighlightState(state);
    onHighlightStateChange?.(state);
  });
  useEffect(() => {
    setShowHighlightLoading(false);
    if (highlightState?.status !== 'loading') return;
    const timer = window.setTimeout(() => setShowHighlightLoading(true), 200);
    return () => window.clearTimeout(timer);
  }, [highlightState]);
  const [overflow, setOverflow] = useState<'scroll' | 'wrap'>(
    options?.overflow ?? 'scroll'
  );

  useEffect(() => {
    setOverflow(options?.overflow ?? 'scroll');
  }, [options?.overflow]);

  const resolvedMessages = resolveCodeBlockMessages(messages);
  const toolbarRenderer =
    renderCustomHeader ??
    (toolbar
      ? () => (
          <CodeBlockToolbar
            filename={file.name}
            contents={file.contents}
            overflow={overflow}
            messages={resolvedMessages}
            onCopy={onCopy}
            onCopyError={onCopyError}
            highlightState={highlightFeedback ? highlightState : undefined}
            showHighlightLoading={
              highlightFeedback &&
              highlightState?.status === 'loading' &&
              showHighlightLoading
            }
            onHighlightRetry={() => setRetryAttempt((attempt) => attempt + 1)}
            onOverflowChange={(nextOverflow) => {
              setOverflow(nextOverflow);
              onOverflowChange?.(nextOverflow);
            }}
          />
        )
      : undefined);

  return (
    <File
      {...props}
      highlightRetryKey={JSON.stringify([highlightRetryKey, retryAttempt])}
      onHighlightStateChange={handleHighlight}
      file={file}
      options={{ ...options, overflow }}
      renderCustomHeader={toolbarRenderer}
      className={cn(
        appearance === 'zeron' && 'zeron-code-block',
        'block overflow-hidden rounded-xl border border-border bg-surface-floating',
        className
      )}
      style={getCodeBlockStyle(themeMode, style)}
    />
  );
}

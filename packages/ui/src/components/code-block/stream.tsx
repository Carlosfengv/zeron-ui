'use client';

import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import {
  FileStream,
  type FileStreamOptions,
} from '#system/code-engine/components/FileStream';
import { useStableCallback } from '#system/code-engine/react/utils/useStableCallback';
import { areOptionsEqual } from '#system/code-engine/utils/areOptionsEqual';
import { cn } from '#system/utils';

import { getCodeBlockStyle } from './code-block-theme';
import type { CodeBlockPresentationProps } from './code-block-types';

export interface CodeStreamProps extends CodeBlockPresentationProps {
  source: ReadableStream<string> | (() => ReadableStream<string>);
  options?: FileStreamOptions;
  className?: string;
  style?: CSSProperties;
  onError?: (error: unknown) => void;
}

export function CodeStream({
  source,
  options,
  appearance = 'zeron',
  themeMode = 'inherit',
  className,
  style,
  onError,
}: CodeStreamProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef(options);
  if (!areOptionsEqual(optionsRef.current, options)) {
    optionsRef.current = options;
  }
  const stableOptions = optionsRef.current;
  const emitError = useStableCallback((error: unknown) => onError?.(error));
  const resolvedOptions = useMemo<FileStreamOptions>(
    () => ({
      ...stableOptions,
      containerClassName: cn(
        stableOptions?.containerClassName,
        appearance === 'zeron' && 'zeron-code-block'
      ),
      onStreamError(error) {
        stableOptions?.onStreamError?.(error);
        emitError(error);
      },
    }),
    [appearance, emitError, stableOptions]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container == null) return;

    const instance = new FileStream(resolvedOptions);
    try {
      const resolvedSource = typeof source === 'function' ? source() : source;
      void instance.setup(resolvedSource, container).catch(emitError);
    } catch (error) {
      emitError(error);
    }
    return () => {
      instance.cleanUp();
      container.replaceChildren();
    };
  }, [emitError, resolvedOptions, source]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface-floating',
        className
      )}
      style={getCodeBlockStyle(themeMode, style)}
    />
  );
}

export type { FileStreamOptions as CodeStreamOptions };
export type { RecallToken } from '#system/code-engine/shiki-stream/types';

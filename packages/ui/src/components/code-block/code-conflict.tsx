'use client';

import {
  UnresolvedFile,
  type UnresolvedFileProps,
} from '#system/code-engine/react/UnresolvedFile';
import type { MergeConflictMessages } from '#system/code-engine/renderers/UnresolvedFileHunksRenderer';
import { cn } from '#system/utils';

import { getCodeBlockStyle } from './code-block-theme';
import type { CodeBlockPresentationProps } from './code-block-types';

export type CodeConflictMessages = MergeConflictMessages;

export type CodeConflictProps<LAnnotation = undefined> = Omit<
  UnresolvedFileProps<LAnnotation>,
  'options'
> &
  CodeBlockPresentationProps & {
    options?: UnresolvedFileProps<LAnnotation>['options'];
    messages?: Partial<CodeConflictMessages>;
  };

export function CodeConflict<LAnnotation = undefined>({
  appearance = 'zeron',
  themeMode = 'inherit',
  className,
  style,
  options,
  messages,
  ...props
}: CodeConflictProps<LAnnotation>): React.JSX.Element {
  return (
    <UnresolvedFile
      {...props}
      options={{ ...options, mergeConflictMessages: messages }}
      className={cn(
        appearance === 'zeron' && 'zeron-code-block',
        'block overflow-hidden rounded-xl border border-border bg-surface-floating',
        className
      )}
      style={getCodeBlockStyle(themeMode, style)}
    />
  );
}

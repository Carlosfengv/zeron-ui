'use client';

import {
  PatchDiff,
  type PatchDiffProps,
} from '#system/code-engine/react/PatchDiff';
import { cn } from '#system/utils';

import { getCodeBlockStyle } from './code-block-theme';
import type { CodeBlockPresentationProps } from './code-block-types';

export type CodePatchProps<LAnnotation = undefined, Caret = undefined> =
  PatchDiffProps<LAnnotation, Caret> & CodeBlockPresentationProps;

export function CodePatch<LAnnotation = undefined, Caret = undefined>({
  appearance = 'zeron',
  themeMode = 'inherit',
  className,
  style,
  ...props
}: CodePatchProps<LAnnotation, Caret>): React.JSX.Element {
  return (
    <PatchDiff
      {...props}
      className={cn(
        appearance === 'zeron' && 'zeron-code-block',
        'block overflow-hidden rounded-xl border border-border bg-surface-floating',
        className
      )}
      style={getCodeBlockStyle(themeMode, style)}
    />
  );
}

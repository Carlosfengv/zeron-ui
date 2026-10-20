import type { ReactNode } from 'react';

import type { FileDiffMetadata } from '#system/code-engine/types';
import { useIcon } from '#system/icon-context';
import { cn } from '#system/utils';
import { codeBlockHeaderClassName } from './code-block-styles';

interface CodeDiffHeaderProps {
  fileDiff: FileDiffMetadata;
  prefix?: ReactNode;
  suffix?: ReactNode;
  metadata?: ReactNode;
}

export function CodeDiffHeader({ fileDiff, prefix, suffix, metadata }: CodeDiffHeaderProps) {
  const FileIcon = useIcon('file-text');
  const ArrowIcon = useIcon('arrow-right');
  let additions = 0;
  let deletions = 0;
  for (const hunk of fileDiff.hunks) {
    additions += hunk.additionLines;
    deletions += hunk.deletionLines;
  }

  return (
    <div data-slot="code-diff-header" className={codeBlockHeaderClassName}>
      <div className="flex min-w-0 items-center gap-2">
        {prefix}
        <FileIcon aria-hidden className={cn('size-4 shrink-0', {
          'text-fg-success': fileDiff.type === 'new',
          'text-fg-danger': fileDiff.type === 'deleted',
          'text-fg-info': fileDiff.type === 'change' || fileDiff.prevName != null,
        })} />
        {fileDiff.prevName != null && <>
          <bdi title={fileDiff.prevName} className="min-w-0 truncate text-fg-subtle">{fileDiff.prevName}</bdi>
          <ArrowIcon aria-hidden className="size-4 shrink-0" />
        </>}
        <bdi title={fileDiff.name} className="min-w-0 truncate">{fileDiff.name}</bdi>
        {suffix}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {(deletions > 0 || additions === 0) && <span className="font-mono text-fg-danger tabular-nums">-{deletions}</span>}
        {(additions > 0 || deletions === 0) && <span className="font-mono text-fg-success tabular-nums">+{additions}</span>}
        {metadata}
      </div>
    </div>
  );
}

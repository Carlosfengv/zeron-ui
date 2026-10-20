'use client';

import { FileDiff } from '#system/code-engine/react/FileDiff';
import { MultiFileDiff } from '#system/code-engine/react/MultiFileDiff';
import type { DiffBasePropsReact } from '#system/code-engine/react/types';
import type {
  DiffFileInput,
  FileDiffMetadata,
  MaybeDiffFileInput,
} from '#system/code-engine/types';
import { cn } from '#system/utils';

import { getCodeBlockStyle } from './code-block-theme';
import type { CodeBlockPresentationProps } from './code-block-types';
import { CodeDiffHeader } from './code-diff-header';
import { codeBlockSurfaceClassName } from './code-block-styles';

type CodeDiffBaseProps<LAnnotation, Caret> = DiffBasePropsReact<
  LAnnotation,
  Caret
> &
  CodeBlockPresentationProps;

export type CodeDiffProps<LAnnotation = undefined, Caret = undefined> =
  CodeDiffBaseProps<LAnnotation, Caret> &
    (
      | ({ fileDiff: FileDiffMetadata } & MaybeDiffFileInput)
      | ({ fileDiff?: undefined } & DiffFileInput)
    );

export function CodeDiff<LAnnotation = undefined, Caret = undefined>({
  appearance = 'zeron',
  themeMode = 'inherit',
  className,
  style,
  fileDiff,
  renderCustomHeader,
  renderHeaderPrefix,
  renderHeaderFilenameSuffix,
  renderHeaderMetadata,
  ...props
}: CodeDiffProps<LAnnotation, Caret>): React.JSX.Element {
  const defaultHeader = appearance === 'zeron' && renderCustomHeader == null;
  const presentation = {
    className: cn(
      appearance === 'zeron' && 'zeron-code-block',
      'block overflow-hidden',
      codeBlockSurfaceClassName,
      className
    ),
    style: getCodeBlockStyle(themeMode, style),
    renderCustomHeader: defaultHeader
      ? (diff: FileDiffMetadata) => <CodeDiffHeader
          fileDiff={diff}
          prefix={renderHeaderPrefix?.(diff)}
          suffix={renderHeaderFilenameSuffix?.(diff)}
          metadata={renderHeaderMetadata?.(diff)}
        />
      : renderCustomHeader,
    renderHeaderPrefix: defaultHeader ? undefined : renderHeaderPrefix,
    renderHeaderFilenameSuffix: defaultHeader ? undefined : renderHeaderFilenameSuffix,
    renderHeaderMetadata: defaultHeader ? undefined : renderHeaderMetadata,
  };

  if (fileDiff != null) {
    return <FileDiff {...props} {...presentation} fileDiff={fileDiff} />;
  }

  const multiFileProps = props as DiffBasePropsReact<LAnnotation, Caret> &
    DiffFileInput;
  return <MultiFileDiff {...multiFileProps} {...presentation} />;
}

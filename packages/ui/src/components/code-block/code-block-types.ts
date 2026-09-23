import type { FileProps } from '#system/code-engine/react/types';

import type {
  CodeBlockAppearance,
  CodeBlockThemeMode,
} from './code-block-theme';
import type { CodeBlockMessages } from './code-block-messages';

export interface CodeBlockPresentationProps {
  appearance?: CodeBlockAppearance;
  themeMode?: CodeBlockThemeMode;
}

export interface CodeBlockProductProps {
  toolbar?: boolean;
  messages?: Partial<CodeBlockMessages>;
  onCopy?(contents: string): void;
  onCopyError?(error: unknown): void;
  onOverflowChange?(overflow: 'scroll' | 'wrap'): void;
}

export type CodeBlockProps<LAnnotation = undefined, Caret = undefined> =
  FileProps<LAnnotation, Caret> &
    CodeBlockPresentationProps &
    CodeBlockProductProps & {
      /** Hide built-in feedback while retaining highlight state notifications. */
      highlightFeedback?: boolean;
    };

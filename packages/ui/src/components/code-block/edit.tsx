'use client';

import { useCallback, type PropsWithChildren } from 'react';

import {
  Editor,
  type EditorOptions,
} from '#system/code-engine/editor/editor';
import type {
  EditorFactory,
  EditorType,
} from '#system/code-engine/editor/types';
import { EditProvider } from '#system/code-engine/react/EditContext';

export function CodeEditProvider<LAnnotation = undefined, Caret = undefined>({
  children,
}: PropsWithChildren): React.JSX.Element {
  const createEditor = useCallback<EditorFactory<LAnnotation, Caret>>(
    <EType extends EditorType>(
      editorType: EType,
      options: EditorOptions<EType, LAnnotation, Caret>,
      editStateKey?: string
    ) => new Editor(editorType, options, editStateKey),
    []
  );

  return <EditProvider createEditor={createEditor}>{children}</EditProvider>;
}

export { Editor } from '#system/code-engine/editor/editor';
export type { EditorOptions } from '#system/code-engine/editor/editor';
export { EditStateManager } from '#system/code-engine/editor/EditStateManager';
export type * from '#system/code-engine/editor/types';

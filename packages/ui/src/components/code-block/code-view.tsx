'use client';

import { forwardRef, useMemo } from 'react';

import {
  CodeView as EngineCodeView,
  type CodeViewHandle,
  type CodeViewProps as EngineCodeViewProps,
  type CodeViewReactOptions,
} from '#system/code-engine/react/CodeView';
import { cn } from '#system/utils';

import { getCodeBlockStyle } from './code-block-theme';
import type { CodeBlockPresentationProps } from './code-block-types';

export type CodeViewProps<
  LAnnotation = undefined,
  Caret = undefined,
> = EngineCodeViewProps<LAnnotation, Caret> & CodeBlockPresentationProps;

type CodeViewComponent = <LAnnotation = undefined, Caret = undefined>(
  props: CodeViewProps<LAnnotation, Caret> & {
    ref?: React.Ref<CodeViewHandle<LAnnotation, Caret>>;
  }
) => React.JSX.Element;

function CodeViewInner<LAnnotation = undefined, Caret = undefined>(
  {
    appearance = 'zeron',
    themeMode = 'inherit',
    className,
    options,
    style,
    ...props
  }: CodeViewProps<LAnnotation, Caret>,
  ref: React.ForwardedRef<CodeViewHandle<LAnnotation, Caret>>
): React.JSX.Element {
  const itemClassName = cn(
    options?.itemClassName,
    appearance === 'zeron' && 'zeron-code-block'
  );
  const resolvedOptions = useMemo(
    () => ({ ...options, itemClassName }),
    [itemClassName, options]
  );

  return (
    <EngineCodeView
      {...(props as EngineCodeViewProps<LAnnotation, Caret>)}
      ref={ref}
      options={resolvedOptions}
      className={cn(
        'overflow-auto rounded-xl border border-border bg-surface-floating',
        className
      )}
      style={getCodeBlockStyle(themeMode, style)}
    />
  );
}

export const CodeView = forwardRef(CodeViewInner) as CodeViewComponent;

export type { CodeViewHandle, CodeViewReactOptions };
